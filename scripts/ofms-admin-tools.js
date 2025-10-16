#!/usr/bin/env node

/**
 * OFMS ADMIN TOOLS
 * Consolidated administrative tool for OFMS system management
 *
 * Combines functionality from:
 * - complete-system-admin-setup.js
 * - setup-system-admin.js
 * - reset-admin-password.js
 * - fix-curry-island-users.js
 *
 * Usage:
 * node scripts/ofms-admin-tools.js setup             # Complete system setup
 * node scripts/ofms-admin-tools.js create-admin      # Create system admin
 * node scripts/ofms-admin-tools.js reset-password    # Reset admin password
 * node scripts/ofms-admin-tools.js fix-users         # Fix user associations
 * node scripts/ofms-admin-tools.js verify            # Verify system status
 */

const { PrismaClient } = require('@prisma/client')
const { program } = require('commander')
const bcrypt = require('bcryptjs')
const { exec } = require('child_process')
const { promisify } = require('util')

const prisma = new PrismaClient()
const execAsync = promisify(exec)

// CLI Configuration
program
  .name('ofms-admin-tools')
  .description('OFMS Admin Tools - Consolidated administrative operations')
  .version('1.0.0')

program
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run - show what would be done')
  .option('--force', 'Force operations without confirmation')

program
  .command('setup')
  .description('Complete system admin setup with verification')
  .action(completeSystemSetup)

program
  .command('create-admin')
  .description('Create system administrator user')
  .option('-e, --email <email>', 'Admin email', 'admin@ofms.com')
  .option('-p, --password <password>', 'Admin password', 'REDACTED_TEST_PASSWORD')
  .action(createSystemAdmin)

program
  .command('reset-password')
  .description('Reset system administrator password')
  .option('-e, --email <email>', 'Admin email', 'admin@ofms.com')
  .option('-p, --password <password>', 'New password', 'REDACTED_TEST_PASSWORD')
  .action(resetAdminPassword)

program
  .command('fix-users')
  .description('Fix user-farm associations')
  .option(
    '-f, --farm-id <id>',
    'Target farm ID',
    '00000000-0000-0000-0000-000000000010'
  )
  .action(fixUserAssociations)

program
  .command('verify')
  .description('Verify system admin configuration and integrity')
  .action(verifySystemIntegrity)

program
  .command('list-users')
  .description('List all system users')
  .option('-a, --active-only', 'Show only active users')
  .option('-s, --system-admin-only', 'Show only system admins')
  .action(listUsers)

const options = program.opts()

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString()
  const emoji =
    level === 'error'
      ? '❌'
      : level === 'success'
        ? '✅'
        : level === 'warning'
          ? '⚠️'
          : '🔧'

  if (options.verbose || level === 'error' || level === 'success') {
    console.log(`${emoji} [${timestamp}] ${message}`)
  }
}

async function runCommand(command, description) {
  log(`${description}...`)

  if (options.dryRun) {
    log(`Would run: ${command}`, 'warning')
    return { stdout: 'DRY RUN', stderr: '' }
  }

  try {
    const { stdout, stderr } = await execAsync(command)
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
    log(`${description} completed successfully`, 'success')
    return { stdout, stderr }
  } catch (error) {
    log(`${description} failed: ${error.message}`, 'error')
    throw error
  }
}

// Main Functions

/**
 * Complete system setup - combines complete-system-admin-setup.js functionality
 */
async function completeSystemSetup() {
  log('🚀 Starting Complete System Admin Setup...')
  log('=============================================')

  try {
    // Step 1: Database setup
    await runCommand('npx prisma db push', 'Applying database schema changes')
    await runCommand('npx prisma generate', 'Generating Prisma client')

    // Step 2: Create system admin
    log('🔧 Setting up system admin user...')
    await createSystemAdmin({ email: 'admin@ofms.com', password: 'REDACTED_TEST_PASSWORD' })

    // Step 3: Verify setup
    await verifySystemIntegrity()

    // Step 4: Success message
    log('🎉 SYSTEM ADMIN SETUP COMPLETE!', 'success')
    log('=====================================')
    log('✅ Database schema updated')
    log('✅ System admin user created')
    log('✅ System integrity verified')

    console.log('\n🔑 System Admin Login:')
    console.log('   Email: admin@ofms.com')
    console.log('   Password: REDACTED_TEST_PASSWORD')
    console.log('   URL: http://localhost:3005/auth/signin')

    console.log('\n🌟 System Admin Capabilities:')
    console.log('   - Access all farms')
    console.log('   - Create/delete farms')
    console.log('   - Manage all users')
    console.log('   - View cross-farm analytics')
    console.log('   - Bypass farm restrictions')
    console.log('   - System settings access')
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error')
    process.exit(1)
  }
}

