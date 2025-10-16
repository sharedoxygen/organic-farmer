const { BaseTest } = require('../../lib/base-test.js')

class ProductionAnalyticsTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('📈 STARTING PRODUCTION ANALYTICS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Analytics Page Load', () => this.testPageLoad())
      await this.runTest('Analytics API GET', () => this.testAPIGet())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/analytics/yield', null, [
      'text=Yield Analysis',
      'main',
    ])
    return true
  }

  async testAPIGet() {
    const res = await this.apiHelper.testEndpoint(
      this.automation.page,
      'analytics',
      'GET'
    )
    if (!res.ok) throw new Error('GET analytics failed')
    return true
  }
}

if (require.main === module) {
  const test = new ProductionAnalyticsTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Production Analytics Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { ProductionAnalyticsTest }
