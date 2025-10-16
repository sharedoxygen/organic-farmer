const { BaseTest } = require('../../lib/base-test.js')

class EnvironmentsTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('🏠 STARTING GROWING ENVIRONMENTS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Environments Page Load', () => this.testPageLoad())
      await this.runTest('API Endpoints', () => this.testAPI())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/production/environments', null, [
      'text=Growing Environments',
      '[class*="environmentsGrid"], [class*="environmentCard"], main',
    ])
    return true
  }

  async testAPI() {
    const getRes = await this.apiHelper.testEndpoint(
      this.automation.page,
      'environments',
      'GET'
    )
    if (!getRes.ok) throw new Error('GET environments failed')

    const postRes = await this.apiHelper.testEndpoint(
      this.automation.page,
      'environments',
      'POST',
      {
        name: `ENV-${Date.now()}`,
        type: 'greenhouse',
        location: 'North Field',
        maxBatches: 10,
        totalArea: 120,
        areaUnit: 'sqft',
        currentTemp: 20,
        currentHumidity: 60,
        currentLightLevel: 100,
        targetTempMin: 18,
        targetTempMax: 25,
        targetHumidityMin: 55,
        targetHumidityMax: 70,
        targetLightHours: 12,
        status: 'optimal',
        equipmentIds: '',
      }
    )
    if (!postRes.ok) throw new Error('POST environments failed')
    return true
  }
}

if (require.main === module) {
  const test = new EnvironmentsTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Environments Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { EnvironmentsTest }
