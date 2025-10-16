#!/usr/bin/env node

/**
 * OFMS Real Data Seeder - Extract ACTUAL operational data from afarm_d
 * 
 * This script extracts the REAL current operational dataset from afarm_d database
 * and loads it into target databases (afarm_t, afarm_research, etc.)
 * 
 * OFMS - Organic Farmer Management System
 */

const { PrismaClient } = require('@prisma/client');
const { Command } = require('commander');

const program = new Command();

program
  .name('ofms-real-data-seeder')
  .description('Extract REAL operational data from afarm_d and load into target database')
  .option('-r, --reset', 'Reset target database before loading')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Show what would be extracted/loaded without making changes')
  .option('-s, --source-db <url>', 'Source database URL (defaults to afarm_d)')
  .option('-t, --target-db <url>', 'Target database URL (required)')
  .option('--include-ai', 'Include AI demonstration data')
  .parse(process.argv);

const options = program.opts();

// Validate target database
if (!options.targetDb && !process.env.DATABASE_URL) {
  console.error('❌ Target database URL is required');
  console.error('Use: --target-db="postgresql://..." or set DATABASE_URL');
  process.exit(1);
}

// Database connections
const sourceDb = options.sourceDb || 'postgresql://postgres:REDACTED_DB_PASSWORD@localhost:5432/afarm_d';
const targetDb = options.targetDb || process.env.DATABASE_URL;

const sourcePrisma = new PrismaClient({
  datasources: { db: { url: sourceDb } }
});

const targetPrisma = new PrismaClient({
  datasources: { db: { url: targetDb } }
});

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🌱';
  
  if (options.verbose || level === 'error' || level === 'success' || level === 'warning') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

// Real Data Extraction Functions
async function extractRealData() {
  log('🔍 Extracting REAL operational data from afarm_d...');
  
  try {
    // Extract real users
    const users = await sourcePrisma.users.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' }
    });
    
    // Extract real seed varieties
    const seedVarieties = await sourcePrisma.seed_varieties.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Extract real customers
    const customers = await sourcePrisma.customers.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' }
    });
    
    // Extract real batches
    const batches = await sourcePrisma.batches.findMany({
      orderBy: { plantDate: 'desc' },
      take: 50 // Limit to recent batches
    });
    
    // Extract real orders (recent ones)
    const orders = await sourcePrisma.orders.findMany({
      include: {
        order_items: true
      },
      orderBy: { orderDate: 'desc' },
      take: 100 // Limit to recent orders
    });
    
    const realData = {
      users,
      seedVarieties,
      customers,
      batches,
      orders
    };
    
    log(`✅ Extracted ${realData.users.length} real users`, 'success');
    log(`✅ Extracted ${realData.seedVarieties.length} real seed varieties`, 'success');
    log(`✅ Extracted ${realData.customers.length} real customers`, 'success');
    log(`✅ Extracted ${realData.batches.length} real batches`, 'success');
    log(`✅ Extracted ${realData.orders.length} real orders`, 'success');
    
    return realData;
    
  } catch (error) {
    log(`❌ Failed to extract real data: ${error.message}`, 'error');
    throw error;
  }
}

// Data Loading Functions
async function resetTargetDatabase() {
  if (!options.reset) return;
  
  log('🗑️ Resetting target database...', 'warning');
  
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
    
    log('✅ Target database reset completed', 'success');
  } catch (error) {
    log(`❌ Database reset failed: ${error.message}`, 'error');
    throw error;
  }
}