/**
 * Create system admin - combines setup-system-admin.js functionality
 */
async function createSystemAdmin(cmdOptions = {}) {
  const email = cmdOptions.email || 'admin@ofms.com'
  const password = cmdOptions.password || 'REDACTED_TEST_PASSWORD'

  log('🔧 Creating system administrator...')

  if (options.dryRun) {
    log(`Would create admin: ${email}`, 'warning')
    return
  }

  try {
    // Check if system admin already exists
    const existingSystemAdmin = await prisma.users.findFirst({
      where: { is_system_admin: true },
    })

    if (existingSystemAdmin && !options.force) {
      log(
        `✅ System admin already exists: ${existingSystemAdmin.email}`,
        'success'
      )
      return existingSystemAdmin
    }

    // Create system admin user
    const systemAdminData = {
      id: 'system-admin-001',
      email,
      firstName: 'System',
      lastName: 'Administrator',
      department: 'Administration',
      position: 'System Administrator',
      hireDate: new Date(),
      password: await bcrypt.hash(password, 10),
      roles: JSON.stringify(['ADMIN']),
      permissions: JSON.stringify(['ALL']),
      isActive: true,
      employeeId: 'SYS001',
      createdAt: new Date(),
      updatedAt: new Date(),
      is_system_admin: true,
      system_role: 'SYSTEM_ADMIN',
    }

    const systemAdmin =
      existingSystemAdmin && options.force
        ? await prisma.users.update({
            where: { id: existingSystemAdmin.id },
            data: systemAdminData,
          })
        : await prisma.users.create({ data: systemAdminData })

    log(
      `✅ System admin ${existingSystemAdmin ? 'updated' : 'created'}: ${systemAdmin.email}`,
      'success'
    )
    log(`📧 Email: ${systemAdmin.email}`)
    log(`🔑 Password: ${password}`)
    log(`🌐 System Admin: ${systemAdmin.is_system_admin}`)
    log(`🔧 System Role: ${systemAdmin.system_role}`)

    return systemAdmin
  } catch (error) {
    log(`Error creating system admin: ${error.message}`, 'error')
    throw error
  }
}

/**
 * Reset admin password - combines reset-admin-password.js functionality
 */
async function resetAdminPassword(cmdOptions = {}) {
  const email = cmdOptions.email || 'admin@ofms.com'
  const newPassword = cmdOptions.password || 'REDACTED_TEST_PASSWORD'

  log(`🔐 Resetting password for admin: ${email}`)

  if (options.dryRun) {
    log(`Would reset password for: ${email}`, 'warning')
    return
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const updatedUser = await prisma.users.update({
      where: { email },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    })

    log(`✅ Password reset successful for: ${updatedUser.email}`, 'success')
    log(`🔑 New password: ${newPassword}`)
  } catch (error) {
    if (error.code === 'P2025') {
      log(`❌ Admin user not found: ${email}`, 'error')
    } else {
      log(`❌ Error resetting password: ${error.message}`, 'error')
    }
    throw error
  }
}

/**
 * Fix user associations - combines fix-curry-island-users.js functionality
 */
