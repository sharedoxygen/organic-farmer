/**
 * Comprehensive Demo Runner for OFMS Automation
 * Executes the complete 3-phase testing: Navigation + CRUD + Data Integrity
 */

const { OFMSAutomation } = require('./ofms-data-entry.js')

class ComprehensiveDemo {
  constructor() {
    this.automation = null
    this.headless = process.env.HEADLESS === 'true'
  }

  async run() {
    console.log('🔬 OFMS COMPREHENSIVE AUTOMATION DEMO')
    console.log('='.repeat(60))
    console.log(
      `🖥️  Mode: ${this.headless ? 'Headless' : 'Headed (visible browser)'}`
    )
    console.log(`📅 Started: ${new Date().toLocaleString()}`)
    console.log('='.repeat(60))

    this.automation = new OFMSAutomation()

    try {
      // Initialize automation
      await this.automation.init()

      // Authenticate
      await this.automation.login()

      // Select farm context
      await this.automation.selectFarm('Curry Island Microgreens')

      console.log('\n🚀 STARTING 3-PHASE COMPREHENSIVE TESTING...')

      // Run the comprehensive test suite
      const results = await this.automation.runComprehensiveTests()

      // Print final results
      console.log('\n' + '='.repeat(60))
      console.log('🎉 COMPREHENSIVE DEMO COMPLETED')
      console.log('='.repeat(60))

      if (results.overall.successRate >= 85) {
        console.log('🏆 EXCELLENT: Automation suite is working excellently!')
      } else if (results.overall.successRate >= 70) {
        console.log(
          '✅ GOOD: Automation suite is working well with minor issues'
        )
      } else {
        console.log('⚠️ NEEDS ATTENTION: Several issues detected in automation')
      }

      console.log(`\n📊 FINAL SCORES:`)
      console.log(
        `   Navigation: ${results.navigation.passed}/${results.navigation.total} pages`
      )
      console.log(
        `   CRUD Operations: ${results.crud.passed}/${results.crud.total} pages`
      )
      console.log(
        `   Data Integrity: ${results.integrity.passed}/${results.integrity.total} tests`
      )
      console.log(`   Overall: ${results.overall.successRate}% success rate`)

      return results.overall.successRate >= 70
    } catch (error) {
      console.error('❌ Comprehensive demo failed:', error)
      return false
    } finally {
      if (!this.headless) {
        console.log('\n⏳ Browser will remain open for inspection...')
        console.log('Press Ctrl+C to close.')
      } else {
        await this.automation.close()
      }
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping comprehensive demo...')
  process.exit(0)
})

// Run if called directly
if (require.main === module) {
  const demo = new ComprehensiveDemo()

  demo
    .run()
    .then(success => {
      if (success) {
        console.log('\n🎉 Comprehensive demo completed successfully!')
      } else {
        console.log('\n⚠️ Comprehensive demo completed with issues')
      }

      if (process.env.HEADLESS === 'true') {
        process.exit(success ? 0 : 1)
      }
    })
    .catch(error => {
      console.error('❌ Demo execution failed:', error)
      process.exit(1)
    })
}

module.exports = { ComprehensiveDemo }

