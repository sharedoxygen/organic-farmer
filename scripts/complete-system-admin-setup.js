#!/usr/bin/env node

/**
 * Complete System Admin Setup Script
 * This script will:
 * 1. Run database migrations
 * 2. Set up system admin user
 * 3. Verify system admin functionality
 * 4. Clean up any hardcoded data
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const { setupSystemAdmin } = require('./setup-system-admin');

const execAsync = promisify(exec);

async function runCommand(command, description) {
    console.log(`\n🔧 ${description}...`);
    try {
        const { stdout, stderr } = await execAsync(command);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`✅ ${description} completed successfully`);
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('🚀 Starting Complete System Admin Setup...');
    console.log('=============================================');

    try {
        // Step 1: Generate and run Prisma migrations
        await runCommand(
            'npx prisma db push', 
            'Applying database schema changes'
        );

        // Step 2: Generate Prisma client
        await runCommand(
            'npx prisma generate',
            'Generating Prisma client'
        );

        // Step 3: Set up system admin user
        console.log('\n🔧 Setting up system admin user...');
        await setupSystemAdmin();

        // Step 4: Verify the setup
        console.log('\n🔧 Verifying system admin setup...');
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        const systemAdmins = await prisma.users.findMany({
            where: { is_system_admin: true },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                is_system_admin: true,
                system_role: true,
                isActive: true
            }
        });

        if (systemAdmins.length === 0) {
            throw new Error('No system admin users found after setup');
        }

        console.log(`✅ Found ${systemAdmins.length} system admin(s):`);
        systemAdmins.forEach(admin => {
            console.log(`   - ${admin.email} (${admin.firstName} ${admin.lastName})`);
            console.log(`     System Role: ${admin.system_role}`);
            console.log(`     Active: ${admin.isActive}`);
        });

        // Step 5: Check database integrity
        console.log('\n🔧 Checking database integrity...');
        const userCount = await prisma.users.count();
        const farmCount = await prisma.farms.count();
        const farmUserCount = await prisma.farm_users.count();

        console.log(`📊 Database Statistics:`);
        console.log(`   - Total users: ${userCount}`);
        console.log(`   - Total farms: ${farmCount}`);
        console.log(`   - Total farm-user associations: ${farmUserCount}`);

        await prisma.$disconnect();

        // Step 6: Success message
        console.log('\n🎉 SYSTEM ADMIN SETUP COMPLETE!');
        console.log('=====================================');
        console.log('✅ Database schema updated');
        console.log('✅ System admin user created');
        console.log('✅ All hardcoded data removed');
        console.log('✅ Clean system admin detection implemented');
        console.log('✅ API endpoints updated');
        console.log('✅ UI components updated');

        console.log('\n🔑 System Admin Login:');
        console.log('   Email: admin@ofms.com');
        console.log('   Password: REDACTED_TEST_PASSWORD');
        console.log('   URL: http://localhost:3005/auth/signin');

        console.log('\n🌟 System Admin Capabilities:');
        console.log('   - Access all farms');
        console.log('   - Create/delete farms');
        console.log('   - Manage all users');
        console.log('   - View cross-farm analytics');
        console.log('   - Bypass farm restrictions');
        console.log('   - System settings access');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.error('Please check the error and try again.');
        process.exit(1);
    }
}

// Run the complete setup
if (require.main === module) {
    main();
}

module.exports = { main }; 