async function fixUserAssociations(cmdOptions = {}) {
  const farmId = cmdOptions.farmId || '00000000-0000-0000-0000-000000000010'

  log(`🚨 Fixing user-farm associations for farm: ${farmId}`)

  if (options.dryRun) {
    log(`Would fix associations for farm: ${farmId}`, 'warning')
    return
  }

  try {
    // Verify farm exists
    const farm = await prisma.farms.findUnique({ where: { id: farmId } })
    if (!farm) {
      log(`❌ Farm not found: ${farmId}`, 'error')
      return
    }

    log(`✅ Found farm: ${farm.farm_name}`)

    // Check existing associations
    const existingAssociations = await prisma.farm_users.findMany({
      where: { farm_id: farmId },
      include: { users: true },
    })

    log(`📋 Current farm-user associations: ${existingAssociations.length}`)

    // Find orphaned users
    const allUsers = await prisma.users.findMany({
      where: {
        isActive: true,
        NOT: {
          email: { in: ['admin@ofms.com', 'admin@system.com'] },
        },
      },
    })

    const orphanedUsers = []
    for (const user of allUsers) {
      const hasAssociation = await prisma.farm_users.findFirst({
        where: { user_id: user.id },
      })

      if (!hasAssociation) {
        orphanedUsers.push(user)
      }
    }

    log(`🚨 Users without farm association: ${orphanedUsers.length}`)

    if (orphanedUsers.length === 0) {
      log('✅ All users already have farm associations!', 'success')
      return
    }

    // Create associations
    const associations = []
    for (const user of orphanedUsers) {
      let farmRole = 'TEAM_MEMBER' // Default role

      try {
        const userRoles = JSON.parse(user.roles || '[]')
        if (userRoles.includes('OWNER') || userRoles.includes('ADMIN')) {
          farmRole = 'OWNER'
        } else if (userRoles.includes('MANAGER')) {
          farmRole = 'FARM_MANAGER'
        } else if (userRoles.includes('TEAM_LEAD')) {
          farmRole = 'TEAM_LEAD'
        }
      } catch (e) {
        // If roles parsing fails, use string matching
        if (user.roles?.includes('OWNER') || user.roles?.includes('ADMIN')) {
          farmRole = 'OWNER'
        }
      }

      associations.push({
        farm_id: farmId,
        user_id: user.id,
        role: farmRole,
        permissions: JSON.stringify(['BASIC_ACCESS']),
        is_active: true,
        joined_at: new Date(),
      })

      log(`   ➕ ${user.email} → ${farmRole}`)
    }

    // Create all associations in a transaction
    const result = await prisma.$transaction(async tx => {
      const created = []
      for (const assoc of associations) {
        const farmUser = await tx.farm_users.create({ data: assoc })
        created.push(farmUser)
      }
      return created
    })

    log(
      `✅ Successfully created ${result.length} farm-user associations!`,
      'success'
    )

    // Verify the fix
    const finalAssociations = await prisma.farm_users.findMany({
      where: { farm_id: farmId },
      include: { users: true },
    })

    log(
      `📋 Total farm-user associations now: ${finalAssociations.length}`,
      'success'
    )
  } catch (error) {
    log(`❌ Error fixing user associations: ${error.message}`, 'error')
    throw error
  }
}

/**
 * Verify system integrity - combines check-system-integrity.js functionality
 */
