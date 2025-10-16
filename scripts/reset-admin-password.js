const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupSystemAdminUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 Setting up SUPER USER admin@ofms.com with system admin privileges...\n');
    
    // Password
    const password = 'REDACTED_TEST_PASSWORD';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: 'admin@ofms.com' }
    });
    
    const systemAdminData = {
      email: 'admin@ofms.com',
      firstName: 'System',
      lastName: 'Administrator',
      department: 'Administration',
      position: 'System Administrator',
      hireDate: new Date(),
      password: hashedPassword,
      roles: JSON.stringify(['ADMIN', 'SYSTEM_ADMIN']),
      permissions: JSON.stringify(['ALL']),
      isActive: true,
      employeeId: 'SYS001',
      is_system_admin: true,
      system_role: 'SYSTEM_ADMIN',
      updatedAt: new Date()
    };
    
    let user;
    
    if (existingUser) {
      // Update existing user with system admin privileges
      user = await prisma.users.update({
        where: { email: 'admin@ofms.com' },
        data: systemAdminData
      });
      
      console.log('✅ Updated existing user to SUPER USER:');
      
    } else {
      // Create new system admin user
      user = await prisma.users.create({
        data: {
          id: 'system-admin-001',
          ...systemAdminData,
          createdAt: new Date()
        }
      });
      
      console.log('✅ Created new SUPER USER:');
    }
    
    console.log(`   📧 Email: ${user.email}`);
    console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`   🎯 Position: ${user.position}`);
    console.log(`   🔧 System Admin: ${user.is_system_admin}`);
    console.log(`   🌐 System Role: ${user.system_role}`);
    console.log(`   🛡️  Roles: ${user.roles}`);
    console.log(`   🔑 Password: ${password}`);
    
    // Verify system admin can access all farms
    const farms = await prisma.farms.findMany({
      select: { id: true, farm_name: true }
    });
    
    console.log('\n🏢 Farms accessible to SUPER USER:');
    farms.forEach(farm => {
      console.log(`   ✅ ${farm.farm_name} (ID: ${farm.id})`);
    });
    
    console.log('\n🎉 SUPER USER Setup Complete!');
    console.log('==========================================');
    console.log('📧 Login URL: http://localhost:3005/auth/signin');
    console.log(`📧 Email: admin@ofms.com`);
    console.log(`🔑 Password: ${password}`);
    console.log('\n🌟 SUPER USER Capabilities:');
    console.log('   - Access ALL farms');
    console.log('   - Switch between farms');
    console.log('   - Create/delete farms');
    console.log('   - Manage all users');
    console.log('   - View cross-farm analytics');
    console.log('   - Bypass farm restrictions');
    console.log('   - System settings access');
    console.log('\n⚠️  This is the SYSTEM ADMINISTRATOR account');
    
  } catch (error) {
    console.error('❌ Error setting up SUPER USER:', error.message);
    
    if (error.code === 'P2002') {
      console.error('❌ User with this email already exists or ID conflict.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupSystemAdminUser(); 