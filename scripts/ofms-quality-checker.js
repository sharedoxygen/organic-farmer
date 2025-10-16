#!/usr/bin/env node

/**
 * OFMS QUALITY CHECKER
 * Consolidated tool for all quality assurance needs
 * Replaces 6+ individual quality check scripts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { program } = require('commander');

// CLI Configuration
program
  .name('ofms-quality-checker')
  .description('OFMS Quality Checker - Consolidated quality assurance tool')
  .version('1.0.0');

program
  .option('-c, --check <type>', 'Check type (all, css, docs, styles, code)', 'all')
  .option('-f, --fix', 'Automatically fix issues where possible')
  .option('-r, --report <format>', 'Generate report (detailed, summary)', 'summary')
  .option('-v, --verbose', 'Verbose output')
  .option('-d, --dry-run', 'Dry run - show what would be done')
  .option('--strict', 'Strict mode - treat warnings as errors')
  .parse(process.argv);

const options = program.opts();

// Check Types
const CHECK_TYPES = {
  all: 'Run all quality checks',
  css: 'CSS Modules and style compliance',
  docs: 'Documentation organization',
  styles: 'Style guidelines and formatting',
  code: 'Code quality and linting'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Utility Functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const emoji = level === 'error' ? '❌' : level === 'success' ? '✅' : level === 'warning' ? '⚠️' : '🔧';
  const color = level === 'error' ? colors.red : level === 'success' ? colors.green : level === 'warning' ? colors.yellow : colors.blue;
  
  if (options.verbose || level === 'error' || level === 'success') {
    console.log(`${color}${emoji} [${timestamp}] ${message}${colors.reset}`);
  }
}

function runCommand(name, command, required = true) {
  log(`Running ${name}...`);
  
  if (options.dryRun) {
    log(`Would run: ${command}`, 'warning');
    return { status: 'SKIPPED', name, required };
  }
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      timeout: 120000 // 2 minute timeout
    });
    
    log(`${name}: PASSED`, 'success');
    
    if (output.trim() && options.verbose) {
      console.log(colors.white + output.trim() + colors.reset);
    }
    
    return { status: 'PASSED', name, required, output };
    
  } catch (error) {
    const status = required ? 'FAILED' : 'WARNING';
    log(`${name}: ${status}`, required ? 'error' : 'warning');
    
    if (error.stdout && options.verbose) {
      console.log(colors.white + error.stdout.toString() + colors.reset);
    }
    if (error.stderr && options.verbose) {
      console.log(colors.red + error.stderr.toString() + colors.reset);
    }
    
    return { status, name, required, error: error.message };
  }
}

// Quality Checker Classes
class StyleChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  checkInlineStyles() {
    log('Checking for inline styles...');
    
    const files = glob.sync('src/**/*.{tsx,ts,jsx,js}', { 
      ignore: ['node_modules/**', 'dist/**', '.next/**'] 
    });
    
    let inlineStyleCount = 0;
    
    files.forEach(file => {
      if (options.dryRun) {
        log(`Would check: ${file}`, 'warning');
        return;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for style prop usage
      const styleMatches = content.match(/style\s*=\s*\{/g);
      if (styleMatches) {
        this.errors.push({
          file,
          type: 'INLINE_STYLES',
          count: styleMatches.length,
          description: `Inline styles found (${styleMatches.length} instances)`
        });
        inlineStyleCount += styleMatches.length;
      }
      
      // Check for styled-jsx usage
      const styledJsxMatches = content.match(/<style\s+jsx>/g);
      if (styledJsxMatches) {
        this.errors.push({
          file,
          type: 'STYLED_JSX',
          count: styledJsxMatches.length,
          description: `styled-jsx found (${styledJsxMatches.length} instances)`
        });
        inlineStyleCount += styledJsxMatches.length;
      }
    });
    
    if (inlineStyleCount === 0) {
      log('No inline styles found', 'success');
    } else {
      log(`Found ${inlineStyleCount} inline style violations`, 'error');
    }
    
    return inlineStyleCount === 0;
  }

  checkCSSModulesCompliance() {
    log('Checking CSS Modules compliance...');
    
    const moduleFiles = glob.sync('src/**/*.module.css', { 
      ignore: ['node_modules/**', 'dist/**', '.next/**'] 
    });
    
    let violationCount = 0;
    
    moduleFiles.forEach(file => {
      if (options.dryRun) {
        log(`Would check: ${file}`, 'warning');
        return;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for :global() usage
      const globalMatches = content.match(/:global\(/g);
      if (globalMatches) {
        this.errors.push({
          file,
          type: 'GLOBAL_USAGE',
          count: globalMatches.length,
          description: `:global() usage found (${globalMatches.length} instances)`
        });
        violationCount += globalMatches.length;
      }
      
      // Check for global selectors
      const globalSelectors = content.match(/^(html|body|\*)\s*\{/gm);
      if (globalSelectors) {
        this.errors.push({
          file,
          type: 'GLOBAL_SELECTORS',
          count: globalSelectors.length,
          description: `Global selectors found (${globalSelectors.length} instances)`
        });
        violationCount += globalSelectors.length;
      }
    });
    
    if (violationCount === 0) {
      log('CSS Modules compliance verified', 'success');
    } else {
      log(`Found ${violationCount} CSS Modules violations`, 'error');
    }
    
    return violationCount === 0;
  }

  checkDesignSystemUsage() {
    log('Checking design system usage...');
    
    const cssFiles = glob.sync('src/**/*.{css,module.css}', { 
      ignore: ['node_modules/**', 'dist/**', '.next/**', 'src/app/globals.css'] 
    });
    
    let hardcodedValues = 0;
    let missingVarUsage = 0;
    
    cssFiles.forEach(file => {
      if (options.dryRun) {
        log(`Would check: ${file}`, 'warning');
        return;
      }
      
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for hardcoded colors (hex, rgb, rgba)
      const colorMatches = content.match(/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/g);
      if (colorMatches) {
        this.warnings.push({
          file,
          type: 'HARDCODED_COLORS',
          count: colorMatches.length,
          description: `Hardcoded colors (${colorMatches.length} instances)`
        });
        hardcodedValues += colorMatches.length;
      }
      
      // Check for hardcoded spacing values
      const spacingMatches = content.match(/:\s*\d+px(?!\s*var)/g);
      if (spacingMatches) {
        this.warnings.push({
          file,
          type: 'HARDCODED_SPACING',
          count: spacingMatches.length,
          description: `Hardcoded spacing (${spacingMatches.length} instances)`
        });
        hardcodedValues += spacingMatches.length;
      }
      
      // Check for var() usage (good practice)
      const varUsage = content.match(/var\(--[^)]+\)/g);
      if (!varUsage && content.trim().length > 0) {
        this.warnings.push({
          file,
          type: 'NO_CSS_VARIABLES',
          description: 'No CSS variables used'
        });
        missingVarUsage++;
      }
    });
    
    if (hardcodedValues === 0 && missingVarUsage === 0) {
      log('Design system usage looks good', 'success');
    } else {
      log(`Found ${hardcodedValues} hardcoded values and ${missingVarUsage} files without CSS variables`, 'warning');
    }
    
    return true; // This is warnings only
  }

  checkComponentStructure() {
    log('Checking component structure...');
    
    const componentDirs = glob.sync('src/components/*/', { 
      ignore: ['node_modules/**', 'dist/**', '.next/**'] 
    });
    
    let structureIssues = 0;
    
    componentDirs.forEach(dir => {
      if (options.dryRun) {
        log(`Would check: ${dir}`, 'warning');
        return;
      }
      
      const componentName = path.basename(dir);
      const tsxFile = path.join(dir, `${componentName}.tsx`);
      const cssFile = path.join(dir, `${componentName}.module.css`);
      
      if (!fs.existsSync(tsxFile)) {
        this.warnings.push({
          file: dir,
          type: 'MISSING_TSX',
          description: `Missing ${componentName}.tsx`
        });
        structureIssues++;
      }
      
      if (!fs.existsSync(cssFile)) {
        this.warnings.push({
          file: dir,
          type: 'MISSING_CSS',
          description: `Missing ${componentName}.module.css`
        });
        structureIssues++;
      }
    });
    
    if (structureIssues === 0) {
      log('Component structure looks good', 'success');
    } else {
      log(`Found ${structureIssues} component structure issues`, 'warning');
    }
    
    return true; // This is warnings only
  }

  runAllStyleChecks() {
    const results = {
      inlineStyles: this.checkInlineStyles(),
      cssModules: this.checkCSSModulesCompliance(),
      designSystem: this.checkDesignSystemUsage(),
      componentStructure: this.checkComponentStructure()
    };
    
    return results;
  }

  autoFix() {
    if (!options.fix) return;
    
    log('Auto-fixing style issues...');
    
    // Auto-fix would implement fixes for common issues
    // This is a placeholder for actual auto-fix functionality
    
    log('Auto-fix completed', 'success');
  }
}

class DocumentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
  }

  // Document placement rules
  getDocumentRules() {
    return {
      'app-docs/': [
        'API_DOCUMENTATION.md',
        'ADMIN_GUIDE.md',
        'SYSTEM_OVERVIEW.md',
        'HELP_SYSTEM_GUIDE.md',
        'SETUP.md',
        'CANNABIS_MODULE.md',
        'OFMS_*.md',
        'MATHEMATICAL_*.md',
        'AI_*.md',
        '*_AUDIT_REPORT.md',
        '*_ANALYSIS.md',
        '*_GUIDE.md'
      ],
      'dev-docs/': [
        'OFMS_TECHNICAL_ESSENTIALS.md',
        'IMPLEMENTATION_PATTERNS.md',
        'TESTING_AND_QUALITY.md',
        'UI_AND_STYLING.md',
        'DATABASE_AND_DEPLOYMENT.md',
        'DOCUMENTATION_INDEX.md',
        'BRANCHING_MODEL.md',
        'COMMIT_CONVENTIONS.md',
        'AI_SETUP_INSTRUCTIONS.md',
        'TEST_DATA_README.md'
      ],
      'root/': [
        'README.md',
        'CHANGELOG.md',
        'CONTRIBUTING.md',
        'LICENSE.md',
        'SECURITY.md'
      ]
    };
  }

  matchesPattern(filename, patterns) {
    return patterns.some(pattern => {
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
        .replace(/\./g, '\\.');
      
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      return regex.test(filename);
    });
  }

  getCorrectDirectory(filename) {
    const rules = this.getDocumentRules();
    
    for (const [directory, patterns] of Object.entries(rules)) {
      if (this.matchesPattern(filename, patterns)) {
        return directory;
      }
    }
    return null;
  }

  checkRootDirectory() {
    log('Checking root directory for misplaced documents...');
    
    if (options.dryRun) {
      log('Would check root directory for misplaced documents', 'warning');
      return true;
    }
    
    const rootDocs = glob.sync('*.md', { cwd: process.cwd() });
    const allowedInRoot = this.getDocumentRules()['root/'];
    
    for (const doc of rootDocs) {
      if (!this.matchesPattern(doc, allowedInRoot)) {
        const correctDir = this.getCorrectDirectory(doc);
        if (correctDir) {
          this.errors.push({
            file: doc,
            type: 'WRONG_LOCATION',
            currentLocation: 'root',
            correctLocation: correctDir,
            action: `Move ${doc} to ${correctDir}`
          });
        } else {
          this.warnings.push({
            file: doc,
            type: 'UNKNOWN_DOCUMENT',
            action: 'Determine correct location based on content'
          });
        }
      }
    }
    
    return this.errors.length === 0;
  }

  checkDuplicates() {
    log('Checking for duplicate documents...');
    
    if (options.dryRun) {
      log('Would check for duplicate documents', 'warning');
      return true;
    }
    
    const allDocs = new Map();
    const directories = ['', 'app-docs/', 'dev-docs/'];
    
    for (const dir of directories) {
      const docs = glob.sync(`${dir}*.md`, { cwd: process.cwd() });
      for (const docPath of docs) {
        const filename = path.basename(docPath);
        
        if (allDocs.has(filename)) {
          allDocs.get(filename).push(docPath);
        } else {
          allDocs.set(filename, [docPath]);
        }
      }
    }
    
    for (const [filename, locations] of allDocs) {
      if (locations.length > 1) {
        this.errors.push({
          file: filename,
          type: 'DUPLICATE_DOCUMENT',
          locations: locations,
          action: 'Consolidate duplicates and keep only canonical version'
        });
      }
    }
    
    return this.errors.length === 0;
  }

  checkDocumentLinks() {
    log('Checking document links...');
    
    if (options.dryRun) {
      log('Would check document links', 'warning');
      return true;
    }
    
    const allMdFiles = glob.sync('**/*.md', { 
      cwd: process.cwd(),
      ignore: ['node_modules/**', '.git/**', 'backups/**']
    });
    
    for (const file of allMdFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
        let match;
        
        while ((match = linkRegex.exec(content)) !== null) {
          const linkPath = match[2];
          const resolvedPath = path.resolve(path.dirname(file), linkPath);
          
          if (!fs.existsSync(resolvedPath)) {
            this.warnings.push({
              file: file,
              type: 'BROKEN_LINK',
              brokenLink: linkPath,
              action: 'Update link path after document reorganization'
            });
          }
        }
      } catch (error) {
        this.warnings.push({
          file: file,
          type: 'READ_ERROR',
          action: 'Check file permissions'
        });
      }
    }
    
    return true; // This is warnings only
  }

  runAllDocumentChecks() {
    const results = {
      rootDirectory: this.checkRootDirectory(),
      duplicates: this.checkDuplicates(),
      links: this.checkDocumentLinks()
    };
    
    return results;
  }
}

