#!/usr/bin/env node
/**
 * Minimal Shared Oxygen Cannabis Setup
 * Just update the farm profile and add basic cannabis strains
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function setupMinimalCannabis() {
  try {
    console.log('🌿 Setting up Shared Oxygen Cannabis Farm (Minimal)...')

    const farmId = '00000000-0000-0000-0000-000000000020'
    const adminUserId = '00000000-0000-0000-0000-000000000100'

    // Step 1: Update farm profile
    console.log('📋 Updating farm profile...')
    await prisma.farms.update({
      where: { id: farmId },
      data: {
        farm_name: 'Shared Oxygen Farms',
        business_name: 'Shared Oxygen Cannabis Cultivation LLC',
        subscription_plan: 'ENTERPRISE_CANNABIS',
        settings: {
          farm_type: 'CANNABIS_CULTIVATION',
          state: 'CALIFORNIA',
          license_number: 'BCC-LIC-SHOX-2024-001',
          license_type: 'Adult-Use Cultivation',
          canopy_size_sqft: 5000,
          compliance_level: 'BCC_COMPLIANT',
          testing_required: true,
          seed_to_consumer_tracking: true,
        },
      },
    })

    // Step 2: Clear existing seed varieties
    console.log('🗑️ Clearing existing seed varieties...')
    await prisma.seed_varieties.deleteMany({ where: { farm_id: farmId } })

    // Step 3: Add cannabis strains (minimal required fields only)
    console.log('🌱 Adding cannabis strains...')
    const strains = [
      {
        id: 'strain-blue-dream-so',
        name: 'Blue Dream',
        scientificName: 'Cannabis sativa x indica',
        supplier: 'California Cannabis Genetics',
        stockQuantity: 50,
        minStockLevel: 10,
        unit: 'SEEDS',
        costPerUnit: 25.0,
        germinationRate: 95,
        daysToGermination: 3,
        daysToHarvest: 70,
        storageTemp: 2.0,
        storageHumidity: 50.0,
        lightExposure: 'CONTROLLED',
        status: 'ACTIVE',
        isOrganic: true,
        lotNumber: 'CCG-BD-2025-001',
        auditTrail: 'Licensed California Cannabis Strain',
        usdaCompliant: true,
        seedSource: 'Licensed Cultivator',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'strain-og-kush-so',
        name: 'OG Kush',
        scientificName: 'Cannabis indica',
        supplier: 'California Cannabis Genetics',
        stockQuantity: 40,
        minStockLevel: 8,
        unit: 'SEEDS',
        costPerUnit: 30.0,
        germinationRate: 92,
        daysToGermination: 3,
        daysToHarvest: 63,
        storageTemp: 2.0,
        storageHumidity: 50.0,
        lightExposure: 'CONTROLLED',
        status: 'ACTIVE',
        isOrganic: true,
        lotNumber: 'CCG-OG-2025-002',
        auditTrail: 'Licensed California Cannabis Strain',
        usdaCompliant: true,
        seedSource: 'Licensed Cultivator',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'strain-girl-scout-cookies-so',
        name: 'Girl Scout Cookies',
        scientificName: 'Cannabis indica x sativa',
        supplier: 'California Cannabis Genetics',
        stockQuantity: 35,
        minStockLevel: 7,
        unit: 'SEEDS',
        costPerUnit: 35.0,
        germinationRate: 90,
        daysToGermination: 4,
        daysToHarvest: 70,
        storageTemp: 2.0,
        storageHumidity: 50.0,
        lightExposure: 'CONTROLLED',
        status: 'ACTIVE',
        isOrganic: true,
        lotNumber: 'CCG-GSC-2025-003',
        auditTrail: 'Licensed California Cannabis Strain',
        usdaCompliant: true,
        seedSource: 'Licensed Cultivator',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'strain-jack-herer-so',
        name: 'Jack Herer',
        scientificName: 'Cannabis sativa',
        supplier: 'California Cannabis Genetics',
        stockQuantity: 45,
        minStockLevel: 9,
        unit: 'SEEDS',
        costPerUnit: 28.0,
        germinationRate: 94,
        daysToGermination: 3,
        daysToHarvest: 67,
        storageTemp: 2.0,
        storageHumidity: 50.0,
        lightExposure: 'CONTROLLED',
        status: 'ACTIVE',
        isOrganic: true,
        lotNumber: 'CCG-JH-2025-004',
        auditTrail: 'Licensed California Cannabis Strain',
        usdaCompliant: true,
        seedSource: 'Licensed Cultivator',
        farm_id: farmId,
        createdBy: adminUserId,
        updatedBy: adminUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    for (const strain of strains) {
      await prisma.seed_varieties.create({ data: strain })
    }

    // Verification
    const farm = await prisma.farms.findUnique({ where: { id: farmId } })
    const strainCount = await prisma.seed_varieties.count({
      where: { farm_id: farmId },
    })

    console.log('\n🎉 Shared Oxygen Cannabis Setup Complete!')
    console.log(`✅ Farm: ${farm.farm_name} - ${farm.business_name}`)
    console.log(`✅ Cannabis strains: ${strainCount} varieties`)
    console.log(`✅ License: ${farm.settings.license_number}`)
    console.log(`✅ Farm type: ${farm.settings.farm_type}`)

    console.log('\n🔒 Next Steps:')
    console.log('• Add growing environments via admin interface')
    console.log('• Create cannabis batches for seed-to-consumer tracking')
    console.log('• Set up dispensary customers')
    console.log('• Configure compliance testing workflows')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  setupMinimalCannabis()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { setupMinimalCannabis }
