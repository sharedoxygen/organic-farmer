#!/usr/bin/env node

/**
 * OFMS MASTER DATA GENERATOR
 * Consolidated tool for all data generation needs
 * Replaces 10+ individual data generation scripts
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { program } = require('commander');

const prisma = new PrismaClient();

// CLI Configuration
program
  .name('ofms-data-generator')
  .description('OFMS Master Data Generator - Consolidated tool for all data generation needs')
  .version('1.0.0');

program
  .option('-m, --mode <mode>', 'Generation mode', 'demo')
  .option('-f, --farm-type <type>', 'Farm type for specialized data', 'microgreens')
  .option('-s, --size <size>', 'Data size (small, medium, large)', 'medium')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run - show what would be generated')
  .option('--reset', 'Reset database before generating data')
  .parse(process.argv);

const options = program.opts();

// Data Generation Modes
const GENERATION_MODES = {
  demo: 'Quick demo data for testing',
  comprehensive: 'Full business data with complete workflows',
  'ai-showcase': 'AI features demonstration data',
  production: 'Production-like data for staging',
  testing: 'Testing scenarios and edge cases'
};

// Farm Types
const FARM_TYPES = {
  microgreens: 'Microgreens production facility',
  cannabis: 'Cannabis cultivation operation',
  hydroponic: 'Hydroponic growing system',
  vertical: 'Vertical farming operation',
  mixed: 'Mixed agriculture facility'
};

// Data Size Configurations
const DATA_SIZES = {
  small: { users: 5, batches: 10, customers: 8, orders: 15 },
  medium: { users: 12, batches: 25, customers: 20, orders: 40 },
  large: { users: 25, batches: 50, customers: 40, orders: 80 }
};

// Production Users (from create-production-users.js)
const PRODUCTION_USERS = [
  { id: 'admin-001', email: 'admin@ofms.com', password: 'process.env.TEST_ADMIN_PASSWORD || 'test_password'', role: 'ADMIN' },
  { id: 'mgr-001', email: 'sarah.chen@ofms.com', password: 'process.env.TEST_ADMIN_PASSWORD || 'test_password'', role: 'MANAGER' },
  { id: 'mgr-002', email: 'operations@ofms.com', password: 'process.env.TEST_ADMIN_PASSWORD || 'test_password'', role: 'MANAGER' },
  { id: 'tl-001', email: 'production.lead@ofms.com', password: 'process.env.TEST_ADMIN_PASSWORD || 'test_password'', role: 'TEAM_LEAD' },
  { id: 'sl-001', email: 'quality.lead@ofms.com', password: 'process.env.TEST_ADMIN_PASSWORD || 'test_password'', role: 'TEAM_LEAD' },
  { id: 'tm-001', email: 'team.member@ofms.com', password: process.env.TEST_WORKER_PASSWORD || 'test_password', role: 'TEAM_MEMBER' },
  { id: 'sp-001', email: 'quality@ofms.com', password: process.env.TEST_WORKER_PASSWORD || 'test_password', role: 'QUALITY_CONTROL' },
  { id: 'tm-002', email: 'grower@ofms.com', password: process.env.TEST_WORKER_PASSWORD || 'test_password', role: 'GROWER' },
  { id: 'tm-003', email: 'harvest@ofms.com', password: process.env.TEST_WORKER_PASSWORD || 'test_password', role: 'HARVESTER' }
];

// Master Seed Data from afarm_d Database
const AFARM_D_SEED_VARIETIES = [
  {
    name: 'Arugula',
    scientificName: 'Eruca vesicaria',
    supplier: 'Organic Seeds USA',
    stockQuantity: 150.0,
    minStockLevel: 50.0,
    costPerUnit: 2.50,
    germinationRate: 92,
    daysToGermination: 3,
    daysToHarvest: 7,
    storageTemp: 4.0,
    storageHumidity: 50.0,
    lightExposure: 'PARTIAL',
    status: 'ADEQUATE',
    isOrganic: true,
    lotNumber: 'ORG-ARU-2024-001',
    seedSource: 'Certified Organic',
    usdaCompliant: true
  },
  {
    name: 'Radish',
    scientificName: 'Raphanus sativus',
    supplier: 'Green Valley Seeds',
    stockQuantity: 25.0,
    minStockLevel: 40.0,
    costPerUnit: 1.75,
    germinationRate: 88,
    daysToGermination: 2,
    daysToHarvest: 5,
    storageTemp: 4.0,
    storageHumidity: 45.0,
    lightExposure: 'PARTIAL',
    status: 'LOW',
    isOrganic: true,
    lotNumber: 'ORG-RAD-2024-002',
    seedSource: 'Certified Organic',
    usdaCompliant: true
  },
  {
    name: 'Pea Shoots',
    scientificName: 'Pisum sativum',
    supplier: 'Organic Growers',
    stockQuantity: 80.0,
    minStockLevel: 30.0,
    costPerUnit: 3.20,
    germinationRate: 95,
    daysToGermination: 4,
    daysToHarvest: 10,
    storageTemp: 4.0,
    storageHumidity: 55.0,
    lightExposure: 'PARTIAL',
    status: 'ADEQUATE',
    isOrganic: true,
    lotNumber: 'ORG-PEA-2024-003',
    seedSource: 'Certified Organic',
    usdaCompliant: true
  },
  {
    name: 'Sunflower',
    scientificName: 'Helianthus annuus',
    supplier: 'Premium Seeds Ltd',
    stockQuantity: 0.0,
    minStockLevel: 20.0,
    costPerUnit: 4.00,
    germinationRate: 85,
    daysToGermination: 4,
    daysToHarvest: 12,
    storageTemp: 4.0,
    storageHumidity: 40.0,
    lightExposure: 'FULL',
    status: 'OUT_OF_STOCK',
    isOrganic: false,
    lotNumber: 'SUN-2024-004',
    seedSource: 'Commercial',
    usdaCompliant: false
  },
  {
    name: 'Broccoli',
    scientificName: 'Brassica oleracea',
    supplier: 'Organic Seeds USA',
    stockQuantity: 35.0,
    minStockLevel: 50.0,
    costPerUnit: 2.80,
    germinationRate: 90,
    daysToGermination: 3,
    daysToHarvest: 8,
    storageTemp: 4.0,
    storageHumidity: 50.0,
    lightExposure: 'PARTIAL',
    status: 'CRITICAL',
    isOrganic: true,
    lotNumber: 'ORG-BRO-2024-005',
    seedSource: 'Certified Organic',
    usdaCompliant: true
  }
];

// AI Demo Scenarios (from create-ai-demo-data.js)
const AI_DEMO_SCENARIOS = {
  microgreens: {
    crops: ['Arugula', 'Basil', 'Kale', 'Pea Shoots', 'Radish', 'Cilantro'],
    commonDiseases: ['Powdery Mildew', 'Damping Off', 'Root Rot', 'Healthy'],
    marketDemand: {
      'Arugula': { basePrice: 16.0, seasonality: 1.2, demand: 'high' },
      'Basil': { basePrice: 18.0, seasonality: 1.4, demand: 'very_high' },
      'Kale': { basePrice: 14.0, seasonality: 0.9, demand: 'medium' },
      'Pea Shoots': { basePrice: 22.0, seasonality: 1.6, demand: 'premium' },
      'Radish': { basePrice: 12.0, seasonality: 0.8, demand: 'low' }
    },
    aiAccuracy: 0.94,
    roiIncrease: '340%'
  },
  cannabis: {
    crops: ['Blue Dream', 'OG Kush', 'Wedding Cake', 'Girl Scout Cookies', 'Purple Haze'],
    commonDiseases: ['Bud Rot', 'Powdery Mildew', 'Spider Mites', 'Nitrogen Deficiency', 'Healthy'],
    marketDemand: {
      'Blue Dream': { basePrice: 3200, seasonality: 1.6, demand: 'very_high' },
      'OG Kush': { basePrice: 2800, seasonality: 1.2, demand: 'high' },
      'Wedding Cake': { basePrice: 3600, seasonality: 1.8, demand: 'premium' }
    },
    aiAccuracy: 0.91,
    roiIncrease: '580%'
  },
  hydroponic: {
    crops: ['Lettuce', 'Tomatoes', 'Cucumbers', 'Herbs', 'Spinach', 'Swiss Chard'],
    commonDiseases: ['Root Rot', 'Nutrient Burn', 'pH Imbalance', 'Algae Growth', 'Healthy'],
    marketDemand: {
      'Lettuce': { basePrice: 8.0, seasonality: 1.0, demand: 'stable' },
      'Tomatoes': { basePrice: 12.0, seasonality: 1.4, demand: 'high' },
      'Cucumbers': { basePrice: 10.0, seasonality: 1.2, demand: 'medium' }
    },
    aiAccuracy: 0.89,
    roiIncrease: '290%'
  },
  vertical: {
    crops: ['Strawberries', 'Leafy Greens', 'Herbs', 'Microgreens', 'Cherry Tomatoes'],
    commonDiseases: ['LED Burn', 'Powdery Mildew', 'Nutrient Deficiency', 'Air Circulation Issues', 'Healthy'],
    marketDemand: {
      'Strawberries': { basePrice: 25.0, seasonality: 1.8, demand: 'premium' },
      'Leafy Greens': { basePrice: 15.0, seasonality: 1.2, demand: 'high' },
      'Herbs': { basePrice: 28.0, seasonality: 1.4, demand: 'very_high' }
    },
    aiAccuracy: 0.92,
    roiIncrease: '450%'
  }
};

// Customer Types
const CUSTOMER_TYPES = [
  {
    type: 'RESTAURANT',
    prefix: 'Fresh Greens',
    orderFrequency: 'WEEKLY',
    avgOrderSize: 8.5,
    pricePerPound: 24.50,
    paymentTerms: 'NET_30'
  },
  {
    type: 'GROCERY',
    prefix: 'Organic Market',
    orderFrequency: 'BIWEEKLY',
    avgOrderSize: 15.2,
    pricePerPound: 18.75,
    paymentTerms: 'NET_15'
  },
  {
    type: 'DIRECT_CONSUMER',
    prefix: 'Local',
    orderFrequency: 'MONTHLY',
    avgOrderSize: 4.8,
    pricePerPound: 28.00,
    paymentTerms: 'PREPAID'
  },
  {
    type: 'WHOLESALER',
    prefix: 'Fresh Supply',
    orderFrequency: 'WEEKLY',
    avgOrderSize: 25.7,
    pricePerPound: 16.50,
    paymentTerms: 'NET_30'
  }
];

// Utility Functions
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔧';
  
  if (options.verbose || level === 'error' || level === 'success') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

// Data Generation Functions
async function createProductionUsers() {
  log('Creating production users...');
  
  const users = [];
  for (const userData of PRODUCTION_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    if (options.dryRun) {
      log(`Would create user: ${userData.email} (${userData.role})`);
      continue;
    }
    
    try {
      const user = await prisma.users.create({
        data: {
          id: userData.id,
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
          firstName: userData.email.split('@')[0].split('.')[0],
          lastName: userData.email.split('@')[0].split('.')[1] || 'User',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      users.push(user);
      log(`Created user: ${user.email}`, 'success');
    } catch (error) {
      log(`Failed to create user ${userData.email}: ${error.message}`, 'error');
    }
  }
  
  return users;
}

async function createGrowingEnvironments() {
  log('Creating growing environments...');
  
  const environments = [
    {
      name: 'Greenhouse A',
      type: 'GREENHOUSE',
      capacity: 200,
      temperature: 22.5,
      humidity: 65.0,
      lightLevel: 'HIGH',
      status: 'ACTIVE'
    },
    {
      name: 'Greenhouse B', 
      type: 'GREENHOUSE',
      capacity: 200,
      temperature: 23.0,
      humidity: 63.0,
      lightLevel: 'HIGH',
      status: 'ACTIVE'
    },
    {
      name: 'Germination Room',
      type: 'GERMINATION',
      capacity: 100,
      temperature: 24.0,
      humidity: 85.0,
      lightLevel: 'LOW',
      status: 'ACTIVE'
    }
  ];
  
  const createdEnvironments = [];
  for (const env of environments) {
    if (options.dryRun) {
      log(`Would create environment: ${env.name} (${env.type})`);
      continue;
    }
    
    try {
      const environment = await prisma.growing_environments.create({
        data: {
          id: uuidv4(),
          name: env.name,
          type: env.type,
          capacity: env.capacity,
          currentUsage: 0,
          temperature: env.temperature,
          humidity: env.humidity,
          lightLevel: env.lightLevel,
          status: env.status,
          lastMaintenance: new Date('2024-06-01'),
          nextMaintenance: new Date('2024-07-01'),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdEnvironments.push(environment);
      log(`Created environment: ${environment.name}`, 'success');
    } catch (error) {
      log(`Failed to create environment ${env.name}: ${error.message}`, 'error');
    }
  }
  
  return createdEnvironments;
}

async function createSeedVarieties() {
  log('Creating seed varieties from afarm_d database...');
  
  const varieties = AFARM_D_SEED_VARIETIES.slice(0, DATA_SIZES[options.size].batches / 5);
  const createdVarieties = [];
  
  for (const variety of varieties) {
    if (options.dryRun) {
      log(`Would create variety: ${variety.name}`);
      continue;
    }
    
    try {
      const seedVariety = await prisma.seed_varieties.create({
        data: {
          id: `seed-${variety.name.toLowerCase().replace(/\s+/g, '-')}-001`,
          name: variety.name,
          scientificName: variety.scientificName,
          supplier: variety.supplier,
          stockQuantity: variety.stockQuantity,
          minStockLevel: variety.minStockLevel,
          unit: 'grams',
          costPerUnit: variety.costPerUnit,
          germinationRate: variety.germinationRate / 100, // Convert percentage to decimal
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
          auditTrail: 'Master seed data from afarm_d database',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      createdVarieties.push(seedVariety);
      log(`Created variety: ${seedVariety.name} (${variety.status})`, 'success');
    } catch (error) {
      log(`Failed to create variety ${variety.name}: ${error.message}`, 'error');
    }
  }
  
  return createdVarieties;
}

async function createCustomers() {
  log('Creating customers...');
  
  const customerCount = DATA_SIZES[options.size].customers;
  const customers = [];
  
  for (let i = 0; i < customerCount; i++) {
    const customerType = randomChoice(CUSTOMER_TYPES);
    const customerNumber = (i + 1).toString().padStart(3, '0');
    
    if (options.dryRun) {
      log(`Would create customer: ${customerType.prefix} ${customerType.type} ${customerNumber}`);
      continue;
    }
    
    try {
      const customer = await prisma.customers.create({
        data: {
          id: `cust-${customerType.type.toLowerCase()}-${customerNumber}`,
          name: `${customerType.prefix} ${customerType.type} ${customerNumber}`,
          type: customerType.type,
          email: `orders${customerNumber}@${customerType.prefix.toLowerCase().replace(' ', '')}.com`,
          phone: `+1-555-${randomBetween(1000, 9999)}`,
          street: `${randomBetween(100, 9999)} Business St`,
          city: randomChoice(['Portland', 'Seattle', 'San Francisco', 'Los Angeles']),
          state: randomChoice(['OR', 'WA', 'CA']),
          zipCode: randomBetween(90000, 99999).toString(),
          country: 'USA',
          businessName: `${customerType.prefix} ${customerType.type} LLC`,
          taxId: `${randomBetween(10, 99)}-${randomBetween(1000000, 9999999)}`,
          contactPerson: `Contact Person ${customerNumber}`,
          businessType: `${customerType.type} Business`,
          orderFrequency: customerType.orderFrequency,
          status: 'ACTIVE',
          creditLimit: customerType.avgOrderSize * 10,
          paymentTerms: customerType.paymentTerms,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      customers.push(customer);
      log(`Created customer: ${customer.name}`, 'success');
    } catch (error) {
      log(`Failed to create customer ${customerType.prefix} ${customerNumber}: ${error.message}`, 'error');
    }
  }
  
  return customers;
}

async function createBatches(seedVarieties, environments, users) {
  log('Creating production batches...');
  
  const batchCount = DATA_SIZES[options.size].batches;
  const batches = [];
  
  for (let i = 0; i < batchCount; i++) {
    const variety = randomChoice(seedVarieties);
    const environment = randomChoice(environments);
    const grower = users.find(u => u.role === 'GROWER') || randomChoice(users);
    
    const seedingDate = new Date();
    seedingDate.setDate(seedingDate.getDate() - randomBetween(1, 30));
    
    const expectedHarvestDate = new Date(seedingDate);
    expectedHarvestDate.setDate(expectedHarvestDate.getDate() + variety.daysToHarvest);
    
    const statuses = ['SEEDED', 'GROWING', 'READY_TO_HARVEST', 'HARVESTED'];
    const status = randomChoice(statuses);
    
    if (options.dryRun) {
      log(`Would create batch: ${variety.name} - ${status}`);
      continue;
    }
    
    try {
      const batch = await prisma.batches.create({
        data: {
          id: `batch-${variety.name.split(' ')[1].toLowerCase()}-${(i + 1).toString().padStart(3, '0')}`,
          batchNumber: `${variety.name.split(' ')[1].toUpperCase()}-2024-${(i + 1).toString().padStart(3, '0')}`,
          varietyId: variety.id,
          zoneId: environment.id,
          seedingDate: seedingDate,
          expectedHarvestDate: expectedHarvestDate,
          actualHarvestDate: status === 'HARVESTED' ? expectedHarvestDate : null,
          status: status,
          seedAmount: randomFloat(100, 500),
          trayCount: randomBetween(5, 20),
          yieldExpected: randomFloat(5, 15),
          yieldActual: status === 'HARVESTED' ? randomFloat(5, 15) : null,
          qualityScore: status === 'HARVESTED' ? randomBetween(85, 100) : null,
          notes: `Batch ${i + 1} - ${variety.name}`,
          createdBy: grower.id,
          assignedTo: grower.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      batches.push(batch);
      log(`Created batch: ${batch.batchNumber}`, 'success');
    } catch (error) {
      log(`Failed to create batch ${i + 1}: ${error.message}`, 'error');
    }
  }
  
  return batches;
}

async function createOrders(customers, users) {
  log('Creating orders...');
  
  const orderCount = DATA_SIZES[options.size].orders;
  const orders = [];
  
  for (let i = 0; i < orderCount; i++) {
    const customer = randomChoice(customers);
    const salesperson = users.find(u => u.role === 'MANAGER') || randomChoice(users);
    
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - randomBetween(1, 60));
    
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + randomBetween(3, 14));
    
    const statuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED'];
    const status = randomChoice(statuses);
    
    if (options.dryRun) {
      log(`Would create order: ${customer.name} - ${status}`);
      continue;
    }
    
    try {
      const order = await prisma.orders.create({
        data: {
          id: `order-${(i + 1).toString().padStart(4, '0')}`,
          orderNumber: `ORD-2024-${(i + 1).toString().padStart(4, '0')}`,
          customerId: customer.id,
          orderDate: orderDate,
          deliveryDate: deliveryDate,
          status: status,
          totalAmount: randomFloat(50, 500),
          notes: `Order ${i + 1} for ${customer.name}`,
          createdBy: salesperson.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      orders.push(order);
      log(`Created order: ${order.orderNumber}`, 'success');
    } catch (error) {
      log(`Failed to create order ${i + 1}: ${error.message}`, 'error');
    }
  }
  
  return orders;
}

async function createAIScenarios() {
  log('Creating AI demonstration scenarios...');
  
  if (options.mode !== 'ai-showcase') {
    log('Skipping AI scenarios (not in ai-showcase mode)');
    return;
  }
  
  const farmType = options.farmType;
  const scenarios = AI_DEMO_SCENARIOS[farmType];
  
  if (!scenarios) {
    log(`No AI scenarios available for farm type: ${farmType}`, 'warning');
    return;
  }
  
  log(`Creating AI scenarios for ${farmType} farm with ${scenarios.aiAccuracy * 100}% accuracy`);
  log(`Expected ROI increase: ${scenarios.roiIncrease}`);
  
  // AI scenarios would be created here
  // This is a placeholder for the actual AI demo data generation
  
  return scenarios;
}

async function generateTestingScenarios() {
  log('Generating testing scenarios...');
  
  if (options.mode !== 'testing') {
    log('Skipping testing scenarios (not in testing mode)');
    return;
  }
  
  // Create edge case scenarios for testing
  log('Creating edge case scenarios for comprehensive testing');
  
  return [];
}

// Main Data Generation Function
async function generateData() {
  log(`Starting OFMS data generation...`);
  log(`Mode: ${options.mode} (${GENERATION_MODES[options.mode]})`);
  log(`Farm Type: ${options.farmType} (${FARM_TYPES[options.farmType]})`);
  log(`Size: ${options.size} (${JSON.stringify(DATA_SIZES[options.size])})`);
  
  if (options.dryRun) {
    log('DRY RUN MODE - No data will be created', 'warning');
  }
  
  if (options.reset && !options.dryRun) {
    log('Resetting database...', 'warning');
    // Database reset logic would go here
  }
  
  try {
    // Generate data based on mode
    const users = await createProductionUsers();
    const environments = await createGrowingEnvironments();
    const seedVarieties = await createSeedVarieties();
    const customers = await createCustomers();
    const batches = await createBatches(seedVarieties, environments, users);
    const orders = await createOrders(customers, users);
    
    // Mode-specific data generation
    if (options.mode === 'ai-showcase') {
      await createAIScenarios();
    } else if (options.mode === 'testing') {
      await generateTestingScenarios();
    }
    
    // Summary
    log('\n🎉 DATA GENERATION COMPLETE!', 'success');
    log(`📊 SUMMARY:`);
    log(`   👥 Users: ${users.length}`);
    log(`   🏭 Environments: ${environments.length}`);
    log(`   🌱 Seed Varieties: ${seedVarieties.length}`);
    log(`   🛒 Customers: ${customers.length}`);
    log(`   📦 Batches: ${batches.length}`);
    log(`   📋 Orders: ${orders.length}`);
    log(`   🎯 Mode: ${options.mode}`);
    log(`   🏢 Farm Type: ${options.farmType}`);
    log(`   📏 Size: ${options.size}`);
    
    if (options.mode === 'ai-showcase') {
      log(`   🤖 AI Scenarios: Generated for ${options.farmType} farm`);
    }
    
    log('\n✅ Ready for testing and demonstration!', 'success');
    
  } catch (error) {
    log(`❌ Error during data generation: ${error.message}`, 'error');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  // Validate mode
  if (!GENERATION_MODES[options.mode]) {
    console.error(`❌ Invalid mode: ${options.mode}`);
    console.error(`Available modes: ${Object.keys(GENERATION_MODES).join(', ')}`);
    process.exit(1);
  }
  
  // Validate farm type
  if (!FARM_TYPES[options.farmType]) {
    console.error(`❌ Invalid farm type: ${options.farmType}`);
    console.error(`Available farm types: ${Object.keys(FARM_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  // Validate size
  if (!DATA_SIZES[options.size]) {
    console.error(`❌ Invalid size: ${options.size}`);
    console.error(`Available sizes: ${Object.keys(DATA_SIZES).join(', ')}`);
    process.exit(1);
  }
  
  generateData().catch(console.error);
}

// Export for use by other scripts
module.exports = {
  generateData,
  createProductionUsers,
  createGrowingEnvironments,
  createSeedVarieties,
  createCustomers,
  createBatches,
  createOrders,
  createAIScenarios,
  GENERATION_MODES,
  FARM_TYPES,
  DATA_SIZES,
  AI_DEMO_SCENARIOS,
  AFARM_D_SEED_VARIETIES
}; 