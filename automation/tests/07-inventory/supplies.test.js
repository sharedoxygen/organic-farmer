const { BaseTest } = require('../../lib/base-test.js')

class InventorySuppliesTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('🧰 STARTING INVENTORY SUPPLIES TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Supplies Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/inventory/supplies', null, [
      'text=Inventory - Supplies',
      '[class*="suppliesGrid"], [class*="supplyCard"], main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new InventorySuppliesTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Inventory Supplies Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { InventorySuppliesTest }
