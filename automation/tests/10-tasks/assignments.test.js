const { BaseTest } = require('../../lib/base-test.js')

class AssignmentsTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('📋 STARTING ASSIGNMENTS TESTS')
    console.log('='.repeat(50))
    await this.setup()
    try {
      await this.runTest('Assignments Page Load', () => this.testPageLoad())
    } finally {
      await this.teardown()
    }
    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/tasks/assignments', null, [
      'text=Assignments',
      'main',
    ])
    return true
  }
}

if (require.main === module) {
  const test = new AssignmentsTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Assignments Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(err => {
      console.error('❌ Test execution failed:', err)
      process.exit(1)
    })
}

module.exports = { AssignmentsTest }

