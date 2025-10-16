const { BaseTest } = require('../../lib/base-test.js')

class PostHarvestTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('📦 STARTING POST-HARVEST TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Post-Harvest Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/production/post-harvest', null, [
      'text=Post-Harvest Handling',
      '[class*="tasksGrid"], [class*="taskCard"], main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new PostHarvestTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Post-Harvest Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { PostHarvestTest }
