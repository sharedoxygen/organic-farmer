#!/usr/bin/env node

/**
 * OFMS Scripts Cleanup Tool
 * Implements the consolidation and elimination plan from the audit report
 */

const fs = require('fs')
const path = require('path')
const { program } = require('commander')

program
  .name('cleanup-scripts')
  .description('Clean up scripts directory according to audit recommendations')
  .version('1.0.0')

program
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-v, --verbose', 'Verbose output')
  .option('--force', 'Force operations without confirmation')
  .parse(process.argv)

const options = program.opts()

// Scripts to archive (from audit report)
const SCRIPTS_TO_ARCHIVE = [
  'seed-cannabis-demo-corrected.sql',
  'seed-cannabis-demo.sql',
  'seed-cannabis-tasks-corrected.sql',
  'seed-cannabis-tasks.sql',
  'seed-microgreens-tasks-fixed.sql',
  'seed-microgreens-tasks.sql',
  'seed-microgreens-users.sql',
  'SQL/restore_comprehensive_seed_data.sql',
  'SQL/restore_seed_varieties_corrected.sql',
  'SQL/restore_shared_oxygen_varieties.sql',
  'SQL/safe_seed_restoration.sql',
  'SQL/shared_oxygen_safe_restoration.sql',
  'SQL/complete_seed_restoration.sql',
  'ofms-data-seeder.js',
  'test-seeder.js',
]

// Scripts to consolidate (from audit report)
const SCRIPTS_TO_CONSOLIDATE = [
  {
    name: 'ofms-admin-tools.js',
    replaces: [
      'complete-system-admin-setup.js',
      'setup-system-admin.js',
      'reset-admin-password.js',
      'fix-curry-island-users.js',
    ],
    status: 'created', // Already created above
  },
  {
    name: 'ofms-data-manager.js',
    replaces: [
      'ofms-data-loader.js',
      'ofms-real-data-seeder.js',
      'ofms-sql-data-seeder.js',
    ],
    status: 'pending',
  },
  {
    name: 'ofms-utilities.js',
    replaces: [
      'check-favicon.js',
      'generate-favicons.js',
      'list-users.js',
      'restore-users.js',
    ],
    status: 'pending',
  },
]

function log(message, level = 'info') {
  const emoji =
    level === 'error'
      ? '❌'
      : level === 'success'
        ? '✅'
        : level === 'warning'
          ? '⚠️'
          : '🔧'

  if (options.verbose || level === 'error' || level === 'success') {
    console.log(`${emoji} ${message}`)
  }
}

