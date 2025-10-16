#!/usr/bin/env node

/**
 * OFMS DATA MANAGER
 * Unified entrypoint orchestrating data generation, loading, and real-data seeding
 *
 * Reuses existing modules to avoid duplication:
 * - ofms-data-generator.js
 * - ofms-data-loader.js
 * - ofms-data-seeder.js (current dataset)
 * - ofms-real-data-seeder.js (Prisma live extract)
 * - ofms-sql-data-seeder.js (SQL live extract)
 */

const { program } = require('commander')

// Lazy requires to avoid loading heavy modules for --help
function getGenerator() {
  // Existing consolidated generator
  return require('./ofms-data-generator')
}

function getLoader() {
  // Existing consolidated data loader
  return require('./ofms-data-loader')
}

function getCurrentSeeder() {
  // Current operational dataset seeder
  return require('./ofms-data-seeder')
}

function getRealSeeder() {
  // Prisma-based real data extractor/loader
  return require('./ofms-real-data-seeder')
}

function getSqlSeeder() {
  // SQL-based real data extractor/loader
  return require('./ofms-sql-data-seeder')
}

program
  .name('ofms-data-manager')
  .description(
    'OFMS Data Manager - Orchestrate data generation, loading, and seeding'
  )
  .version('1.0.0')

program
  .command('generate')
  .description('Generate demo or synthetic datasets')
  .option(
    '-m, --mode <mode>',
    'Generation mode (demo|comprehensive|ai-showcase|production|testing)',
    'demo'
  )
  .option(
    '-f, --farm-type <type>',
    'Farm type (microgreens|cannabis|hydroponic|vertical|mixed)',
    'microgreens'
  )
  .option('-s, --size <size>', 'Data size (small|medium|large)', 'medium')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run')
  .option('--reset', 'Reset database before generation')
  .action(async opts => {
    const gen = getGenerator()
    // Reuse the generator CLI by setting process.argv options and invoking exported function if available
    if (typeof gen.generateData === 'function') {
      // The generator reads its own Commander options, so recommend running it directly
      // For convenience, we spawn a child process
      const { exec } = require('child_process')
      const args = [
        `--mode=${opts.mode}`,
        `--farm-type=${opts.farmType || opts.farm_type || opts.farmType}`,
        `--size=${opts.size}`,
        opts.verbose ? '--verbose' : '',
        opts.dryRun ? '--dry-run' : '',
        opts.reset ? '--reset' : '',
      ]
        .filter(Boolean)
        .join(' ')
      const cmd = `node ${__dirname}/ofms-data-generator.js ${args}`
      exec(cmd, { stdio: 'inherit' }, (err, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout)
        if (stderr) process.stderr.write(stderr)
        if (err) process.exit(1)
      })
    } else {
      console.error(
        'ofms-data-generator.js missing generateData export; run it directly instead.'
      )
      process.exit(1)
    }
  })

program
  .command('load')
  .description('Load synthesized data into a target farm')
  .option(
    '-l, --type <type>',
    'Load type (seeds|customers|inventory|orders|economics|all)',
    'all'
  )
  .option('-f, --farm-id <id>', 'Target farm ID')
  .option('-s, --size <size>', 'Data size (small|medium|large)', 'medium')
  .option('-r, --reset', 'Reset before loading')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run')
  .action(async opts => {
    // Defer to existing loader CLI for consistency
    const { exec } = require('child_process')
    const args = [
      `--load=${opts.type}`,
      opts.farmId ? `--farm-id=${opts.farmId}` : '',
      `--size=${opts.size}`,
      opts.reset ? '--reset' : '',
      opts.verbose ? '--verbose' : '',
      opts.dryRun ? '--dry-run' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const cmd = `node ${__dirname}/ofms-data-loader.js ${args}`
    exec(cmd, { stdio: 'inherit' }, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      if (err) process.exit(1)
    })
  })

program
  .command('seed')
  .description('Seed database with current or real operational data')
  .option('-s, --source <source>', 'Source (current|real|sql)', 'current')
  .option('-r, --reset', 'Reset target before seeding')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run')
  .option('--source-db <url>', 'Source DB URL (for real/sql modes)')
  .option('--target-db <url>', 'Target DB URL (defaults to DATABASE_URL)')
  .action(async opts => {
    const source = (opts.source || 'current').toLowerCase()
    if (source === 'current') {
      const seeder = getCurrentSeeder()
      if (typeof seeder.seedDatabase === 'function') {
        await seeder.seedDatabase()
      } else {
        // Fall back to running the script directly
        const { exec } = require('child_process')
        const args = [
          opts.reset ? '--reset' : '',
          opts.verbose ? '--verbose' : '',
          opts.dryRun ? '--dry-run' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const cmd = `node ${__dirname}/ofms-data-seeder.js ${args}`
        exec(cmd, { stdio: 'inherit' }, (err, stdout, stderr) => {
          if (stdout) process.stdout.write(stdout)
          if (stderr) process.stderr.write(stderr)
          if (err) process.exit(1)
        })
      }
      return
    }

    if (source === 'real') {
      const { exec } = require('child_process')
      const args = [
        opts.reset ? '--reset' : '',
        opts.verbose ? '--verbose' : '',
        opts.dryRun ? '--dry-run' : '',
        opts.sourceDb ? `--source-db="${opts.sourceDb}"` : '',
        opts.targetDb ? `--target-db="${opts.targetDb}"` : '',
      ]
        .filter(Boolean)
        .join(' ')
      const cmd = `node ${__dirname}/ofms-real-data-seeder.js ${args}`
      exec(cmd, { stdio: 'inherit' }, (err, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout)
        if (stderr) process.stderr.write(stderr)
        if (err) process.exit(1)
      })
      return
    }

    if (source === 'sql') {
      const { exec } = require('child_process')
      const args = [
        opts.reset ? '--reset' : '',
        opts.verbose ? '--verbose' : '',
        opts.dryRun ? '--dry-run' : '',
        opts.targetDb ? `--target-db="${opts.targetDb}"` : '',
      ]
        .filter(Boolean)
        .join(' ')
      const cmd = `node ${__dirname}/ofms-sql-data-seeder.js ${args}`
      exec(cmd, { stdio: 'inherit' }, (err, stdout, stderr) => {
        if (stdout) process.stdout.write(stdout)
        if (stderr) process.stderr.write(stderr)
        if (err) process.exit(1)
      })
      return
    }

    console.error(
      `❌ Invalid seed source: ${opts.source}. Use current|real|sql`
    )
    process.exit(1)
  })

program.parseAsync(process.argv)
