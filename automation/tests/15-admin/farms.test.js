const { BaseTest } = require('../../lib/base-test.js')

class AdminFarmsTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('🛠️ STARTING ADMIN FARMS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Admin Farms Page Load', () => this.testPageLoad())
      await this.runTest('Farms API GET', () => this.testAPIGet())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/admin/farms', null, [
      'text=Farm Management',
      '[class*="farmCard"], main',
    ])
    return true
  }

  async testAPIGet() {
    const res = await this.apiHelper.testEndpoint(
      this.automation.page,
      'farms',
      'GET'
    )
    if (!res.ok) throw new Error('GET farms failed')
    return true
  }
}

if (require.main === module) {
  const test = new AdminFarmsTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Admin Farms Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { AdminFarmsTest }
