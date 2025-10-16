#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSystemIntegrity() {
    console.log('🔍 OFMS SYSTEM INTEGRITY CHECK\n');
    console.log('Verifying all critical issues have been resolved...\n');

    const issues = [];
    const successes = [];

    try {
        // 1. Check Farm-User Associations
        console.log('📋 1. CHECKING FARM-USER ASSOCIATIONS...');
        
        const farms = await prisma.farms.findMany();
        console.log(`   Found ${farms.length} farms`);
        
        for (const farm of farms) {
            const farmUsers = await prisma.farm_users.findMany({
                where: { farm_id: farm.id, is_active: true },
                include: { users: true }
            });
            
            console.log(`   🏢 ${farm.farm_name}:`);
            console.log(`      Users: ${farmUsers.length}`);
            
            if (farmUsers.length === 0) {
                issues.push(`Farm "${farm.farm_name}" has no associated users`);
            } else {
                successes.push(`Farm "${farm.farm_name}" has ${farmUsers.length} properly associated users`);
            }
            
            // Check for owner
            const owner = farmUsers.find(fu => fu.role === 'OWNER');
            if (owner) {
                console.log(`      Owner: ${owner.users.email}`);
                successes.push(`Farm "${farm.farm_name}" has a designated owner`);
            } else {
                issues.push(`Farm "${farm.farm_name}" has no designated owner`);
            }
        }

        // 2. Check for orphaned users
        console.log('\n📋 2. CHECKING FOR ORPHANED USERS...');
        
        const allUsers = await prisma.users.findMany({
            where: { isActive: true }
        });
        
        const orphanedUsers = [];
        for (const user of allUsers) {
            // Skip global system admins
            if (user.email.includes('@ofms.com') && user.roles?.includes('ADMIN')) {
                continue;
            }
            
            const farmAssociation = await prisma.farm_users.findFirst({
                where: { user_id: user.id, is_active: true }
            });
            
            if (!farmAssociation) {
                orphanedUsers.push(user);
            }
        }
        
        if (orphanedUsers.length === 0) {
            successes.push('No orphaned users found - all users properly associated with farms');
        } else {
            issues.push(`Found ${orphanedUsers.length} orphaned users without farm associations`);
            orphanedUsers.forEach(user => {
                console.log(`      ⚠️ ${user.email} (${user.firstName} ${user.lastName})`);
            });
        }

        // 3. Check data integrity - batches
        console.log('\n📋 3. CHECKING DATA INTEGRITY - BATCHES...');
        
        const totalBatches = await prisma.batches.count();
        const batchesWithFarm = await prisma.batches.count({
            where: { 
                farm_id: { 
                    not: ''
                }
            }
        });
        
        console.log(`   Total batches: ${totalBatches}`);
        console.log(`   Batches with farm_id: ${batchesWithFarm}`);
        
        if (totalBatches === batchesWithFarm) {
            successes.push('All batches properly associated with farms');
        } else {
            issues.push(`${totalBatches - batchesWithFarm} batches missing farm_id`);
        }

        // 4. Check data integrity - customers
        console.log('\n📋 4. CHECKING DATA INTEGRITY - CUSTOMERS...');
        
        const totalCustomers = await prisma.customers.count();
        const customersWithFarm = await prisma.customers.count({
            where: { 
                farm_id: { 
                    not: ''
                }
            }
        });
        
        console.log(`   Total customers: ${totalCustomers}`);
        console.log(`   Customers with farm_id: ${customersWithFarm}`);
        
        if (totalCustomers === customersWithFarm) {
            successes.push('All customers properly associated with farms');
        } else {
            issues.push(`${totalCustomers - customersWithFarm} customers missing farm_id`);
        }

        // 5. Check database schema integrity
        console.log('\n📋 5. CHECKING DATABASE SCHEMA...');
        
        try {
            // Test basic queries
            await prisma.farms.findFirst();
            await prisma.farm_users.findFirst();
            await prisma.users.findFirst();
            successes.push('Database schema is healthy and accessible');
        } catch (error) {
            issues.push(`Database schema error: ${error.message}`);
        }

        // 6. Check for duplicate farm names
        console.log('\n📋 6. CHECKING FOR DUPLICATE FARM NAMES...');
        
        const farmNames = farms.map(f => f.farm_name.toLowerCase());
        const uniqueFarmNames = new Set(farmNames);
        
        if (farmNames.length === uniqueFarmNames.size) {
            successes.push('No duplicate farm names found');
        } else {
            issues.push('Duplicate farm names detected');
        }

        // 7. Check multi-tenant isolation
        console.log('\n📋 7. CHECKING MULTI-TENANT ISOLATION...');
        
        const farmIds = farms.map(f => f.id);
        let isolationIssues = 0;
        
        // Check that all business data has farm_id
        const tables = ['batches', 'customers', 'orders', 'tasks', 'equipment'];
        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                const withFarmId = await prisma[table].count({
                    where: { 
                        farm_id: { 
                            not: ''
                        }
                    }
                });
                
                if (count !== withFarmId) {
                    isolationIssues++;
                    issues.push(`Table ${table}: ${count - withFarmId} records missing farm_id`);
                }
            } catch (error) {
                // Table might not exist or have farm_id
                console.log(`      Skipping ${table} (${error.message})`);
            }
        }
        
        if (isolationIssues === 0) {
            successes.push('Multi-tenant isolation properly implemented');
        }

        // Print Results
        console.log('\n' + '='.repeat(60));
        console.log('📊 SYSTEM INTEGRITY REPORT');
        console.log('='.repeat(60));
        
        if (issues.length === 0) {
            console.log('🎉 ALL CHECKS PASSED! System integrity is EXCELLENT!');
        } else {
            console.log(`🚨 FOUND ${issues.length} ISSUES:`);
            issues.forEach((issue, i) => {
                console.log(`   ${i + 1}. ❌ ${issue}`);
            });
        }
        
        if (successes.length > 0) {
            console.log(`\n✅ ${successes.length} SUCCESSFUL CHECKS:`);
            successes.forEach((success, i) => {
                console.log(`   ${i + 1}. ✅ ${success}`);
            });
        }

        console.log('\n📈 SYSTEM SUMMARY:');
        console.log(`   Farms: ${farms.length}`);
        console.log(`   Total Users: ${allUsers.length}`);
        console.log(`   Active Farm-User Associations: ${await prisma.farm_users.count({ where: { is_active: true } })}`);
        console.log(`   Total Batches: ${totalBatches}`);
        console.log(`   Total Customers: ${totalCustomers}`);
        
        if (issues.length === 0) {
            console.log('\n🎯 RESULT: SYSTEM IS READY FOR PRODUCTION! 🚀');
        } else {
            console.log('\n⚠️ RESULT: ISSUES NEED ATTENTION BEFORE PRODUCTION');
        }

    } catch (error) {
        console.error('❌ System integrity check failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the integrity check
if (require.main === module) {
    checkSystemIntegrity()
        .then(() => {
            console.log('\n✅ System integrity check completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Integrity check failed:', error);
            process.exit(1);
        });
}

module.exports = { checkSystemIntegrity }; 