const { BaseTest } = require('../../lib/base-test.js')

class HarvestingTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('✂️ STARTING HARVESTING TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Harvesting Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/production/harvesting', null, [
      'text=Harvesting & Processing',
      '[class*="batchesGrid"], [class*="batchCard"], main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new HarvestingTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Harvesting Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { HarvestingTest }
