/**
 * OFMS 2.0 Showcase Seed
 * - Preserves ALL existing users, passwords, and org hierarchy
 * - Enhances operational data for Curry Island + Shared Oxygen demo flows
 *
 * Run: npm run seed:showcase
 */
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import {
  CANNABIS_OWNER,
  CANNABIS_TEAM,
  CURRY_ISLAND_FARM_ID,
  CURRY_OWNER,
  CURRY_TEAM,
  SHARED_OXYGEN_FARM_ID,
} from './showcase-user-registry'
import { ensureShowcaseOrg } from './ensure-showcase-org'

const prisma = new PrismaClient()

async function resolveUser(
  primaryId: string,
  email: string,
  altId?: string
): Promise<{ id: string; email: string } | null> {
  const byId = await prisma.users.findUnique({ where: { id: primaryId } })
  if (byId?.isActive) return { id: byId.id, email: byId.email }

  const byEmail = await prisma.users.findUnique({
    where: { email: email.toLowerCase() },
  })
  if (byEmail?.isActive) return { id: byEmail.id, email: byEmail.email }

  if (altId) {
    const alt = await prisma.users.findUnique({ where: { id: altId } })
    if (alt?.isActive) return { id: alt.id, email: alt.email }
  }

  return null
}

async function updateFarmSettingsOnly(
  farmId: string,
  farmName: string,
  settings: Record<string, unknown>
) {
  const farm = await prisma.farms.findUnique({ where: { id: farmId } })
  if (!farm) {
    console.warn(
      `⚠️  Farm not found: ${farmName} (${farmId}) — skipping settings update`
    )
    return null
  }

  const existing = (farm.settings as Record<string, unknown>) || {}
  await prisma.farms.update({
    where: { id: farmId },
    data: {
      settings: { ...existing, ...settings } as object,
      updated_at: new Date(),
    },
  })
  console.log(`✅ Updated farm settings: ${farm.farm_name}`)
  return farm
}

async function verifyOrgHierarchy(
  farmId: string,
  ownerId: string,
  team: Array<{ id: string; email?: string; role: string; name: string }>
) {
  const ownerMembership = await prisma.farm_users.findUnique({
    where: { farm_id_user_id: { farm_id: farmId, user_id: ownerId } },
  })
  if (!ownerMembership) {
    console.warn(
      `⚠️  Owner ${ownerId} not linked to farm ${farmId} — run fix-curry-island-users or existing admin setup`
    )
  } else {
    console.log(`   ✓ Owner linked (${ownerMembership.role})`)
  }

  for (const member of team) {
    const user = member.email
      ? await prisma.users.findFirst({
          where: { OR: [{ id: member.id }, { email: member.email }] },
        })
      : await prisma.users.findUnique({ where: { id: member.id } })

    if (!user) {
      console.log(`   · Team member not in DB (skipped): ${member.name}`)
      continue
    }

    const membership = await prisma.farm_users.findUnique({
      where: { farm_id_user_id: { farm_id: farmId, user_id: user.id } },
    })
    if (membership?.is_active) {
      console.log(`   ✓ ${user.email} → ${membership.role}`)
    } else {
      console.log(`   · ${user.email} exists but not active on farm`)
    }
  }
}

async function enhanceCustodyAndAudit(
  farmId: string,
  performerIds: string[],
  stages: string[]
) {
  const batches = await prisma.batches.findMany({
    where: { farm_id: farmId },
    take: 10,
    orderBy: { createdAt: 'desc' },
  })

  let performerIdx = 0
  for (const batch of batches) {
    const existing = await prisma.custody_events.count({
      where: { farm_id: farmId, entityId: batch.id },
    })
    if (existing >= Math.min(stages.length, 5)) continue

    const steps = stages.slice(0, 5)
    for (let i = 0; i < steps.length; i++) {
      const performer =
        performerIds[performerIdx % performerIds.length] || performerIds[0]
      performerIdx++

      await prisma.custody_events.create({
        data: {
          farm_id: farmId,
          entityType: 'batch',
          entityId: batch.id,
          stage: steps[i],
          performedBy: performer,
          location:
            i < 2 ? 'Production Floor' : i < 4 ? 'Processing' : 'Distribution',
          notes: `${steps[i]} — recorded by operations team`,
          timestamp: new Date(Date.now() - (steps.length - i) * 86400000),
        },
      })
    }

    await prisma.audit_logs.create({
      data: {
        farm_id: farmId,
        userId: performerIds[0],
        action: 'SHOWCASE_TRACEABILITY_ENHANCED',
        entity: 'Batch',
        entityId: batch.id,
        details: { batchNumber: batch.batchNumber, showcase: true },
      },
    })
  }
}

