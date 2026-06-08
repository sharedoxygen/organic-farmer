/**
 * End-to-end agent verification against live DB
 * Run: npx tsx scripts/verify-agent.ts
 */
import { PrismaClient } from '@prisma/client'
import { runAgent } from '../src/lib/ai/agent'
import { loadFarmContext } from '../src/lib/ai/farmContextService'
import { getAiMetrics } from '../src/lib/ai/inferenceLogger'

const prisma = new PrismaClient()
const CURRY = '00000000-0000-0000-0000-000000000010'
const CANNABIS = '00000000-0000-0000-0000-000000000020'

async function verifyFarm(farmId: string, label: string) {
  const owner = await prisma.farms.findUnique({
    where: { id: farmId },
    select: { owner_id: true, farm_name: true },
  })
  if (!owner) {
    console.log(`⏭️  ${label}: farm not found`)
    return false
  }

  const ctx = await loadFarmContext(farmId)
  console.log(`\n📍 ${label} (${owner.farm_name})`)
  console.log(`   Batches: ${ctx.allBatches.length} total, ${ctx.activeBatches.length} active`)

  const result = await runAgent({
    message: 'What should I focus on today?',
    farmId,
    userId: owner.owner_id,
    userName: 'verify-script',
    useLlm: false,
  })

  const tools = result.toolsUsed.filter((t) => t.status === 'completed').map((t) => t.tool)
  console.log(`   Tools: ${tools.join(' → ')}`)
  console.log(`   Confidence: ${result.confidence}`)
  console.log(`   Answer preview: ${result.answer.slice(0, 120)}...`)

  return tools.length >= 2
}

async function main() {
  console.log('🔬 OFMS Agent E2E Verification\n')

  const curryOk = await verifyFarm(CURRY, 'Curry Island')
  const cannabisOk = await verifyFarm(CANNABIS, 'Shared Oxygen')

  const metrics = await getAiMetrics(CURRY)
  console.log(`\n📊 AI metrics (Curry): ${metrics.inferenceCalls24h} inferences / 24h`)

  const ok = curryOk && cannabisOk
  console.log(ok ? '\n✅ Agent verification PASSED' : '\n❌ Agent verification FAILED')
  process.exit(ok ? 0 : 1)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