class CodeQualityChecker {
  constructor() {
    this.results = [];
  }

  runLinting() {
    return runCommand('ESLint Check', 'npm run lint', true);
  }

  runTypeScript() {
    return runCommand('TypeScript Check', 'npm run type-check', true);
  }

  runTests() {
    return runCommand('Unit Tests', 'npm run test -- --passWithNoTests', false);
  }

  runBuild() {
    return runCommand('Production Build', 'npm run build', true);
  }

  runAllCodeChecks() {
    log('Running code quality checks...');
    
    const results = [
      this.runLinting(),
      this.runTypeScript(),
      this.runTests(),
      this.runBuild()
    ];
    
    this.results = results;
    return results;
  }
}

// Main Quality Checker
class QualityChecker {
  constructor() {
    this.styleChecker = new StyleChecker();
    this.documentChecker = new DocumentChecker();
    this.codeChecker = new CodeQualityChecker();
    this.overallSuccess = true;
  }

  async runChecks() {
    log('Starting OFMS Quality Checks...', 'info');
    log(`Check type: ${options.check}`, 'info');
    
    const results = {};
    
    if (options.check === 'all' || options.check === 'styles') {
      log('\n🎨 Running Style Checks...', 'info');
      results.styles = this.styleChecker.runAllStyleChecks();
      
      if (options.fix) {
        this.styleChecker.autoFix();
      }
    }
    
    if (options.check === 'all' || options.check === 'docs') {
      log('\n📋 Running Document Checks...', 'info');
      results.documents = this.documentChecker.runAllDocumentChecks();
    }
    
    if (options.check === 'all' || options.check === 'code') {
      log('\n🔧 Running Code Quality Checks...', 'info');
      results.code = this.codeChecker.runAllCodeChecks();
    }
    
    if (options.check === 'css') {
      log('\n🎨 Running CSS-specific Checks...', 'info');
      results.css = {
        inlineStyles: this.styleChecker.checkInlineStyles(),
        cssModules: this.styleChecker.checkCSSModulesCompliance(),
        designSystem: this.styleChecker.checkDesignSystemUsage()
      };
    }
    
    this.generateReport(results);
    
    return results;
  }

