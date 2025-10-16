const { BaseTest } = require('../../lib/base-test.js')

class PackagingTest extends BaseTest {
  constructor() {
    super({ timeout: 25000 })
  }

  async runAllTests() {
    console.log('📦 STARTING PACKAGING MATERIALS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Packaging Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/inventory/packaging', null, [
      'text=Packaging Materials',
      '[class*="materialsGrid"], [class*="materialCard"], main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new PackagingTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Packaging Materials Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { PackagingTest }
