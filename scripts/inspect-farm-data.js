const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const FARM_NAME = 'Curry Island Microgreens'
const FARM_ID = '00000000-0000-0000-0000-000000000010' // Hardcoded for consistency

async function inspectFarmData() {
  console.log(
    `\n🔍 Inspecting all data for farm: "${FARM_NAME}" (ID: ${FARM_ID})...`
  )
  console.log('============================================================')

  try {
    const farm = await prisma.farms.findUnique({
      where: { id: FARM_ID },
    })

    if (!farm) {
      console.error(`❌ Farm "${FARM_NAME}" with ID ${FARM_ID} not found.`)
      return
    }

    console.log(`\n✅ Found Farm: ${farm.farm_name}`)

    const counts = {
      seedVarieties: await prisma.seed_varieties.count({
        where: { farm_id: FARM_ID },
      }),
      growingEnvironments: await prisma.growing_environments.count({
        where: { farm_id: FARM_ID },
      }),
      batches: await prisma.batches.count({ where: { farm_id: FARM_ID } }),
      inventoryItems: await prisma.inventory_items.count({
        where: { farm_id: FARM_ID },
      }),
      tasks: await prisma.tasks.count({ where: { farm_id: FARM_ID } }),
      customers: await prisma.customers.count({ where: { farm_id: FARM_ID } }),
      orders: await prisma.orders.count({ where: { farm_id: FARM_ID } }),
      qualityChecks: await prisma.quality_checks.count({
        where: { farm_id: FARM_ID },
      }),
    }

    console.log('\n📊 Database Record Counts:')
    console.table(counts)

    // Optional: Log a few sample records if they exist
    if (counts.seedVarieties > 0) {
      const sampleSeed = await prisma.seed_varieties.findFirst({
        where: { farm_id: FARM_ID },
      })
      console.log('\n🌱 Sample Seed Variety:')
      console.log(sampleSeed)
    }

    if (counts.batches > 0) {
      const sampleBatch = await prisma.batches.findFirst({
        where: { farm_id: FARM_ID },
        include: { seed_varieties: true },
      })
      console.log('\n🌿 Sample Batch:')
      console.log(sampleBatch)
    }

    console.log(
      '\n============================================================'
    )
    console.log('✅ Inspection complete.')
  } catch (error) {
    console.error('❌ An error occurred during farm data inspection:', error)
  } finally {
    await prisma.$disconnect()
  }
}

inspectFarmData()