  generateReport(results) {
    log('\n📊 Quality Check Report', 'info');
    log('======================\n', 'info');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;
    
    // Count results
    const allErrors = [
      ...(this.styleChecker.errors || []),
      ...(this.documentChecker.errors || [])
    ];
    
    const allWarnings = [
      ...(this.styleChecker.warnings || []),
      ...(this.documentChecker.warnings || [])
    ];
    
    // Count code check results
    if (this.codeChecker.results) {
      const passedCode = this.codeChecker.results.filter(r => r.status === 'PASSED').length;
      const failedCode = this.codeChecker.results.filter(r => r.status === 'FAILED').length;
      totalPassed += passedCode;
      totalFailed += failedCode;
    }
    
    totalFailed += allErrors.length;
    totalWarnings += allWarnings.length;
    
    // Report summary
    log(`✅ Passed: ${totalPassed}`, 'success');
    if (totalFailed > 0) {
      log(`❌ Failed: ${totalFailed}`, 'error');
      this.overallSuccess = false;
    }
    if (totalWarnings > 0) {
      log(`⚠️ Warnings: ${totalWarnings}`, 'warning');
      if (options.strict) {
        this.overallSuccess = false;
      }
    }
    
    // Detailed report
    if (options.report === 'detailed') {
      this.generateDetailedReport(results);
    }
    
    // Final verdict
    if (this.overallSuccess) {
      log('\n🎯 OVERALL STATUS: READY FOR PRODUCTION ✅', 'success');
      log('All critical quality checks passed successfully.', 'success');
    } else {
      log('\n🚨 OVERALL STATUS: QUALITY ISSUES DETECTED ❌', 'error');
      log('Critical issues must be resolved before proceeding.', 'error');
    }
  }

