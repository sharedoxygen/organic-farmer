#!/usr/bin/env node

/**
 * OFMS SQL Data Seeder - Extract REAL operational data using direct SQL
 * 
 * This script extracts the REAL current operational dataset from afarm_d database
 * and loads it into target databases using direct SQL queries.
 * 
 * OFMS - Organic Farmer Management System
 */

const { Client } = require('pg');
const { Command } = require('commander');

const program = new Command();

program
  .name('ofms-sql-data-seeder')
  .description('Extract REAL operational data from afarm_d using SQL and load into target database')
  .option('-r, --reset', 'Reset target database before loading')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Show what would be extracted/loaded without making changes')
  .option('-t, --target-db <url>', 'Target database URL (required)')
  .parse(process.argv);

const options = program.opts();

// Validate target database
if (!options.targetDb && !process.env.DATABASE_URL) {
  console.error('❌ Target database URL is required');
  console.error('Usage: node scripts/ofms-sql-data-seeder.js --target-db="postgresql://..." [options]');
  process.exit(1);
}

// Database connections
const sourceDb = 'postgresql://postgres:REDACTED_DB_PASSWORD@localhost:5432/afarm_d';
const targetDb = options.targetDb || process.env.DATABASE_URL;

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🌱';
  
  if (options.verbose || level === 'error' || level === 'success' || level === 'warning') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

function parseConnectionString(url) {
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) throw new Error('Invalid PostgreSQL connection string');
  
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4]),
    database: match[5]
  };
}

// Data Extraction Functions
async function extractRealData() {
  log('🔍 Extracting REAL operational data from afarm_d using SQL...');
  
  const sourceClient = new Client(parseConnectionString(sourceDb));
  
  try {
    await sourceClient.connect();
    
    // Extract real users (active only)
    const usersResult = await sourceClient.query(`
      SELECT * FROM users 
      WHERE "isActive" = true 
      ORDER BY "createdAt" ASC
    `);
    
    // Extract real seed varieties
    const seedVarietiesResult = await sourceClient.query(`
      SELECT * FROM seed_varieties 
      ORDER BY name ASC
    `);
    
    // Extract real active customers
    const customersResult = await sourceClient.query(`
      SELECT * FROM customers 
      WHERE status = 'ACTIVE' 
      ORDER BY name ASC
    `);
    
    // Extract recent batches
    const batchesResult = await sourceClient.query(`
      SELECT * FROM batches 
      ORDER BY "plantDate" DESC 
      LIMIT 50
    `);
    
    // Extract recent orders
    const ordersResult = await sourceClient.query(`
      SELECT * FROM orders 
      ORDER BY "orderDate" DESC 
      LIMIT 100
    `);
    
    // Extract order items for the recent orders
    const orderItemsResult = await sourceClient.query(`
      SELECT oi.* FROM order_items oi
      JOIN orders o ON oi."orderId" = o.id
      ORDER BY o."orderDate" DESC
      LIMIT 500
    `);
    
    const realData = {
      users: usersResult.rows,
      seedVarieties: seedVarietiesResult.rows,
      customers: customersResult.rows,
      batches: batchesResult.rows,
      orders: ordersResult.rows,
      orderItems: orderItemsResult.rows
    };
    
    log(`✅ Extracted ${realData.users.length} real users`, 'success');
    log(`✅ Extracted ${realData.seedVarieties.length} real seed varieties`, 'success');
    log(`✅ Extracted ${realData.customers.length} real customers`, 'success');
    log(`✅ Extracted ${realData.batches.length} real batches`, 'success');
    log(`✅ Extracted ${realData.orders.length} real orders`, 'success');
    log(`✅ Extracted ${realData.orderItems.length} real order items`, 'success');
    
    return realData;
    
  } catch (error) {
    log(`❌ Failed to extract real data: ${error.message}`, 'error');
    throw error;
  } finally {
    await sourceClient.end();
  }
}

// Data Loading Functions
async function resetTargetDatabase(targetClient) {
  if (!options.reset) return;
  
  log('🗑️ Resetting target database...', 'warning');
  
  if (options.dryRun) {
    log('Would reset target database', 'warning');
    return;
  }
  
  try {
    // Delete in correct order to respect foreign key constraints
    await targetClient.query('DELETE FROM order_items');
    await targetClient.query('DELETE FROM orders');
    await targetClient.query('DELETE FROM batches');
    await targetClient.query('DELETE FROM customers');
    await targetClient.query('DELETE FROM seed_varieties');
    await targetClient.query('DELETE FROM users');
    
    log('✅ Target database reset completed', 'success');
  } catch (error) {
    log(`❌ Database reset failed: ${error.message}`, 'error');
    throw error;
  }
}

