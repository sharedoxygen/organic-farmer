#!/usr/bin/env node
/**
 * Party Data Model Backfill Script
 * Migrates existing farms, users, customers, and suppliers to the party model
 *
 * Run after party_model_phase1.sql and party_model_phase2.sql
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function backfillPartyModel() {
  try {
    console.log('🚀 Starting Party Model Backfill...')
    console.log('='.repeat(60))

    // Step 1: Backfill Farms → Parties
    console.log('\n🏢 Step 1: Migrating Farms to Party Model...')
    const farms = await prisma.farms.findMany()
    console.log(`Found ${farms.length} farms to migrate`)

    for (const farm of farms) {
      // Create party for farm
      const farmParty = await prisma.parties.create({
        data: {
          displayName: farm.farm_name,
          legalName: farm.business_name || farm.farm_name,
          partyType: 'ORGANIZATION',
        },
      })

      // Create FARM role
      await prisma.party_roles.create({
        data: {
          partyId: farmParty.id,
          roleType: 'FARM',
          farm_id: farm.id,
          metadata: {
            subscription_plan: farm.subscription_plan,
            subscription_status: farm.subscription_status,
            settings: farm.settings,
          },
        },
      })

      // Update farm with partyId
      await prisma.farms.update({
        where: { id: farm.id },
        data: { partyId: farmParty.id },
      })

      console.log(
        `  ✅ Migrated farm: ${farm.farm_name} → Party ${farmParty.id}`
      )
    }

    // Step 2: Backfill Users → Parties
    console.log('\n👤 Step 2: Migrating Users to Party Model...')
    const users = await prisma.users.findMany()
    console.log(`Found ${users.length} users to migrate`)

    for (const user of users) {
      // Create party for user
      const userParty = await prisma.parties.create({
        data: {
          displayName: `${user.firstName} ${user.lastName}`,
          legalName: `${user.firstName} ${user.lastName}`,
          partyType: 'PERSON',
        },
      })

      // Create USER role
      await prisma.party_roles.create({
        data: {
          partyId: userParty.id,
          roleType: 'USER',
          metadata: {
            is_system_admin: user.is_system_admin,
            system_role: user.system_role,
            position: user.position,
            department: user.department,
          },
        },
      })

      // Add EMPLOYEE roles for each farm the user belongs to
      const farmUsers = await prisma.farm_users.findMany({
        where: { user_id: user.id },
      })

      for (const farmUser of farmUsers) {
        await prisma.party_roles.create({
          data: {
            partyId: userParty.id,
            roleType: 'EMPLOYEE',
            farm_id: farmUser.farm_id,
            metadata: {
              role: farmUser.role,
              permissions: farmUser.permissions,
            },
          },
        })
      }

      // Add contacts for user
      if (user.email) {
        await prisma.party_contacts.create({
          data: {
            partyId: userParty.id,
            type: 'EMAIL',
            label: 'Work Email',
            value: user.email,
            isPrimary: true,
          },
        })
      }

      if (user.phone) {
        await prisma.party_contacts.create({
          data: {
            partyId: userParty.id,
            type: 'PHONE',
            label: 'Work Phone',
            value: user.phone,
            isPrimary: false,
          },
        })
      }

      // Update user with partyId
      await prisma.users.update({
        where: { id: user.id },
        data: { partyId: userParty.id },
      })

      console.log(`  ✅ Migrated user: ${user.email} → Party ${userParty.id}`)
    }

    // Step 3: Backfill Customers → Parties
    console.log('\n🏪 Step 3: Migrating Customers to Party Model...')
    const customers = await prisma.customers.findMany()
    console.log(`Found ${customers.length} customers to migrate`)

    for (const customer of customers) {
      // Determine party type
      const partyType =
        customer.type === 'B2B' || customer.businessName
          ? 'ORGANIZATION'
          : 'PERSON'

      // Create party for customer
      const customerParty = await prisma.parties.create({
        data: {
          displayName: customer.businessName || customer.name,
          legalName: customer.businessName || customer.name,
          partyType,
        },
      })

      // Create CUSTOMER role
      const roleType = customer.type === 'B2B' ? 'CUSTOMER_B2B' : 'CUSTOMER_B2C'
      await prisma.party_roles.create({
        data: {
          partyId: customerParty.id,
          roleType,
          farm_id: customer.farm_id,
          metadata: {
            taxId: customer.taxId,
            paymentTerms: customer.paymentTerms,
            creditLimit: customer.creditLimit,
            orderFrequency: customer.orderFrequency,
            preferredVarieties: customer.preferredVarieties,
            businessType: customer.businessType,
          },
        },
      })

      // Add contacts for customer
      if (customer.email) {
        await prisma.party_contacts.create({
          data: {
            partyId: customerParty.id,
            type: 'EMAIL',
            label: 'Business Email',
            value: customer.email,
            isPrimary: true,
          },
        })
      }

      if (customer.phone) {
        await prisma.party_contacts.create({
          data: {
            partyId: customerParty.id,
            type: 'PHONE',
            label: 'Business Phone',
            value: customer.phone,
            isPrimary: false,
          },
        })
      }

      // Create address contact if available
      if (customer.street || customer.city || customer.state) {
        const addressValue = [
          customer.street,
          customer.city,
          customer.state,
          customer.zipCode,
          customer.country,
        ]
          .filter(Boolean)
          .join(', ')

        if (addressValue) {
          await prisma.party_contacts.create({
            data: {
              partyId: customerParty.id,
              type: 'ADDRESS',
              label: 'Business Address',
              value: addressValue,
              isPrimary: true,
            },
          })
        }
      }

      // Update customer with partyId
      await prisma.customers.update({
        where: { id: customer.id },
        data: { partyId: customerParty.id },
      })

      console.log(
        `  ✅ Migrated customer: ${customer.name} → Party ${customerParty.id}`
      )
    }

    // Step 4: Backfill Suppliers → Parties
    console.log('\n📦 Step 4: Migrating Suppliers to Party Model...')
    const suppliers = await prisma.suppliers.findMany()
    console.log(`Found ${suppliers.length} suppliers to migrate`)

    for (const supplier of suppliers) {
      // Create party for supplier
      const supplierParty = await prisma.parties.create({
        data: {
          displayName: supplier.name,
          legalName: supplier.name,
          partyType: 'ORGANIZATION',
        },
      })

      // Create SUPPLIER role
      await prisma.party_roles.create({
        data: {
          partyId: supplierParty.id,
          roleType: 'SUPPLIER',
          farm_id: supplier.farm_id,
          metadata: {
            contact: supplier.contact,
          },
        },
      })

      // Add contacts
      if (supplier.email) {
        await prisma.party_contacts.create({
          data: {
            partyId: supplierParty.id,
            type: 'EMAIL',
            value: supplier.email,
            isPrimary: true,
          },
        })
      }

      if (supplier.phone) {
        await prisma.party_contacts.create({
          data: {
            partyId: supplierParty.id,
            type: 'PHONE',
            value: supplier.phone,
            isPrimary: false,
          },
        })
      }

      if (supplier.address) {
        await prisma.party_contacts.create({
          data: {
            partyId: supplierParty.id,
            type: 'ADDRESS',
            value: supplier.address,
            isPrimary: true,
          },
        })
      }

      // Update supplier with partyId
      await prisma.suppliers.update({
        where: { id: supplier.id },
        data: { partyId: supplierParty.id },
      })

      console.log(
        `  ✅ Migrated supplier: ${supplier.name} → Party ${supplierParty.id}`
      )
    }

    // Step 5: Update Orders with customerPartyId
    console.log('\n📋 Step 5: Updating Orders with Party References...')
    const orders = await prisma.orders.findMany({
      include: { customers: true },
    })
    console.log(`Found ${orders.length} orders to update`)

    for (const order of orders) {
      if (order.customers && order.customers.partyId) {
        await prisma.orders.update({
          where: { id: order.id },
          data: { customerPartyId: order.customers.partyId },
        })
        console.log(`  ✅ Updated order: ${order.orderNumber}`)
      } else {
        console.warn(
          `  ⚠️ Order ${order.orderNumber} has no customer or customer partyId`
        )
      }
    }

    // Verification
    console.log('\n🔍 Verifying Migration...')
    const partyCount = await prisma.parties.count()
    const roleCount = await prisma.party_roles.count()
    const contactCount = await prisma.party_contacts.count()
    const farmsWithParty = await prisma.farms.count({
      where: { partyId: { not: null } },
    })
    const usersWithParty = await prisma.users.count({
      where: { partyId: { not: null } },
    })
    const customersWithParty = await prisma.customers.count({
      where: { partyId: { not: null } },
    })
    const suppliersWithParty = await prisma.suppliers.count({
      where: { partyId: { not: null } },
    })
    const ordersWithParty = await prisma.orders.count({
      where: { customerPartyId: { not: null } },
    })

    console.log('\n📊 MIGRATION SUMMARY:')
    console.log('='.repeat(60))
    console.log(`✅ Total Parties Created: ${partyCount}`)
    console.log(`✅ Total Party Roles Created: ${roleCount}`)
    console.log(`✅ Total Party Contacts Created: ${contactCount}`)
    console.log(`\n📈 Entity Migration Status:`)
    console.log(`  Farms: ${farmsWithParty}/${farms.length}`)
    console.log(`  Users: ${usersWithParty}/${users.length}`)
    console.log(`  Customers: ${customersWithParty}/${customers.length}`)
    console.log(`  Suppliers: ${suppliersWithParty}/${suppliers.length}`)
    console.log(`  Orders: ${ordersWithParty}/${orders.length}`)

    console.log('\n✅ Party Model Backfill Complete!')
    console.log('Next steps:')
    console.log('  1. Update application logic to use party-based queries')
    console.log('  2. Test all features with new party model')
    console.log('  3. Add foreign key constraints once fully migrated')
    console.log('  4. Remove legacy columns in final cleanup phase')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

backfillPartyModel()
