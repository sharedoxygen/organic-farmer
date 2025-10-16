#!/usr/bin/env node

/**
 * OFMS DATA LOADER
 * Consolidated tool for all data loading operations
 * Replaces 8+ individual data loading scripts
 */

const { PrismaClient } = require('@prisma/client');
const { program } = require('commander');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// CLI Configuration
program
  .name('ofms-data-loader')
  .description('OFMS Data Loader - Consolidated data loading tool')
  .version('1.0.0');

program
  .option('-l, --load <type>', 'Load type (seeds, customers, inventory, orders, all)', 'all')
  .option('-r, --reset', 'Reset data before loading')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run - show what would be loaded')
  .option('-f, --farm-id <id>', 'Target farm ID for multi-tenant loading')
  .option('-s, --size <size>', 'Data size (small, medium, large)', 'medium')
  .parse(process.argv);

const options = program.opts();

// Load Types
const LOAD_TYPES = {
  seeds: 'Load seed varieties and inventory',
  customers: 'Load customer data',
  inventory: 'Load inventory items',
  orders: 'Load order data',
  economics: 'Load crop economics data',
  all: 'Load all data types'
};

// Data size configurations
const DATA_SIZES = {
  small: { customers: 5, orders: 10, inventory: 15 },
  medium: { customers: 15, orders: 30, inventory: 40 },
  large: { customers: 30, orders: 60, inventory: 80 }
};

// Default farm ID for single-tenant mode
const DEFAULT_FARM_ID = '00000000-0000-0000-0000-000000000001';

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔧';
  
  if (options.verbose || level === 'error' || level === 'success') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Data Loaders
