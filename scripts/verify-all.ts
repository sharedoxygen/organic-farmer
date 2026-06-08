/**
 * OFMS 2.0 full verification — showcase data, agent, docs proof points
 * Run: npm run verify:all
 */
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import { runAgent } from '../src/lib/ai/agent'
import { getMcpToolDescriptors } from '../src/lib/ai/agent/mcpTools'
import { loadFarmContext } from '../src/lib/ai/farmContextService'
import { getAiMetrics } from '../src/lib/ai/inferenceLogger'
import {
  CURRY_ISLAND_FARM_ID,
  SHARED_OXYGEN_FARM_ID,
} from './showcase-user-registry'

const prisma = new PrismaClient()

async function checkFarm(farmId: string, label: string): Promise<boolean> {
  const farm = await prisma.farms.findUnique({ where: { id: farmId } })
  if (!farm) {
    console.log(`❌ ${label}: farm missing`)
    return false
  }
  const ctx = await loadFarmContext(farmId)
  const batches = ctx.allBatches.length
  const owner = farm.owner_id
  const users = await prisma.users.count({
    where: { farm_users: { some: { farm_id: farmId, is_active: true } } },
  })
  console.log(`✅ ${label}: ${batches} batches, ${users} farm_users`)
  if (batches < 1) {
    console.log(`   ⚠️  Run: npm run seed:showcase`)
    return false
  }
  const agent = await runAgent({
    message: 'What should I focus on today?',
    farmId,
    userId: owner,
    userName: 'verify-all',
    useLlm: false,
  })
  const tools = agent.toolsUsed.filter(t => t.status === 'completed').length
  console.log(`   Agent: ${tools} tools, confidence ${agent.confidence}`)
  return tools >= 2
}

async function main() {
  console.log('🔬 OFMS 2.0 Full Verification\n')

  console.log('1️⃣  TypeScript...')
  execSync('npx tsc --noEmit', { stdio: 'inherit' })

  console.log('\n2️⃣  Agent + AI unit tests...')
  execSync(
    'npx jest __tests__/lib/ai __tests__/lib/operations --selectProjects node --coverage=false',
    { stdio: 'inherit' }
  )

  console.log('\n3️⃣  MCP tool catalog...')
  const tools = getMcpToolDescriptors()
  console.log(`   ${tools.length} tools registered`)
  if (tools.length < 10) {
    console.log(`❌ Expected at least 10 agent tools, got ${tools.length}`)
    process.exit(1)
  }

  console.log('\n4️⃣  Showcase farms + agent...')
  const curry = await checkFarm(CURRY_ISLAND_FARM_ID, 'Curry Island')
  const cannabis = await checkFarm(SHARED_OXYGEN_FARM_ID, 'Shared Oxygen')

  console.log('\n5️⃣  Inference trail...')
  const metrics = await getAiMetrics(CURRY_ISLAND_FARM_ID)
  console.log(`   AI inferences (24h): ${metrics.inferenceCalls24h}`)

  const ok = curry && cannabis
  console.log(ok ? '\n✅ verify:all PASSED' : '\n❌ verify:all FAILED')
  process.exit(ok ? 0 : 1)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
