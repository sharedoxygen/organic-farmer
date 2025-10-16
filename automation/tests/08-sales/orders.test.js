const { BaseTest } = require('../../lib/base-test.js')

class SalesOrdersTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('🧾 STARTING SALES ORDERS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Orders Page Load', () => this.testPageLoad())
      await this.runTest('Orders API GET', () => this.testAPIGet())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/sales/orders', null, [
      'text=Orders',
      '[class*="ordersGrid"], [class*="orderCard"], main',
    ])
    return true
  }

  async testAPIGet() {
    const res = await this.apiHelper.testEndpoint(
      this.automation.page,
      'orders',
      'GET'
    )
    if (!res.ok) throw new Error('GET orders failed')
    return true
  }
}

if (require.main === module) {
  const test = new SalesOrdersTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Sales Orders Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { SalesOrdersTest }
