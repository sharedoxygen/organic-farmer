const { BaseTest } = require('../../lib/base-test.js')

class WorkOrdersTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('🧾 STARTING WORK ORDERS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Work Orders Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/tasks/work-orders', null, [
      'text=Work Orders',
      'main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new WorkOrdersTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Work Orders Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { WorkOrdersTest }

