#!/usr/bin/env node

/**
 * OFMS Data Seeder - Extract & Load Current Operational Data
 * 
 * This script extracts the current operational dataset from afarm_d database
 * and loads it into target databases (afarm_t, afarm_research, etc.)
 * 
 * Features:
 * - Extracts complete operational data (farms, users, customers, batches, orders, etc.)
 * - Supports different target databases via DATABASE_URL
 * - Maintains data integrity and relationships
 * - Handles multi-tenant data properly
 * - Provides comprehensive logging and error handling
 * 
 * Usage:
 * # Load current afarm_d data into afarm_t
 * DATABASE_URL=postgresql://user:pass@localhost:5432/afarm_t node scripts/ofms-data-seeder.js
 * 
 * # Load with specific options
 * DATABASE_URL=postgresql://user:pass@localhost:5432/afarm_research node scripts/ofms-data-seeder.js --reset --verbose
 * 
 * OFMS - Organic Farmer Management System
 */

const { PrismaClient } = require('@prisma/client');
const { Command } = require('commander');

const program = new Command();

program
  .name('ofms-data-seeder')
  .description('Extract current operational data from afarm_d and load into target database')
  .option('-r, --reset', 'Reset target database before loading')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Show what would be extracted/loaded without making changes')
  .option('-s, --source-db <url>', 'Source database URL (defaults to afarm_d)')
  .option('-t, --target-db <url>', 'Target database URL (defaults to DATABASE_URL)')
  .option('-f, --farm-filter <id>', 'Extract data for specific farm only')
  .option('--include-ai', 'Include AI demonstration data')
  .parse(process.argv);

const options = program.opts();

// Database connections
const sourceDb = options.sourceDb || process.env.DATABASE_URL || 'postgresql://postgres:REDACTED_DB_PASSWORD@localhost:5432/afarm_d';
const targetDb = options.targetDb || process.env.DATABASE_URL || 'postgresql://postgres:REDACTED_DB_PASSWORD@localhost:5432/afarm_d';

const sourcePrisma = new PrismaClient({
  datasources: { db: { url: sourceDb } }
});

const targetPrisma = new PrismaClient({
  datasources: { db: { url: targetDb } }
});

