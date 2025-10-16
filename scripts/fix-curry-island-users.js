#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CURRY_ISLAND_FARM_ID = '00000000-0000-0000-0000-000000000010';

async function fixCurryIslandUsers() {
    console.log('🚨 CRITICAL FIX: Associating Curry Island users with their farm...\n');

    try {
        // Step 1: Check current state
        console.log('📊 Step 1: Checking current database state...');
        
        const farm = await prisma.farms.findUnique({
            where: { id: CURRY_ISLAND_FARM_ID }
        });
        
        if (!farm) {
            console.error('❌ ERROR: Curry Island farm not found!');
            return;
        }
        
        console.log(`✅ Found farm: ${farm.farm_name}`);
        
        // Check existing farm_users associations
        const existingAssociations = await prisma.farm_users.findMany({
            where: { farm_id: CURRY_ISLAND_FARM_ID },
            include: { users: true }
        });
        
        console.log(`📋 Current farm-user associations: ${existingAssociations.length}`);
        existingAssociations.forEach(assoc => {
            console.log(`   - ${assoc.users.email} (${assoc.role})`);
        });

        // Step 2: Find all users that should belong to Curry Island
        console.log('\n📊 Step 2: Finding users that need farm association...');
        
        const allUsers = await prisma.users.findMany({
            where: {
                isActive: true,
                // Exclude global system admins
                NOT: {
                    email: {
                        in: ['admin@ofms.com', 'admin@system.com']
                    }
                }
            }
        });
        
        console.log(`📋 Total active users found: ${allUsers.length}`);
        
        // Find users not yet associated with any farm
        const usersWithoutFarm = [];
        for (const user of allUsers) {
            const hasAssociation = await prisma.farm_users.findFirst({
                where: { user_id: user.id }
            });
            
            if (!hasAssociation) {
                usersWithoutFarm.push(user);
                console.log(`   - ${user.email} (${user.firstName} ${user.lastName}) - NO FARM ASSOCIATION`);
            }
        }
        
        console.log(`🚨 Users without farm association: ${usersWithoutFarm.length}`);

        // Step 3: Create farm associations
        console.log('\n🔧 Step 3: Creating farm-user associations...');
        
        if (usersWithoutFarm.length === 0) {
            console.log('✅ All users already have farm associations!');
            return;
        }

        const associations = [];
        
        for (const user of usersWithoutFarm) {
            // Determine role based on user's existing roles
            let farmRole = 'TEAM_MEMBER'; // Default role
            
            try {
                const userRoles = JSON.parse(user.roles || '[]');
                
                if (userRoles.includes('OWNER') || userRoles.includes('ADMIN')) {
                    farmRole = 'OWNER';
                } else if (userRoles.includes('MANAGER')) {
                    farmRole = 'FARM_MANAGER';
                } else if (userRoles.includes('TEAM_LEAD')) {
                    farmRole = 'TEAM_LEAD';
                } else if (userRoles.includes('SPECIALIST')) {
                    farmRole = 'SPECIALIST';
                }
            } catch (e) {
                // If roles is not valid JSON, check string format
                if (user.roles?.includes('OWNER') || user.roles?.includes('ADMIN')) {
                    farmRole = 'OWNER';
                } else if (user.roles?.includes('MANAGER')) {
                    farmRole = 'FARM_MANAGER';
                }
            }
            
            // Special handling for known owner
            if (user.email === 'kinkead@curryislandmicrogreens.com') {
                farmRole = 'OWNER';
            }
            
            associations.push({
                farm_id: CURRY_ISLAND_FARM_ID,
                user_id: user.id,
                role: farmRole,
                permissions: JSON.stringify(['BASIC_ACCESS']),
                is_active: true,
                joined_at: new Date()
            });
            
            console.log(`   ➕ ${user.email} → ${farmRole}`);
        }

        // Create all associations in a transaction
        console.log('\n💾 Creating associations in database...');
        
        const result = await prisma.$transaction(async (tx) => {
            const created = [];
            for (const assoc of associations) {
                const farmUser = await tx.farm_users.create({
                    data: assoc
                });
                created.push(farmUser);
            }
            return created;
        });
        
        console.log(`✅ Successfully created ${result.length} farm-user associations!`);

        // Step 4: Verify the fix
        console.log('\n🔍 Step 4: Verifying the fix...');
        
        const finalAssociations = await prisma.farm_users.findMany({
            where: { farm_id: CURRY_ISLAND_FARM_ID },
            include: { users: true }
        });
        
        console.log(`📋 Total farm-user associations now: ${finalAssociations.length}`);
        finalAssociations.forEach(assoc => {
            console.log(`   ✅ ${assoc.users.email} (${assoc.role})`);
        });

        // Check for any remaining unassociated users
        const remainingUnassociated = [];
        for (const user of allUsers) {
            const hasAssociation = await prisma.farm_users.findFirst({
                where: { user_id: user.id }
            });
            
            if (!hasAssociation) {
                remainingUnassociated.push(user);
            }
        }
        
        if (remainingUnassociated.length === 0) {
            console.log('\n🎉 SUCCESS: All users now have proper farm associations!');
        } else {
            console.log(`\n⚠️ WARNING: ${remainingUnassociated.length} users still unassociated:`);
            remainingUnassociated.forEach(user => {
                console.log(`   - ${user.email}`);
            });
        }

        console.log('\n📊 SUMMARY:');
        console.log(`✅ Farm: ${farm.farm_name}`);
        console.log(`✅ Total users associated: ${finalAssociations.length}`);
        console.log(`✅ New associations created: ${result.length}`);
        console.log('✅ Critical issue RESOLVED!');

    } catch (error) {
        console.error('❌ ERROR during user-farm association fix:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
if (require.main === module) {
    fixCurryIslandUsers()
        .then(() => {
            console.log('\n🎯 User-farm association fix completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Fix failed:', error);
            process.exit(1);
        });
}

module.exports = { fixCurryIslandUsers }; 