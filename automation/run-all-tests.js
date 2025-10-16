/**
 * Comprehensive Test Runner for OFMS Automation Suite
 * Runs all tests in organized sequence with detailed reporting
 */

const fs = require('fs')
const path = require('path')
const config = require('./config/test-config.js')

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      sections: {},
      errors: [],
    }

    this.headless = process.env.HEADLESS === 'true'
    this.parallel = process.env.PARALLEL === 'true'
  }

  async run() {
    console.log('🔬 OFMS COMPREHENSIVE TEST SUITE')
    console.log('='.repeat(60))
    console.log(`🖥️  Mode: ${this.headless ? 'Headless' : 'Headed'}`)
    console.log(`⚡ Execution: ${this.parallel ? 'Parallel' : 'Sequential'}`)
    console.log(`📅 Started: ${this.results.startTime.toLocaleString()}`)
    console.log('='.repeat(60))

    try {
      // Run tests in priority order
      const testSections = this.getTestSections()

      if (this.parallel) {
        await this.runTestsInParallel(testSections)
      } else {
        await this.runTestsSequentially(testSections)
      }
    } catch (error) {
      console.error('❌ Test runner failed:', error)
      this.results.errors.push(error.message)
    } finally {
      this.results.endTime = new Date()
      this.generateReport()
    }

    return this.results.failedTests === 0
  }

  getTestSections() {
    const sections = []

    // Get all test categories from config, sorted by priority
    const categories = Object.entries(config.testCategories)
      .filter(([name, cfg]) => cfg.enabled)
      .sort((a, b) => a[1].priority - b[1].priority)

    for (const [name, cfg] of categories) {
      const testDir = path.join(__dirname, 'tests', this.getSectionFolder(name))

      if (fs.existsSync(testDir)) {
        const testFiles = fs
          .readdirSync(testDir)
          .filter(file => file.endsWith('.test.js'))
          .map(file => ({
            name: `${name}-${file.replace('.test.js', '')}`,
            path: path.join(testDir, file),
            category: name,
            timeout: cfg.timeout || 30000,
          }))

        sections.push(...testFiles)
      } else {
        console.log(`⚠️ Test directory not found: ${testDir}`)
      }
    }

    return sections
  }

  getSectionFolder(categoryName) {
    const folderMap = {
      authentication: '01-authentication',
      navigation: '02-navigation',
      dashboard: '03-dashboard',
      planning: '04-planning',
      production: '05-production',
      quality: '06-quality',
      inventory: '07-inventory',
      sales: '08-sales',
      traceability: '09-traceability',
      tasks: '10-tasks',
      equipment: '11-equipment',
      analytics: '12-analytics',
      aiInsights: '13-ai-insights',
      integrations: '14-integrations',
      admin: '15-admin',
      compliance: '16-compliance',
      settings: '17-settings',
      dataIntegrity: '99-data-integrity',
    }

    return folderMap[categoryName] || categoryName
  }

  async runTestsSequentially(testSections) {
    console.log(
      `\n🔄 Running ${testSections.length} test sections sequentially...\n`
    )

    for (let i = 0; i < testSections.length; i++) {
      const section = testSections[i]
      console.log(`[${i + 1}/${testSections.length}] ${section.name}`)
      console.log('-'.repeat(50))

      await this.runSingleTest(section)

      // Small delay between sections
      await this.sleep(1000)
    }
  }

  async runTestsInParallel(testSections) {
    console.log(
      `\n⚡ Running ${testSections.length} test sections in parallel...\n`
    )

    const maxWorkers = config.parallel.maxWorkers || 4
    const chunks = this.chunkArray(testSections, maxWorkers)

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(
        `Processing batch ${i + 1}/${chunks.length} (${chunk.length} tests)`
      )

      const promises = chunk.map(section => this.runSingleTest(section))
      await Promise.allSettled(promises)

      console.log(`Batch ${i + 1} completed\n`)
    }
  }

  async runSingleTest(section) {
    const startTime = Date.now()

    try {
      // Set environment variables for test
      process.env.HEADLESS = this.headless.toString()

      // Import and run the test
      const TestClass = require(section.path)

      // Get the test class (could be default export or named export)
      const TestConstructor =
        (TestClass && TestClass.default) ||
        (TestClass && TestClass[Object.keys(TestClass)[0]]) ||
        TestClass

      if (!TestConstructor) {
        throw new Error(`Could not find test class in ${section.path}`)
      }

      const testInstance = new TestConstructor()
      const result = await testInstance.runAllTests()

      const duration = Date.now() - startTime

      // Record results
      this.results.totalTests++
      this.results.sections[section.name] = {
        passed: result.success,
        duration,
        details: result.results,
      }

      if (result.success) {
        this.results.passedTests++
        console.log(
          `✅ ${section.name} - PASSED (${Math.round(duration / 1000)}s)`
        )
      } else {
        this.results.failedTests++
        console.log(
          `❌ ${section.name} - FAILED (${Math.round(duration / 1000)}s)`
        )
        if (result.results && result.results.failed) {
          result.results.failed.forEach(failure => {
            this.results.errors.push(
              `${section.name}: ${failure.name} - ${failure.error}`
            )
          })
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime

      this.results.totalTests++
      this.results.failedTests++
      this.results.sections[section.name] = {
        passed: false,
        duration,
        error: error.message,
      }

      console.log(`❌ ${section.name} - ERROR: ${error.message}`)
      this.results.errors.push(`${section.name}: ${error.message}`)
    }
  }

  generateReport() {
    const duration = this.results.endTime - this.results.startTime
    const successRate =
      this.results.totalTests > 0
        ? Math.round((this.results.passedTests / this.results.totalTests) * 100)
        : 0

    console.log('\n' + '='.repeat(60))
    console.log('🏁 COMPREHENSIVE TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`)
    console.log(`📋 Total Test Sections: ${this.results.totalTests}`)
    console.log(`✅ Passed: ${this.results.passedTests}`)
    console.log(`❌ Failed: ${this.results.failedTests}`)
    console.log(`📈 Success Rate: ${successRate}%`)

    if (this.results.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:')
      console.log('-'.repeat(30))
      Object.entries(this.results.sections)
        .filter(([name, result]) => !result.passed)
        .forEach(([name, result]) => {
          console.log(`   ${name}: ${result.error || 'Test failed'}`)
        })
    }

    if (this.results.passedTests > 0) {
      console.log('\n✅ PASSED TESTS:')
      console.log('-'.repeat(30))
      Object.entries(this.results.sections)
        .filter(([name, result]) => result.passed)
        .forEach(([name, result]) => {
          const duration = Math.round(result.duration / 1000)
          console.log(`   ${name} (${duration}s)`)
        })
    }

    // Performance insights
    const avgDuration =
      this.results.totalTests > 0
        ? Math.round(
            Object.values(this.results.sections).reduce(
              (sum, result) => sum + result.duration,
              0
            ) /
              this.results.totalTests /
              1000
          )
        : 0

    console.log(`\n⚡ Average Section Duration: ${avgDuration}s`)

    // Slowest tests
    const slowestTests = Object.entries(this.results.sections)
      .sort((a, b) => b[1].duration - a[1].duration)
      .slice(0, 3)

    if (slowestTests.length > 0) {
      console.log('\n⏰ SLOWEST TESTS:')
      console.log('-'.repeat(30))
      slowestTests.forEach(([name, result]) => {
        console.log(`   ${name}: ${Math.round(result.duration / 1000)}s`)
      })
    }

    // Save detailed report to file
    this.saveReportToFile()

    console.log('\n' + '='.repeat(60))
    console.log(
      `🎯 FINAL RESULT: ${this.results.failedTests === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
    )
    console.log('='.repeat(60))
  }

  saveReportToFile() {
    const reportData = {
      ...this.results,
      config: {
        headless: this.headless,
        parallel: this.parallel,
        baseURL: config.baseURL,
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      },
    }

    const reportDir = './test-reports'
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportFile = path.join(reportDir, `test-report-${timestamp}.json`)

    fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2))
    console.log(`\n📄 Detailed report saved: ${reportFile}`)
  }

  // Utility functions
  chunkArray(array, chunkSize) {
    const chunks = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new ComprehensiveTestRunner()

  runner
    .run()
    .then(success => {
      console.log(
        `\n🏁 Test suite completed ${success ? 'successfully' : 'with failures'}`
      )
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test runner crashed:', error)
      process.exit(1)
    })
}

module.exports = { ComprehensiveTestRunner }