async function loadRealData(realData, targetClient) {
  log('📊 Loading real operational data...');
  
  if (options.dryRun) {
    log('🧪 DRY RUN - Would load the following data:');
    log(`   👥 ${realData.users.length} users`);
    log(`   🌱 ${realData.seedVarieties.length} seed varieties`);
    log(`   🏪 ${realData.customers.length} customers`);
    log(`   📦 ${realData.batches.length} batches`);
    log(`   📋 ${realData.orders.length} orders`);
    log(`   📝 ${realData.orderItems.length} order items`);
    return;
  }
  
  try {
    // Load users (exclude password field for security)
    log('👥 Loading real users...');
    for (const user of realData.users) {
      const { password, ...userData } = user; // Exclude password
      const columns = Object.keys(userData).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(userData).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(userData);
      
      await targetClient.query(
        `INSERT INTO users (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }
    log(`✅ Loaded ${realData.users.length} users`, 'success');
    
    // Load seed varieties
    log('🌱 Loading real seed varieties...');
    for (const variety of realData.seedVarieties) {
      const columns = Object.keys(variety).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(variety).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(variety);
      
      await targetClient.query(
        `INSERT INTO seed_varieties (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }
    log(`✅ Loaded ${realData.seedVarieties.length} seed varieties`, 'success');
    
    // Load customers
    log('🏪 Loading real customers...');
    for (const customer of realData.customers) {
      const columns = Object.keys(customer).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(customer).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(customer);
      
      await targetClient.query(
        `INSERT INTO customers (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }
    log(`✅ Loaded ${realData.customers.length} customers`, 'success');
    
    // Load batches
    log('📦 Loading real production batches...');
    for (const batch of realData.batches) {
      const columns = Object.keys(batch).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(batch).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(batch);
      
      await targetClient.query(
        `INSERT INTO batches (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }
    log(`✅ Loaded ${realData.batches.length} batches`, 'success');
    
    // Load orders
    log('📋 Loading real orders...');
    for (const order of realData.orders) {
      const columns = Object.keys(order).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(order).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(order);
      
      await targetClient.query(
        `INSERT INTO orders (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }
    log(`✅ Loaded ${realData.orders.length} orders`, 'success');
    
    // Load order items
    log('📝 Loading real order items...');
    for (const item of realData.orderItems) {
      const columns = Object.keys(item).map(k => `"${k}"`).join(', ');
      const placeholders = Object.keys(item).map((_, i) => `$${i + 1}`).join(', ');
      const values = Object.values(item);
      
      await targetClient.query(
        `INSERT INTO order_items (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        values
      );
    }
    log(`✅ Loaded ${realData.orderItems.length} order items`, 'success');
    
  } catch (error) {
    log(`❌ Failed to load data: ${error.message}`, 'error');
    throw error;
  }
}

// Main Function
async function seedWithRealData() {
  log('🌱 OFMS SQL DATA SEEDER - Loading Current Operational Data');
  log(`📊 Source: afarm_d (REAL operational data)`);
  log(`🎯 Target: ${targetDb}`);
  
  if (options.dryRun) {
    log('🧪 DRY RUN MODE - No data will be loaded', 'warning');
  }
  
  const targetClient = new Client(parseConnectionString(targetDb));
  
  try {
    await targetClient.connect();
    
    // Step 1: Reset target database if requested
    await resetTargetDatabase(targetClient);
    
    // Step 2: Extract REAL operational data from afarm_d
    const realData = await extractRealData();
    
    // Step 3: Load real data
    await loadRealData(realData, targetClient);
    
    // Step 4: Verify results
    if (!options.dryRun) {
      const userCount = await targetClient.query('SELECT COUNT(*) FROM users');
      const seedCount = await targetClient.query('SELECT COUNT(*) FROM seed_varieties');
      const customerCount = await targetClient.query('SELECT COUNT(*) FROM customers');
      const batchCount = await targetClient.query('SELECT COUNT(*) FROM batches');
      const orderCount = await targetClient.query('SELECT COUNT(*) FROM orders');
      
      log('\n🎉 REAL OPERATIONAL DATA SEEDING COMPLETE!', 'success');
      log('📊 VERIFICATION:');
      log(`   👥 Users loaded: ${userCount.rows[0].count}`);
      log(`   🌱 Seed Varieties loaded: ${seedCount.rows[0].count}`);
      log(`   🏪 Customers loaded: ${customerCount.rows[0].count}`);
      log(`   📦 Batches loaded: ${batchCount.rows[0].count}`);
      log(`   📋 Orders loaded: ${orderCount.rows[0].count}`);
      log(`   📊 Source: afarm_d (REAL operational data)`);
      log(`   🎯 Target: ${targetDb}`);
      log('\n✅ Target database is ready with REAL operational data!', 'success');
    } else {
      log('\n💡 This was a dry run - no data was actually loaded');
    }
    
  } catch (error) {
    log(`❌ Real data seeding failed: ${error.message}`, 'error');
    throw error;
  } finally {
    await targetClient.end();
  }
}

// Run if called directly
if (require.main === module) {
  seedWithRealData().catch(console.error);
}

module.exports = { seedWithRealData, extractRealData }; 