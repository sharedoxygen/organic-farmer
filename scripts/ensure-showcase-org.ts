/**
 * Ensures canonical showcase users + farm org links exist.
 * CREATE-ONLY for users — never updates passwords or emails on existing accounts.
 */
import { FarmRole, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  CANNABIS_OWNER,
  CANNABIS_TEAM,
  CURRY_ISLAND_FARM_ID,
  CURRY_OWNER,
  CURRY_TEAM,
  SHARED_OXYGEN_FARM_ID,
} from './showcase-user-registry'

const prisma = new PrismaClient()

/** Pre-hashed team password from seed-microgreens-users.sql (create-only) */
const MICROGREENS_TEAM_HASH =
  '$2b$10$rX8fZQpL7Qs3KgO9vU2nRuP1mN5sA6cB8dF3jH9kL2wX7yZ4vT6eQ'

type UserSeed = {
  id: string
  email: string
  firstName: string
  lastName: string
  department: string
  position: string
  roles: string
  permissions: string
  passwordHash: string
}

async function ensureUser(seed: UserSeed): Promise<string> {
  const existing = await prisma.users.findFirst({
    where: { OR: [{ id: seed.id }, { email: seed.email.toLowerCase() }] },
  })
  if (existing) {
    console.log(`   ✓ user exists: ${existing.email}`)
    return existing.id
  }

  await prisma.users.create({
    data: {
      id: seed.id,
      email: seed.email.toLowerCase(),
      firstName: seed.firstName,
      lastName: seed.lastName,
      department: seed.department,
      position: seed.position,
      roles: seed.roles,
      permissions: seed.permissions,
      password: seed.passwordHash,
      hireDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })
  console.log(`   + created user: ${seed.email}`)
  return seed.id
}

function toFarmRole(role: string): FarmRole {
  const map: Record<string, FarmRole> = {
    OWNER: 'OWNER',
    MANAGER: 'FARM_MANAGER',
    TEAM_LEAD: 'PRODUCTION_LEAD',
    TEAM_MEMBER: 'TEAM_MEMBER',
    SPECIALIST: 'QUALITY_SPECIALIST',
  }
  return map[role] || 'TEAM_MEMBER'
}

async function ensureFarmMembership(
  farmId: string,
  userId: string,
  role: string
) {
  const farmRole = toFarmRole(role)
  await prisma.farm_users.upsert({
    where: { farm_id_user_id: { farm_id: farmId, user_id: userId } },
    create: {
      farm_id: farmId,
      user_id: userId,
      role: farmRole,
      is_active: true,
      joined_at: new Date(),
    },
    update: { role: farmRole, is_active: true },
  })
}

export async function ensureShowcaseOrg(): Promise<{
  curryOwnerId: string
  cannabisOwnerId: string
}> {
  console.log(
    '🏢 Ensuring showcase org (create-only users, passwords preserved)…\n'
  )

  const demoPassword =
    process.env.SHOWCASE_DEMO_PASSWORD ||
    process.env.TEST_ADMIN_PASSWORD ||
    'changeme_dev_only'
  const jayHash = await bcrypt.hash(demoPassword, 10)
  const curryOwnerHash = await bcrypt.hash(
    process.env.SHOWCASE_CURRY_PASSWORD || demoPassword,
    10
  )

  const curryOwnerId = await ensureUser({
    id: CURRY_OWNER.id,
    email: CURRY_OWNER.email,
    firstName: 'Christian',
    lastName: 'Kinkead',
    department: 'Management',
    position: 'Owner',
    roles: 'OWNER',
    permissions: '[]',
    passwordHash: curryOwnerHash,
  })

  for (const m of CURRY_TEAM) {
    const [firstName, ...rest] = m.name.split(' ')
    const lastName = rest.join(' ') || firstName
    const userId = await ensureUser({
      id: m.id,
      email: m.email,
      firstName,
      lastName,
      department: 'Operations',
      position: m.role,
      roles: m.role,
      permissions: 'PRODUCTION_READ',
      passwordHash: MICROGREENS_TEAM_HASH,
    })
    await ensureFarmMembership(CURRY_ISLAND_FARM_ID, userId, m.role)
  }
  await ensureFarmMembership(CURRY_ISLAND_FARM_ID, curryOwnerId, 'OWNER')

  const cannabisOwnerId = await ensureUser({
    id: CANNABIS_OWNER.id,
    email: CANNABIS_OWNER.email,
    firstName: 'Jay',
    lastName: 'Cee',
    department: 'Executive',
    position: 'Owner',
    roles: 'OWNER,ADMIN',
    permissions: 'FULL_ACCESS',
    passwordHash: jayHash,
  })

  for (const m of CANNABIS_TEAM) {
    const [firstName, ...rest] = m.name.split(' ')
    const lastName = rest.join(' ') || firstName
    const userId = await ensureUser({
      id: m.id,
      email: m.email,
      firstName,
      lastName,
      department: 'Operations',
      position: m.role,
      roles: m.role,
      permissions: 'PRODUCTION_READ',
      passwordHash: jayHash,
    })
    await ensureFarmMembership(SHARED_OXYGEN_FARM_ID, userId, m.role)
  }
  await ensureFarmMembership(SHARED_OXYGEN_FARM_ID, cannabisOwnerId, 'OWNER')

  const sharedOxygen = await prisma.farms.findUnique({
    where: { id: SHARED_OXYGEN_FARM_ID },
  })
  if (sharedOxygen && sharedOxygen.owner_id !== cannabisOwnerId) {
    await prisma.farms.update({
      where: { id: SHARED_OXYGEN_FARM_ID },
      data: { owner_id: cannabisOwnerId, updated_at: new Date() },
    })
    console.log(`   ↻ Shared Oxygen owner → ${CANNABIS_OWNER.email}`)
  }

  const curryFarm = await prisma.farms.findUnique({
    where: { id: CURRY_ISLAND_FARM_ID },
  })
  if (curryFarm && curryFarm.owner_id !== curryOwnerId) {
    await prisma.farms.update({
      where: { id: CURRY_ISLAND_FARM_ID },
      data: { owner_id: curryOwnerId, updated_at: new Date() },
    })
    console.log(`   ↻ Curry Island owner → ${CURRY_OWNER.email}`)
  }

  console.log('')
  return { curryOwnerId, cannabisOwnerId }
}

if (require.main === module) {
  ensureShowcaseOrg()
    .then(() => prisma.$disconnect())
    .catch(e => {
      console.error(e)
      prisma.$disconnect()
      process.exit(1)
    })
}
