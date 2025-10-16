const { BaseTest } = require('../../lib/base-test.js')

class EquipmentManagementTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('🔧 STARTING EQUIPMENT MANAGEMENT TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Equipment Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/inventory/equipment', null, [
      'text=Equipment Management',
      '[class*="equipmentGrid"], [class*="equipmentCard"], main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new EquipmentManagementTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Equipment Management Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { EquipmentManagementTest }