async function enhanceQualityChecks(farmId: string, inspectorIds: string[]) {
  const existing = await prisma.quality_checks.count({
    where: { farm_id: farmId },
  })
  if (existing >= 15) return

  const batches = await prisma.batches.findMany({
    where: { farm_id: farmId },
    take: 6,
    orderBy: { createdAt: 'desc' },
  })

  for (let i = 0; i < batches.length; i++) {
    const inspector = inspectorIds[i % inspectorIds.length]
    const already = await prisma.quality_checks.findFirst({
      where: { farm_id: farmId, batchId: batches[i].id },
    })
    if (already) continue

    await prisma.quality_checks.create({
      data: {
        id: `showcase-qc-${farmId.slice(-4)}-${batches[i].id.slice(0, 8)}`,
        farm_id: farmId,
        batchId: batches[i].id,
        checkType: 'ROUTINE',
        checkDate: new Date(Date.now() - i * 86400000),
        inspectorId: inspector,
        status: 'PASSED',
        notes: 'Showcase QC inspection — all parameters within spec',
        correctiveActions: 'None required',
        visualAppearance: i % 3 === 0 ? 'Excellent' : 'Good',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }
}

async function main() {
  console.log('🚀 OFMS 2.0 Showcase Seed (preserve users & credentials)\n')

  await ensureShowcaseOrg()

  const curryOwner = await resolveUser(CURRY_OWNER.id, CURRY_OWNER.email)
  const cannabisOwner = await resolveUser(
    CANNABIS_OWNER.id,
    CANNABIS_OWNER.email,
    CANNABIS_OWNER.altId
  )

  if (!curryOwner || !cannabisOwner) {
    console.error('❌ Showcase owners could not be resolved after org ensure.')
    process.exit(1)
  }

  console.log(`👤 Curry Island owner: ${curryOwner.email} (${curryOwner.id})`)
  console.log(
    `👤 Shared Oxygen owner: ${cannabisOwner.email} (${cannabisOwner.id})`
  )
  console.log('🔒 Passwords: unchanged\n')

  await updateFarmSettingsOnly(
    CURRY_ISLAND_FARM_ID,
    'Curry Island Microgreens',
    {
      farm_type: 'ORGANIC_MICROGREENS',
      timezone: 'America/New_York',
      location: 'Naples, FL',
      usda_organic: true,
      certification: 'USDA Organic',
    }
  )

  await updateFarmSettingsOnly(SHARED_OXYGEN_FARM_ID, 'Shared Oxygen Farms', {
    farm_type: 'CANNABIS_CULTIVATION',
    state: 'CALIFORNIA',
    license_number: 'BCC-LIC-DEMO-0001',
    compliance_level: 'BCC_COMPLIANT',
    seed_to_consumer_tracking: true,
  })

  console.log('\n📋 Verifying org hierarchy…')
  console.log('Curry Island:')
  await verifyOrgHierarchy(CURRY_ISLAND_FARM_ID, curryOwner.id, CURRY_TEAM)
  console.log('Shared Oxygen:')
  await verifyOrgHierarchy(
    SHARED_OXYGEN_FARM_ID,
    cannabisOwner.id,
    CANNABIS_TEAM
  )

  console.log('\n📦 Seeding Curry Island operational data…')
  try {
    execSync('npx tsx prisma/seed-curry-island.ts', {
      stdio: 'inherit',
      env: { ...process.env, OFMS_PRESERVE_USERS: '1' },
    })
  } catch {
    console.warn(
      '⚠️  Curry Island data seed partial — continuing enhancements.'
    )
  }

  console.log('\n🌿 Seeding Shared Oxygen operational data…')
  try {
    execSync('npx tsx scripts/seed-cannabis-buyer-demo.ts', {
      stdio: 'inherit',
      env: {
        ...process.env,
        OFMS_PRESERVE_USERS: '1',
        OFMS_CANNABIS_OWNER_ID: cannabisOwner.id,
        DOCS_DEMO_MODE: process.env.DOCS_DEMO_MODE || 'append',
      },
    })
  } catch {
    console.warn('⚠️  Cannabis data seed partial — continuing enhancements.')
  }

  const curryPerformers = [
    curryOwner.id,
    ...((
      await Promise.all(
        CURRY_TEAM.map(async t => {
          const u = await prisma.users.findFirst({
            where: { OR: [{ id: t.id }, { email: t.email }] },
          })
          return u?.id
        })
      )
    ).filter(Boolean) as string[]),
  ]

  const cannabisIds: string[] = [cannabisOwner.id]
  for (const t of CANNABIS_TEAM) {
    const u = await prisma.users.findUnique({ where: { id: t.id } })
    if (u) cannabisIds.push(u.id)
  }

  console.log('\n✨ Enhancing showcase traceability & QC…')
  await enhanceCustodyAndAudit(CURRY_ISLAND_FARM_ID, curryPerformers, [
    'PLANTING',
    'GROWING',
    'HARVEST',
    'PACKAGING',
    'DISTRIBUTION',
  ])
  await enhanceCustodyAndAudit(SHARED_OXYGEN_FARM_ID, cannabisIds, [
    'GERMINATION',
    'VEGETATIVE',
    'FLOWERING',
    'HARVEST',
    'DRYING',
    'CURING',
    'TESTING',
    'VAULT_STORAGE',
    'DISTRIBUTION',
  ])

  await enhanceQualityChecks(CURRY_ISLAND_FARM_ID, curryPerformers.slice(0, 3))
  await enhanceQualityChecks(SHARED_OXYGEN_FARM_ID, cannabisIds.slice(0, 3))

  console.log('\n✅ Showcase seed complete — users & credentials preserved.')
  console.log('   Login with your existing accounts:')
  console.log(`   · Organic demo: ${CURRY_OWNER.email}`)
  console.log(`   · Cannabis demo: ${CANNABIS_OWNER.email}`)
  console.log(
    '   Team logins unchanged (manager@curryisland.com, grower@curryisland.com, etc.)'
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
