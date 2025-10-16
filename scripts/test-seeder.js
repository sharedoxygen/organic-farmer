#!/usr/bin/env node

/**
 * Simple test script to verify the data seeding concept
 */

const { PrismaClient } = require('@prisma/client');

// Use the target database from environment or default
const targetDb = process.env.DATABASE_URL || 'postgresql://postgres:REDACTED_DB_PASSWORD@localhost:5432/afarm_t';

console.log('🌱 Testing OFMS Data Seeder');
console.log(`Target database: ${targetDb}`);

const prisma = new PrismaClient({
  datasources: { db: { url: targetDb } }
});

// Simple test data from afarm_d
const testData = {
  users: [
    {
      id: 'admin-001',
      email: 'admin@ofms.com',
      firstName: 'Farm',
      lastName: 'Administrator',
      roles: JSON.stringify(['ADMIN']),
      department: 'Administration',
      position: 'System Administrator',
      hireDate: new Date(),
      permissions: JSON.stringify(['ALL']),
      isActive: true,
      employeeId: 'EMP001'
    }
  ],
  seedVarieties: [
    {
      id: 'seed-arugula-001',
      name: 'Arugula',
      scientificName: 'Eruca vesicaria',
      supplier: 'Organic Seeds USA',
      stockQuantity: 150.0,
      minStockLevel: 50.0,
      unit: 'grams',
      costPerUnit: 2.50,
      germinationRate: 0.92,
      daysToGermination: 3,
      daysToHarvest: 7,
      storageTemp: 4.0,
      storageHumidity: 50.0,
      lightExposure: 'PARTIAL',
      status: 'ADEQUATE',
      isOrganic: true,
      lotNumber: 'ORG-ARU-2024-001',
      seedSource: 'Certified Organic',
      usdaCompliant: true,
      auditTrail: 'Test data from afarm_d'
    }
  ]
};

async function testSeed() {
  try {
    console.log('💾 Creating test user...');
    const user = await prisma.users.create({
      data: {
        ...testData.users[0],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created user: ${user.email}`);

    console.log('🌱 Creating test seed variety...');
    const seedVariety = await prisma.seed_varieties.create({
      data: {
        ...testData.seedVarieties[0],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log(`✅ Created seed variety: ${seedVariety.name}`);

    console.log('🎉 Test seeding successful!');
    
    // Check what we created
    const userCount = await prisma.users.count();
    const seedCount = await prisma.seed_varieties.count();
    
    console.log(`📊 Database now has:`);
    console.log(`   👥 Users: ${userCount}`);
    console.log(`   🌱 Seed Varieties: ${seedCount}`);
    
  } catch (error) {
    console.error('❌ Test seeding failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSeed(); 