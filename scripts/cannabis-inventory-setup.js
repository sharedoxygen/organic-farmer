#!/usr/bin/env node
/**
 * Cannabis Inventory Setup for Shared Oxygen
 * Adds cannabis-specific inventory items for cultivation
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addCannabisInventory() {
  try {
    console.log('📦 Adding cannabis-specific inventory...')

    const farmId = '00000000-0000-0000-0000-000000000020'

    const inventoryItems = [
      {
        id: 'inv-bloom-nutrients-so',
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
        status: 'ACTIVE',
        createdBy: '00000000-0000-0000-0000-000000000100',
        updatedBy: '00000000-0000-0000-0000-000000000100',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-veg-nutrients-so',
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
        status: 'ACTIVE',
        createdBy: '00000000-0000-0000-0000-000000000100',
        updatedBy: '00000000-0000-0000-0000-000000000100',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-smart-pots-so',
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
        createdBy: '00000000-0000-0000-0000-000000000100',
        updatedBy: '00000000-0000-0000-0000-000000000100',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-trimming-scissors-so',
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
        createdBy: '00000000-0000-0000-0000-000000000100',
        updatedBy: '00000000-0000-0000-0000-000000000100',
        updatedAt: new Date(),
        farm_id: farmId,
      },
      {
        id: 'inv-compliance-tags-so',
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
        createdBy: '00000000-0000-0000-0000-000000000100',
        updatedBy: '00000000-0000-0000-0000-000000000100',
        updatedAt: new Date(),
        farm_id: farmId,
      },
    ]

    for (const item of inventoryItems) {
      await prisma.inventory_items.create({ data: item })
    }

    console.log(`✅ Added ${inventoryItems.length} cannabis inventory items`)

    // Final verification
    const counts = await Promise.all([
      prisma.seed_varieties.count({ where: { farm_id: farmId } }),
      prisma.growing_environments.count({ where: { farm_id: farmId } }),
      prisma.batches.count({ where: { farm_id: farmId } }),
      prisma.customers.count({ where: { farm_id: farmId } }),
      prisma.inventory_items.count({ where: { farm_id: farmId } }),
    ])

    console.log('\n🎉 SHARED OXYGEN CANNABIS OPERATION COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✅ Cannabis Strains: ${counts[0]} varieties`)
    console.log(`✅ Growing Environments: ${counts[1]} rooms`)
    console.log(`✅ Active Batches: ${counts[2]} cultivation batches`)
    console.log(`✅ B2B Customers: ${counts[3]} dispensaries & labs`)
    console.log(`✅ Cannabis Inventory: ${counts[4]} specialized items`)
    console.log('')
    console.log('🔒 CANNABIS COMPLIANCE READY:')
    console.log('   • California BCC Licensed (BCC-LIC-SHOX-2024-001)')
    console.log('   • Seed-to-Consumer Tracking Enabled')
    console.log('   • Multi-Stage Growth Environments')
    console.log('   • B2B Dispensary Relationships')
    console.log('   • Cannabis-Specific Inventory')
    console.log('')
    console.log('🚀 READY FOR FULL CANNABIS OPERATIONS!')
  } catch (error) {
    console.error('❌ Setup failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  addCannabisInventory()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = { addCannabisInventory }
