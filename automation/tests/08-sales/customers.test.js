const { BaseTest } = require('../../lib/base-test.js')

class SalesCustomersTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('👥 STARTING SALES CUSTOMERS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('B2B Customers Page Load', () =>
        this.testB2BPageLoad()
      )
      await this.runTest('B2C Customers Page Load', () =>
        this.testB2CPageLoad()
      )
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testB2BPageLoad() {
    await this.testPageNavigation('/sales/b2b-customers', null, [
      'text=B2B Customers',
      'main',
    ])
    return true
  }

  async testB2CPageLoad() {
    await this.testPageNavigation('/sales/b2c-customers', null, [
      'text=B2C Customers',
      'main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new SalesCustomersTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Sales Customers Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { SalesCustomersTest }

