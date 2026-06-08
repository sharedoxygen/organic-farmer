import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const FARM_ID = '00000000-0000-0000-0000-000000000020'

// Realistic cannabis cultivation timeline (days)
const CULTIVATION_TIMELINE = {
  GERMINATION: 3,
  SEEDLING: 14,
  VEGETATIVE: 28,
  FLOWERING: 56,
  HARVEST_WINDOW: 7,
  DRYING: 10,
  CURING: 21,
  TOTAL_CYCLE: 139, // ~4.5 months seed to sale
}

function env(name: string, fallback?: string): string | undefined {
  const v = process.env[name]
  if (typeof v === 'string' && v.trim().length > 0) return v.trim()
  return fallback
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

async function resolveCannabisOwner(): Promise<{ id: string; email: string }> {
  const preserve = env('OFMS_PRESERVE_USERS') === '1'
  const forcedId = env('OFMS_CANNABIS_OWNER_ID')

  if (forcedId) {
    const u = await prisma.users.findUnique({ where: { id: forcedId } })
    if (u) return { id: u.id, email: u.email }
  }

  const ownerEmail = 'jay.cee@sharedoxygen.com'
  const byEmail = await prisma.users.findUnique({
    where: { email: ownerEmail },
  })
  if (byEmail) return { id: byEmail.id, email: byEmail.email }

  const byId = await prisma.users.findUnique({
    where: { id: '00000000-0000-0000-0000-000000000201' },
  })
  if (byId) return { id: byId.id, email: byId.email }

  if (preserve) {
    throw new Error(
      'OFMS_PRESERVE_USERS=1 but Shared Oxygen owner (jay.cee@sharedoxygen.com) not found'
    )
  }

  // Legacy path: create docs demo admin only when not preserving users
  const email = env(
    'DOCS_DEMO_EMAIL',
    env('TEST_ADMIN_EMAIL', 'demo.admin@ofms.example')
  )!
  const password = env(
    'DOCS_DEMO_PASSWORD',
    env('TEST_ADMIN_PASSWORD', 'ofms_demo_admin_please_change')
  )!
  const hashedPassword = await bcrypt.hash(password, 12)
  const id = 'docs-demo-admin'

  await prisma.users.upsert({
    where: { id },
    create: {
      id,
      email: email.toLowerCase(),
      firstName: 'Demo',
      lastName: 'Administrator',
      department: 'Operations',
      position: 'Demo Admin',
      hireDate: new Date('2024-01-01'),
      password: hashedPassword,
      roles: JSON.stringify(['ADMIN', 'SYSTEM_ADMIN']),
      permissions: JSON.stringify(['ALL']),
      isActive: true,
      employeeId: 'DEMO001',
      createdAt: new Date(),
      updatedAt: new Date(),
      is_system_admin: true,
      system_role: 'SYSTEM_ADMIN',
    },
    update: {
      email: email.toLowerCase(),
      password: hashedPassword,
      roles: JSON.stringify(['ADMIN', 'SYSTEM_ADMIN']),
      permissions: JSON.stringify(['ALL']),
      isActive: true,
      is_system_admin: true,
      system_role: 'SYSTEM_ADMIN',
      updatedAt: new Date(),
    },
  })

  return { id, email }
}

async function upsertCannabisFarm(ownerId: string): Promise<void> {
  const existing = await prisma.farms.findUnique({ where: { id: FARM_ID } })
  const preserveOwner = env('OFMS_PRESERVE_USERS') === '1' && existing

  await prisma.farms.upsert({
    where: { id: FARM_ID },
    create: {
      id: FARM_ID,
      farm_name: 'Shared Oxygen Farms',
      business_name: 'Shared Oxygen Cannabis Demo Farm',
      subdomain: 'shared-oxygen-cannabis-demo',
      owner_id: ownerId,
      subscription_plan: 'ENTERPRISE_CANNABIS',
      subscription_status: 'active',
      settings: {
        farm_type: 'CANNABIS_CULTIVATION',
        state: 'CALIFORNIA',
        license_number: 'BCC-LIC-DEMO-0001',
        license_type: 'Adult-Use Cultivation',
        canopy_size_sqft: 5000,
        compliance_level: 'BCC_COMPLIANT',
        seed_to_consumer_tracking: true,
        testing_required: true,
        tax_calculation_mode: 'california_cannabis',
      },
      created_at: new Date(),
      updated_at: new Date(),
    },
    update: {
      farm_name: 'Shared Oxygen Farms',
      business_name: 'Shared Oxygen Cannabis Demo Farm',
      subscription_plan: 'ENTERPRISE_CANNABIS',
      subscription_status: 'active',
      settings: {
        farm_type: 'CANNABIS_CULTIVATION',
        state: 'CALIFORNIA',
        license_number: 'BCC-LIC-DEMO-0001',
        license_type: 'Adult-Use Cultivation',
        canopy_size_sqft: 5000,
        compliance_level: 'BCC_COMPLIANT',
        seed_to_consumer_tracking: true,
        testing_required: true,
        tax_calculation_mode: 'california_cannabis',
      },
      ...(preserveOwner ? {} : { owner_id: ownerId }),
      updated_at: new Date(),
    },
  })

  if (!preserveOwner || existing?.owner_id === ownerId) {
    await prisma.farm_users.upsert({
      where: { farm_id_user_id: { farm_id: FARM_ID, user_id: ownerId } },
      create: {
        farm_id: FARM_ID,
        user_id: ownerId,
        role: 'OWNER',
        permissions: { all: true },
        is_active: true,
        joined_at: new Date(),
      },
      update: { is_active: true },
    })
  }
}

async function clearCannabisFarmData(): Promise<void> {
  await prisma.recall_items.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.recall_cases.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.custody_events.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.quality_checks.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.tasks.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.orders.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.customers.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.inventory_items.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.equipment.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.growing_environments.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.batches.deleteMany({ where: { farm_id: FARM_ID } })
  await prisma.seed_varieties.deleteMany({ where: { farm_id: FARM_ID } })
}

async function seedCannabisDemoData(ownerId: string): Promise<void> {
  const defaultMode = env('OFMS_PRESERVE_USERS') === '1' ? 'append' : 'reset'
  const mode = env('DOCS_DEMO_MODE', defaultMode)
  if (mode === 'append') {
    const existing = await prisma.seed_varieties.count({
      where: { farm_id: FARM_ID },
    })
    if (existing > 0) {
      process.stdout.write(
        'Cannabis demo data exists — append mode skipping re-seed.\n'
      )
      return
    }
  }

  const now = new Date()

  // Create a realistic timeline: We're at Day 85 of our flagship Blue Dream batch
  // This means we have batches at various stages to demonstrate the full lifecycle
  const cycleStartDate = addDays(now, -85) // Day 1 was 85 days ago

  // Premium cannabis strains with realistic genetics and yield data
  const strains = [
    {
      id: 'strain-blue-dream',
      name: 'Blue Dream',
      scientificName: 'Cannabis sativa-dominant hybrid (Blueberry × Haze)',
      thcRange: '17-24%',
      cbdRange: '0.1-0.2%',
      terpeneProfile: 'Myrcene, Pinene, Caryophyllene',
      floweringDays: 65,
      yieldPerPlant: 450, // grams
      description:
        'Flagship strain. Sweet berry aroma with balanced cerebral and body effects. High demand from dispensaries.',
    },
    {
      id: 'strain-og-kush',
      name: 'OG Kush',
      scientificName: 'Cannabis indica-dominant hybrid',
      thcRange: '20-26%',
      cbdRange: '0.3%',
      terpeneProfile: 'Limonene, Myrcene, Linalool',
      floweringDays: 56,
      yieldPerPlant: 400,
      description:
        'Premium indica. Earthy pine with fuel undertones. Strong relaxation effects.',
    },
    {
      id: 'strain-gsc',
      name: 'Girl Scout Cookies',
      scientificName: 'Cannabis hybrid (OG Kush × Durban Poison)',
      thcRange: '25-28%',
      cbdRange: '0.2%',
      terpeneProfile: 'Caryophyllene, Limonene, Humulene',
      floweringDays: 63,
      yieldPerPlant: 350,
      description:
        'Award-winning hybrid. Sweet, earthy with mint notes. Euphoric and relaxing.',
    },
    {
      id: 'strain-sour-diesel',
      name: 'Sour Diesel',
      scientificName: 'Cannabis sativa-dominant (Chemdawg 91 × Super Skunk)',
      thcRange: '19-25%',
      cbdRange: '0.2%',
      terpeneProfile: 'Caryophyllene, Myrcene, Limonene',
      floweringDays: 70,
      yieldPerPlant: 500,
      description:
        'Energizing sativa. Pungent diesel aroma. Fast-acting cerebral effects.',
    },
    {
      id: 'strain-granddaddy-purple',
      name: 'Granddaddy Purple',
      scientificName: 'Cannabis indica (Purple Urkle × Big Bud)',
      thcRange: '17-23%',
      cbdRange: '0.1%',
      terpeneProfile: 'Myrcene, Pinene, Caryophyllene',
      floweringDays: 60,
      yieldPerPlant: 425,
      description:
        'Classic indica. Grape and berry flavors. Deep relaxation and sleep aid.',
    },
  ]

  for (const s of strains) {
    const strainData = {
      name: s.name,
      scientificName: s.scientificName,
      supplier: 'Humboldt Seed Company',
      stockQuantity: 200,
      minStockLevel: 50,
      unit: 'SEEDS',
      costPerUnit: 12.5,
      germinationRate: 0.95,
      daysToGermination: 3,
      daysToHarvest:
        s.floweringDays +
        CULTIVATION_TIMELINE.VEGETATIVE +
        CULTIVATION_TIMELINE.SEEDLING,
      storageTemp: 4,
      storageHumidity: 30,
      lightExposure: 'DARK',
      status: 'ACTIVE',
      isOrganic: true,
      organicCertNumber: 'CCOF-2024-SO-001',
      certifyingAgent: 'California Certified Organic Farmers',
      certificationDate: new Date('2024-01-15'),
      certExpiration: new Date('2027-01-15'),
      lotNumber: `SO-${s.id.split('-')[1].toUpperCase()}-2025-001`,
      seedSource: 'Humboldt Seed Company, Eureka CA',
      auditTrail: JSON.stringify({
        received: formatDate(addDays(cycleStartDate, -30)),
        inspected: formatDate(addDays(cycleStartDate, -29)),
        approved: formatDate(addDays(cycleStartDate, -28)),
        thcRange: s.thcRange,
        cbdRange: s.cbdRange,
        terpenes: s.terpeneProfile,
      }),
      usdaCompliant: true,
      createdAt: addDays(cycleStartDate, -30),
      updatedAt: now,
      createdBy: ownerId,
      updatedBy: ownerId,
      farm_id: FARM_ID,
    }
    await prisma.seed_varieties.upsert({
      where: { id: s.id },
      create: { id: s.id, ...strainData },
      update: strainData,
    })
  }

  // Professional indoor cannabis facility with precise environmental controls
  const environments = [
    {
      id: 'env-clone-room',
      name: 'Clone & Propagation Room',
      type: 'PROPAGATION',
      location: 'Building A - Room 101',
      maxBatches: 8,
      totalArea: 400,
      areaUnit: 'SQ_FT',
      currentTemp: 76,
      currentHumidity: 75,
      currentLightLevel: 200,
      currentCO2: 600,
      currentPH: 5.8,
      targetTempMin: 74,
      targetTempMax: 78,
      targetHumidityMin: 70,
      targetHumidityMax: 80,
      targetLightHours: 18,
      targetCO2: 600,
      targetPH: 5.8,
      equipmentIds: 'clone-dome-1,t5-clone-lights,heat-mat-1,misting-system',
      status: 'ACTIVE',
    },
    {
      id: 'env-veg-room-1',
      name: 'Vegetative Room 1',
      type: 'VEG_ROOM',
      location: 'Building A - Room 102',
      maxBatches: 6,
      totalArea: 800,
      areaUnit: 'SQ_FT',
      currentTemp: 78,
      currentHumidity: 55,
      currentLightLevel: 600,
      currentCO2: 1200,
      currentPH: 6.0,
      targetTempMin: 75,
      targetTempMax: 82,
      targetHumidityMin: 50,
      targetHumidityMax: 60,
      targetLightHours: 18,
      targetCO2: 1200,
      targetPH: 6.0,
      equipmentIds: 'led-veg-1,hvac-veg-1,co2-gen-1,irrigation-veg-1',
      status: 'ACTIVE',
    },
    {
      id: 'env-veg-room-2',
      name: 'Vegetative Room 2',
      type: 'VEG_ROOM',
      location: 'Building A - Room 103',
      maxBatches: 6,
      totalArea: 800,
      areaUnit: 'SQ_FT',
      currentTemp: 77,
      currentHumidity: 58,
      currentLightLevel: 580,
      currentCO2: 1150,
      currentPH: 6.1,
      targetTempMin: 75,
      targetTempMax: 82,
      targetHumidityMin: 50,
      targetHumidityMax: 60,
      targetLightHours: 18,
      targetCO2: 1200,
      targetPH: 6.0,
      equipmentIds: 'led-veg-2,hvac-veg-2,co2-gen-2,irrigation-veg-2',
      status: 'ACTIVE',
    },
    {
      id: 'env-flower-room-1',
      name: 'Flower Room 1 (Main)',
      type: 'FLOWER_ROOM',
      location: 'Building B - Room 201',
      maxBatches: 4,
      totalArea: 1200,
      areaUnit: 'SQ_FT',
      currentTemp: 72,
      currentHumidity: 45,
      currentLightLevel: 1000,
      currentCO2: 1400,
      currentPH: 6.2,
      targetTempMin: 68,
      targetTempMax: 75,
      targetHumidityMin: 40,
      targetHumidityMax: 50,
      targetLightHours: 12,
      targetCO2: 1400,
      targetPH: 6.2,
      equipmentIds:
        'led-flower-1,hvac-flower-1,co2-flower-1,irrigation-flower-1,dehumidifier-1',
      status: 'ACTIVE',
    },
    {
      id: 'env-flower-room-2',
      name: 'Flower Room 2',
      type: 'FLOWER_ROOM',
      location: 'Building B - Room 202',
      maxBatches: 4,
      totalArea: 1200,
      areaUnit: 'SQ_FT',
      currentTemp: 71,
      currentHumidity: 42,
      currentLightLevel: 980,
      currentCO2: 1380,
      currentPH: 6.3,
      targetTempMin: 68,
      targetTempMax: 75,
      targetHumidityMin: 40,
      targetHumidityMax: 50,
      targetLightHours: 12,
      targetCO2: 1400,
      targetPH: 6.2,
      equipmentIds:
        'led-flower-2,hvac-flower-2,co2-flower-2,irrigation-flower-2,dehumidifier-2',
      status: 'ACTIVE',
    },
    {
      id: 'env-dry-room',
      name: 'Drying Room',
      type: 'DRYING_CURING',
      location: 'Building C - Room 301',
      maxBatches: 4,
      totalArea: 500,
      areaUnit: 'SQ_FT',
      currentTemp: 62,
      currentHumidity: 55,
      currentLightLevel: 0,
      currentCO2: 400,
      currentPH: 6.5,
      targetTempMin: 60,
      targetTempMax: 65,
      targetHumidityMin: 50,
      targetHumidityMax: 60,
      targetLightHours: 0,
      targetCO2: 400,
      targetPH: 6.5,
      equipmentIds:
        'exhaust-dry-1,dehumidifier-dry-1,drying-racks,hygrometer-array',
      status: 'ACTIVE',
    },
    {
      id: 'env-cure-vault',
      name: 'Curing Vault',
      type: 'DRYING_CURING',
      location: 'Building C - Room 302',
      maxBatches: 8,
      totalArea: 400,
      areaUnit: 'SQ_FT',
      currentTemp: 64,
      currentHumidity: 62,
      currentLightLevel: 0,
      currentCO2: 400,
      currentPH: 6.5,
      targetTempMin: 62,
      targetTempMax: 68,
      targetHumidityMin: 58,
      targetHumidityMax: 65,
      targetLightHours: 0,
      targetCO2: 400,
      targetPH: 6.5,
      equipmentIds:
        'climate-cure-1,cure-containers,boveda-packs,hygrometer-cure',
      status: 'ACTIVE',
    },
  ]

  for (const e of environments) {
    await prisma.growing_environments.create({
      data: {
        ...e,
        createdAt: now,
        updatedAt: now,
        createdBy: ownerId,
        farm_id: FARM_ID,
      },
    })
  }

  const inventoryItems = [
    {
      id: 'inv-nutrients-bloom-demo',
      name: 'Bloom Nutrients (Demo)',
      category: 'NUTRIENTS',
      sku: 'NUT-BLOOM-001',
      currentStock: 42,
      minStockLevel: 10,
      maxStockLevel: 100,
      unit: 'LITERS',
      costPerUnit: 79,
      supplier: 'Cultivation Supplies (Demo)',
      location: 'Storage - Shelf A1',
      status: 'ACTIVE',
    },
    {
      id: 'inv-nutrients-veg-demo',
      name: 'Vegetative Nutrients (Demo)',
      category: 'NUTRIENTS',
      sku: 'NUT-VEG-001',
      currentStock: 36,
      minStockLevel: 8,
      maxStockLevel: 80,
      unit: 'LITERS',
      costPerUnit: 72,
      supplier: 'Cultivation Supplies (Demo)',
      location: 'Storage - Shelf A1',
      status: 'ACTIVE',
    },
    {
      id: 'inv-compliance-tags-demo',
      name: 'Compliance Tags (Demo)',
      category: 'COMPLIANCE',
      sku: 'TAG-001',
      currentStock: 500,
      minStockLevel: 100,
      maxStockLevel: 2000,
      unit: 'TAGS',
      costPerUnit: 0.75,
      supplier: 'State Portal (Demo)',
      location: 'Office Storage',
      status: 'ACTIVE',
    },
    {
      id: 'inv-jars-demo',
      name: 'Glass Jars 1oz (Demo)',
      category: 'PACKAGING',
      sku: 'PKG-JAR-001',
      currentStock: 900,
      minStockLevel: 200,
      maxStockLevel: 2000,
      unit: 'UNITS',
      costPerUnit: 2.25,
      supplier: 'Packaging Co (Demo)',
      location: 'Packaging - Bin 2',
      status: 'ACTIVE',
    },
  ]

  for (const item of inventoryItems) {
    await prisma.inventory_items.create({
      data: {
        ...item,
        createdAt: now,
        updatedAt: now,
        createdBy: ownerId,
        updatedBy: ownerId,
        farm_id: FARM_ID,
      },
    })
  }

  const equipmentItems = [
    {
      id: 'eq-hvac-flower-demo',
      name: 'HVAC - Flower Room',
      type: 'HVAC',
      model: 'HVAC-XL',
      manufacturer: 'Climate Systems (Demo)',
      serialNumber: 'DEMO-HVAC-FL-001',
      location: 'Flower Room 1',
      installDate: new Date('2024-01-10'),
      warrantyExpiration: new Date('2027-01-10'),
      status: 'ACTIVE',
      maintenanceFrequency: 'MONTHLY',
      lastMaintenance: addDays(now, -20),
      nextMaintenance: addDays(now, 10),
      specifications: 'Temperature and humidity control',
      powerConsumption: 2.4,
      maintenanceCost: 250,
      replacementCost: 12000,
    },
    {
      id: 'eq-led-flower-demo',
      name: 'LED Lighting Array - Flower',
      type: 'LIGHTING',
      model: 'LED-600W',
      manufacturer: 'Lighting Systems (Demo)',
      serialNumber: 'DEMO-LED-FL-001',
      location: 'Flower Room 1',
      installDate: new Date('2024-02-01'),
      warrantyExpiration: new Date('2026-02-01'),
      status: 'ACTIVE',
      maintenanceFrequency: 'QUARTERLY',
      lastMaintenance: addDays(now, -35),
      nextMaintenance: addDays(now, 55),
      specifications: 'Full-spectrum LED',
      powerConsumption: 0.6,
      maintenanceCost: 75,
      replacementCost: 4500,
    },
    {
      id: 'eq-ph-meter-demo',
      name: 'pH Meter (Demo)',
      type: 'SENSOR',
      model: 'PH-PRO',
      manufacturer: 'Lab Tools (Demo)',
      serialNumber: 'DEMO-PH-001',
      location: 'Lab',
      installDate: new Date('2024-03-01'),
      warrantyExpiration: new Date('2025-03-01'),
      status: 'ACTIVE',
      maintenanceFrequency: 'MONTHLY',
      lastMaintenance: addDays(now, -10),
      nextMaintenance: addDays(now, 20),
      specifications: 'Calibrated weekly',
      powerConsumption: 0.01,
      maintenanceCost: 15,
      replacementCost: 250,
    },
  ]

  for (const eq of equipmentItems) {
    await prisma.equipment.create({
      data: {
        ...eq,
        createdAt: now,
        updatedAt: now,
        createdBy: ownerId,
        updatedBy: ownerId,
        farm_id: FARM_ID,
      },
    })
  }

  // Complete cultivation lifecycle batches - telling the Day 1 through Harvest story
  // Each batch represents a different stage in the cannabis cultivation journey
  const batches = [
    // BATCH 1: Blue Dream - Our flagship, currently in late flower (Day 85 of cycle)
    // This is the "hero" batch that demonstrates the full journey
    {
      id: 'batch-bd-2025-001',
      number: 'SO-BD-2025-001',
      strainId: strains[0].id, // Blue Dream
      status: 'FLOWERING',
      stage: 'Late Flower (Week 7)',
      qty: 48,
      zone: 'Flower Room 1 (Main)',
      plantDate: cycleStartDate, // Day 1
      daysInCycle: 85,
      notes:
        'Flagship Blue Dream batch. Trichomes showing 70% cloudy, 20% clear, 10% amber. Target harvest in 5-7 days. AI prediction: 21.3% THC based on environmental data.',
      yieldEstimate: 21.6, // kg wet weight
      aiInsights:
        'AI Analysis: Optimal harvest window predicted for Days 90-92. Current trichome development suggests peak THC at Day 91. Recommend increasing dark period to 14 hours for final 48 hours before harvest.',
    },
    // BATCH 2: OG Kush - Mid flower stage
    {
      id: 'batch-og-2025-001',
      number: 'SO-OG-2025-001',
      strainId: strains[1].id, // OG Kush
      status: 'FLOWERING',
      stage: 'Mid Flower (Week 4)',
      qty: 36,
      zone: 'Flower Room 2',
      plantDate: addDays(cycleStartDate, 21), // Started 3 weeks after Blue Dream
      daysInCycle: 64,
      notes:
        'OG Kush batch showing excellent bud development. Dense cola formation. Maintaining 45% RH to prevent mold.',
      yieldEstimate: 14.4,
      aiInsights:
        'AI Analysis: Growth rate 8% above strain average. Recommend maintaining current nutrient schedule. Predicted harvest: Day 112.',
    },
    // BATCH 3: Girl Scout Cookies - Early flower, just flipped
    {
      id: 'batch-gsc-2025-001',
      number: 'SO-GSC-2025-001',
      strainId: strains[2].id, // GSC
      status: 'FLOWERING',
      stage: 'Early Flower (Week 2)',
      qty: 42,
      zone: 'Flower Room 1 (Main)',
      plantDate: addDays(cycleStartDate, 42), // Started 6 weeks after Blue Dream
      daysInCycle: 43,
      notes:
        'GSC batch transitioned to flower 14 days ago. Stretch phase complete, now focusing energy on bud sites. 127 visible bud sites across batch.',
      yieldEstimate: 14.7,
      aiInsights:
        'AI Analysis: Stretch measured at 2.1x, within expected range. Defoliation recommended at Day 50 to improve light penetration to lower bud sites.',
    },
    // BATCH 4: Sour Diesel - Late vegetative, ready for flip
    {
      id: 'batch-sd-2025-001',
      number: 'SO-SD-2025-001',
      strainId: strains[3].id, // Sour Diesel
      status: 'VEGETATIVE',
      stage: 'Late Veg (Week 4)',
      qty: 40,
      zone: 'Vegetative Room 1',
      plantDate: addDays(cycleStartDate, 56), // Started 8 weeks after Blue Dream
      daysInCycle: 29,
      notes:
        'Sour Diesel ready for flower transition. Plants topped twice, 8 main colas per plant. Average height 24 inches. Scheduling flip for next Monday.',
      yieldEstimate: 20.0,
      aiInsights:
        'AI Analysis: Plant structure optimal for SCROG setup. Recommend 3 more days of veg to fill canopy to 85% before flip. Projected yield: 500g/plant.',
    },
    // BATCH 5: Granddaddy Purple - Early vegetative
    {
      id: 'batch-gdp-2025-001',
      number: 'SO-GDP-2025-001',
      strainId: strains[4].id, // GDP
      status: 'VEGETATIVE',
      stage: 'Early Veg (Week 2)',
      qty: 50,
      zone: 'Vegetative Room 2',
      plantDate: addDays(cycleStartDate, 70), // Started 10 weeks after Blue Dream
      daysInCycle: 15,
      notes:
        'GDP clones transplanted from propagation. Strong root development visible. First topping scheduled for Day 21.',
      yieldEstimate: 21.25,
      aiInsights:
        'AI Analysis: Root development 12% ahead of schedule. Recommend increasing nitrogen by 10% to support rapid vegetative growth.',
    },
    // BATCH 6: Blue Dream - New clones in propagation (next cycle)
    {
      id: 'batch-bd-2025-002',
      number: 'SO-BD-2025-002',
      strainId: strains[0].id, // Blue Dream
      status: 'SEEDLING',
      stage: 'Clones (Day 7)',
      qty: 60,
      zone: 'Clone & Propagation Room',
      plantDate: addDays(now, -7), // Just started last week
      daysInCycle: 7,
      notes:
        'New Blue Dream clones taken from mother plants. 58/60 showing root development. Ready for transplant in 7 days.',
      yieldEstimate: 27.0,
      aiInsights:
        'AI Analysis: Clone success rate 96.7%, above 95% target. Mother plant health score: 94/100. Recommend taking next clone batch in 14 days.',
    },
    // BATCH 7: OG Kush - Completed batch (harvested, dried, curing)
    {
      id: 'batch-og-2024-012',
      number: 'SO-OG-2024-012',
      strainId: strains[1].id, // OG Kush
      status: 'CURING',
      stage: 'Curing (Day 18)',
      qty: 32,
      zone: 'Curing Vault',
      plantDate: addDays(cycleStartDate, -90), // Previous cycle
      daysInCycle: 175,
      notes:
        'Harvest complete. Dry weight: 11.2 kg. Currently curing in grove bags. COA received: 24.1% THC, 0.3% CBD. Ready for packaging in 3 days.',
      yieldEstimate: 11.2,
      aiInsights:
        'AI Analysis: Final yield 350g/plant, 5% above prediction. Cure moisture at 62% RH - optimal. Terpene preservation estimated at 94%.',
    },
    // BATCH 8: GSC - Packaged and ready for sale
    {
      id: 'batch-gsc-2024-008',
      number: 'SO-GSC-2024-008',
      strainId: strains[2].id, // GSC
      status: 'HARVESTED',
      stage: 'Packaged - Ready for Sale',
      qty: 28,
      zone: 'Packaging & Vault',
      plantDate: addDays(cycleStartDate, -120), // Previous cycle
      daysInCycle: 205,
      notes:
        'Fully packaged and compliance-tagged. 892 units (1/8oz jars). COA: 26.8% THC. Allocated to North Bay Dispensary order.',
      yieldEstimate: 9.8,
      aiInsights:
        'AI Analysis: This batch achieved highest THC% in GSC history. Environmental conditions logged for replication. Recommend same parameters for SO-GSC-2025-001.',
    },
    // BATCH 9: Blue Dream - Previous harvest (Q4 2024)
    {
      id: 'batch-bd-2024-010',
      number: 'SO-BD-2024-010',
      strainId: strains[0].id, // Blue Dream
      status: 'HARVESTED',
      stage: 'Sold - Complete',
      qty: 45,
      zone: 'Flower Room 1 (Main)',
      plantDate: addDays(cycleStartDate, -150),
      daysInCycle: 235,
      notes:
        'Q4 2024 harvest. Final yield: 15.8 kg dry weight. COA: 22.1% THC, 0.3% CBD. Sold to Coastal Wellness and Green Valley.',
      yieldEstimate: 15.8,
      aiInsights:
        'AI Analysis: Yield 351g/plant, 3% above target. Terpene profile: Myrcene 1.2%, Pinene 0.8%, Caryophyllene 0.6%.',
    },
    // BATCH 10: Sour Diesel - Previous harvest (Q4 2024)
    {
      id: 'batch-sd-2024-007',
      number: 'SO-SD-2024-007',
      strainId: strains[3].id, // Sour Diesel
      status: 'HARVESTED',
      stage: 'Sold - Complete',
      qty: 38,
      zone: 'Flower Room 2',
      plantDate: addDays(cycleStartDate, -180),
      daysInCycle: 265,
      notes:
        'Q4 2024 harvest. Final yield: 14.2 kg dry weight. COA: 20.5% THC. Strong diesel terpene profile. Premium pricing achieved.',
      yieldEstimate: 14.2,
      aiInsights:
        'AI Analysis: Yield 374g/plant, 8% above strain average. Environmental conditions optimal throughout flower.',
    },
    // BATCH 11: Granddaddy Purple - Previous harvest (Q3 2024)
    {
      id: 'batch-gdp-2024-005',
      number: 'SO-GDP-2024-005',
      strainId: strains[4].id, // GDP
      status: 'HARVESTED',
      stage: 'Sold - Complete',
      qty: 42,
      zone: 'Flower Room 1 (Main)',
      plantDate: addDays(cycleStartDate, -210),
      daysInCycle: 295,
      notes:
        'Q3 2024 harvest. Final yield: 13.6 kg dry weight. COA: 19.8% THC, 0.5% CBD. Deep purple coloration achieved.',
      yieldEstimate: 13.6,
      aiInsights:
        'AI Analysis: Yield 324g/plant. Purple coloration enhanced by 10°F night temperature drop in final 2 weeks.',
    },
  ]

  for (const b of batches) {
    const strain = strains.find(s => s.id === b.strainId)!
    const totalDays =
      strain.floweringDays +
      CULTIVATION_TIMELINE.VEGETATIVE +
      CULTIVATION_TIMELINE.SEEDLING
    const expectedHarvestDate = addDays(b.plantDate, totalDays)

    await prisma.batches.create({
      data: {
        id: b.id,
        batchNumber: b.number,
        seedVarietyId: b.strainId,
        plantDate: b.plantDate,
        expectedHarvestDate,
        actualHarvestDate:
          b.status === 'HARVESTED' || b.status === 'CURING'
            ? addDays(expectedHarvestDate, -3)
            : null,
        quantity: b.qty,
        unit: 'PLANTS',
        growingMedium: 'COCO_COIR',
        status: b.status,
        growingZone: b.zone,
        fertilizersUsed:
          b.status === 'FLOWERING' ||
          b.status === 'HARVESTED' ||
          b.status === 'CURING'
            ? 'Advanced Nutrients Bloom A+B, Big Bud, Overdrive'
            : 'Advanced Nutrients Grow A+B, B-52, Voodoo Juice',
        harvestContainers: 'Food-grade stainless steel bins',
        irrigationSource: 'Reverse Osmosis + Cal-Mag',
        pestControlMethods:
          'IPM: Beneficial insects (ladybugs, predatory mites), neem oil preventive, sticky traps',
        storageConditions: '60-65°F, 58-62% RH, dark',
        transportationMethod: 'Climate-controlled vehicle with GPS tracking',
        organicCompliant: true,
        organicIntegrity: true,
        labelingCompliance: true,
        notes: `${b.notes}\n\n${b.aiInsights}`,
        createdAt: b.plantDate,
        updatedAt: now,
        createdBy: ownerId,
        updatedBy: ownerId,
        farm_id: FARM_ID,
      },
    })
  }

  const customers = [
    {
      id: 'cust-north-bay-demo',
      name: 'North Bay Dispensary (Demo)',
      email: 'purchasing@northbay.example',
      phone: '(555) 010-1000',
      street: '100 Market St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA',
      type: 'B2B',
      businessName: 'North Bay Dispensary',
      businessType: 'Dispensary',
      contactPerson: 'Purchasing',
      status: 'ACTIVE',
      creditLimit: 50000,
      paymentTerms: 'NET_30',
      orderFrequency: 'WEEKLY',
      preferredVarieties: 'Blue Dream, OG Kush',
    },
    {
      id: 'cust-coastal-demo',
      name: 'Coastal Wellness (Demo)',
      email: 'orders@coastalwellness.example',
      phone: '(555) 010-2000',
      street: '200 Ocean Blvd',
      city: 'Monterey',
      state: 'CA',
      zipCode: '93940',
      country: 'USA',
      type: 'B2B',
      businessName: 'Coastal Wellness',
      businessType: 'Dispensary',
      contactPerson: 'Operations',
      status: 'ACTIVE',
      creditLimit: 35000,
      paymentTerms: 'NET_15',
      orderFrequency: 'BIWEEKLY',
      preferredVarieties: 'Girl Scout Cookies, Jack Herer',
    },
    {
      id: 'cust-lab-demo',
      name: 'Statewide Testing Lab (Demo)',
      email: 'testing@statewidelab.example',
      phone: '(555) 010-3000',
      street: '300 Science Dr',
      city: 'Sacramento',
      state: 'CA',
      zipCode: '95814',
      country: 'USA',
      type: 'B2B',
      businessName: 'Statewide Testing Lab',
      businessType: 'Testing Lab',
      contactPerson: 'Lab Intake',
      status: 'ACTIVE',
      creditLimit: 15000,
      paymentTerms: 'NET_15',
      orderFrequency: 'AS_NEEDED',
      preferredVarieties: 'All',
    },
  ]

  for (const c of customers) {
    await prisma.customers.create({
      data: {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        street: c.street,
        city: c.city,
        state: c.state,
        zipCode: c.zipCode,
        country: c.country,
        type: c.type,
        businessName: c.businessName,
        businessType: c.businessType,
        contactPerson: c.contactPerson,
        status: c.status,
        creditLimit: c.creditLimit,
        paymentTerms: c.paymentTerms,
        orderFrequency: c.orderFrequency,
        preferredVarieties: c.preferredVarieties,
        createdAt: now,
        updatedAt: now,
        createdBy: ownerId,
        updatedBy: ownerId,
        farm_id: FARM_ID,
      },
    })
  }

  const orders = [
    {
      id: 'order-demo-001',
      orderNumber: 'SO-ORDER-0001',
      customerId: customers[0].id,
      deliveryMethod: 'PICKUP',
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      notes: 'Demo order for premium flower.',
      items: [
        {
          productName: 'Blue Dream Flower (Demo)',
          seedVarietyId: strains[0].id,
          quantity: 5,
          unit: 'LB',
          unitPrice: 2400,
        },
      ],
    },
    {
      id: 'order-demo-002',
      orderNumber: 'SO-ORDER-0002',
      customerId: customers[1].id,
      deliveryMethod: 'DELIVERY',
      status: 'PROCESSING',
      paymentStatus: 'PENDING',
      notes: 'Demo order for mixed strains.',
      items: [
        {
          productName: 'OG Kush Flower (Demo)',
          seedVarietyId: strains[1].id,
          quantity: 3,
          unit: 'LB',
          unitPrice: 2550,
        },
        {
          productName: 'GSC Flower (Demo)',
          seedVarietyId: strains[2].id,
          quantity: 2,
          unit: 'LB',
          unitPrice: 2650,
        },
      ],
    },
  ]

  for (const o of orders) {
    const subtotal = o.items.reduce(
      (acc, it) => acc + it.quantity * it.unitPrice,
      0
    )
    const tax = 0
    const shippingCost = 0
    const total = subtotal + tax + shippingCost

    await prisma.orders.create({
      data: {
        id: o.id,
        orderNumber: o.orderNumber,
        customerId: o.customerId,
        orderDate: addDays(now, -4),
        requestedDeliveryDate: addDays(now, 2),
        actualDeliveryDate: null,
        subtotal,
        shippingCost,
        tax,
        total,
        deliveryMethod: o.deliveryMethod,
        paymentStatus: o.paymentStatus,
        status: o.status,
        notes: o.notes,
        createdAt: now,
        updatedAt: now,
        createdBy: ownerId,
        updatedBy: ownerId,
        farm_id: FARM_ID,
      },
    })

    for (const item of o.items) {
      await prisma.order_items.create({
        data: {
          id: `${o.id}-${item.seedVarietyId}`,
          orderId: o.id,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          qualityRequirements: 'COA required (Demo)',
          seedVarietyId: item.seedVarietyId,
          unit: item.unit,
          farm_id: FARM_ID,
        },
      })
    }
  }

  const tasks = [
    {
      id: 'task-demo-001',
      title: 'Daily Environmental Check',
      description:
        'Review temperature/humidity/CO2 setpoints in all rooms and record results.',
      assignedTo: 'cultivation-manager',
      category: 'MONITORING',
      dueDate: addDays(now, 0),
      estimatedDuration: 45,
      priority: 'HIGH',
      status: 'PENDING',
      dependencies: '',
    },
    {
      id: 'task-demo-002',
      title: 'Batch Inspection',
      description:
        'Inspect active batches for pests/disease and confirm irrigation schedule.',
      assignedTo: 'quality-lead',
      category: 'QUALITY_CHECK',
      dueDate: addDays(now, 1),
      estimatedDuration: 60,
      priority: 'HIGH',
      status: 'PENDING',
      dependencies: '',
    },
  ]

  for (const t of tasks) {
    await prisma.tasks.create({
      data: {
        id: t.id,
        title: t.title,
        description: t.description,
        assignedBy: ownerId,
        assignedTo: t.assignedTo,
        category: t.category,
        dueDate: t.dueDate,
        estimatedDuration: t.estimatedDuration,
        priority: t.priority,
        status: t.status,
        dependencies: t.dependencies,
        updatedAt: now,
        farm_id: FARM_ID,
      },
    })
  }

  const inspectedBatch = batches[0] // Blue Dream flagship batch

  await prisma.quality_checks.create({
    data: {
      id: 'qc-demo-001',
      batchId: inspectedBatch.id,
      inspectorId: ownerId,
      checkDate: addDays(now, -1),
      checkType: 'VISUAL',
      status: 'PASS',
      correctiveActions: 'None required (Demo)',
      notes: 'Healthy canopy and consistent growth for demo purposes.',
      followUpRequired: false,
      updatedAt: now,
      farm_id: FARM_ID,
    },
  })

  // ============================================================
  // RECALL CASES - Complete recall management demo data
  // ============================================================
  const recallCases = [
    {
      id: 'recall-001',
      recallNumber: 'RC-2024-001',
      status: 'CLOSED',
      reason:
        'Routine quality audit - elevated moisture detected in packaging. Preventive recall initiated per SOP.',
      scope: 'batch',
      notes:
        'Recall completed successfully. All 892 units located and reprocessed. Root cause: humidity spike in curing vault on 11/15. CAPA implemented.',
    },
    {
      id: 'recall-002',
      recallNumber: 'RC-2024-002',
      status: 'IN_PROGRESS',
      reason:
        'Customer complaint - inconsistent potency reported by North Bay Dispensary. Lab retest ordered.',
      scope: 'lot',
      notes:
        'Affected lot: SO-BD-LOT-2024-Q4. 156 units shipped. 89 units returned. Awaiting lab results.',
    },
    {
      id: 'recall-003',
      recallNumber: 'RC-2025-001',
      status: 'OPEN',
      reason:
        'Training exercise - simulated recall for staff certification. No actual product affected.',
      scope: 'batch',
      notes:
        'Annual recall drill per compliance requirements. Testing notification systems and response times.',
    },
  ]

  for (const rc of recallCases) {
    const recallCase = await prisma.recall_cases.create({
      data: {
        id: rc.id,
        farm_id: FARM_ID,
        recallNumber: rc.recallNumber,
        status: rc.status,
        reason: rc.reason,
        scope: rc.scope,
        initiatedBy: ownerId,
        notes: rc.notes,
      },
    })

    // Add recall items for each case
    if (rc.id === 'recall-001') {
      await prisma.recall_items.create({
        data: {
          caseId: recallCase.id,
          farm_id: FARM_ID,
          entityType: 'batch',
          entityId: batches[7].id, // GSC packaged batch
          quantity: 892,
          unit: 'UNITS',
          status: 'returned',
          notes:
            'All units accounted for. Reprocessed and re-tested. COA verified.',
        },
      })
    } else if (rc.id === 'recall-002') {
      await prisma.recall_items.create({
        data: {
          caseId: recallCase.id,
          farm_id: FARM_ID,
          entityType: 'batch',
          entityId: batches[8].id, // Blue Dream harvested
          quantity: 156,
          unit: 'UNITS',
          status: 'located',
          notes:
            '89 units returned to facility. 67 units pending return from dispensary.',
        },
      })
    } else if (rc.id === 'recall-003') {
      await prisma.recall_items.create({
        data: {
          caseId: recallCase.id,
          farm_id: FARM_ID,
          entityType: 'batch',
          entityId: batches[6].id, // OG Kush curing
          quantity: 32,
          unit: 'PLANTS',
          status: 'located',
          notes:
            'Training exercise - no actual recall. Staff response time: 4.2 hours.',
        },
      })
    }
  }

  // ============================================================
  // CUSTODY EVENTS - Complete chain of custody for harvested batches
  // ============================================================
  const custodyStages = [
    {
      stage: 'HARVEST',
      location: 'Flower Room 1',
      notes:
        'Batch harvested at optimal trichome maturity. Weight: 18.2 kg wet.',
    },
    {
      stage: 'DRYING',
      location: 'Drying Room',
      notes: 'Hung to dry at 60°F, 55% RH. Target: 10-14 days.',
    },
    {
      stage: 'TRIMMING',
      location: 'Processing Area',
      notes: 'Hand-trimmed by certified staff. Trim weight: 2.1 kg.',
    },
    {
      stage: 'CURING',
      location: 'Curing Vault',
      notes: 'Placed in grove bags. Target cure: 21+ days at 62°F, 62% RH.',
    },
    {
      stage: 'TESTING',
      location: 'Lab Pickup',
      notes: 'Samples sent to Certified Labs Inc. COA pending.',
    },
    {
      stage: 'PACKAGING',
      location: 'Packaging Room',
      notes: 'Packaged into 1/8oz jars. 892 units created. Labels applied.',
    },
    {
      stage: 'VAULT_STORAGE',
      location: 'Secure Vault',
      notes: 'Stored in climate-controlled vault. Inventory tagged in Metrc.',
    },
    {
      stage: 'DISTRIBUTION',
      location: 'Loading Dock',
      notes:
        'Loaded for delivery to North Bay Dispensary. Manifest #MF-2024-1847.',
    },
  ]

  // Add custody events for multiple harvested batches
  const harvestedBatchIds = [
    batches[6].id,
    batches[7].id,
    batches[8].id,
    batches[9].id,
    batches[10].id,
  ]

  for (const batchId of harvestedBatchIds) {
    for (let i = 0; i < custodyStages.length; i++) {
      const cs = custodyStages[i]
      await prisma.custody_events.create({
        data: {
          farm_id: FARM_ID,
          entityType: 'batch',
          entityId: batchId,
          stage: cs.stage,
          timestamp: addDays(now, -(custodyStages.length - i) * 2), // Stagger timestamps
          performedBy: ownerId,
          location: cs.location,
          signature: `Demo Admin - ${cs.stage}`,
          notes: cs.notes,
        },
      })
    }
  }

  // ============================================================
  // ZONES - Required for Environmental Controls page
  // ============================================================
  const zones = [
    {
      id: 'zone-clone-room',
      name: 'Clone & Propagation',
      type: 'propagation',
      capacity: 500,
      area: 400,
      area_unit: 'sq_ft',
      description:
        'Climate-controlled propagation room for clones and seedlings. 75-78°F, 70-80% RH.',
      status: 'active',
    },
    {
      id: 'zone-veg-1',
      name: 'Vegetative Room 1',
      type: 'indoor',
      capacity: 200,
      area: 800,
      area_unit: 'sq_ft',
      description:
        'Primary vegetative growth room. 18/6 light cycle, 75-82°F, 50-60% RH.',
      status: 'active',
    },
    {
      id: 'zone-veg-2',
      name: 'Vegetative Room 2',
      type: 'indoor',
      capacity: 200,
      area: 800,
      area_unit: 'sq_ft',
      description:
        'Secondary vegetative growth room. 18/6 light cycle, 75-82°F, 50-60% RH.',
      status: 'active',
    },
    {
      id: 'zone-flower-1',
      name: 'Flower Room 1',
      type: 'indoor',
      capacity: 150,
      area: 1200,
      area_unit: 'sq_ft',
      description:
        'Primary flowering room. 12/12 light cycle, 68-75°F, 40-50% RH.',
      status: 'active',
    },
    {
      id: 'zone-flower-2',
      name: 'Flower Room 2',
      type: 'indoor',
      capacity: 150,
      area: 1200,
      area_unit: 'sq_ft',
      description:
        'Secondary flowering room. 12/12 light cycle, 68-75°F, 40-50% RH.',
      status: 'active',
    },
    {
      id: 'zone-dry-room',
      name: 'Drying Room',
      type: 'processing',
      capacity: 100,
      area: 500,
      area_unit: 'sq_ft',
      description:
        'Temperature and humidity controlled drying. 60-65°F, 50-60% RH, complete darkness.',
      status: 'active',
    },
    {
      id: 'zone-cure-vault',
      name: 'Curing Vault',
      type: 'storage',
      capacity: 200,
      area: 400,
      area_unit: 'sq_ft',
      description:
        'Long-term curing storage. 62-68°F, 58-65% RH. Grove bags and humidity packs.',
      status: 'active',
    },
  ]

  for (const z of zones) {
    await prisma.zones.upsert({
      where: { id: z.id },
      create: {
        ...z,
        farm_id: FARM_ID,
        created_by: ownerId,
        updated_by: ownerId,
      },
      update: {
        ...z,
        updated_by: ownerId,
      },
    })
  }

  // ============================================================
  // FEEDBACK SUBMISSIONS - Required for Feedback page
  // Uses schema: title, type (enum), description, priority (enum), status (enum)
  // ============================================================
  const feedbackSubmissions = [
    {
      id: 'feedback-001',
      title: 'Pre-Harvest Checklist Automation',
      category: 'Production',
      type: 'ENHANCEMENT' as const,
      description:
        'Suggest adding a pre-harvest checklist that auto-generates based on batch size. For 50+ plant harvests, we need to schedule extra trim staff 48 hours in advance. This would help with labor planning.',
      priority: 'NORMAL' as const,
      status: 'REVIEW' as const,
    },
    {
      id: 'feedback-002',
      title: 'Environmental Alert Thresholds',
      category: 'Equipment',
      type: 'ENHANCEMENT' as const,
      description:
        'The current humidity alerts trigger at 5% deviation. For flowering rooms, we need tighter tolerances (2-3%) to prevent mold issues. Can we make alert thresholds configurable per zone?',
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
    },
    {
      id: 'feedback-003',
      title: 'Excellent Batch Tracking',
      category: 'Production',
      type: 'GENERAL' as const,
      description:
        'The new batch tracking interface is excellent. Being able to see AI insights alongside environmental data has helped us optimize our Blue Dream yields by 12% this quarter.',
      priority: 'LOW' as const,
      status: 'CLOSED' as const,
    },
    {
      id: 'feedback-004',
      title: 'Calendar View Not Showing Weekend Tasks',
      category: 'Tasks',
      type: 'BUG' as const,
      description:
        'Tasks scheduled for Saturday and Sunday are not appearing in the calendar view, though they show correctly in the list view. This affects our weekend watering schedules.',
      priority: 'HIGH' as const,
      status: 'IN_PROGRESS' as const,
    },
  ]

  for (const fb of feedbackSubmissions) {
    await prisma.feedback_submissions.upsert({
      where: { id: fb.id },
      create: {
        ...fb,
        farm_id: FARM_ID,
        user_id: ownerId,
      },
      update: {
        title: fb.title,
        category: fb.category,
        type: fb.type,
        description: fb.description,
        priority: fb.priority,
        status: fb.status,
      },
    })
  }
}

async function main(): Promise<void> {
  const owner = await resolveCannabisOwner()
  const ownerId = owner.id
  await upsertCannabisFarm(ownerId)

  const defaultMode = env('OFMS_PRESERVE_USERS') === '1' ? 'append' : 'reset'
  const mode = env('DOCS_DEMO_MODE', defaultMode)
  if (mode === 'reset') {
    await clearCannabisFarmData()
  }

  await seedCannabisDemoData(ownerId)

  process.stdout.write('Demo farm and buyer-safe data seeded.\n')
  process.stdout.write(`Farm ID: ${FARM_ID}\n`)
  process.stdout.write(`Login URL: http://localhost:3005/auth/signin\n`)
  process.stdout.write(`Owner: ${owner.email}\n`)
  if (env('OFMS_PRESERVE_USERS') === '1') {
    process.stdout.write(
      'Users/credentials preserved (OFMS_PRESERVE_USERS=1).\n'
    )
  }
  process.stdout.write(
    'Use DOCS_DEMO_MODE=append to keep existing cannabis farm records.\n'
  )
}

main()
  .catch(err => {
    process.stderr.write(String(err?.stack || err?.message || err) + '\n')
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
