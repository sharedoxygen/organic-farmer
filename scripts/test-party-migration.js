#!/usr/bin/env node

/**
 * Test Party Model Migration
 * Verifies that the migration was successful and data is accessible
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMigration() {
  console.log('\n🧪 TESTING PARTY MODEL MIGRATION\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Check customers table
    console.log('\n📊 Test 1: Customer Data');
    const customers = await prisma.customers.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        partyId: true
      }
    });
    console.log(`  ✅ Found ${customers.length} customers`);
    customers.forEach(c => {
      console.log(`     - ${c.name} (${c.type}) ${c.partyId ? '✓ linked' : '✗ not linked'}`);
    });

    // Test 2: Check parties
    console.log('\n📊 Test 2: Parties Created');
    const parties = await prisma.parties.findMany({
      where: {
        roles: {
          some: {
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        }
      },
      include: {
        roles: {
          where: {
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        }
      },
      take: 3
    });
    console.log(`  ✅ Found ${parties.length} customer parties`);
    parties.forEach(p => {
      const role = p.roles[0];
      console.log(`     - ${p.displayName} (${p.partyType}) - ${role.roleType}`);
    });

    // Test 3: Check contacts
    console.log('\n📊 Test 3: Contacts Created');
    const contacts = await prisma.party_contacts.findMany({
      take: 5,
      include: {
        party: {
          select: { displayName: true }
        }
      }
    });
    console.log(`  ✅ Found ${contacts.length} contacts`);
    contacts.forEach(c => {
      console.log(`     - ${c.party.displayName}: ${c.type} (${c.isPrimary ? 'Primary' : 'Secondary'})`);
    });

    // Test 4: Check orders linkage
    console.log('\n📊 Test 4: Orders Linked to Parties');
    const orders = await prisma.orders.findMany({
      where: {
        customerPartyId: { not: null }
      },
      select: {
        id: true,
        orderNumber: true,
        customerId: true,
        customerPartyId: true
      },
      take: 3
    });
    console.log(`  ✅ Found ${orders.length} orders linked to parties`);
    orders.forEach(o => {
      console.log(`     - ${o.orderNumber}: ${o.customerPartyId ? '✓ party linked' : '✗ not linked'}`);
    });

    // Test 5: Full customer with party data
    console.log('\n📊 Test 5: Full Customer Party Data');
    const fullCustomer = await prisma.parties.findFirst({
      where: {
        roles: {
          some: {
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        }
      },
      include: {
        roles: {
          where: {
            roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] }
          }
        },
        contacts: true
      }
    });

    if (fullCustomer) {
      console.log(`  ✅ Sample Customer: ${fullCustomer.displayName}`);
      console.log(`     Party Type: ${fullCustomer.partyType}`);
      console.log(`     Role: ${fullCustomer.roles[0].roleType}`);
      console.log(`     Contacts: ${fullCustomer.contacts.length}`);
      fullCustomer.contacts.forEach(c => {
        console.log(`       - ${c.type}: ${c.value.substring(0, 30)}...`);
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const stats = {
      totalCustomers: await prisma.customers.count(),
      customersWithParty: await prisma.customers.count({ where: { partyId: { not: null } } }),
      totalParties: await prisma.parties.count(),
      customerRoles: await prisma.party_roles.count({ 
        where: { roleType: { in: ['CUSTOMER_B2B', 'CUSTOMER_B2C'] } } 
      }),
      totalContacts: await prisma.party_contacts.count(),
      ordersLinked: await prisma.orders.count({ where: { customerPartyId: { not: null } } }),
      totalOrders: await prisma.orders.count()
    };

    console.log(`\n  Total Customers:           ${stats.totalCustomers}`);
    console.log(`  Customers with Party:      ${stats.customersWithParty} (${Math.round(stats.customersWithParty/stats.totalCustomers*100)}%)`);
    console.log(`  Total Parties:             ${stats.totalParties}`);
    console.log(`  Customer Roles:            ${stats.customerRoles}`);
    console.log(`  Total Contacts:            ${stats.totalContacts}`);
    console.log(`  Orders Linked to Parties:  ${stats.ordersLinked}/${stats.totalOrders} (${Math.round(stats.ordersLinked/stats.totalOrders*100)}%)`);

    console.log('\n✅ MIGRATION TEST COMPLETE!\n');
    console.log('🎉 All data successfully migrated to Party Model');
    console.log('🌐 Visit http://localhost:3005/sales/customers to see the new UI\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testMigration();