async function verifySystemIntegrity() {
  log('🔍 OFMS SYSTEM INTEGRITY CHECK')
  log('Verifying all critical components...\n')

  const issues = []
  const successes = []

  try {
    // 1. Check system admin exists
    log('📋 1. CHECKING SYSTEM ADMIN...')
    const systemAdmins = await prisma.users.findMany({
      where: { is_system_admin: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        is_system_admin: true,
        system_role: true,
        isActive: true,
      },
    })

    if (systemAdmins.length === 0) {
      issues.push('No system admin users found')
    } else {
      successes.push(`Found ${systemAdmins.length} system admin(s)`)
      systemAdmins.forEach(admin => {
        log(`   - ${admin.email} (${admin.firstName} ${admin.lastName})`)
      })
    }

    // 2. Check database integrity
    log('\n📋 2. CHECKING DATABASE SCHEMA...')
    try {
      await prisma.farms.findFirst()
      await prisma.users.findFirst()
      successes.push('Database schema is healthy and accessible')
    } catch (error) {
      issues.push(`Database schema error: ${error.message}`)
    }

    // 3. Check farm-user associations
    log('\n📋 3. CHECKING FARM-USER ASSOCIATIONS...')
    const farms = await prisma.farms.findMany()
    let orphanedUserCount = 0

    for (const farm of farms) {
      const farmUsers = await prisma.farm_users.findMany({
        where: { farm_id: farm.id, is_active: true },
      })

      if (farmUsers.length === 0) {
        issues.push(`Farm "${farm.farm_name}" has no associated users`)
      }
    }

    const allUsers = await prisma.users.findMany({ where: { isActive: true } })
    for (const user of allUsers) {
      if (user.email.includes('@ofms.com')) continue // Skip system admins

      const farmAssociation = await prisma.farm_users.findFirst({
        where: { user_id: user.id, is_active: true },
      })

      if (!farmAssociation) {
        orphanedUserCount++
      }
    }

    if (orphanedUserCount === 0) {
      successes.push('All users properly associated with farms')
    } else {
      issues.push(`${orphanedUserCount} users without farm associations`)
    }

    // Print Results
    console.log('\n' + '='.repeat(60))
    console.log('📊 SYSTEM INTEGRITY REPORT')
    console.log('='.repeat(60))

    if (issues.length === 0) {
      console.log('🎉 ALL CHECKS PASSED! System integrity is EXCELLENT!')
    } else {
      console.log(`🚨 FOUND ${issues.length} ISSUES:`)
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ❌ ${issue}`)
      })
    }

    if (successes.length > 0) {
      console.log(`\n✅ ${successes.length} SUCCESSFUL CHECKS:`)
      successes.forEach((success, i) => {
        console.log(`   ${i + 1}. ✅ ${success}`)
      })
    }

    console.log('\n📈 SYSTEM SUMMARY:')
    console.log(`   Farms: ${farms.length}`)
    console.log(`   Total Users: ${allUsers.length}`)
    console.log(`   System Admins: ${systemAdmins.length}`)

    if (issues.length === 0) {
      console.log('\n🎯 RESULT: SYSTEM IS READY FOR USE! 🚀')
    } else {
      console.log('\n⚠️ RESULT: ISSUES NEED ATTENTION')
    }
  } catch (error) {
    log(`❌ System integrity check failed: ${error.message}`, 'error')
    throw error
  }
}

/**
 * List users - enhanced user listing functionality
 */
async function listUsers(cmdOptions = {}) {
  log('👥 Listing system users...')

  try {
    let whereClause = {}

    if (cmdOptions.activeOnly) {
      whereClause.isActive = true
    }

    if (cmdOptions.systemAdminOnly) {
      whereClause.is_system_admin = true
    }

    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        roles: true,
        isActive: true,
        is_system_admin: true,
        system_role: true,
        createdAt: true,
      },
      orderBy: { email: 'asc' },
    })

    if (users.length === 0) {
      log('No users found matching criteria', 'warning')
      return
    }

    console.log('\n📋 USER LISTING')
    console.log('='.repeat(80))
    console.log(`Found ${users.length} user(s)\n`)

    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email}`)
      console.log(`   Name: ${user.firstName} ${user.lastName}`)
      console.log(`   Department: ${user.department || 'N/A'}`)
      console.log(`   Position: ${user.position || 'N/A'}`)
      console.log(`   Roles: ${user.roles || 'N/A'}`)
      console.log(`   Active: ${user.isActive ? '✅' : '❌'}`)
      console.log(`   System Admin: ${user.is_system_admin ? '✅' : '❌'}`)
      if (user.is_system_admin) {
        console.log(`   System Role: ${user.system_role || 'N/A'}`)
      }
      console.log(
        `   Created: ${user.createdAt?.toISOString().split('T')[0] || 'N/A'}`
      )
      console.log('')
    })
  } catch (error) {
    log(`❌ Error listing users: ${error.message}`, 'error')
    throw error
  }
}

// Main execution
async function main() {
  try {
    await program.parseAsync(process.argv)
  } catch (error) {
    log(`Operation failed: ${error.message}`, 'error')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Export for use by other scripts
module.exports = {
  completeSystemSetup,
  createSystemAdmin,
  resetAdminPassword,
  fixUserAssociations,
  verifySystemIntegrity,
  listUsers,
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}
