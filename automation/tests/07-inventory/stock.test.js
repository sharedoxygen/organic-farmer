const { BaseTest } = require('../../lib/base-test.js')

class InventoryStockTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('📦 STARTING INVENTORY STOCK TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Stock Page Load', () => this.testPageLoad())
      await this.runTest('Inventory API GET', () => this.testAPIGet())
      await this.runTest('Inventory API POST', () => this.testAPIPost())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/inventory/stock', null, [
      'text=Inventory',
      '[class*="table"], [class*="tableHead"], main',
    ])
    return true
  }

  async testAPIGet() {
    const res = await this.apiHelper.testEndpoint(
      this.automation.page,
      'inventory',
      'GET'
    )
    if (!res.ok) throw new Error('GET inventory failed')
    return true
  }

  async testAPIPost() {
    const payload = {
      name: `AUTO_ITEM_${Date.now()}`,
      category: 'supplies',
      quantity: 5,
      unit: 'units',
      reorderPoint: 2,
      supplier: 'Automation Supplier',
      unitCost: 9.99,
      location: 'Warehouse A',
      notes: 'Automated test item',
    }
    const res = await this.apiHelper.testEndpoint(
      this.automation.page,
      'inventory',
      'POST',
      payload
    )
    if (!res.ok) throw new Error('POST inventory failed')
    return true
  }
}

if (require.main === module) {
  const test = new InventoryStockTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Inventory Stock Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { InventoryStockTest }
