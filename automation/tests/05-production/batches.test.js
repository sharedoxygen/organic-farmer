const { BaseTest } = require('../../lib/base-test.js')

class ProductionBatchesTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('🌱 STARTING PRODUCTION BATCHES TESTS')
    console.log('='.repeat(50))

    await this.setup()

    try {
      await this.runTest('Batches Page Load', () => this.testPageLoad())
      await this.runTest('Create Batch', () => this.testCreateBatch())
      await this.runTest('Batch CRUD Operations', () => this.testBatchCRUD())
      await this.runTest('API Endpoints', () => this.testBatchesAPI())
    } finally {
      await this.teardown()
    }

    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/production/batches', null, [
      'main, [role="main"], .main-content, [class*="container"]',
      'text=Production Batches',
    ])
    return true
  }

  async testCreateBatch() {
    await this.automation.page.goto(
      `${this.testConfig.baseURL}/production/batches`
    )
    await this.automation.page.waitForLoadState('networkidle')

    // Open create modal
    await this.automation.page.click('button:has-text("+ New Batch")')
    await this.automation.page.waitForSelector('.modal, [class*="modal"]')

    const batchNumber = `BATCH-${Date.now()}`

    // Fill form
    await this.automation.page.fill('input[name="batchNumber"]', batchNumber)
    // Select first seed variety option
    await this.automation.page.selectOption('select[name="seedVarietyId"]', {
      index: 1,
    })
    await this.automation.page.fill('input[name="quantity"]', '25')
    await this.automation.page.selectOption('select[name="unit"]', 'trays')
    await this.automation.page.fill(
      'input[name="plantDate"]',
      new Date().toISOString().split('T')[0]
    )
    await this.automation.page.fill(
      'input[name="expectedHarvestDate"]',
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
    )
    await this.automation.page.selectOption(
      'select[name="growingZone"]',
      'Zone A'
    )

    // Submit
    await this.automation.page.click(
      'button[type="submit"], button:has-text("Create Batch")'
    )
    await this.automation.page.waitForTimeout(2000)

    const created = await this.automation.page.isVisible(`text=${batchNumber}`)
    if (!created) throw new Error('Batch not created or not visible')
    return true
  }

  async testBatchCRUD() {
    return await this.validateDataIntegrity('batch', [
      'create',
      'read',
      'update',
      'delete',
    ])
  }

  async testBatchesAPI() {
    const getResult = await this.apiHelper.testEndpoint(
      this.automation.page,
      'batches',
      'GET'
    )
    const postResult = await this.apiHelper.testEndpoint(
      this.automation.page,
      'batches',
      'POST',
      {
        batchNumber: `API-BATCH-${Date.now()}`,
        seedVarietyId: 'seed-001',
        plantDate: new Date().toISOString(),
      }
    )

    const ok = getResult.ok && postResult.ok
    if (!ok) throw new Error('Batches API failed')
    return true
  }
}

if (require.main === module) {
  const test = new ProductionBatchesTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Production Batches Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { ProductionBatchesTest }
