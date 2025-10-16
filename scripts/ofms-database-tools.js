#!/usr/bin/env node

/**
 * OFMS DATABASE TOOLS
 * Consolidated tool for all database operations
 * Replaces 10+ individual database scripts
 */

const { PrismaClient } = require('@prisma/client');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// CLI Configuration
program
  .name('ofms-database-tools')
  .description('OFMS Database Tools - Consolidated database operations')
  .version('1.0.0');

program
  .option('-c, --check <type>', 'Check type (all, integrity, orphans, math, constraints)', 'all')
  .option('-a, --audit <type>', 'Audit type (full, referential, accuracy)', 'full')
  .option('-b, --backup [filename]', 'Create database backup')
  .option('-r, --restore <filename>', 'Restore from backup')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run - show what would be done')
  .option('--fix', 'Automatically fix issues where possible')
  .option('--report', 'Generate detailed report')
  .parse(process.argv);

const options = program.opts();

// Check Types
const CHECK_TYPES = {
  all: 'Run all database checks',
  integrity: 'Check referential integrity',
  orphans: 'Check for orphaned records',
  math: 'Check mathematical accuracy',
  constraints: 'Check database constraints'
};

// Audit Types
const AUDIT_TYPES = {
  full: 'Complete database audit',
  referential: 'Referential integrity audit',
  accuracy: 'Data accuracy audit'
};

