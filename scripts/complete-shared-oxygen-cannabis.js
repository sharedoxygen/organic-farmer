#!/usr/bin/env node
/**
 * Complete Shared Oxygen Cannabis Operation Setup
 * Adds growing environments, batches, customers, inventory, and compliance workflows
 * Based on Cannabis Module and AI Use Cases documentation
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function completeSharedOxygenCannabis() {
  try {
    console.log('🌿 Completing Shared Oxygen Cannabis Operation Setup...')

    const farmId = '00000000-0000-0000-0000-000000000020'
    const adminUserId = '00000000-0000-0000-0000-000000000100'

    // Step 1: Clear existing cannabis data first
    console.log('🧹 Clearing existing cannabis data...')
    await prisma.growing_environments.deleteMany({
      where: { farm_id: farmId },
    })
    await prisma.batches.deleteMany({
      where: { farm_id: farmId },
    })
    await prisma.orders.deleteMany({
      where: { farm_id: farmId },
    })
    await prisma.customers.deleteMany({
      where: { farm_id: farmId },
    })
    await prisma.inventory_items.deleteMany({
      where: { farm_id: farmId },
    })
    await prisma.tasks.deleteMany({
      where: { farm_id: farmId },
    })

    // Step 1: Add Cannabis Growing Environments
    console.log('🏢 Adding cannabis growing environments...')
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
      {
        id: 'env-drying-curing',
        name: 'Drying & Curing Room',
        type: 'DRYING_CURING',
        location: 'Building B - Room 1',
        maxBatches: 5,
        totalArea: 600.0,
        areaUnit: 'SQ_FT',
        currentTemp: 64.8,
        currentHumidity: 59.5,
        currentLightLevel: 0.0,
        currentCO2: 400.0,
        currentPH: 6.5,
        targetTempMin: 60.0,
        targetTempMax: 70.0,
        targetHumidityMin: 55.0,
        targetHumidityMax: 65.0,
        targetLightHours: 0.0,
        targetCO2: 400.0,
        targetPH: 6.5,
        equipmentIds: 'exhaust-fans,dehumidifier,drying-racks',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'env-mother-room',
        name: 'Mother Plant Room',
        type: 'MOTHER_ROOM',
        location: 'Building A - Room 4',
        maxBatches: 3,
        totalArea: 400.0,
        areaUnit: 'SQ_FT',
        currentTemp: 75.8,
        currentHumidity: 54.2,
        currentLightLevel: 600.0,
        currentCO2: 1000.0,
        currentPH: 6.2,
        targetTempMin: 74.0,
        targetTempMax: 78.0,
        targetHumidityMin: 50.0,
        targetHumidityMax: 60.0,
        targetLightHours: 18.0,
        targetCO2: 1000.0,
        targetPH: 6.2,
        equipmentIds: 'LED-panels-mother,HVAC-3,hand-watering',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const env of environments) {
      await prisma.growing_environments.create({ data: env })
    }

    // Step 2: Add Cannabis Batches with Seed-to-Consumer Tracking
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
        growingZone: 'Flower Room 1',
        fertilizersUsed: 'Advanced Bloom, Cal-Mag',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        status: 'GROWING',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'Blue Dream flowering batch - Week 6. Trichomes developing well. Expected harvest in 2-3 weeks.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'batch-og-flower-01',
        batchNumber: 'OG-FL-001',
        seedVarietyId: 'strain-og-kush-so',
        plantDate: new Date('2024-10-25'),
        expectedHarvestDate: new Date('2025-01-03'),
        quantity: 20,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        growingZone: 'Flower Room 1',
        fertilizersUsed: 'Advanced Bloom, Cal-Mag',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        status: 'GROWING',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'OG Kush flowering batch - Week 7. Ready for harvest soon. Excellent resin production.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'batch-gsc-veg-01',
        batchNumber: 'GSC-VG-001',
        seedVarietyId: 'strain-girl-scout-cookies-so',
        plantDate: new Date('2024-11-15'),
        expectedHarvestDate: new Date('2025-02-15'),
        quantity: 30,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        growingZone: 'Veg Room 1',
        fertilizersUsed: 'Vegetative nutrients - high N',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        status: 'GROWING',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'Girl Scout Cookies vegetative batch - Week 4. Healthy growth, preparing for flowering transition.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'batch-jh-veg-01',
        batchNumber: 'JH-VG-001',
        seedVarietyId: 'strain-jack-herer-so',
        plantDate: new Date('2024-12-01'),
        expectedHarvestDate: new Date('2025-03-01'),
        quantity: 28,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        growingZone: 'Veg Room 1',
        fertilizersUsed: 'Vegetative nutrients - high N',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        status: 'GROWING',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'Jack Herer vegetative batch - Week 2. Strong sativa growth pattern observed.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'batch-bd-harvest-01',
        batchNumber: 'BD-HV-001',
        seedVarietyId: 'strain-blue-dream-so',
        plantDate: new Date('2024-08-15'),
        expectedHarvestDate: new Date('2024-10-24'),
        actualHarvestDate: new Date('2024-10-24'),
        quantity: 22,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        growingZone: 'Drying & Curing Room',
        fertilizersUsed: 'Advanced Bloom, Cal-Mag',
        harvestContainers: 'Food-grade buckets',
        irrigationSource: 'Municipal water + RO filtration',
        pestControlMethods: 'IPM - organic predatory insects',
        storageConditions: 'Cool, dry, dark storage',
        transportationMethod: 'Climate-controlled vehicle',
        status: 'HARVESTED',
        organicCompliant: true,
        labelingCompliance: true,
        organicIntegrity: true,
        notes:
          'Blue Dream harvest - 45.8oz total yield. Currently curing. Lab testing scheduled.',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    for (const batch of batches) {
      await prisma.batches.create({ data: batch })
    }

    // Step 3: Add Cannabis Dispensary Customers
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
        orderFrequency: 'WEEKLY',
        preferredVarieties: 'Blue Dream, OG Kush, Girl Scout Cookies',
        type: 'DISPENSARY',
        taxId: '12-3456789',
        paymentTerms: 'NET_30',
        creditLimit: 50000.0,
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
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
        orderFrequency: 'BIWEEKLY',
        preferredVarieties: 'Blue Dream, Wedding Cake, Jack Herer',
        type: 'DISPENSARY',
        taxId: '98-7654321',
        paymentTerms: 'NET_15',
        creditLimit: 35000.0,
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'cust-valley-wellness',
        name: 'Valley Wellness Center',
        email: 'procurement@valleywellness.com',
        phone: '(209) 555-0167',
        street: '789 Wellness Way',
        city: 'Stockton',
        state: 'CA',
        zipCode: '95202',
        country: 'USA',
        orderFrequency: 'MONTHLY',
        preferredVarieties: 'CBD-dominant strains, Harlequin, ACDC',
        type: 'MEDICAL',
        taxId: '45-1237890',
        paymentTerms: 'NET_30',
        creditLimit: 25000.0,
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
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
        orderFrequency: 'AS_NEEDED',
        preferredVarieties: 'All strains for testing',
        type: 'TESTING_LAB',
        taxId: '67-8901234',
        paymentTerms: 'NET_15',
        creditLimit: 15000.0,
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const customer of customers) {
      await prisma.customers.create({ data: customer })
    }

    // Step 4: Add Cannabis-Specific Inventory
    console.log('📦 Adding cannabis inventory...')
    const inventoryItems = [
      {
        id: 'inv-bloom-nutrients',
        name: 'Advanced Bloom Nutrients',
        category: 'NUTRIENTS',
        sku: 'BLOOM-001',
        currentStock: 45,
        minStockLevel: 10,
        maxStockLevel: 100,
        unit: 'LITERS',
        costPerUnit: 85.0,
        supplier: 'Advanced Nutrients Inc.',
        location: 'Storage Room A - Shelf 1',
        expirationDate: new Date('2025-12-01'),
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-veg-nutrients',
        name: 'Vegetative Growth Nutrients',
        category: 'NUTRIENTS',
        sku: 'VEG-001',
        currentStock: 38,
        minStockLevel: 8,
        maxStockLevel: 80,
        unit: 'LITERS',
        costPerUnit: 75.0,
        supplier: 'Advanced Nutrients Inc.',
        location: 'Storage Room A - Shelf 1',
        expirationDate: new Date('2025-12-01'),
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-smart-pots-7gal',
        name: '7-Gallon Smart Pots',
        category: 'CONTAINERS',
        sku: 'POT-7GAL-001',
        currentStock: 200,
        minStockLevel: 40,
        maxStockLevel: 400,
        unit: 'PIECES',
        costPerUnit: 8.5,
        supplier: 'Smart Pot Inc.',
        location: 'Storage Room C - Shelf 1',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-trimming-scissors',
        name: 'Precision Trimming Scissors',
        category: 'HARVEST_TOOLS',
        sku: 'TRIM-001',
        currentStock: 25,
        minStockLevel: 5,
        maxStockLevel: 50,
        unit: 'PIECES',
        costPerUnit: 35.0,
        supplier: 'Fiskars Professional',
        location: 'Tool Storage A',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-compliance-tags',
        name: 'BCC Compliance Tags',
        category: 'COMPLIANCE',
        sku: 'TAG-001',
        currentStock: 500,
        minStockLevel: 100,
        maxStockLevel: 1000,
        unit: 'TAGS',
        costPerUnit: 0.75,
        supplier: 'California BCC',
        location: 'Office Storage',
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-test-kits',
        name: 'Cannabis Testing Kits',
        category: 'TESTING',
        sku: 'TEST-001',
        currentStock: 15,
        minStockLevel: 3,
        maxStockLevel: 30,
        unit: 'KITS',
        costPerUnit: 65.0,
        supplier: 'Green Scientific',
        location: 'Lab Storage',
        expirationDate: new Date('2025-06-01'),
        status: 'ACTIVE',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const item of inventoryItems) {
      await prisma.inventory_items.create({ data: item })
    }

    // Step 5: Add Cannabis Cultivation Tasks
    console.log('📋 Adding cannabis cultivation tasks...')
    const tasks = [
      {
        id: 'task-daily-env-check',
        title: 'Daily Environmental Check - All Rooms',
        description:
          'Monitor temperature, humidity, CO2, and lighting in all growing environments. Record readings in compliance logs.',
        assignedBy: adminUserId,
        assignedTo: 'cultivation-manager',
        category: 'MONITORING',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedDuration: 45,
        priority: 'HIGH',
        status: 'PENDING',
        dependencies: '',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-plant-health-inspect',
        title: 'Plant Health Inspection',
        description:
          'Visual inspection of all plants for pests, diseases, nutrient deficiencies, and overall health. Photo documentation required.',
        assignedBy: adminUserId,
        assignedTo: 'cultivation-manager',
        category: 'QUALITY_CHECK',
        dueDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        estimatedDuration: 60,
        priority: 'HIGH',
        status: 'PENDING',
        dependencies: '',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-blue-dream-harvest-prep',
        title: 'Blue Dream Harvest Preparation',
        description:
          'Prepare Blue Dream batch BD-FL-001 for harvest. Set up drying racks, schedule lab testing, prepare compliance documentation.',
        assignedBy: adminUserId,
        assignedTo: 'harvest-manager',
        category: 'HARVEST_PREP',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedDuration: 180,
        relatedBatchId: 'batch-bd-flower-01',
        priority: 'HIGH',
        status: 'PENDING',
        dependencies: '',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-compliance-plant-count',
        title: 'Weekly Plant Count & Compliance Check',
        description:
          'Conduct mandatory plant count, update BCC tracking system, verify compliance with license limits.',
        assignedBy: adminUserId,
        assignedTo: 'compliance-officer',
        category: 'COMPLIANCE',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        estimatedDuration: 60,
        priority: 'HIGH',
        status: 'PENDING',
        dependencies: '',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-harvest-testing',
        title: 'Schedule Harvest Testing',
        description:
          'Schedule mandatory testing for harvested batches: potency, pesticides, microbials, heavy metals, mycotoxins.',
        assignedBy: adminUserId,
        assignedTo: 'lab-coordinator',
        category: 'TESTING',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        estimatedDuration: 30,
        relatedBatchId: 'batch-bd-harvest-01',
        priority: 'HIGH',
        status: 'PENDING',
        dependencies: '',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'task-metrc-updates',
        title: 'METRC System Updates',
        description:
          'Update California state tracking system (METRC) with plant movements, harvest data, and inventory changes.',
        assignedBy: adminUserId,
        assignedTo: 'compliance-officer',
        category: 'COMPLIANCE',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        estimatedDuration: 45,
        priority: 'HIGH',
        status: 'PENDING',
        dependencies: '',
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const task of tasks) {
      await prisma.tasks.create({ data: task })
    }

    // Step 6: Add Sample Cannabis Orders for Seed-to-Consumer Tracking
    console.log('📋 Adding cannabis orders for tracking...')
    const orders = [
      {
        id: 'order-greenleaf-001',
        orderNumber: 'GL-001-2025',
        customerId: 'cust-green-leaf-disp',
        orderDate: new Date('2024-12-15'),
        requestedDeliveryDate: new Date('2024-12-20'),
        subtotal: 12500.0,
        shippingCost: 0,
        tax: 0,
        total: 12500.0,
        deliveryMethod: 'PICKUP',
        paymentStatus: 'PENDING',
        status: 'CONFIRMED',
        notes: 'Blue Dream flower order - 5 lbs premium grade',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'order-coastal-002',
        orderNumber: 'CC-002-2025',
        customerId: 'cust-coastal-cannabis',
        orderDate: new Date('2024-12-10'),
        requestedDeliveryDate: new Date('2024-12-18'),
        subtotal: 8750.0,
        shippingCost: 0,
        tax: 0,
        total: 8750.0,
        deliveryMethod: 'DELIVERY',
        paymentStatus: 'PENDING',
        status: 'PROCESSING',
        notes: 'OG Kush flower order - 3 lbs organic certified',
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const order of orders) {
      await prisma.orders.create({ data: order })
    }

    // Verification and Summary
    console.log('🔍 Verifying complete setup...')

    const farm = await prisma.farms.findUnique({
      where: { id: farmId },
    })

    const strainCount = await prisma.seed_varieties.count({
      where: { farm_id: farmId },
    })

    const environmentCount = await prisma.growing_environments.count({
      where: { farm_id: farmId },
    })

    const batchCount = await prisma.batches.count({
      where: { farm_id: farmId },
    })

    const inventoryCount = await prisma.inventory_items.count({
      where: { farm_id: farmId },
    })

    const customerCount = await prisma.customers.count({
      where: { farm_id: farmId },
    })

    const taskCount = await prisma.tasks.count({
      where: { farm_id: farmId },
    })

    const orderCount = await prisma.orders.count({
      where: { farm_id: farmId },
    })

    console.log('\n🎉 SHARED OXYGEN CANNABIS OPERATION COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✅ Farm: ${farm.farm_name}`)
    console.log(`✅ Business: ${farm.business_name}`)
    console.log(`✅ License: ${farm.settings.license_number}`)
    console.log(`✅ Type: ${farm.settings.farm_type}`)
    console.log('')
    console.log('📊 OPERATION SUMMARY:')
    console.log(`   🌱 Cannabis Strains: ${strainCount} premium varieties`)
    console.log(
      `   🏢 Growing Environments: ${environmentCount} specialized rooms`
    )
    console.log(`   📦 Active Batches: ${batchCount} cultivation batches`)
    console.log(`   📋 Inventory Items: ${inventoryCount} cannabis supplies`)
    console.log(
      `   🏪 B2B Customers: ${customerCount} dispensaries & collectives`
    )
    console.log(`   📋 Cultivation Tasks: ${taskCount} active tasks`)
    console.log(`   📋 Active Orders: ${orderCount} confirmed orders`)
    console.log('')
    console.log('🔒 COMPLIANCE FEATURES ENABLED:')
    console.log('   • California BCC Licensed Operation')
    console.log('   • Seed-to-Consumer Tracking')
    console.log('   • Multi-Stage Growth Monitoring')
    console.log('   • Cannabinoid Testing Integration')
    console.log('   • Tax Calculation (California Cannabis)')
    console.log('   • Dispensary B2B Management')
    console.log('   • METRC Integration Ready')
    console.log('   • Quality Control & Testing Workflows')
    console.log('')
    console.log('🌿 CANNABIS STRAINS AVAILABLE:')

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
      select: {
        name: true,
        type: true,
        maxBatches: true,
        currentTemp: true,
      },
    })

    envs.forEach(env => {
      console.log(
        `   • ${env.name} (${env.type}) - Max ${env.maxBatches} batches, ${env.currentTemp}°F`
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
        `   • ${batch.batchNumber} - ${batch.seed_varieties?.name} (${batch.status}) - ${batch.quantity} plants`
      )
    })

    console.log('')
    console.log('🚀 READY FOR OPERATIONS!')
    console.log('The cannabis cultivation system is fully operational with:')
    console.log('• Complete seed-to-consumer traceability')
    console.log('• California BCC compliance workflows')
    console.log('• Multi-stage growth tracking')
    console.log('• B2B dispensary relationships')
    console.log('• Testing and quality control processes')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  completeSharedOxygenCannabis()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { completeSharedOxygenCannabis }