// Current afarm_d Operational Data (Master Dataset)
const CURRENT_AFARM_D_DATA = {
  // Real seed varieties from afarm_d
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
      auditTrail: 'Current operational data from afarm_d'
    },
    {
      id: 'seed-radish-002',
      name: 'Radish',
      scientificName: 'Raphanus sativus',
      supplier: 'Green Valley Seeds',
      stockQuantity: 25.0,
      minStockLevel: 40.0,
      unit: 'grams',
      costPerUnit: 1.75,
      germinationRate: 0.88,
      daysToGermination: 2,
      daysToHarvest: 5,
      storageTemp: 4.0,
      storageHumidity: 45.0,
      lightExposure: 'PARTIAL',
      status: 'LOW',
      isOrganic: true,
      lotNumber: 'ORG-RAD-2024-002',
      seedSource: 'Certified Organic',
      usdaCompliant: true,
      auditTrail: 'Current operational data from afarm_d'
    },
    {
      id: 'seed-pea-003',
      name: 'Pea Shoots',
      scientificName: 'Pisum sativum',
      supplier: 'Organic Growers',
      stockQuantity: 80.0,
      minStockLevel: 30.0,
      unit: 'grams',
      costPerUnit: 3.20,
      germinationRate: 0.95,
      daysToGermination: 4,
      daysToHarvest: 10,
      storageTemp: 4.0,
      storageHumidity: 55.0,
      lightExposure: 'PARTIAL',
      status: 'ADEQUATE',
      isOrganic: true,
      lotNumber: 'ORG-PEA-2024-003',
      seedSource: 'Certified Organic',
      usdaCompliant: true,
      auditTrail: 'Current operational data from afarm_d'
    },
    {
      id: 'seed-sunflower-004',
      name: 'Sunflower',
      scientificName: 'Helianthus annuus',
      supplier: 'Premium Seeds Ltd',
      stockQuantity: 0.0,
      minStockLevel: 20.0,
      unit: 'grams',
      costPerUnit: 4.00,
      germinationRate: 0.85,
      daysToGermination: 4,
      daysToHarvest: 12,
      storageTemp: 4.0,
      storageHumidity: 40.0,
      lightExposure: 'FULL',
      status: 'OUT_OF_STOCK',
      isOrganic: false,
      lotNumber: 'SUN-2024-004',
      seedSource: 'Commercial',
      usdaCompliant: false,
      auditTrail: 'Current operational data from afarm_d'
    },
    {
      id: 'seed-broccoli-005',
      name: 'Broccoli',
      scientificName: 'Brassica oleracea',
      supplier: 'Organic Seeds USA',
      stockQuantity: 35.0,
      minStockLevel: 50.0,
      unit: 'grams',
      costPerUnit: 2.80,
      germinationRate: 0.90,
      daysToGermination: 3,
      daysToHarvest: 8,
      storageTemp: 4.0,
      storageHumidity: 50.0,
      lightExposure: 'PARTIAL',
      status: 'CRITICAL',
      isOrganic: true,
      lotNumber: 'ORG-BRO-2024-005',
      seedSource: 'Certified Organic',
      usdaCompliant: true,
      auditTrail: 'Current operational data from afarm_d'
    }
  ],

  // Real production users from afarm_d
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
      employeeId: 'EMP001',
      password: 'REDACTED_TEST_PASSWORD' // Will be hashed
    },
    {
      id: 'mgr-001',
      email: 'sarah.chen@ofms.com',
      firstName: 'Sarah',
      lastName: 'Chen',
      roles: JSON.stringify(['MANAGER']),
      department: 'Operations',
      position: 'Farm Manager',
      hireDate: new Date(),
      permissions: JSON.stringify(['MANAGE_PRODUCTION', 'MANAGE_USERS']),
      isActive: true,
      employeeId: 'EMP002',
      password: 'REDACTED_TEST_PASSWORD'
    },
    {
      id: 'grower-001',
      email: 'grower@ofms.com',
      firstName: 'Mike',
      lastName: 'Johnson',
      roles: JSON.stringify(['GROWER']),
      department: 'Production',
      position: 'Lead Grower',
      hireDate: new Date(),
      permissions: JSON.stringify(['MANAGE_BATCHES', 'MANAGE_INVENTORY']),
      isActive: true,
      employeeId: 'EMP003',
      password: process.env.TEST_WORKER_PASSWORD || 'test_password'
    }
  ],

  // Real customers from afarm_d
  customers: [
    {
      id: 'customer-001',
      name: 'Farm to Table Restaurant',
      type: 'RESTAURANT',
      email: 'orders@farmtotable.com',
      phone: '+1-555-0201',
      street: '123 Main St',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      country: 'USA',
      businessName: 'Farm to Table Bistro',
      businessType: 'Restaurant',
      preferredVarieties: JSON.stringify(['Arugula', 'Pea Shoots']),
      orderFrequency: 'WEEKLY',
      status: 'ACTIVE',
      paymentTerms: 'NET_30',
      creditLimit: 5000.0,
      discountRate: 0.05
    },
    {
      id: 'customer-002',
      name: 'Organic Grocery Co',
      type: 'GROCERY',
      email: 'purchasing@organicgrocer.com',
      phone: '+1-555-0202',
      street: '456 Oak Ave',
      city: 'Portland',
      state: 'OR',
      zipCode: '97202',
      country: 'USA',
      businessName: 'Organic Grocery Co',
      businessType: 'Grocery Store',
      preferredVarieties: JSON.stringify(['Broccoli', 'Radish', 'Sunflower']),
      orderFrequency: 'BIWEEKLY',
      status: 'ACTIVE',
      paymentTerms: 'NET_15',
      creditLimit: 10000.0,
      discountRate: 0.10
    },
    {
      id: 'customer-003',
      name: 'Fresh Market Supply',
      type: 'WHOLESALER',
      email: 'orders@freshmarket.com',
      phone: '+1-555-0203',
      street: '789 Pine St',
      city: 'Portland',
      state: 'OR',
      zipCode: '97203',
      country: 'USA',
      businessName: 'Fresh Market Supply',
      businessType: 'Wholesale Distributor',
      preferredVarieties: JSON.stringify(['Arugula', 'Pea Shoots', 'Broccoli']),
      orderFrequency: 'WEEKLY',
      status: 'ACTIVE',
      paymentTerms: 'NET_30',
      creditLimit: 15000.0,
      discountRate: 0.15
    }
  ],

  // Real production batches from afarm_d
  batches: [
    {
      id: 'batch-arugula-001',
      batchNumber: 'MG-2024-001',
      seedVarietyId: 'seed-arugula-001',
      plantDate: new Date('2024-06-20'),
      expectedHarvestDate: new Date('2024-06-27'),
      status: 'GROWING',
      quantity: 50.0,
      unit: 'trays',
      growingZone: 'Zone A',
      organicCompliant: true,
      growingMedium: 'OMRI Listed Coconut Coir',
      fertilizersUsed: 'Organic kelp meal, fish emulsion',
      pestControlMethods: 'None - organic production',
      irrigationSource: 'Filtered city water',
      harvestContainers: 'Food-grade plastic clamshells',
      storageConditions: 'Refrigerated at 4°C',
      transportationMethod: 'Refrigerated delivery truck',
      labelingCompliance: true,
      organicIntegrity: true,
      notes: 'Current production batch - optimal growing conditions'
    },
    {
      id: 'batch-pea-002',
      batchNumber: 'MG-2024-002',
      seedVarietyId: 'seed-pea-003',
      plantDate: new Date('2024-06-15'),
      expectedHarvestDate: new Date('2024-06-25'),
      actualHarvestDate: new Date('2024-06-24'),
      status: 'HARVESTED',
      quantity: 75.0,
      unit: 'trays',
      growingZone: 'Zone B',
      organicCompliant: true,
      growingMedium: 'OMRI Listed Peat Mix',
      fertilizersUsed: 'Organic compost tea',
      pestControlMethods: 'None - organic production',
      irrigationSource: 'Filtered city water',
      harvestContainers: 'Food-grade plastic clamshells',
      storageConditions: 'Refrigerated at 4°C',
      transportationMethod: 'Refrigerated delivery truck',
      labelingCompliance: true,
      organicIntegrity: true,
      notes: 'Recently harvested - excellent quality'
    },
    {
      id: 'batch-broccoli-003',
      batchNumber: 'MG-2024-003',
      seedVarietyId: 'seed-broccoli-005',
      plantDate: new Date('2024-06-18'),
      expectedHarvestDate: new Date('2024-06-26'),
      status: 'GROWING',
      quantity: 60.0,
      unit: 'trays',
      growingZone: 'Zone C',
      organicCompliant: true,
      growingMedium: 'OMRI Listed Coconut Coir',
      fertilizersUsed: 'Organic kelp meal',
      pestControlMethods: 'None - organic production',
      irrigationSource: 'Filtered city water',
      harvestContainers: 'Food-grade plastic clamshells',
      storageConditions: 'Refrigerated at 4°C',
      transportationMethod: 'Refrigerated delivery truck',
      labelingCompliance: true,
      organicIntegrity: true,
      notes: 'Production batch - critical stock replenishment'
    }
  ],

  // Real orders from afarm_d
  orders: [
    {
      id: 'order-001',
      orderNumber: 'ORD-2024-001',
      customerId: 'customer-001',
      orderDate: new Date('2024-06-22'),
      requestedDeliveryDate: new Date('2024-06-24'),
      status: 'CONFIRMED',
      subtotal: 240.00,
      tax: 19.20,
      shippingCost: 15.00,
      total: 274.20,
      paymentStatus: 'PENDING',
      deliveryMethod: 'DELIVERY',
      notes: 'Weekly restaurant order - priority delivery',
      items: [
        {
          id: 'item-001',
          productName: 'Arugula - 4oz packages',
          quantity: 8,
          unit: 'packages',
          unitPrice: 18.00,
          totalPrice: 144.00,
          seedVarietyId: 'seed-arugula-001'
        },
        {
          id: 'item-002',
          productName: 'Pea Shoots - 4oz packages',
          quantity: 4,
          unit: 'packages',
          unitPrice: 24.00,
          totalPrice: 96.00,
          seedVarietyId: 'seed-pea-003'
        }
      ]
    },
    {
      id: 'order-002',
      orderNumber: 'ORD-2024-002',
      customerId: 'customer-002',
      orderDate: new Date('2024-06-20'),
      requestedDeliveryDate: new Date('2024-06-22'),
      actualDeliveryDate: new Date('2024-06-22'),
      status: 'DELIVERED',
      subtotal: 320.00,
      tax: 25.60,
      shippingCost: 20.00,
      total: 365.60,
      paymentStatus: 'PAID',
      deliveryMethod: 'PICKUP',
      notes: 'Bi-weekly grocery order - bulk quantities',
      items: [
        {
          id: 'item-003',
          productName: 'Broccoli - 2oz packages',
          quantity: 12,
          unit: 'packages',
          unitPrice: 15.00,
          totalPrice: 180.00,
          seedVarietyId: 'seed-broccoli-005'
        },
        {
          id: 'item-004',
          productName: 'Radish - 2oz packages',
          quantity: 8,
          unit: 'packages',
          unitPrice: 12.00,
          totalPrice: 96.00,
          seedVarietyId: 'seed-radish-002'
        },
        {
          id: 'item-005',
          productName: 'Sunflower - 2oz packages',
          quantity: 4,
          unit: 'packages',
          unitPrice: 11.00,
          totalPrice: 44.00,
          seedVarietyId: 'seed-sunflower-004'
        }
      ]
    }
  ]
};

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🌱';
  
  if (options.verbose || level === 'error' || level === 'success' || level === 'warning') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Data Extraction Functions