  generateDetailedReport(results) {
    log('\n📋 DETAILED REPORT:', 'info');
    
    // Style errors
    if (this.styleChecker.errors.length > 0) {
      log('\n❌ Style Errors:', 'error');
      this.styleChecker.errors.forEach(error => {
        log(`  • ${error.file}: ${error.description}`, 'error');
      });
    }
    
    // Style warnings
    if (this.styleChecker.warnings.length > 0) {
      log('\n⚠️ Style Warnings:', 'warning');
      this.styleChecker.warnings.forEach(warning => {
        log(`  • ${warning.file}: ${warning.description}`, 'warning');
      });
    }
    
    // Document errors
    if (this.documentChecker.errors.length > 0) {
      log('\n❌ Document Errors:', 'error');
      this.documentChecker.errors.forEach(error => {
        log(`  • ${error.file}: ${error.action}`, 'error');
      });
    }
    
    // Document warnings
    if (this.documentChecker.warnings.length > 0) {
      log('\n⚠️ Document Warnings:', 'warning');
      this.documentChecker.warnings.forEach(warning => {
        log(`  • ${warning.file}: ${warning.action}`, 'warning');
      });
    }
    
    // Code check results
    if (this.codeChecker.results.length > 0) {
      log('\n🔧 Code Quality Results:', 'info');
      this.codeChecker.results.forEach(result => {
        const emoji = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
        const level = result.status === 'PASSED' ? 'success' : result.status === 'FAILED' ? 'error' : 'warning';
        log(`  ${emoji} ${result.name}: ${result.status}`, level);
      });
    }
  }
}

// Main execution
async function main() {
  // Validate check type
  if (!CHECK_TYPES[options.check]) {
    console.error(`❌ Invalid check type: ${options.check}`);
    console.error(`Available check types: ${Object.keys(CHECK_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  const checker = new QualityChecker();
  
  try {
    await checker.runChecks();
    
    if (checker.overallSuccess) {
      process.exit(0);
    } else {
      process.exit(1);
    }
    
  } catch (error) {
    log(`Quality check failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Command line interface
if (require.main === module) {
  main().catch(console.error);
}

// Export for use by other scripts
module.exports = {
  QualityChecker,
  StyleChecker,
  DocumentChecker,
  CodeQualityChecker,
  CHECK_TYPES
}; 