class SeedDataLoader {
  constructor() {
    // Master Seed Data from afarm_d Database
    this.varieties = [
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
  }

  async loadSeeds() {
    log('Loading seed varieties from afarm_d database...');
    
    const farmId = options.farmId || DEFAULT_FARM_ID;
    const createdSeeds = [];
    
    for (const variety of this.varieties) {
      if (options.dryRun) {
        log(`Would create seed variety: ${variety.name}`);
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
            farm_id: farmId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        createdSeeds.push(seedVariety);
        log(`Created seed variety: ${seedVariety.name} (${variety.status})`, 'success');
      } catch (error) {
        log(`Failed to create seed variety ${variety.name}: ${error.message}`, 'error');
      }
    }
    
    return createdSeeds;
  }
}

class CustomerDataLoader {
  constructor() {
    this.customerTypes = [
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
  }

  async loadCustomers() {
    log('Loading customers...');
    
    const farmId = options.farmId || DEFAULT_FARM_ID;
    const customerCount = DATA_SIZES[options.size].customers;
    const customers = [];
    
    for (let i = 0; i < customerCount; i++) {
      const customerType = randomChoice(this.customerTypes);
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
            farm_id: farmId,
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
}

class InventoryDataLoader {
  constructor() {
    this.inventoryItems = [
      { name: 'Growing Trays', category: 'SUPPLIES', unit: 'pieces', costPerUnit: 2.50 },
      { name: 'Coconut Coir', category: 'GROWING_MEDIUM', unit: 'pounds', costPerUnit: 1.25 },
      { name: 'Organic Fertilizer', category: 'NUTRIENTS', unit: 'pounds', costPerUnit: 8.75 },
      { name: 'pH Test Strips', category: 'TESTING', unit: 'packages', costPerUnit: 15.00 },
      { name: 'Clamshell Containers', category: 'PACKAGING', unit: 'pieces', costPerUnit: 0.35 },
      { name: 'Labels', category: 'PACKAGING', unit: 'sheets', costPerUnit: 0.05 },
      { name: 'Spray Bottles', category: 'TOOLS', unit: 'pieces', costPerUnit: 3.25 },
      { name: 'Heat Mats', category: 'EQUIPMENT', unit: 'pieces', costPerUnit: 25.00 }
    ];
  }

  async loadInventory() {
    log('Loading inventory items...');
    
    const farmId = options.farmId || DEFAULT_FARM_ID;
    const inventoryCount = DATA_SIZES[options.size].inventory;
    const inventory = [];
    
    // Create a mix of predefined and random inventory items
    const itemsToCreate = Math.min(inventoryCount, this.inventoryItems.length);
    
    for (let i = 0; i < itemsToCreate; i++) {
      const item = this.inventoryItems[i];
      
      if (options.dryRun) {
        log(`Would create inventory item: ${item.name}`);
        continue;
      }
      
      try {
        const inventoryItem = await prisma.inventory.create({
          data: {
            id: `inv-${item.name.toLowerCase().replace(/\s+/g, '-')}-001`,
            name: item.name,
            category: item.category,
            unit: item.unit,
            currentStock: randomFloat(50, 500),
            minStockLevel: randomFloat(10, 50),
            maxStockLevel: randomFloat(500, 1000),
            costPerUnit: item.costPerUnit,
            supplier: 'Farm Supply Co.',
            location: 'Storage Room A',
            lastRestocked: new Date(Date.now() - randomBetween(1, 30) * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            farm_id: farmId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        inventory.push(inventoryItem);
        log(`Created inventory item: ${inventoryItem.name}`, 'success');
      } catch (error) {
        log(`Failed to create inventory item ${item.name}: ${error.message}`, 'error');
      }
    }
    
    return inventory;
  }
}

class OrderDataLoader {
  constructor() {
    this.orderStatuses = ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'DELIVERED'];
  }

  async loadOrders() {
    log('Loading orders...');
    
    const farmId = options.farmId || DEFAULT_FARM_ID;
    const orderCount = DATA_SIZES[options.size].orders;
    
    // Get existing customers to create orders for
    const customers = await prisma.customers.findMany({
      where: { farm_id: farmId },
      take: 10
    });
    
    if (customers.length === 0) {
      log('No customers found - create customers first', 'warning');
      return [];
    }
    
    const orders = [];
    
    for (let i = 0; i < orderCount; i++) {
      const customer = randomChoice(customers);
      
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - randomBetween(1, 60));
      
      const deliveryDate = new Date(orderDate);
      deliveryDate.setDate(deliveryDate.getDate() + randomBetween(3, 14));
      
      const status = randomChoice(this.orderStatuses);
      
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
            farm_id: farmId,
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
}

class CropEconomicsLoader {
  constructor() {
    this.economicsData = [
      { crop: 'Arugula', profitMargin: 65, marketPrice: 24.50, productionCost: 8.58 },
      { crop: 'Pea Shoots', profitMargin: 72, marketPrice: 28.00, productionCost: 7.84 },
      { crop: 'Kale', profitMargin: 58, marketPrice: 22.00, productionCost: 9.24 },
      { crop: 'Sunflower', profitMargin: 78, marketPrice: 26.00, productionCost: 5.72 },
      { crop: 'Radish', profitMargin: 61, marketPrice: 20.00, productionCost: 7.80 }
    ];
  }

  async loadCropEconomics() {
    log('Loading crop economics data...');
    
    const farmId = options.farmId || DEFAULT_FARM_ID;
    const economics = [];
    
    for (const crop of this.economicsData) {
      if (options.dryRun) {
        log(`Would create economics data for: ${crop.crop}`);
        continue;
      }
      
      try {
        const economicsData = await prisma.crop_economics.create({
          data: {
            id: `econ-${crop.crop.toLowerCase()}-001`,
            cropName: crop.crop,
            profitMargin: crop.profitMargin,
            marketPrice: crop.marketPrice,
            productionCost: crop.productionCost,
            laborCost: crop.productionCost * 0.4,
            materialCost: crop.productionCost * 0.6,
            breakEvenPoint: crop.productionCost / crop.marketPrice,
            recommendedPrice: crop.marketPrice * 1.1,
            farm_id: farmId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        economics.push(economicsData);
        log(`Created economics data for: ${crop.crop}`, 'success');
      } catch (error) {
        log(`Failed to create economics data for ${crop.crop}: ${error.message}`, 'error');
      }
    }
    
    return economics;
  }
}

// Main Data Loader
class DataLoader {
  constructor() {
    this.seedLoader = new SeedDataLoader();
    this.customerLoader = new CustomerDataLoader();
    this.inventoryLoader = new InventoryDataLoader();
    this.orderLoader = new OrderDataLoader();
    this.economicsLoader = new CropEconomicsLoader();
  }

  async resetData() {
    if (!options.reset) return;
    
    log('Resetting existing data...', 'warning');
    
    if (options.dryRun) {
      log('Would reset all data in database', 'warning');
      return;
    }
    
    const farmId = options.farmId || DEFAULT_FARM_ID;
    
    try {
      // Delete in correct order to respect foreign key constraints
      await prisma.orders.deleteMany({ where: { farm_id: farmId } });
      await prisma.customers.deleteMany({ where: { farm_id: farmId } });
      await prisma.inventory.deleteMany({ where: { farm_id: farmId } });
      await prisma.seed_varieties.deleteMany({ where: { farm_id: farmId } });
      await prisma.crop_economics.deleteMany({ where: { farm_id: farmId } });
      
      log('Data reset completed', 'success');
    } catch (error) {
      log(`Data reset failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async loadData() {
    log(`Starting OFMS data loading...`);
    log(`Load type: ${options.load}`);
    log(`Size: ${options.size} (${JSON.stringify(DATA_SIZES[options.size])})`);
    
    if (options.farmId) {
      log(`Target farm: ${options.farmId}`);
    }
    
    if (options.dryRun) {
      log('DRY RUN MODE - No data will be loaded', 'warning');
    }
    
    await this.resetData();
    
    const results = {};
    
    try {
      if (options.load === 'all' || options.load === 'seeds') {
        results.seeds = await this.seedLoader.loadSeeds();
      }
      
      if (options.load === 'all' || options.load === 'customers') {
        results.customers = await this.customerLoader.loadCustomers();
      }
      
      if (options.load === 'all' || options.load === 'inventory') {
        results.inventory = await this.inventoryLoader.loadInventory();
      }
      
      if (options.load === 'all' || options.load === 'orders') {
        results.orders = await this.orderLoader.loadOrders();
      }
      
      if (options.load === 'all' || options.load === 'economics') {
        results.economics = await this.economicsLoader.loadCropEconomics();
      }
      
      // Summary
      log('\n🎉 DATA LOADING COMPLETE!', 'success');
      log(`📊 SUMMARY:`);
      
      Object.entries(results).forEach(([type, data]) => {
        log(`   ${type}: ${data ? data.length : 0} items loaded`);
      });
      
      log(`   🎯 Load type: ${options.load}`);
      log(`   📏 Size: ${options.size}`);
      
      if (options.farmId) {
        log(`   🏢 Farm ID: ${options.farmId}`);
      }
      
      log('\n✅ Ready for use!', 'success');
      
    } catch (error) {
      log(`❌ Error during data loading: ${error.message}`, 'error');
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  // Validate load type
  if (!LOAD_TYPES[options.load]) {
    console.error(`❌ Invalid load type: ${options.load}`);
    console.error(`Available load types: ${Object.keys(LOAD_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  // Validate size
  if (!DATA_SIZES[options.size]) {
    console.error(`❌ Invalid size: ${options.size}`);
    console.error(`Available sizes: ${Object.keys(DATA_SIZES).join(', ')}`);
    process.exit(1);
  }
  
  const loader = new DataLoader();
  
  try {
    await loader.loadData();
  } catch (error) {
    log(`Data loading failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  main().catch(console.error);
}

// Export for use by other scripts
module.exports = {
  DataLoader,
  SeedDataLoader,
  CustomerDataLoader,
  InventoryDataLoader,
  OrderDataLoader,
  CropEconomicsLoader,
  LOAD_TYPES,
  DATA_SIZES
}; 