async function loadRealUsers(users) {
  log('👥 Loading real users...');
  
  const createdUsers = [];
  
  for (const user of users) {
    if (options.dryRun) {
      log(`Would create user: ${user.email} (${user.firstName} ${user.lastName})`);
      continue;
    }
    
    try {
      // Create user without password field (we don't want to copy passwords)
      const userData = { ...user };
      delete userData.password;
      
      const createdUser = await targetPrisma.users.create({
        data: {
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdUsers.push(createdUser);
      log(`✅ Created user: ${createdUser.email} (${user.position})`, 'success');
    } catch (error) {
      log(`❌ Failed to create user ${user.email}: ${error.message}`, 'error');
    }
  }
  
  return createdUsers;
}

async function loadRealSeedVarieties(seedVarieties) {
  log('🌱 Loading real seed varieties...');
  
  const createdVarieties = [];
  
  for (const variety of seedVarieties) {
    if (options.dryRun) {
      log(`Would create variety: ${variety.name} (${variety.status})`);
      continue;
    }
    
    try {
      const createdVariety = await targetPrisma.seed_varieties.create({
        data: {
          ...variety,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdVarieties.push(createdVariety);
      log(`✅ Created variety: ${createdVariety.name} (${variety.status})`, 'success');
    } catch (error) {
      log(`❌ Failed to create variety ${variety.name}: ${error.message}`, 'error');
    }
  }
  
  return createdVarieties;
}

async function loadRealCustomers(customers, users) {
  log('🏪 Loading real customers...');
  
  const createdCustomers = [];
  const adminUser = users.find(u => u.roles && JSON.parse(u.roles).includes('ADMIN')) || users[0];
  
  for (const customer of customers) {
    if (options.dryRun) {
      log(`Would create customer: ${customer.name} (${customer.type})`);
      continue;
    }
    
    try {
      const createdCustomer = await targetPrisma.customers.create({
        data: {
          ...customer,
          createdBy: adminUser?.id,
          updatedBy: adminUser?.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdCustomers.push(createdCustomer);
      log(`✅ Created customer: ${createdCustomer.name} (${customer.type})`, 'success');
    } catch (error) {
      log(`❌ Failed to create customer ${customer.name}: ${error.message}`, 'error');
    }
  }
  
  return createdCustomers;
}

async function loadRealBatches(batches, users) {
  log('📦 Loading real production batches...');
  
  const createdBatches = [];
  const adminUser = users.find(u => u.roles && JSON.parse(u.roles).includes('ADMIN')) || users[0];
  
  for (const batch of batches) {
    if (options.dryRun) {
      log(`Would create batch: ${batch.batchNumber} (${batch.status})`);
      continue;
    }
    
    try {
      const createdBatch = await targetPrisma.batches.create({
        data: {
          ...batch,
          createdBy: adminUser?.id,
          updatedBy: adminUser?.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdBatches.push(createdBatch);
      log(`✅ Created batch: ${createdBatch.batchNumber} (${batch.status})`, 'success');
    } catch (error) {
      log(`❌ Failed to create batch ${batch.batchNumber}: ${error.message}`, 'error');
    }
  }
  
  return createdBatches;
}

async function loadRealOrders(orders, users) {
  log('📋 Loading real orders...');
  
  const createdOrders = [];
  const adminUser = users.find(u => u.roles && JSON.parse(u.roles).includes('ADMIN')) || users[0];
  
  for (const order of orders) {
    if (options.dryRun) {
      log(`Would create order: ${order.orderNumber} (${order.status}) with ${order.order_items?.length || 0} items`);
      continue;
    }
    
    try {
      // Create order without order_items first
      const orderData = { ...order };
      delete orderData.order_items;
      
      const createdOrder = await targetPrisma.orders.create({
        data: {
          ...orderData,
          createdBy: adminUser?.id,
          updatedBy: adminUser?.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      // Create order items
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          await targetPrisma.order_items.create({
            data: {
              ...item,
              orderId: createdOrder.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
      }
      
      createdOrders.push(createdOrder);
      log(`✅ Created order: ${createdOrder.orderNumber} (${order.status}) with ${order.order_items?.length || 0} items`, 'success');
    } catch (error) {
      log(`❌ Failed to create order ${order.orderNumber}: ${error.message}`, 'error');
    }
  }
  
  return createdOrders;
}

// Main Function
async function seedWithRealData() {
  log('🌱 OFMS REAL DATA SEEDER - Loading Current Operational Data');
  log(`📊 Source: ${sourceDb}`);
  log(`🎯 Target: ${targetDb}`);
  
  if (options.dryRun) {
    log('🧪 DRY RUN MODE - No data will be loaded', 'warning');
  }
  
  try {
    // Step 1: Reset target database if requested
    await resetTargetDatabase();
    
    // Step 2: Extract REAL operational data from afarm_d
    const realData = await extractRealData();
    
    // Step 3: Load real data in correct order (respecting foreign key constraints)
    const users = await loadRealUsers(realData.users);
    const seedVarieties = await loadRealSeedVarieties(realData.seedVarieties);
    const customers = await loadRealCustomers(realData.customers, users);
    const batches = await loadRealBatches(realData.batches, users);
    const orders = await loadRealOrders(realData.orders, users);
    
    // Step 4: Summary
    log('\n🎉 REAL OPERATIONAL DATA SEEDING COMPLETE!', 'success');
    log('📊 SUMMARY:');
    log(`   👥 Users: ${users.length}`);
    log(`   🌱 Seed Varieties: ${seedVarieties.length}`);
    log(`   🏪 Customers: ${customers.length}`);
    log(`   📦 Batches: ${batches.length}`);
    log(`   📋 Orders: ${orders.length}`);
    log(`   📊 Source: afarm_d (REAL operational data)`);
    log(`   🎯 Target: ${targetDb}`);
    
    if (options.dryRun) {
      log('\n💡 This was a dry run - no data was actually loaded');
    } else {
      log('\n✅ Target database is ready with REAL operational data!', 'success');
      log('   🌱 Current seed varieties from afarm_d');
      log('   🏪 Active customers from afarm_d');
      log('   📦 Recent production batches from afarm_d');
      log('   📋 Recent order history from afarm_d');
    }
    
  } catch (error) {
    log(`❌ Real data seeding failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Export for use by other scripts
module.exports = {
  seedWithRealData,
  extractRealData,
  loadRealUsers,
  loadRealSeedVarieties,
  loadRealCustomers,
  loadRealBatches,
  loadRealOrders
};

// Run if called directly
if (require.main === module) {
  seedWithRealData().catch(console.error);
} 