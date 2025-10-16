#!/usr/bin/env node

/**
 * OFMS Party Model Data Seeder
 * 
 * This script seeds customer data using the proper Party model
 * instead of the legacy customers table.
 * 
 * OFMS - Organic Farmer Management System
 * 
 * @author Shared Oxygen, LLC
 * @copyright 2025 Shared Oxygen, LLC. All rights reserved.
 */

const { PrismaClient } = require('@prisma/client');
const { Command } = require('commander');

const program = new Command();

program
  .name('ofms-party-seeder')
  .description('Seed customer data using Party model')
  .option('-r, --reset', 'Reset party data before loading')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Show what would be created without making changes')
  .option('-f, --farm-id <id>', 'Target farm ID (required)')
  .option('-u, --user-id <id>', 'User ID for created/updated by fields (required)')
  .parse(process.argv);

const options = program.opts();

// Validate required options
if (!options.farmId) {
  console.error('❌ Farm ID is required (--farm-id)');
  process.exit(1);
}

if (!options.userId) {
  console.error('❌ User ID is required (--user-id)');
  process.exit(1);
}

const prisma = new PrismaClient();

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🌱';
  
  if (options.verbose || level === 'error' || level === 'success' || level === 'warning') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

// Sample customer data using Party model
const sampleCustomers = [
  // B2B Customers
  {
    displayName: 'Green Valley Grocery',
    legalName: 'Green Valley Grocery Co., LLC',
    partyType: 'ORGANIZATION',
    roleType: 'CUSTOMER_B2B',
    contacts: [
      { type: 'EMAIL', label: 'Primary Email', value: 'orders@greenvalleygrocery.com', isPrimary: true },
      { type: 'PHONE', label: 'Main Office', value: '(555) 123-4567', isPrimary: true },
      { type: 'ADDRESS', label: 'Business Address', value: JSON.stringify({
        street: '123 Market Street',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        country: 'USA'
      }), isPrimary: true }
    ],
    metadata: {
      status: 'ACTIVE',
      creditLimit: 10000,
      paymentTerms: 'NET_30',
      orderFrequency: 'WEEKLY',
      preferredVarieties: 'Arugula, Basil, Microgreens Mix'
    }
  },
  {
    displayName: 'Farm Fresh Restaurant Group',
    legalName: 'Farm Fresh Restaurant Group Inc.',
    partyType: 'ORGANIZATION',
    roleType: 'CUSTOMER_B2B',
    contacts: [
      { type: 'EMAIL', label: 'Purchasing', value: 'purchasing@farmfreshgroup.com', isPrimary: true },
      { type: 'PHONE', label: 'Office', value: '(555) 234-5678', isPrimary: true },
      { type: 'ADDRESS', label: 'Corporate Office', value: JSON.stringify({
        street: '456 Restaurant Row',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98101',
        country: 'USA'
      }), isPrimary: true }
    ],
    metadata: {
      status: 'ACTIVE',
      creditLimit: 15000,
      paymentTerms: 'NET_15',
      orderFrequency: 'TWICE_WEEKLY',
      preferredVarieties: 'Sunflower Shoots, Pea Shoots, Radish Microgreens'
    }
  },
  {
    displayName: 'Organic Market Co-op',
    legalName: 'Organic Market Cooperative',
    partyType: 'ORGANIZATION',
    roleType: 'CUSTOMER_B2B',
    contacts: [
      { type: 'EMAIL', label: 'Produce Manager', value: 'produce@organicmarket.coop', isPrimary: true },
      { type: 'PHONE', label: 'Store', value: '(555) 345-6789', isPrimary: true },
      { type: 'ADDRESS', label: 'Store Location', value: JSON.stringify({
        street: '789 Organic Way',
        city: 'Eugene',
        state: 'OR',
        zipCode: '97401',
        country: 'USA'
      }), isPrimary: true }
    ],
    metadata: {
      status: 'ACTIVE',
      creditLimit: 8000,
      paymentTerms: 'NET_30',
      orderFrequency: 'WEEKLY',
      preferredVarieties: 'All varieties'
    }
  },
  
  // B2C Customers
  {
    displayName: 'Sarah Johnson',
    legalName: null,
    partyType: 'PERSON',
    roleType: 'CUSTOMER_B2C',
    contacts: [
      { type: 'EMAIL', label: 'Personal Email', value: 'sarah.johnson@email.com', isPrimary: true },
      { type: 'PHONE', label: 'Mobile', value: '(555) 456-7890', isPrimary: true },
      { type: 'ADDRESS', label: 'Home', value: JSON.stringify({
        street: '321 Elm Street',
        city: 'Portland',
        state: 'OR',
        zipCode: '97202',
        country: 'USA'
      }), isPrimary: true }
    ],
    metadata: {
      status: 'ACTIVE',
      paymentTerms: 'IMMEDIATE',
      orderFrequency: 'MONTHLY',
      preferredVarieties: 'Basil, Cilantro'
    }
  },
  {
    displayName: 'Michael Chen',
    legalName: null,
    partyType: 'PERSON',
    roleType: 'CUSTOMER_B2C',
    contacts: [
      { type: 'EMAIL', label: 'Personal Email', value: 'mchen@email.com', isPrimary: true },
      { type: 'PHONE', label: 'Mobile', value: '(555) 567-8901', isPrimary: true },
      { type: 'ADDRESS', label: 'Home', value: JSON.stringify({
        street: '654 Oak Avenue',
        city: 'Seattle',
        state: 'WA',
        zipCode: '98102',
        country: 'USA'
      }), isPrimary: true }
    ],
    metadata: {
      status: 'ACTIVE',
      paymentTerms: 'IMMEDIATE',
      orderFrequency: 'BI_WEEKLY',
      preferredVarieties: 'Microgreens Mix, Arugula'
    }
  },
  {
    displayName: 'Emily Rodriguez',
    legalName: null,
    partyType: 'PERSON',
    roleType: 'CUSTOMER_B2C',
    contacts: [
      { type: 'EMAIL', label: 'Personal Email', value: 'emily.r@email.com', isPrimary: true },
      { type: 'PHONE', label: 'Mobile', value: '(555) 678-9012', isPrimary: true },
      { type: 'ADDRESS', label: 'Home', value: JSON.stringify({
        street: '987 Pine Street',
        city: 'Eugene',
        state: 'OR',
        zipCode: '97402',
        country: 'USA'
      }), isPrimary: true }
    ],
    metadata: {
      status: 'ACTIVE',
      paymentTerms: 'IMMEDIATE',
      orderFrequency: 'WEEKLY',
      preferredVarieties: 'Sunflower Shoots, Pea Shoots'
    }
  }
];