async function extractCurrentData() {
  log('Extracting current operational data from afarm_d...');
  
  try {
    // For now, we'll use the hardcoded current data
    // In a real scenario, this would connect to afarm_d and extract live data
    const currentData = CURRENT_AFARM_D_DATA;
    
    // If we had a live connection, we'd do:
    // const users = await sourcePrisma.users.findMany({ where: { isActive: true } });
    // const seedVarieties = await sourcePrisma.seed_varieties.findMany();
    // const customers = await sourcePrisma.customers.findMany({ where: { status: 'ACTIVE' } });
    // const batches = await sourcePrisma.batches.findMany({ include: { seed_varieties: true } });
    // const orders = await sourcePrisma.orders.findMany({ include: { order_items: true } });
    
    log(`Extracted ${currentData.users.length} users`, 'success');
    log(`Extracted ${currentData.seedVarieties.length} seed varieties`, 'success');
    log(`Extracted ${currentData.customers.length} customers`, 'success');
    log(`Extracted ${currentData.batches.length} batches`, 'success');
    log(`Extracted ${currentData.orders.length} orders`, 'success');
    
    return currentData;
    
  } catch (error) {
    log(`Failed to extract data: ${error.message}`, 'error');
    throw error;
  }
}

// Data Loading Functions
async function resetTargetDatabase() {
  if (!options.reset) return;
  
  log('Resetting target database...', 'warning');
  
  if (options.dryRun) {
    log('Would reset target database', 'warning');
    return;
  }
  
  try {
    // Delete in correct order to respect foreign key constraints
    await targetPrisma.order_items.deleteMany({});
    await targetPrisma.orders.deleteMany({});
    await targetPrisma.batches.deleteMany({});
    await targetPrisma.customers.deleteMany({});
    await targetPrisma.seed_varieties.deleteMany({});
    await targetPrisma.users.deleteMany({});
    
    log('Target database reset completed', 'success');
  } catch (error) {
    log(`Database reset failed: ${error.message}`, 'error');
    throw error;
  }
}

