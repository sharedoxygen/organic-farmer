const { BaseTest } = require('../../lib/base-test.js')

class DailyTasksTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('📝 STARTING DAILY TASKS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Daily Tasks Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/tasks/daily', null, [
      'text=Daily Tasks',
      '[class*="task"], main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new DailyTasksTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Daily Tasks Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { DailyTasksTest }