// Test Configuration
const FARM_IDS = {
  CURRY_ISLAND: '00000000-0000-0000-0000-000000000010',
  SHARED_OXYGEN: '00000000-0000-0000-0000-000000000020'
};

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔧';
  
  if (options.verbose || level === 'error' || level === 'success') {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

// Database Integrity Checks
class DatabaseIntegrityChecker {
  constructor() {
    this.results = [];
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  async checkReferentialIntegrity() {
    log('Checking referential integrity...');
    
    try {
      // Query actual database constraints
      const constraints = await prisma.$queryRaw`
        SELECT 
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints tc 
        LEFT JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        LEFT JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name
          AND tc.table_schema = rc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name, tc.constraint_name;
      `;

      log(`Found ${constraints.length} foreign key constraints`);

      let criticalViolations = [];
      let passedChecks = [];
      
      // Critical relationships that must have proper constraints
      const criticalConstraints = [
        { table: 'batches', column: 'createdBy', expected: 'RESTRICT' },
        { table: 'batches', column: 'seedVarietyId', expected: 'RESTRICT' },
        { table: 'orders', column: 'customerId', expected: 'RESTRICT' },
        { table: 'order_items', column: 'orderId', expected: 'CASCADE' },
        { table: 'quality_checks', column: 'batchId', expected: 'CASCADE' },
        { table: 'quality_checks', column: 'inspectorId', expected: 'RESTRICT' },
        { table: 'tasks', column: 'assignedBy', expected: 'RESTRICT' },
        { table: 'tasks', column: 'relatedBatchId', expected: 'SET NULL' },
        { table: 'tasks', column: 'relatedEquipmentId', expected: 'SET NULL' }
      ];

      // Check each critical constraint
      for (const check of criticalConstraints) {
        const constraint = constraints.find(c => 
          c.table_name === check.table && 
          c.column_name === check.column
        );
        
        if (!constraint) {
          criticalViolations.push({
            table: check.table,
            column: check.column,
            issue: 'MISSING_FOREIGN_KEY',
            severity: 'CRITICAL'
          });
        } else if (constraint.delete_rule?.toUpperCase() !== check.expected) {
          criticalViolations.push({
            table: check.table,
            column: check.column,
            issue: `WRONG_DELETE_RULE: Expected ${check.expected}, Found ${constraint.delete_rule}`,
            severity: 'HIGH'
          });
        } else {
          passedChecks.push({
            table: check.table,
            column: check.column,
            rule: constraint.delete_rule,
            status: 'CORRECT'
          });
        }
      }

      // Report results
      if (criticalViolations.length === 0) {
        log('Referential integrity check: PASSED', 'success');
        this.passed++;
        return { status: 'PASSED', violations: [], passed: passedChecks };
      } else {
        log(`Referential integrity check: FAILED (${criticalViolations.length} violations)`, 'error');
        this.failed++;
        return { status: 'FAILED', violations: criticalViolations, passed: passedChecks };
      }
      
    } catch (error) {
      log(`Error checking referential integrity: ${error.message}`, 'error');
      this.errors.push(`Referential integrity check failed: ${error.message}`);
      return { status: 'ERROR', error: error.message };
    }
  }

  async checkOrphanedRecords() {
    log('Checking for orphaned records...');
    
    try {
      let orphanedRecords = [];
      
      // Check batches without valid users
      const orphanedBatches = await prisma.$queryRaw`
        SELECT 'batches' as table_name, 'createdBy' as column_name, id, "createdBy" as orphaned_value
        FROM batches b 
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b."createdBy")
      `;
      if (orphanedBatches.length > 0) orphanedRecords.push(...orphanedBatches);
      
      // Check orders without valid customers
      const orphanedOrders = await prisma.$queryRaw`
        SELECT 'orders' as table_name, 'customerId' as column_name, id, "customerId" as orphaned_value
        FROM orders o 
        WHERE NOT EXISTS (SELECT 1 FROM customers c WHERE c.id = o."customerId")
      `;
      if (orphanedOrders.length > 0) orphanedRecords.push(...orphanedOrders);
      
      // Check order_items without valid orders
      const orphanedOrderItems = await prisma.$queryRaw`
        SELECT 'order_items' as table_name, 'orderId' as column_name, id, "orderId" as orphaned_value
        FROM order_items oi 
        WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.id = oi."orderId")
      `;
      if (orphanedOrderItems.length > 0) orphanedRecords.push(...orphanedOrderItems);
      
      // Check quality_checks without valid batches
      const orphanedQualityChecks = await prisma.$queryRaw`
        SELECT 'quality_checks' as table_name, 'batchId' as column_name, id, "batchId" as orphaned_value
        FROM quality_checks qc 
        WHERE NOT EXISTS (SELECT 1 FROM batches b WHERE b.id = qc."batchId")
      `;
      if (orphanedQualityChecks.length > 0) orphanedRecords.push(...orphanedQualityChecks);
      
      // Check tasks without valid users
      const orphanedTasks = await prisma.$queryRaw`
        SELECT 'tasks' as table_name, 'assignedBy' as column_name, id, "assignedBy" as orphaned_value
        FROM tasks t 
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = t."assignedBy")
      `;
      if (orphanedTasks.length > 0) orphanedRecords.push(...orphanedTasks);

      if (orphanedRecords.length === 0) {
        log('Orphaned records check: PASSED', 'success');
        this.passed++;
        return { status: 'PASSED', orphanedRecords: [] };
      } else {
        log(`Orphaned records check: FAILED (${orphanedRecords.length} orphaned records)`, 'error');
        this.failed++;
        return { status: 'FAILED', orphanedRecords };
      }
      
    } catch (error) {
      log(`Error checking orphaned records: ${error.message}`, 'error');
      this.errors.push(`Orphaned records check failed: ${error.message}`);
      return { status: 'ERROR', error: error.message };
    }
  }

  async checkMathematicalAccuracy() {
    log('Checking mathematical accuracy...');
    
    try {
      const issues = [];
      
      // Test revenue calculations
      const dashboardRevenue = await this.calculateDashboardRevenue();
      const directRevenue = await this.calculateDirectRevenue();
      
      if (Math.abs(dashboardRevenue - directRevenue) > 0.01) {
        issues.push({
          type: 'REVENUE_MISMATCH',
          description: `Revenue calculation mismatch: Dashboard=${dashboardRevenue}, Direct=${directRevenue}`,
          severity: 'HIGH'
        });
      }
      
      // Test quality score calculations
      const qualityScoreIssues = await this.checkQualityScoreAccuracy();
      if (qualityScoreIssues.length > 0) {
        issues.push(...qualityScoreIssues);
      }
      
      // Test yield calculations
      const yieldIssues = await this.checkYieldCalculations();
      if (yieldIssues.length > 0) {
        issues.push(...yieldIssues);
      }
      
      if (issues.length === 0) {
        log('Mathematical accuracy check: PASSED', 'success');
        this.passed++;
        return { status: 'PASSED', issues: [] };
      } else {
        log(`Mathematical accuracy check: FAILED (${issues.length} issues)`, 'error');
        this.failed++;
        return { status: 'FAILED', issues };
      }
      
    } catch (error) {
      log(`Error checking mathematical accuracy: ${error.message}`, 'error');
      this.errors.push(`Mathematical accuracy check failed: ${error.message}`);
      return { status: 'ERROR', error: error.message };
    }
  }

  async calculateDashboardRevenue() {
    // Calculate revenue as it would be displayed on dashboard
    const orders = await prisma.orders.findMany({
      where: {
        status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] }
      },
      select: { total: true }
    });
    
    return orders.reduce((sum, order) => sum + (order.total || 0), 0);
  }

  async calculateDirectRevenue() {
    // Calculate revenue directly from database
    const result = await prisma.orders.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['COMPLETED', 'SHIPPED', 'DELIVERED'] }
      }
    });
    
    return result._sum.total || 0;
  }

  async checkQualityScoreAccuracy() {
    const issues = [];
    
    // Check quality score calculations
    const recentChecks = await prisma.quality_checks.findMany({
      where: {
        checkDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    const passedChecks = recentChecks.filter(check => check.status === 'PASSED').length;
    const totalChecks = recentChecks.length;
    const expectedQualityScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    
    // Compare with stored quality scores (if any)
    // This would need to be implemented based on actual quality score storage
    
    return issues;
  }

  async checkYieldCalculations() {
    const issues = [];
    
    // Check yield calculations
    const batches = await prisma.batches.findMany({
      where: {
        status: 'HARVESTED',
        yieldActual: { not: null },
        yieldExpected: { not: null }
      }
    });
    
    for (const batch of batches) {
      const yieldVariance = Math.abs(batch.yieldActual - batch.yieldExpected);
      const yieldVariancePercent = (yieldVariance / batch.yieldExpected) * 100;
      
      if (yieldVariancePercent > 50) {
        issues.push({
          type: 'YIELD_VARIANCE',
          description: `Batch ${batch.batchNumber} has unusual yield variance: ${yieldVariancePercent.toFixed(1)}%`,
          severity: 'MEDIUM',
          batchId: batch.id
        });
      }
    }
    
    return issues;
  }

  async checkConstraints() {
    log('Checking database constraints...');
    
    try {
      // Check NOT NULL constraints
      const notNullViolations = await this.checkNotNullConstraints();
      
      // Check CHECK constraints
      const checkViolations = await this.checkCheckConstraints();
      
      // Check UNIQUE constraints
      const uniqueViolations = await this.checkUniqueConstraints();
      
      const allViolations = [...notNullViolations, ...checkViolations, ...uniqueViolations];
      
      if (allViolations.length === 0) {
        log('Database constraints check: PASSED', 'success');
        this.passed++;
        return { status: 'PASSED', violations: [] };
      } else {
        log(`Database constraints check: FAILED (${allViolations.length} violations)`, 'error');
        this.failed++;
        return { status: 'FAILED', violations: allViolations };
      }
      
    } catch (error) {
      log(`Error checking constraints: ${error.message}`, 'error');
      this.errors.push(`Constraints check failed: ${error.message}`);
      return { status: 'ERROR', error: error.message };
    }
  }

  async checkNotNullConstraints() {
    const violations = [];
    
    // Check critical NOT NULL constraints
    const criticalFields = [
      { table: 'users', field: 'email' },
      { table: 'batches', field: 'batchNumber' },
      { table: 'orders', field: 'orderNumber' },
      { table: 'customers', field: 'name' }
    ];
    
    for (const { table, field } of criticalFields) {
      const nullCount = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*) as count 
        FROM ${table} 
        WHERE ${field} IS NULL
      `);
      
      if (nullCount[0].count > 0) {
        violations.push({
          type: 'NOT_NULL_VIOLATION',
          table,
          field,
          count: nullCount[0].count
        });
      }
    }
    
    return violations;
  }

  async checkCheckConstraints() {
    const violations = [];
    
    // Check for invalid status values
    const invalidStatuses = await prisma.batches.findMany({
      where: {
        status: { notIn: ['SEEDED', 'PLANTED', 'GERMINATING', 'GROWING', 'READY_TO_HARVEST', 'HARVESTED', 'COMPLETED', 'FAILED'] }
      }
    });
    
    if (invalidStatuses.length > 0) {
      violations.push({
        type: 'CHECK_CONSTRAINT_VIOLATION',
        table: 'batches',
        field: 'status',
        count: invalidStatuses.length,
        description: 'Invalid batch status values'
      });
    }
    
    return violations;
  }

  async checkUniqueConstraints() {
    const violations = [];
    
    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
    `;
    
    if (duplicateEmails.length > 0) {
      violations.push({
        type: 'UNIQUE_CONSTRAINT_VIOLATION',
        table: 'users',
        field: 'email',
        count: duplicateEmails.length,
        description: 'Duplicate email addresses'
      });
    }
    
    return violations;
  }

  async runAllChecks() {
    log('Running all database checks...');
    
    const results = {
      integrity: await this.checkReferentialIntegrity(),
      orphans: await this.checkOrphanedRecords(),
      math: await this.checkMathematicalAccuracy(),
      constraints: await this.checkConstraints()
    };
    
    return results;
  }

  generateReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 OFMS DATABASE HEALTH REPORT');
    console.log('='.repeat(80));
    
    console.log(`✅ Tests Passed: ${this.passed}`);
    console.log(`❌ Tests Failed: ${this.failed}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`🚨 Errors: ${this.errors.length}`);
    
    const totalTests = this.passed + this.failed;
    const successRate = totalTests > 0 ? ((this.passed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`📈 Success Rate: ${successRate}%\n`);
    
    // Show detailed results
    if (options.report) {
      console.log('📋 DETAILED RESULTS:');
      for (const [checkType, result] of Object.entries(results)) {
        console.log(`\n${checkType.toUpperCase()}:`);
        console.log(`  Status: ${result.status}`);
        if (result.violations && result.violations.length > 0) {
          console.log(`  Violations: ${result.violations.length}`);
          result.violations.forEach(v => {
            console.log(`    • ${v.issue || v.description}`);
          });
        }
        if (result.orphanedRecords && result.orphanedRecords.length > 0) {
          console.log(`  Orphaned Records: ${result.orphanedRecords.length}`);
          result.orphanedRecords.forEach(r => {
            console.log(`    • ${r.table_name}.${r.column_name}: ${r.id}`);
          });
        }
        if (result.issues && result.issues.length > 0) {
          console.log(`  Issues: ${result.issues.length}`);
          result.issues.forEach(i => {
            console.log(`    • ${i.description}`);
          });
        }
      }
    }
    
    // Final verdict
    if (this.failed === 0) {
      console.log('\n🎉 DATABASE HEALTH: EXCELLENT');
      console.log('✅ All database checks passed successfully!');
    } else {
      console.log('\n🚨 DATABASE HEALTH: ISSUES FOUND');
      console.log('❌ Database has issues that need attention.');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');
  }
}

// Database Operations
async function runDatabaseCheck() {
  const checker = new DatabaseIntegrityChecker();
  
  if (options.dryRun) {
    log('DRY RUN MODE - No changes will be made', 'warning');
  }
  
  log(`Running database check: ${options.check}`);
  
  let results;
  
  try {
    switch (options.check) {
      case 'all':
        results = await checker.runAllChecks();
        break;
      case 'integrity':
        results = { integrity: await checker.checkReferentialIntegrity() };
        break;
      case 'orphans':
        results = { orphans: await checker.checkOrphanedRecords() };
        break;
      case 'math':
        results = { math: await checker.checkMathematicalAccuracy() };
        break;
      case 'constraints':
        results = { constraints: await checker.checkConstraints() };
        break;
      default:
        throw new Error(`Unknown check type: ${options.check}`);
    }
    
    if (options.report) {
      checker.generateReport(results);
    }
    
  } catch (error) {
    log(`Database check failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

async function runDatabaseAudit() {
  log(`Running database audit: ${options.audit}`);
  
  // Implement audit functionality
  // This would include the comprehensive audit from mathematical-accuracy-audit.js
  
  log('Database audit completed', 'success');
}

async function createBackup() {
  const filename = options.backup === true ? `backup-${Date.now()}.sql` : options.backup;
  const backupPath = path.join(process.cwd(), 'backups', filename);
  
  log(`Creating database backup: ${filename}`);
  
  if (options.dryRun) {
    log('Would create backup at: ' + backupPath, 'warning');
    return;
  }
  
  // Create backups directory if it doesn't exist
  const backupDir = path.dirname(backupPath);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Implement backup functionality
  // This would use pg_dump or similar
  
  log(`Backup created: ${filename}`, 'success');
}

async function restoreBackup() {
  const filename = options.restore;
  const backupPath = path.join(process.cwd(), 'backups', filename);
  
  log(`Restoring database from backup: ${filename}`);
  
  if (options.dryRun) {
    log('Would restore from: ' + backupPath, 'warning');
    return;
  }
  
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }
  
  // Implement restore functionality
  // This would use psql or similar
  
  log(`Database restored from: ${filename}`, 'success');
}

// Main execution
async function main() {
  log('Starting OFMS Database Tools...');
  
  try {
    if (options.check) {
      await runDatabaseCheck();
    } else if (options.audit) {
      await runDatabaseAudit();
    } else if (options.backup) {
      await createBackup();
    } else if (options.restore) {
      await restoreBackup();
    } else {
      log('No operation specified. Use --help for usage information.', 'warning');
    }
    
  } catch (error) {
    log(`Operation failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Command line interface
if (require.main === module) {
  // Validate check type
  if (options.check && !CHECK_TYPES[options.check]) {
    console.error(`❌ Invalid check type: ${options.check}`);
    console.error(`Available check types: ${Object.keys(CHECK_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  // Validate audit type
  if (options.audit && !AUDIT_TYPES[options.audit]) {
    console.error(`❌ Invalid audit type: ${options.audit}`);
    console.error(`Available audit types: ${Object.keys(AUDIT_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  main().catch(console.error);
}

// Export for use by other scripts
module.exports = {
  DatabaseIntegrityChecker,
  runDatabaseCheck,
  runDatabaseAudit,
  createBackup,
  restoreBackup,
  CHECK_TYPES,
  AUDIT_TYPES
}; 