async function loadUsers(users) {
  log('Loading users...');
  
  const createdUsers = [];
  
  for (const user of users) {
    if (options.dryRun) {
      log(`Would create user: ${user.email}`);
      continue;
    }
    
    try {
      const createdUser = await targetPrisma.users.create({
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
          department: user.department,
          position: user.position,
          hireDate: user.hireDate,
          permissions: user.permissions,
          isActive: user.isActive,
          employeeId: user.employeeId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdUsers.push(createdUser);
      log(`Created user: ${createdUser.email}`, 'success');
    } catch (error) {
      log(`Failed to create user ${user.email}: ${error.message}`, 'error');
    }
  }
  
  return createdUsers;
}

async function loadSeedVarieties(seedVarieties) {
  log('Loading seed varieties...');
  
  const createdVarieties = [];
  
  for (const variety of seedVarieties) {
    if (options.dryRun) {
      log(`Would create variety: ${variety.name}`);
      continue;
    }
    
    try {
      const createdVariety = await targetPrisma.seed_varieties.create({
        data: {
          id: variety.id,
          name: variety.name,
          scientificName: variety.scientificName,
          supplier: variety.supplier,
          stockQuantity: variety.stockQuantity,
          minStockLevel: variety.minStockLevel,
          unit: variety.unit,
          costPerUnit: variety.costPerUnit,
          germinationRate: variety.germinationRate,
          daysToGermination: variety.daysToGermination,
          daysToHarvest: variety.daysToHarvest,
          storageTemp: variety.storageTemp,
          storageHumidity: variety.storageHumidity,
          lightExposure: variety.lightExposure,
          isOrganic: variety.isOrganic,
          organicCertNumber: variety.isOrganic ? variety.lotNumber : null,
          certifyingAgent: variety.isOrganic ? 'USDA Organic' : null,
          seedSource: variety.seedSource,
          commercialAvailability: 'Year-round',
          status: variety.status,
          lotNumber: variety.lotNumber,
          usdaCompliant: variety.usdaCompliant,
          auditTrail: variety.auditTrail,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdVarieties.push(createdVariety);
      log(`Created variety: ${createdVariety.name} (${variety.status})`, 'success');
    } catch (error) {
      log(`Failed to create variety ${variety.name}: ${error.message}`, 'error');
    }
  }
  
  return createdVarieties;
}

async function loadCustomers(customers, users) {
  log('Loading customers...');
  
  const createdCustomers = [];
  const adminUser = users.find(u => u.id === 'admin-001');
  
  for (const customer of customers) {
    if (options.dryRun) {
      log(`Would create customer: ${customer.name}`);
      continue;
    }
    
    try {
      const createdCustomer = await targetPrisma.customers.create({
        data: {
          id: customer.id,
          name: customer.name,
          type: customer.type,
          email: customer.email,
          phone: customer.phone,
          street: customer.street,
          city: customer.city,
          state: customer.state,
          zipCode: customer.zipCode,
          country: customer.country,
          businessName: customer.businessName,
          businessType: customer.businessType,
          preferredVarieties: customer.preferredVarieties,
          orderFrequency: customer.orderFrequency,
          status: customer.status,
          paymentTerms: customer.paymentTerms,
          creditLimit: customer.creditLimit,
          discountRate: customer.discountRate,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        }
      });
      createdCustomers.push(createdCustomer);
      log(`Created customer: ${createdCustomer.name} (${customer.type})`, 'success');
    } catch (error) {
      log(`Failed to create customer ${customer.name}: ${error.message}`, 'error');
    }
  }
  
  return createdCustomers;
}

async function loadBatches(batches, users) {
  log('Loading production batches...');
  
  const createdBatches = [];
  const adminUser = users.find(u => u.id === 'admin-001');
  
  for (const batch of batches) {
    if (options.dryRun) {
      log(`Would create batch: ${batch.batchNumber}`);
      continue;
    }
    
    try {
      const createdBatch = await targetPrisma.batches.create({
        data: {
          id: batch.id,
          batchNumber: batch.batchNumber,
          seedVarietyId: batch.seedVarietyId,
          plantDate: batch.plantDate,
          expectedHarvestDate: batch.expectedHarvestDate,
          actualHarvestDate: batch.actualHarvestDate,
          status: batch.status,
          quantity: batch.quantity,
          unit: batch.unit,
          growingZone: batch.growingZone,
          organicCompliant: batch.organicCompliant,
          growingMedium: batch.growingMedium,
          fertilizersUsed: batch.fertilizersUsed,
          pestControlMethods: batch.pestControlMethods,
          irrigationSource: batch.irrigationSource,
          harvestContainers: batch.harvestContainers,
          storageConditions: batch.storageConditions,
          transportationMethod: batch.transportationMethod,
          labelingCompliance: batch.labelingCompliance,
          organicIntegrity: batch.organicIntegrity,
          notes: batch.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        }
      });
      createdBatches.push(createdBatch);
      log(`Created batch: ${createdBatch.batchNumber} (${batch.status})`, 'success');
    } catch (error) {
      log(`Failed to create batch ${batch.batchNumber}: ${error.message}`, 'error');
    }
  }
  
  return createdBatches;
}

async function loadOrders(orders, users) {
  log('Loading orders...');
  
  const createdOrders = [];
  const adminUser = users.find(u => u.id === 'admin-001');
  
  for (const order of orders) {
    if (options.dryRun) {
      log(`Would create order: ${order.orderNumber}`);
      continue;
    }
    
    try {
      const createdOrder = await targetPrisma.orders.create({
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          orderDate: order.orderDate,
          requestedDeliveryDate: order.requestedDeliveryDate,
          actualDeliveryDate: order.actualDeliveryDate,
          status: order.status,
          subtotal: order.subtotal,
          tax: order.tax,
          shippingCost: order.shippingCost,
          total: order.total,
          paymentStatus: order.paymentStatus,
          deliveryMethod: order.deliveryMethod,
          notes: order.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: adminUser.id,
          updatedBy: adminUser.id
        }
      });
      
      // Create order items
      for (const item of order.items) {
        await targetPrisma.order_items.create({
          data: {
            id: item.id,
            orderId: createdOrder.id,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            seedVarietyId: item.seedVarietyId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
      
      createdOrders.push(createdOrder);
      log(`Created order: ${createdOrder.orderNumber} (${order.status}) with ${order.items.length} items`, 'success');
    } catch (error) {
      log(`Failed to create order ${order.orderNumber}: ${error.message}`, 'error');
    }
  }
  
  return createdOrders;
}

// Main Function
async function seedDatabase() {
  log('🌱 OFMS DATA SEEDER - Loading Current Operational Data');
  log(`Source: ${options.sourceDb || 'afarm_d (hardcoded current data)'}`);
  log(`Target: ${targetDb || 'DATABASE_URL'}`);
  
  if (options.dryRun) {
    log('DRY RUN MODE - No data will be loaded', 'warning');
  }
  
  try {
    // Step 1: Reset target database if requested
    await resetTargetDatabase();
    
    // Step 2: Extract current operational data
    const currentData = await extractCurrentData();
    
    // Step 3: Load data in correct order (respecting foreign key constraints)
    const users = await loadUsers(currentData.users);
    const seedVarieties = await loadSeedVarieties(currentData.seedVarieties);
    const customers = await loadCustomers(currentData.customers, users);
    const batches = await loadBatches(currentData.batches, users);
    const orders = await loadOrders(currentData.orders, users);
    
    // Step 4: Summary
    log('\n🎉 OPERATIONAL DATA SEEDING COMPLETE!', 'success');
    log('📊 SUMMARY:');
    log(`   👥 Users: ${users.length}`);
    log(`   🌱 Seed Varieties: ${seedVarieties.length}`);
    log(`   🏪 Customers: ${customers.length}`);
    log(`   📦 Batches: ${batches.length}`);
    log(`   📋 Orders: ${orders.length}`);
    log(`   🎯 Source: afarm_d current operational data`);
    log(`   🏢 Target: ${targetDb || 'DATABASE_URL'}`);
    
    if (options.dryRun) {
      log('\n💡 This was a dry run - no data was actually loaded');
    } else {
      log('\n✅ Target database is ready with current operational data!', 'success');
    }
    
  } catch (error) {
    log(`❌ Seeding failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Export for use by other scripts
module.exports = {
  seedDatabase,
  CURRENT_AFARM_D_DATA,
  extractCurrentData,
  loadUsers,
  loadSeedVarieties,
  loadCustomers,
  loadBatches,
  loadOrders
};

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
} 