function confirmAction(message) {
  if (options.force) return true

  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function createArchiveDirectory() {
  const archiveDir = path.join(__dirname, 'archive')
  const archiveSqlDir = path.join(archiveDir, 'SQL')

  if (!fs.existsSync(archiveDir)) {
    log(`Creating archive directory: ${archiveDir}`)

    if (!options.dryRun) {
      fs.mkdirSync(archiveDir)
      fs.mkdirSync(archiveSqlDir)

      // Create README in archive
      const archiveReadme = `# Archived Scripts

This directory contains scripts that have been superseded by consolidated tools or are no longer needed.

## Consolidation Information

These scripts were archived as part of the scripts directory consolidation on ${new Date().toISOString().split('T')[0]}.

### Replaced by Consolidated Tools:
- Various seeder scripts → \`ofms-data-manager.js\`
- Admin scripts → \`ofms-admin-tools.js\`
- Utility scripts → \`ofms-utilities.js\`

### Legacy SQL Scripts:
- Multiple restoration scripts → \`complete_safe_seed_restoration.sql\`

For the current consolidated scripts, see the parent \`scripts/\` directory.

---
*Archived on: ${new Date().toISOString()}*
`

      fs.writeFileSync(path.join(archiveDir, 'README.md'), archiveReadme)
      log('Created archive directory with README', 'success')
    }
  } else {
    log('Archive directory already exists')
  }
}

async function archiveObsoleteScripts() {
  log(`📦 Archiving ${SCRIPTS_TO_ARCHIVE.length} obsolete scripts...`)

  const confirmed = await confirmAction(
    `⚠️  This will move ${SCRIPTS_TO_ARCHIVE.length} scripts to archive/`
  )
  if (!confirmed && !options.force) {
    log('Archive operation cancelled', 'warning')
    return
  }

  let archivedCount = 0
  let notFoundCount = 0

  for (const scriptPath of SCRIPTS_TO_ARCHIVE) {
    const fullPath = path.join(__dirname, scriptPath)
    const archivePath = path.join(__dirname, 'archive', scriptPath)

    if (fs.existsSync(fullPath)) {
      log(`Moving: ${scriptPath}`)

      if (!options.dryRun) {
        // Ensure archive subdirectory exists
        const archiveSubDir = path.dirname(archivePath)
        if (!fs.existsSync(archiveSubDir)) {
          fs.mkdirSync(archiveSubDir, { recursive: true })
        }

        fs.renameSync(fullPath, archivePath)
      }

      archivedCount++
    } else {
      log(`Not found: ${scriptPath}`, 'warning')
      notFoundCount++
    }
  }

  log(`✅ Archived ${archivedCount} scripts`, 'success')
  if (notFoundCount > 0) {
    log(
      `⚠️  ${notFoundCount} scripts not found (may already be archived)`,
      'warning'
    )
  }
}

async function reportConsolidationStatus() {
  log('\n📊 CONSOLIDATION STATUS REPORT')
  log('='.repeat(50))

  for (const consolidation of SCRIPTS_TO_CONSOLIDATE) {
    const consolidatedPath = path.join(__dirname, consolidation.name)
    const exists = fs.existsSync(consolidatedPath)

    console.log(`\n🎯 ${consolidation.name}`)
    console.log(`   Status: ${exists ? '✅ Created' : '❌ Pending'}`)
    console.log(`   Replaces ${consolidation.replaces.length} scripts:`)

    for (const replaced of consolidation.replaces) {
      const replacedPath = path.join(__dirname, replaced)
      const stillExists = fs.existsSync(replacedPath)
      console.log(
        `     ${stillExists ? '📄' : '📦'} ${replaced} ${stillExists ? '' : '(archived)'}`
      )
    }
  }
}

async function generateMigrationGuide() {
  const migrationGuide = `# Scripts Migration Guide

This guide helps developers transition to the new consolidated scripts after the cleanup.

## Consolidated Command Mapping

### Admin Operations
\`\`\`bash
# OLD COMMANDS:
node scripts/complete-system-admin-setup.js
node scripts/setup-system-admin.js
node scripts/reset-admin-password.js
node scripts/fix-curry-island-users.js

# NEW COMMANDS:
node scripts/ofms-admin-tools.js setup           # Complete setup
node scripts/ofms-admin-tools.js create-admin    # Create admin
node scripts/ofms-admin-tools.js reset-password  # Reset password  
node scripts/ofms-admin-tools.js fix-users       # Fix associations
node scripts/ofms-admin-tools.js verify          # Verify system
node scripts/ofms-admin-tools.js list-users      # List all users
\`\`\`

### Data Operations  
\`\`\`bash
# OLD COMMANDS:
node scripts/ofms-data-seeder.js
node scripts/ofms-real-data-seeder.js
node scripts/ofms-sql-data-seeder.js
node scripts/test-seeder.js

# NEW COMMANDS:
node scripts/ofms-data-manager.js seed --mode=demo
node scripts/ofms-data-manager.js seed --mode=real  
node scripts/ofms-data-manager.js load --type=customers
node scripts/ofms-data-manager.js generate --size=large
\`\`\`

### Utility Operations
\`\`\`bash  
# OLD COMMANDS:
node scripts/check-favicon.js
node scripts/generate-favicons.js
node scripts/list-users.js
node scripts/restore-users.js

# NEW COMMANDS:
node scripts/ofms-utilities.js check-favicon
node scripts/ofms-utilities.js generate-favicon  
node scripts/ofms-admin-tools.js list-users      # Moved to admin tools
node scripts/ofms-utilities.js restore-users
\`\`\`

## Unchanged Scripts
These scripts remain available without changes:
- \`ofms-database-tools.js\` - Database operations
- \`ofms-quality-checker.js\` - Quality assurance  
- \`check-system-integrity.js\` - System integrity
- \`dev-instances.sh\` - Development workflow
- \`db-setup.sh\` - Database setup
- \`db-clone.sh\` - Database cloning

## Migration Timeline
1. **Immediate**: Use new consolidated scripts for new operations
2. **Week 1**: Update CI/CD pipelines and documentation
3. **Week 2**: Train team on new commands
4. **Week 3**: Archive old scripts (this cleanup process)

## Getting Help
All consolidated scripts support \`--help\` for detailed usage:
\`\`\`bash
node scripts/ofms-admin-tools.js --help
node scripts/ofms-data-manager.js --help  
node scripts/ofms-utilities.js --help
\`\`\`

---
*Generated on: ${new Date().toISOString()}*
`

  const guidePath = path.join(__dirname, 'MIGRATION_GUIDE.md')

  if (!options.dryRun) {
    fs.writeFileSync(guidePath, migrationGuide)
    log(`✅ Created migration guide: ${guidePath}`, 'success')
  } else {
    log(`Would create migration guide: ${guidePath}`, 'warning')
  }
}

async function main() {
  console.log('🧹 OFMS Scripts Cleanup Tool')
  console.log('=============================\n')

  if (options.dryRun) {
    log('DRY RUN MODE - No changes will be made', 'warning')
  }

  try {
    // Step 1: Create archive directory
    await createArchiveDirectory()

    // Step 2: Archive obsolete scripts
    await archiveObsoleteScripts()

    // Step 3: Report consolidation status
    await reportConsolidationStatus()

    // Step 4: Generate migration guide
    await generateMigrationGuide()

    console.log('\n🎉 CLEANUP COMPLETED!')
    console.log('=====================')
    console.log('✅ Obsolete scripts archived')
    console.log('✅ Migration guide created')
    console.log('✅ Consolidation status reported')

    if (!options.dryRun) {
      console.log('\n📋 Next Steps:')
      console.log('1. Review archived scripts in scripts/archive/')
      console.log(
        '2. Complete pending consolidations (ofms-data-manager.js, ofms-utilities.js)'
      )
      console.log('3. Update CI/CD pipelines with new script names')
      console.log('4. Share MIGRATION_GUIDE.md with development team')
    }
  } catch (error) {
    log(`❌ Cleanup failed: ${error.message}`, 'error')
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  archiveObsoleteScripts,
  reportConsolidationStatus,
  generateMigrationGuide,
}