async function createPartyWithContacts(customerData) {
  const { displayName, legalName, partyType, roleType, contacts, metadata } = customerData;
  
  if (options.dryRun) {
    log(`Would create party: ${displayName} (${partyType} - ${roleType})`);
    return null;
  }
  
  try {
    // Create party
    const party = await prisma.parties.create({
      data: {
        displayName,
        legalName,
        partyType,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    log(`✅ Created party: ${party.displayName}`, 'success');
    
    // Create party role
    const role = await prisma.party_roles.create({
      data: {
        partyId: party.id,
        roleType,
        farm_id: options.farmId,
        metadata: metadata || {},
        createdAt: new Date()
      }
    });
    
    log(`✅ Created role: ${roleType} for ${party.displayName}`, 'success');
    
    // Create contacts
    for (const contact of contacts) {
      await prisma.party_contacts.create({
        data: {
          partyId: party.id,
          type: contact.type,
          label: contact.label,
          value: contact.value,
          isPrimary: contact.isPrimary || false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      log(`  📧 Added ${contact.type} contact: ${contact.label}`, 'info');
    }
    
    return party;
  } catch (error) {
    log(`❌ Failed to create party ${displayName}: ${error.message}`, 'error');
    return null;
  }
}

async function resetPartyData() {
  if (options.dryRun) {
    log('Would reset party data (dry run)', 'warning');
    return;
  }
  
  log('🗑️  Resetting party data...', 'warning');
  
  try {
    await prisma.party_contacts.deleteMany({
      where: {
        party: {
          roles: {
            some: {
              farm_id: options.farmId,
              roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
            }
          }
        }
      }
    });
    
    await prisma.party_roles.deleteMany({
      where: {
        farm_id: options.farmId,
        roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
      }
    });
    
    // Note: We don't delete parties themselves as they might have other roles
    
    log('✅ Party data reset complete', 'success');
  } catch (error) {
    log(`❌ Failed to reset party data: ${error.message}`, 'error');
    throw error;
  }
}

async function main() {
  try {
    log('🌱 OFMS Party Model Seeder Starting...', 'success');
    log(`   Farm ID: ${options.farmId}`);
    log(`   User ID: ${options.userId}`);
    log(`   Dry Run: ${options.dryRun ? 'Yes' : 'No'}`);
    
    // Reset if requested
    if (options.reset) {
      await resetPartyData();
    }
    
    // Create parties
    log('\n📊 Creating customer parties...');
    const createdParties = [];
    
    for (const customerData of sampleCustomers) {
      const party = await createPartyWithContacts(customerData);
      if (party) {
        createdParties.push(party);
      }
    }
    
    // Summary
    log('\n📊 SUMMARY:', 'success');
    log(`   Total Parties Created: ${createdParties.length}`);
    log(`   B2B Customers: ${sampleCustomers.filter(c => c.roleType === 'CUSTOMER_B2B').length}`);
    log(`   B2C Customers: ${sampleCustomers.filter(c => c.roleType === 'CUSTOMER_B2C').length}`);
    
    if (options.dryRun) {
      log('\n⚠️  DRY RUN - No changes were made', 'warning');
    } else {
      log('\n✅ Party seeding complete!', 'success');
    }
    
  } catch (error) {
    log(`❌ Fatal error: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

module.exports = {
  createPartyWithContacts,
  sampleCustomers
};
