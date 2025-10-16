#!/usr/bin/env node

/**
 * OFMS UTILITIES
 * Consolidated utility commands (favicon management, simple user utilities)
 *
 * Reuses existing scripts to avoid duplication:
 * - check-favicon.js
 * - generate-favicons.js
 * - list-users.js (moved mostly to admin tools, keep passthrough)
 * - restore-users.js (passthrough)
 */

const { program } = require('commander')
const path = require('path')
const { exec } = require('child_process')

function run(script, args = '') {
  return new Promise((resolve, reject) => {
    const cmd = `node ${path.join(__dirname, script)} ${args}`
    exec(cmd, { stdio: 'inherit' }, (err, stdout, stderr) => {
      if (stdout) process.stdout.write(stdout)
      if (stderr) process.stderr.write(stderr)
      if (err) return reject(err)
      resolve(0)
    })
  })
}

program
  .name('ofms-utilities')
  .description('OFMS Utilities - Favicon and helper utilities')
  .version('1.0.0')

program
  .command('check-favicon')
  .description('Check presence and references of favicon files')
  .action(async () => {
    await run('check-favicon.js')
  })

program
  .command('generate-favicon')
  .description('Generate favicon assets and update manifest')
  .action(async () => {
    await run('generate-favicons.js')
  })

program
  .command('restore-users')
  .description('Restore predefined users (legacy helper)')
  .action(async () => {
    await run('restore-users.js')
  })

program.parseAsync(process.argv)
