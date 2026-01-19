/**
 * Kinkead Farms Data Seed Script
 * 
 * This script imports real data from Kinkead Farms microgreens operation:
 * - Seed varieties with costs and pricing
 * - Customers with contact info and delivery schedules
 * - Sample orders and batches
 * 
 * Run with: npx ts-node prisma/seed-kinkead-farms.ts
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Helper to generate UUIDs
const uuid = () => crypto.randomUUID();

// Kinkead Farms seed varieties from Operations.pdf
const SEED_VARIETIES = [
    { name: 'Corn Shoot', scientificName: 'Zea mays', seedCostPerLb: 11.66, seedsPerTray: 13, retailPricePerOz: 5, wholesale4oz: 19, wholesale8oz: 36 },
    { name: 'Basil', scientificName: 'Ocimum basilicum', seedCostPerLb: 22.00, seedsPerTray: 1, retailPricePerOz: 6, wholesale4oz: 23, wholesale8oz: 43 },
    { name: 'Mustard', scientificName: 'Brassica juncea', seedCostPerLb: 48.00, seedsPerTray: 3, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Sunflower', scientificName: 'Helianthus annuus', seedCostPerLb: 10.25, seedsPerTray: 8, retailPricePerOz: 3, wholesale4oz: 11, wholesale8oz: 22 },
    { name: 'Red Beet', scientificName: 'Beta vulgaris', seedCostPerLb: 23.00, seedsPerTray: 3, retailPricePerOz: 5, wholesale4oz: 19, wholesale8oz: 36 },
    { name: 'Cilantro', scientificName: 'Coriandrum sativum', seedCostPerLb: 12.86, seedsPerTray: 5, retailPricePerOz: 6, wholesale4oz: 23, wholesale8oz: 43 },
    { name: 'Kale', scientificName: 'Brassica oleracea', seedCostPerLb: 28.00, seedsPerTray: 3, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Spicy Mix', scientificName: 'Mixed varieties', seedCostPerLb: 27.44, seedsPerTray: 3, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Radish', scientificName: 'Raphanus sativus', seedCostPerLb: 19.74, seedsPerTray: 3, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Amaranth', scientificName: 'Amaranthus', seedCostPerLb: 38.98, seedsPerTray: 1, retailPricePerOz: 5, wholesale4oz: 19, wholesale8oz: 36 },
    { name: 'Red Cabbage', scientificName: 'Brassica oleracea var. capitata', seedCostPerLb: 25.95, seedsPerTray: 2, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Broccoli', scientificName: 'Brassica oleracea var. italica', seedCostPerLb: 19.40, seedsPerTray: 2, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Arugula', scientificName: 'Eruca vesicaria', seedCostPerLb: 20.60, seedsPerTray: 1, retailPricePerOz: 5, wholesale4oz: 19, wholesale8oz: 36 },
    { name: 'Speckled Pea', scientificName: 'Pisum sativum', seedCostPerLb: 3.16, seedsPerTray: 16, retailPricePerOz: 3, wholesale4oz: 11, wholesale8oz: 22 },
    { name: 'Fenugreek', scientificName: 'Trigonella foenum-graecum', seedCostPerLb: 12.52, seedsPerTray: 2.5, retailPricePerOz: 4, wholesale4oz: 15, wholesale8oz: 29 },
    { name: 'Chervil', scientificName: 'Anthriscus cerefolium', seedCostPerLb: 35.00, seedsPerTray: 2, retailPricePerOz: 5, wholesale4oz: 19, wholesale8oz: 36 },
];

// Kinkead Farms customers from Plant 3 6 23 HARVEST 3 15 23.pdf
const CUSTOMERS = [
    { name: 'AnnMarie Roebuck', phone: '(239) 825-0615', address: '2365 14th Ave NE, Naples 34120', schedule: 'Weekly', type: 'B2C' },
    { name: 'Joy Erickson', phone: '(239) 289-0314', address: '372 Forest Hills Blvd, Naples 34113', schedule: 'Weekly (On Hold)', type: 'B2C' },
    { name: 'Priya Bhutan', phone: '(954) 868-6219', address: '13909 Luna Dr, Naples 34109', schedule: 'Weekly', type: 'B2C' },
    { name: 'Lauren Schmitt', phone: '(412) 708-7885', address: '16139 Ravina Way, Naples 34110', schedule: 'Weekly', type: 'B2C' },
    { name: 'F&T Freedom', phone: '', address: 'Naples, FL', schedule: 'Weekly', type: 'B2B', businessName: 'F&T Freedom Market' },
    { name: 'F&T Kitchen', phone: '', address: 'Naples, FL', schedule: 'Weekly', type: 'B2B', businessName: 'F&T Kitchen' },
    { name: 'F&T Store', phone: '(239) 821-5983', address: '141 9th St N, Naples 34102', schedule: 'Weekly - 30 units', type: 'B2B', businessName: 'F&T Produce Store' },
    { name: 'Tatiana', phone: '(239) 289-8834', address: 'Naples, FL', schedule: 'Weekly', type: 'B2C' },
    { name: "Wynn's Market - Al Garcia", phone: '239-263-3812', address: 'Naples, FL', schedule: 'Weekly', type: 'B2B', businessName: "Wynn's Market" },
    { name: 'Moorings - Ben', phone: '', address: 'Moorings, Naples FL', schedule: 'Weekly', type: 'B2B', businessName: 'Moorings Country Club' },
    { name: 'Wyndemere - Neil', phone: '', address: 'Wyndemere, Naples FL', schedule: 'Weekly', type: 'B2B', businessName: 'Wyndemere Country Club' },
    { name: 'Vineyards - Chris', phone: '', address: 'Vineyards, Naples FL', schedule: 'Weekly', type: 'B2B', businessName: 'Vineyards Country Club' },
];

async function main() {
    console.log('🌱 Starting Kinkead Farms data seed...\n');

    // Step 1: Find or create Kinkead Farms
    let farm = await prisma.farms.findFirst({
        where: { farm_name: { contains: 'Kinkead', mode: 'insensitive' } }
    });

    if (!farm) {
        // Get the first admin user to be the owner
        const adminUser = await prisma.users.findFirst({
            where: { roles: { contains: 'ADMIN' } }
        });

        if (!adminUser) {
            console.error('❌ No admin user found. Please create a user first.');
            return;
        }

        farm = await prisma.farms.create({
            data: {
                id: uuid(),
                farm_name: 'Kinkead Farms',
                business_name: 'Kinkead Farms Microgreens',
                subdomain: 'kinkead',
                owner_id: adminUser.id,
                subscription_plan: 'professional',
                subscription_status: 'active',
                settings: JSON.stringify({
                    timezone: 'America/New_York',
                    currency: 'USD',
                    measurementSystem: 'imperial'
                }),
                created_at: new Date(),
                updated_at: new Date()
            }
        });

        // Add admin to farm_users
        await prisma.farm_users.create({
            data: {
                farm_id: farm.id,
                user_id: adminUser.id,
                role: 'OWNER',
                permissions: { all: true },
                is_active: true,
                joined_at: new Date()
            }
        });

        console.log(`✅ Created farm: ${farm.farm_name} (ID: ${farm.id})`);
    } else {
        console.log(`✅ Found existing farm: ${farm.farm_name} (ID: ${farm.id})`);
    }

    const farmId = farm.id;
    const ownerId = farm.owner_id;

    // Step 2: Create seed varieties
    console.log('\n📦 Creating seed varieties...');
    const seedVarietyIds: Record<string, string> = {};

    for (const variety of SEED_VARIETIES) {
        const existing = await prisma.seed_varieties.findFirst({
            where: { name: variety.name, farm_id: farmId }
        });

        if (existing) {
            seedVarietyIds[variety.name] = existing.id;
            console.log(`  ⏭️  Skipped (exists): ${variety.name}`);
            continue;
        }

        const id = uuid();
        await prisma.seed_varieties.create({
            data: {
                id,
                name: variety.name,
                scientificName: variety.scientificName,
                supplier: 'True Leaf Market',
                stockQuantity: 10,
                minStockLevel: 2,
                unit: 'lb',
                costPerUnit: variety.seedCostPerLb,
                germinationRate: 0.92,
                daysToGermination: 3,
                daysToHarvest: 10,
                storageTemp: 65,
                storageHumidity: 50,
                lightExposure: '12-16 hours',
                status: 'ACTIVE',
                isOrganic: true,
                organicCertNumber: 'USDA-ORG-2024',
                certifyingAgent: 'Oregon Tilth',
                certificationDate: new Date('2024-01-01'),
                certExpiration: new Date('2025-01-01'),
                lotNumber: `LOT-${variety.name.substring(0, 3).toUpperCase()}-2024`,
                seedSource: 'True Leaf Market - Certified Organic',
                auditTrail: JSON.stringify([{ date: new Date().toISOString(), action: 'Created via seed script' }]),
                usdaCompliant: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: ownerId,
                updatedBy: ownerId,
                farm_id: farmId
            }
        });
        seedVarietyIds[variety.name] = id;
        console.log(`  ✅ Created: ${variety.name} ($${variety.seedCostPerLb}/lb)`);
    }

    // Step 3: Create customers
    console.log('\n👥 Creating customers...');
    const customerIds: Record<string, string> = {};

    for (const customer of CUSTOMERS) {
        const email = customer.name.toLowerCase().replace(/[^a-z]/g, '') + '@example.com';

        const existing = await prisma.customers.findFirst({
            where: { email, farm_id: farmId }
        });

        if (existing) {
            customerIds[customer.name] = existing.id;
            console.log(`  ⏭️  Skipped (exists): ${customer.name}`);
            continue;
        }

        const id = uuid();
        const addressParts = customer.address.split(',').map(s => s.trim());
        const street = addressParts[0] || '';
        const cityState = addressParts[1] || 'Naples FL';
        const [city, stateZip] = cityState.split(' ');
        const state = 'FL';
        const zipCode = stateZip?.match(/\d+/)?.[0] || '34102';

        await prisma.customers.create({
            data: {
                id,
                name: customer.name,
                email,
                phone: customer.phone || null,
                street,
                city: city || 'Naples',
                state,
                zipCode,
                country: 'USA',
                type: customer.type,
                businessName: customer.businessName || null,
                businessType: customer.type === 'B2B' ? 'Restaurant/Market' : 'Individual',
                contactPerson: customer.name,
                status: customer.schedule.includes('Hold') ? 'ON_HOLD' : 'ACTIVE',
                creditLimit: customer.type === 'B2B' ? 5000 : 500,
                paymentTerms: customer.type === 'B2B' ? 'NET_30' : 'DUE_ON_DELIVERY',
                orderFrequency: 'Weekly',
                preferredVarieties: 'Mixed varieties',
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: ownerId,
                updatedBy: ownerId,
                farm_id: farmId
            }
        });
        customerIds[customer.name] = id;
        console.log(`  ✅ Created: ${customer.name} (${customer.type})`);
    }

    // Step 4: Create sample batches
    console.log('\n🌿 Creating sample batches...');
    const batchData = [
        { variety: 'Broccoli', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 10 },
        { variety: 'Radish', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 8 },
        { variety: 'Sunflower', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 6 },
        { variety: 'Cilantro', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 8 },
        { variety: 'Red Beet', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 6 },
        { variety: 'Arugula', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 8 },
        { variety: 'Basil', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 6 },
        { variety: 'Kale', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 4 },
        { variety: 'Speckled Pea', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 8 },
        { variety: 'Red Cabbage', plantDate: '2023-03-06', harvestDate: '2023-03-15', quantity: 4 },
    ];

    let batchNum = 1;
    for (const batch of batchData) {
        const seedVarietyId = seedVarietyIds[batch.variety];
        if (!seedVarietyId) {
            console.log(`  ⚠️  Skipped batch: ${batch.variety} (variety not found)`);
            continue;
        }

        const batchNumber = `KF-2023-${String(batchNum++).padStart(3, '0')}`;

        const existing = await prisma.batches.findFirst({
            where: { batchNumber, farm_id: farmId }
        });

        if (existing) {
            console.log(`  ⏭️  Skipped (exists): ${batchNumber}`);
            continue;
        }

        await prisma.batches.create({
            data: {
                id: uuid(),
                batchNumber,
                seedVarietyId,
                quantity: batch.quantity,
                unit: 'trays',
                plantDate: new Date(batch.plantDate),
                expectedHarvestDate: new Date(batch.harvestDate),
                actualHarvestDate: new Date(batch.harvestDate),
                status: 'HARVESTED',
                growingMedium: 'Organic Coco Coir',
                growingZone: 'Zone A',
                irrigationSource: 'Municipal - Filtered',
                fertilizersUsed: 'None - Organic',
                pestControlMethods: 'None required',
                harvestContainers: 'Food-grade plastic clamshells',
                storageConditions: '38-42°F, 85-95% humidity',
                transportationMethod: 'Refrigerated delivery',
                organicCompliant: true,
                organicIntegrity: true,
                labelingCompliance: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: ownerId,
                updatedBy: ownerId,
                farm_id: farmId
            }
        });
        console.log(`  ✅ Created batch: ${batchNumber} - ${batch.variety} (${batch.quantity} trays)`);
    }

    // Step 5: Create sample orders
    console.log('\n📋 Creating sample orders...');
    const orderData = [
        { customer: 'AnnMarie Roebuck', items: [{ variety: 'Broccoli', qty: 1.5 }, { variety: 'Radish', qty: 1.5 }, { variety: 'Cilantro', qty: 1.5 }] },
        { customer: 'F&T Store', items: [{ variety: 'Broccoli', qty: 10 }, { variety: 'Arugula', qty: 10 }, { variety: 'Cilantro', qty: 9 }] },
        { customer: "Wynn's Market - Al Garcia", items: [{ variety: 'Sunflower', qty: 5 }, { variety: 'Radish', qty: 5 }, { variety: 'Speckled Pea', qty: 5 }] },
    ];

    let orderNum = 1;
    for (const order of orderData) {
        const customerId = customerIds[order.customer];
        if (!customerId) {
            console.log(`  ⚠️  Skipped order: ${order.customer} (customer not found)`);
            continue;
        }

        const orderNumber = `ORD-KF-2023-${String(orderNum++).padStart(4, '0')}`;

        const existing = await prisma.orders.findFirst({
            where: { orderNumber, farm_id: farmId }
        });

        if (existing) {
            console.log(`  ⏭️  Skipped (exists): ${orderNumber}`);
            continue;
        }

        const orderId = uuid();
        let subtotal = 0;

        // Create order first
        await prisma.orders.create({
            data: {
                id: orderId,
                orderNumber,
                customerId,
                orderDate: new Date('2023-03-15'),
                requestedDeliveryDate: new Date('2023-03-15'),
                actualDeliveryDate: new Date('2023-03-15'),
                status: 'DELIVERED',
                paymentStatus: 'PAID',
                deliveryMethod: 'Local Delivery',
                subtotal: 0,
                tax: 0,
                shippingCost: 0,
                total: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: ownerId,
                updatedBy: ownerId,
                farm_id: farmId
            }
        });

        // Create order items
        for (const item of order.items) {
            const seedVarietyId = seedVarietyIds[item.variety];
            if (!seedVarietyId) continue;

            const varietyInfo = SEED_VARIETIES.find(v => v.name === item.variety);
            const unitPrice = varietyInfo?.retailPricePerOz || 5;
            const totalPrice = item.qty * unitPrice;
            subtotal += totalPrice;

            await prisma.order_items.create({
                data: {
                    id: uuid(),
                    orderId,
                    seedVarietyId,
                    productName: item.variety + ' Microgreens',
                    quantity: item.qty,
                    unit: 'oz',
                    unitPrice,
                    totalPrice,
                    farm_id: farmId
                }
            });
        }

        // Update order totals
        const tax = subtotal * 0.07;
        await prisma.orders.update({
            where: { id: orderId },
            data: {
                subtotal,
                tax,
                total: subtotal + tax
            }
        });

        console.log(`  ✅ Created order: ${orderNumber} for ${order.customer} ($${(subtotal + tax).toFixed(2)})`);
    }

    console.log('\n✨ Kinkead Farms data seed completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Farm: ${farm.farm_name}`);
    console.log(`   Seed Varieties: ${Object.keys(seedVarietyIds).length}`);
    console.log(`   Customers: ${Object.keys(customerIds).length}`);
    console.log(`   Batches: ${batchData.length}`);
    console.log(`   Orders: ${orderData.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
