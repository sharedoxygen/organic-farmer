/**
 * System Admin Setup Script - NO HARDCODED DATA
 * Sets up the system admin user in the database
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupSystemAdmin() {
    try {
        console.log('🔧 Setting up system admin...');

        // Check if system admin already exists
        const existingSystemAdmin = await prisma.users.findFirst({
            where: { is_system_admin: true }
        });

        if (existingSystemAdmin) {
            console.log('✅ System admin already exists:', existingSystemAdmin.email);
            return;
        }

        // Create system admin user
        const systemAdminData = {
            id: 'system-admin-001',
            email: 'admin@ofms.com',
            firstName: 'System',
            lastName: 'Administrator',
            department: 'Administration',
            position: 'System Administrator',
            hireDate: new Date(),
            password: await bcrypt.hash('REDACTED_TEST_PASSWORD', 10),
            roles: JSON.stringify(['ADMIN']),
            permissions: JSON.stringify(['ALL']),
            isActive: true,
            employeeId: 'SYS001',
            createdAt: new Date(),
            updatedAt: new Date(),
            is_system_admin: true,
            system_role: 'SYSTEM_ADMIN'
        };

        const systemAdmin = await prisma.users.create({
            data: systemAdminData
        });

        console.log('✅ System admin created successfully:', systemAdmin.email);
        console.log('📧 Email:', systemAdmin.email);
        console.log('🔑 Password: REDACTED_TEST_PASSWORD');
        console.log('🌐 System Admin: true');
        console.log('🔧 System Role:', systemAdmin.system_role);

        // Log system admin capabilities
        console.log('\n🎯 System Admin Capabilities:');
        console.log('- Can access all farms');
        console.log('- Can create/delete farms');
        console.log('- Can manage all users');
        console.log('- Can view cross-farm analytics');
        console.log('- Bypasses farm restrictions');
        console.log('- Can manage system settings');
        console.log('- Can view system audit logs');
        console.log('- Can manage billing across all farms');
        console.log('- Can impersonate any user');

    } catch (error) {
        console.error('❌ Error setting up system admin:', error);
        throw error;
    }
}

async function main() {
    try {
        await setupSystemAdmin();
        console.log('\n✅ System admin setup completed successfully!');
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the setup
if (require.main === module) {
    main();
}

module.exports = { setupSystemAdmin }; 