const { BaseTest } = require('../../lib/base-test.js')

class QualityControlTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('🔍 STARTING QUALITY CONTROL TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Quality Page Load', () => this.testPageLoad())
      await this.runTest('Quality API GET', () => this.testAPIGet())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/quality/control', null, [
      'text=Quality Control',
      '[class*="checksGrid"], [class*="checkCard"], main',
    ])
    return true
  }

  async testAPIGet() {
    const res = await this.apiHelper.testEndpoint(
      this.automation.page,
      'qualityChecks',
      'GET'
    )
    if (!res.ok) throw new Error('GET qualityChecks failed')
    return true
  }
}

if (require.main === module) {
  const test = new QualityControlTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Quality Control Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { QualityControlTest }
