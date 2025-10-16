/**
 * Base Test Class for OFMS Automation
 * Provides common functionality for all test files
 */

const { OFMSAutomation } = require('../ofms-data-entry.js')
const { AuthHelper } = require('./auth-helper.js')
const { DataHelper } = require('./data-helper.js')
const { ApiHelper } = require('./api-helper.js')

class BaseTest {
  constructor(options = {}) {
    this.automation = null
    this.authHelper = new AuthHelper()
    this.dataHelper = new DataHelper()
    this.apiHelper = new ApiHelper()
    this.testConfig = {
      headless: process.env.HEADLESS === 'true',
      slowMo: parseInt(process.env.SLOW_MO) || 200,
      timeout: parseInt(process.env.TIMEOUT) || 30000,
      baseURL: process.env.OFMS_URL || 'http://localhost:3005',
      ...options,
    }
    this.testResults = {
      passed: [],
      failed: [],
      total: 0,
      startTime: null,
      endTime: null,
    }
  }

  async setup() {
    console.log('🔧 Setting up test environment...')
    this.testResults.startTime = new Date()

    // Initialize automation
    this.automation = new OFMSAutomation()
    this.automation.baseURL = this.testConfig.baseURL
    await this.automation.init()

    // Authenticate
    await this.automation.login()

    // Set farm context for multi-tenant testing
    await this.automation.selectFarm('Curry Island Microgreens')

    console.log('✅ Test environment ready')
  }

  async teardown() {
    console.log('🧹 Cleaning up test environment...')
    this.testResults.endTime = new Date()

    if (this.automation) {
      await this.automation.close()
    }

    console.log('✅ Test cleanup completed')
  }

  async runTest(testName, testFunction) {
    this.testResults.total++
    console.log(`\n[${this.testResults.total}] Testing: ${testName}`)
    console.log('-'.repeat(50))

    try {
      const startTime = Date.now()
      const result = await testFunction()
      const duration = Date.now() - startTime

      if (result !== false) {
        this.testResults.passed.push({ name: testName, duration })
        console.log(`✅ ${testName} - PASSED (${duration}ms)`)
        return true
      } else {
        this.testResults.failed.push({
          name: testName,
          error: 'Test returned false',
        })
        console.log(`❌ ${testName} - FAILED`)
        return false
      }
    } catch (error) {
      this.testResults.failed.push({ name: testName, error: error.message })
      console.log(`❌ ${testName} - ERROR: ${error.message}`)

      // Take screenshot on error
      if (this.automation && this.automation.page) {
        try {
          const screenshotPath = `./debug_${testName.replace(/\s+/g, '_')}_${Date.now()}.png`
          await this.automation.page.screenshot({ path: screenshotPath })
          console.log(`📸 Screenshot saved: ${screenshotPath}`)
        } catch (screenshotError) {
          console.log(
            `⚠️ Could not save screenshot: ${screenshotError.message}`
          )
        }
      }

      return false
    }
  }

  async validatePageLoad(expectedSelectors = [], timeout = 10000) {
    for (const selector of expectedSelectors) {
      try {
        await this.automation.page.waitForSelector(selector, { timeout })
      } catch (error) {
        throw new Error(`Required selector not found: ${selector}`)
      }
    }
    return true
  }

  async validateApiResponse(endpoint, expectedData = {}) {
    return await this.apiHelper.validateResponse(
      this.automation.page,
      endpoint,
      expectedData
    )
  }

  async validateDataIntegrity(
    entity,
    operations = ['create', 'read', 'update', 'delete']
  ) {
    return await this.dataHelper.validateCRUD(
      this.automation.page,
      entity,
      operations
    )
  }

  async validateMultiTenantIsolation(endpoint, farmId) {
    return await this.apiHelper.validateFarmIsolation(
      this.automation.page,
      endpoint,
      farmId
    )
  }

  printSummary() {
    const duration = this.testResults.endTime - this.testResults.startTime
    const successRate = Math.round(
      (this.testResults.passed.length / this.testResults.total) * 100
    )

    console.log('\n' + '='.repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`)
    console.log(`📋 Total Tests: ${this.testResults.total}`)
    console.log(`✅ Passed: ${this.testResults.passed.length}`)
    console.log(`❌ Failed: ${this.testResults.failed.length}`)
    console.log(`📈 Success Rate: ${successRate}%`)

    if (this.testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults.failed.forEach(test => {
        console.log(`   - ${test.name}: ${test.error}`)
      })
    }

    if (this.testResults.passed.length > 0) {
      const avgDuration = Math.round(
        this.testResults.passed.reduce((sum, test) => sum + test.duration, 0) /
          this.testResults.passed.length
      )
      console.log(`\n⚡ Average Test Duration: ${avgDuration}ms`)
    }

    return {
      success: this.testResults.failed.length === 0,
      results: this.testResults,
    }
  }

  // Utility methods for common test patterns
  async testPageNavigation(path, expectedTitle = null, expectedSelectors = []) {
    await this.automation.page.goto(`${this.testConfig.baseURL}${path}`)
    try {
      await this.automation.page.waitForLoadState('networkidle', {
        timeout: 15000,
      })
    } catch (_) {
      // Allow pages that keep network busy
    }

    if (expectedTitle) {
      const title = await this.automation.page.title()
      if (!title.includes(expectedTitle)) {
        throw new Error(
          `Expected title to contain "${expectedTitle}", got "${title}"`
        )
      }
    }

    await this.validatePageLoad(expectedSelectors)
    return true
  }

  async testFormSubmission(formData, submitSelector = 'button[type="submit"]') {
    // Fill form fields with support for selects
    for (const [field, value] of Object.entries(formData)) {
      const locator = this.automation.page.locator(`[name="${field}"]`)
      const tag = await locator
        .evaluate(el => el.tagName.toLowerCase())
        .catch(() => 'input')
      if (tag === 'select') {
        await locator.selectOption(String(value))
      } else {
        await locator.fill(String(value))
      }
    }

    // Submit form
    await this.automation.page.click(submitSelector)
    await this.automation.page.waitForTimeout(2000)

    return true
  }

  async testModalInteraction(
    triggerSelector,
    modalSelector = '.modal, [class*="Modal"]'
  ) {
    // Dismiss stray overlays
    await this.dismissOverlaysIfAny()
    await this.automation.page.click(triggerSelector)
    await this.automation.page.waitForSelector(modalSelector, {
      timeout: 10000,
    })
    return true
  }

  async dismissOverlaysIfAny() {
    try {
      // Try Escape key
      await this.automation.page.keyboard.press('Escape').catch(() => {})
      // Click common overlays
      const overlays = [
        '[class*="modalOverlay"]',
        '.modal-overlay',
        '[class*="overlay"]:not([class*="sidebar"])',
      ]
      for (const sel of overlays) {
        if (await this.automation.page.isVisible(sel)) {
          await this.automation.page
            .click(sel, { position: { x: 2, y: 2 } })
            .catch(() => {})
        }
      }
    } catch (_) {}
  }

  // Error handling with context
  createContextualError(message, context = {}) {
    const error = new Error(message)
    error.context = context
    return error
  }
}

module.exports = { BaseTest }
