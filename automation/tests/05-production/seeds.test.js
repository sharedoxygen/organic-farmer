const { BaseTest } = require('../../lib/base-test.js')

class SeedsTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('🌱 STARTING SEEDS & GENETICS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Seeds Page Load', () => this.testPageLoad())
      await this.runTest('Seeds CRUD via API', () => this.testAPI())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/production/seeds', null, [
      'text=Seeds & Genetics',
      '[class*="seedTable"], [class*="tableHead"], main',
    ])
    return true
  }

  async testAPI() {
    // GET
    const getRes = await this.apiHelper.testEndpoint(
      this.automation.page,
      'seedVarieties',
      'GET'
    )
    if (!getRes.ok) throw new Error('GET seedVarieties failed')

    // POST minimal valid payload
    const payload = {
      name: `AUTO_SEED_${Date.now()}`,
      scientificName: 'Cannabis sativa L.',
      supplier: 'Automation Supplier',
      stockQuantity: 100,
      minStockLevel: 10,
      unit: 'grams',
      costPerUnit: 4.2,
      germinationRate: 0.9,
      daysToGermination: 5,
      daysToHarvest: 60,
      storageTemp: 4,
      storageHumidity: 40,
      lightExposure: 'PARTIAL',
    }
    const postRes = await this.apiHelper.testEndpoint(
      this.automation.page,
      'seedVarieties',
      'POST',
      payload
    )
    if (!postRes.ok) throw new Error('POST seedVarieties failed')

    return true
  }
}

if (require.main === module) {
  const test = new SeedsTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Seeds Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { SeedsTest }
