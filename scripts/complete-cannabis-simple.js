#!/usr/bin/env node
/**
 * Complete Shared Oxygen Cannabis Operation Setup - Simplified
 * Uses only the actual schema fields
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function completeCannabisSimple() {
  try {
    console.log('🌿 Completing Shared Oxygen Cannabis Operation...')

    const farmId = '00000000-0000-0000-0000-000000000020'
    const adminUserId = '00000000-0000-0000-0000-000000000100'

    // Clear existing data first
    console.log('🗑️ Clearing existing data...')
    await prisma.tasks.deleteMany({ where: { farm_id: farmId } })
    await prisma.batches.deleteMany({ where: { farm_id: farmId } })
    await prisma.growing_environments.deleteMany({ where: { farm_id: farmId } })
    await prisma.customers.deleteMany({ where: { farm_id: farmId } })

    // Step 1: Add Growing Environments (using actual schema fields only)
    console.log('🏢 Adding growing environments...')
    const environments = [
      {
        id: 'env-flower-room-1',
        name: 'Flower Room 1',
        type: 'FLOWER_ROOM',
        location: 'Building A - Room 1',
        maxBatches: 10,
        totalArea: 1200.0,
        areaUnit: 'SQ_FT',
        currentTemp: 73.2,
        currentHumidity: 44.8,
        currentLightLevel: 1000.0,
        currentCO2: 1350.0,
        currentPH: 6.3,
        targetTempMin: 70.0,
        targetTempMax: 76.0,
        targetHumidityMin: 40.0,
        targetHumidityMax: 50.0,
        targetLightHours: 12.0,
        targetCO2: 1350.0,
        targetPH: 6.3,
        equipmentIds: 'LED-panels,HVAC-1,irrigation-1',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'env-veg-room-1',
        name: 'Veg Room 1',
        type: 'VEG_ROOM',
        location: 'Building A - Room 2',
        maxBatches: 15,
        totalArea: 1500.0,
        areaUnit: 'SQ_FT',
        currentTemp: 77.8,
        currentHumidity: 59.2,
        currentLightLevel: 800.0,
        currentCO2: 1100.0,
        currentPH: 6.1,
        targetTempMin: 75.0,
        targetTempMax: 80.0,
        targetHumidityMin: 55.0,
        targetHumidityMax: 65.0,
        targetLightHours: 18.0,
        targetCO2: 1100.0,
        targetPH: 6.1,
        equipmentIds: 'LED-panels-veg,HVAC-2,irrigation-2',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'env-propagation',
        name: 'Propagation Room',
        type: 'PROPAGATION',
        location: 'Building A - Room 3',
        maxBatches: 20,
        totalArea: 800.0,
        areaUnit: 'SQ_FT',
        currentTemp: 74.5,
        currentHumidity: 64.1,
        currentLightLevel: 400.0,
        currentCO2: 800.0,
        currentPH: 5.8,
        targetTempMin: 73.0,
        targetTempMax: 77.0,
        targetHumidityMin: 60.0,
        targetHumidityMax: 70.0,
        targetLightHours: 24.0,
        targetCO2: 800.0,
        targetPH: 5.8,
        equipmentIds: 'T5-fluorescents,humidity-dome,heating-mat',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const env of environments) {
      await prisma.growing_environments.create({ data: env })
    }

    // Step 2: Add Cannabis Batches
    console.log('📦 Creating cannabis batches...')
    const batches = [
      {
        id: 'batch-bd-flower-01',
        batchNumber: 'BD-FL-001',
        seedVarietyId: 'strain-blue-dream-so',
        plantDate: new Date('2024-11-01'),
        expectedHarvestDate: new Date('2025-01-10'),
        quantity: 25,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        status: 'GROWING',
        fertilizersUsed: 'Advanced Bloom, Cal-Mag',
        growingZone: 'Flower Room 1',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'Blue Dream flowering batch - Week 6. Trichomes developing well.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
      {
        id: 'batch-og-veg-01',
        batchNumber: 'OG-VG-001',
        seedVarietyId: 'strain-og-kush-so',
        plantDate: new Date('2024-11-15'),
        expectedHarvestDate: new Date('2025-02-01'),
        quantity: 30,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        status: 'VEGETATIVE_WEEK_4',
        fertilizersUsed: 'Vegetative nutrients, Cal-Mag',
        growingZone: 'Veg Room 1',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes: 'OG Kush vegetative batch - Week 4. Strong indica growth.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
      {
        id: 'batch-gsc-prop-01',
        batchNumber: 'GSC-PR-001',
        seedVarietyId: 'strain-girl-scout-cookies-so',
        plantDate: new Date('2024-12-05'),
        expectedHarvestDate: new Date('2025-03-15'),
        quantity: 50,
        unit: 'SEEDLINGS',
        growingMedium: 'ROCKWOOL',
        status: 'SEEDLING_WEEK_2',
        fertilizersUsed: 'Seedling nutrients - low concentration',
        growingZone: 'Propagation Room',
        harvestContainers: 'Seedling trays',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'Prevention - clean environment',
        storageConditions: 'Controlled temperature and humidity',
        transportationMethod: 'Hand transfer to veg room',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'Girl Scout Cookies propagation - Week 2. Excellent germination rate.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        updatedAt: new Date(),
      },
    ]

    for (const batch of batches) {
      await prisma.batches.create({ data: batch })
    }

    // Step 3: Add Dispensary Customers
    console.log('🏪 Adding dispensary customers...')
    const customers = [
      {
        id: 'cust-green-leaf-disp',
        name: 'Green Leaf Dispensary',
        email: 'purchasing@greenleaf.com',
        phone: '(415) 555-0123',
        street: '123 Cannabis Ave',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'USA',
        type: 'B2B',
        orderFrequency: 'WEEKLY',
        paymentTerms: 'NET_30',
        preferredVarieties: 'Blue Dream, OG Kush',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'cust-coastal-cannabis',
        name: 'Coastal Cannabis Co.',
        email: 'orders@coastalcannabis.com',
        phone: '(831) 555-0145',
        street: '456 Ocean Blvd',
        city: 'Monterey',
        state: 'CA',
        zipCode: '93940',
        country: 'USA',
        type: 'B2B',
        orderFrequency: 'BIWEEKLY',
        paymentTerms: 'NET_15',
        preferredVarieties: 'Blue Dream, Girl Scout Cookies',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'cust-cannabis-lab',
        name: 'California Cannabis Labs',
        email: 'testing@calcannabislabs.com',
        phone: '(916) 555-0189',
        street: '321 Science Dr',
        city: 'Sacramento',
        state: 'CA',
        zipCode: '95811',
        country: 'USA',
        type: 'B2B',
        orderFrequency: 'AS_NEEDED',
        paymentTerms: 'NET_15',
        preferredVarieties: 'All strains for testing',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const customer of customers) {
      await prisma.customers.create({ data: customer })
    }

    // Step 4: Add Cannabis Tasks
    console.log('📋 Adding cannabis cultivation tasks...')
    const tasks = [
      {
        id: 'task-daily-env-check',
        title: 'Daily Environmental Check - All Rooms',
        description:
          'Monitor temperature, humidity, CO2, and lighting in all growing environments.',
        assignedBy: adminUserId,
        assignedTo: adminUserId,
        category: 'MONITORING',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
        estimatedDuration: 45,
        priority: 'HIGH',
        status: 'PENDING',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-plant-health-inspect',
        title: 'Plant Health Inspection',
        description:
          'Visual inspection of all plants for pests, diseases, and overall health.',
        assignedBy: adminUserId,
        assignedTo: adminUserId,
        category: 'QUALITY_CHECK',
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000),
        estimatedDuration: 60,
        priority: 'HIGH',
        status: 'PENDING',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-compliance-check',
        title: 'Weekly Compliance Check',
        description:
          'Conduct mandatory plant count and update BCC tracking system.',
        assignedBy: adminUserId,
        assignedTo: adminUserId,
        category: 'COMPLIANCE',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        estimatedDuration: 60,
        priority: 'HIGH',
        status: 'PENDING',
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const task of tasks) {
      await prisma.tasks.create({ data: task })
    }

    // Verification
    console.log('🔍 Verifying setup...')

    const farm = await prisma.farms.findUnique({ where: { id: farmId } })
    const strainCount = await prisma.seed_varieties.count({
      where: { farm_id: farmId },
    })
    const environmentCount = await prisma.growing_environments.count({
      where: { farm_id: farmId },
    })
    const batchCount = await prisma.batches.count({
      where: { farm_id: farmId },
    })
    const customerCount = await prisma.customers.count({
      where: { farm_id: farmId },
    })
    const taskCount = await prisma.tasks.count({ where: { farm_id: farmId } })

    console.log('\n🎉 SHARED OXYGEN CANNABIS OPERATION COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✅ Farm: ${farm.farm_name}`)
    console.log(`✅ Business: ${farm.business_name}`)
    console.log(`✅ License: ${farm.settings.license_number}`)
    console.log('')
    console.log('📊 OPERATION SUMMARY:')
    console.log(`   🌱 Cannabis Strains: ${strainCount} varieties`)
    console.log(`   🏢 Growing Environments: ${environmentCount} rooms`)
    console.log(`   📦 Active Batches: ${batchCount} cultivation batches`)
    console.log(`   🏪 B2B Customers: ${customerCount} dispensaries`)
    console.log(`   📋 Active Tasks: ${taskCount} cultivation tasks`)
    console.log('')
    console.log('🔒 COMPLIANCE FEATURES:')
    console.log('   • California BCC Licensed (BCC-LIC-SHOX-2024-001)')
    console.log('   • Seed-to-Consumer Tracking Ready')
    console.log('   • Multi-Stage Growth Environments')
    console.log('   • B2B Dispensary Management')
    console.log('')
    console.log('🌿 CANNABIS STRAINS:')

    const strains = await prisma.seed_varieties.findMany({
      where: { farm_id: farmId },
      select: {
        name: true,
        scientificName: true,
        stockQuantity: true,
        unit: true,
      },
    })

    strains.forEach(strain => {
      console.log(
        `   • ${strain.name} (${strain.scientificName}) - ${strain.stockQuantity} ${strain.unit}`
      )
    })

    console.log('')
    console.log('🏢 GROWING ENVIRONMENTS:')

    const envs = await prisma.growing_environments.findMany({
      where: { farm_id: farmId },
      select: { name: true, type: true, totalArea: true, areaUnit: true },
    })

    envs.forEach(env => {
      console.log(
        `   • ${env.name} (${env.type}) - ${env.totalArea} ${env.areaUnit}`
      )
    })

    console.log('')
    console.log('📦 ACTIVE CULTIVATION BATCHES:')

    const activeBatches = await prisma.batches.findMany({
      where: { farm_id: farmId },
      include: { seed_varieties: { select: { name: true } } },
    })

    activeBatches.forEach(batch => {
      console.log(
        `   • ${batch.batchNumber} - ${batch.seed_varieties?.name} (${batch.status}) - ${batch.quantity} ${batch.unit}`
      )
    })

    console.log('')
    console.log('🚀 CANNABIS OPERATION READY!')
    console.log('Shared Oxygen now has complete cannabis cultivation tracking!')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  completeCannabisSimple()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { completeCannabisSimple }
