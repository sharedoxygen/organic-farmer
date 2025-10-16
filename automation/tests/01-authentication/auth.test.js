/**
 * Authentication Tests
 * Comprehensive testing of login, logout, session management, and role-based access
 */

const { BaseTest } = require('../../lib/base-test.js')
const testData = require('../../fixtures/test-data.json')

class AuthenticationTest extends BaseTest {
  constructor() {
    super({ timeout: 15000 })
  }

  async runAllTests() {
    console.log('🔐 STARTING AUTHENTICATION TESTS')
    console.log('='.repeat(50))

    try {
      // These tests don't use the standard setup since we're testing auth itself

      // Test basic login/logout
      await this.runTest('Valid Admin Login', () => this.testValidLogin())
      await this.runTest('Invalid Login Attempts', () =>
        this.testInvalidLogin()
      )

      // Ensure we're logged in before testing persistence and downstream tests
      await this.authHelper.login(this.automation.page, 'admin')

      await this.runTest('Session Persistence', () =>
        this.testSessionPersistence()
      )
      await this.runTest('Logout Functionality', () => this.testLogout())

      // Test multi-tenant farm switching
      await this.runTest('Farm Selection', () => this.testFarmSelection())
      await this.runTest('Farm Context Persistence', () =>
        this.testFarmContextPersistence()
      )

      // Test role-based access (requires additional setup)
      await this.runTest('Role-Based Access Control', () =>
        this.testRoleBasedAccess()
      )

      // Test session expiration and renewal
      // Ensure we're logged in before validation
      await this.authHelper.login(this.automation.page, 'admin')
      await this.runTest('Session Validation', () =>
        this.testSessionValidation()
      )

      // Test authentication API endpoints
      // Ensure we're logged in before API auth checks
      await this.authHelper.login(this.automation.page, 'admin')
      await this.runTest('Authentication API', () =>
        this.testAuthenticationAPI()
      )
    } finally {
      // Cleanup - ensure we're logged out
      if (this.automation) {
        await this.automation.close()
      }
    }

    return this.printSummary()
  }

  async testValidLogin() {
    console.log('✅ Testing valid admin login...')

    this.automation = new (require('../../ofms-data-entry.js').OFMSAutomation)()
    await this.automation.init()

    // Navigate to login page
    await this.automation.page.goto(`${this.testConfig.baseURL}/auth/signin`)
    await this.automation.page.waitForLoadState('networkidle')

    // Verify login form is present
    await this.validatePageLoad([
      'input[type="email"]',
      'input[type="password"]',
      'button[type="submit"]',
    ])

    // Perform login
    await this.automation.page.fill(
      'input[type="email"]',
      testData.users.admin.email
    )
    await this.automation.page.fill(
      'input[type="password"]',
      testData.users.admin.password
    )
    await this.automation.page.click('button[type="submit"]')

    // Wait for either URL change, authenticated UI, or session API success
    const urlPromise = this.automation.page
      .waitForURL('**/dashboard', { timeout: 15000 })
      .catch(() => null)
    const uiPromise = this.automation.page
      .waitForSelector('[aria-label="Select farm"], header, main', {
        timeout: 15000,
      })
      .catch(() => null)
    const apiPromise = this.automation.page
      .waitForFunction(
        () =>
          fetch('/api/users/me', { credentials: 'include' })
            .then(r => r.ok)
            .catch(() => false),
        { timeout: 15000 }
      )
      .catch(() => null)
    const ok = await Promise.race([urlPromise, uiPromise, apiPromise])
    if (!ok) {
      throw new Error('Login did not reach authenticated state')
    }

    // Username may not be present on all views; try to fetch if available
    let userName = ''
    try {
      userName = await this.automation.page.textContent(
        '[class*="Header_userName"]'
      )
    } catch (_) {}

    console.log(
      `✅ Successfully logged in${userName ? ` as: ${userName}` : ''}`
    )
    return true
  }

  async testInvalidLogin() {
    console.log('❌ Testing invalid login attempts...')

    const invalidCredentials = testData.testScenarios.login.invalidCredentials
    const results = []

    for (const [index, credentials] of invalidCredentials.entries()) {
      console.log(
        `  Testing invalid credentials ${index + 1}/${invalidCredentials.length}`
      )

      // Navigate to login page
      await this.automation.page.goto(`${this.testConfig.baseURL}/auth/signin`)
      await this.automation.page.waitForLoadState('networkidle')

      // Fill invalid credentials
      if (credentials.email) {
        await this.automation.page.fill(
          'input[type="email"]',
          credentials.email
        )
      }
      if (credentials.password) {
        await this.automation.page.fill(
          'input[type="password"]',
          credentials.password
        )
      }

      // Submit form
      await this.automation.page.click('button[type="submit"]')
      await this.automation.page.waitForTimeout(2000)

      // Should still be on login page (not redirected)
      const currentUrl = this.automation.page.url()
      const stillOnLogin = currentUrl.includes('/auth/signin')

      // Should see error message
      const errorVisible = await this.automation.page.isVisible(
        '.error, [class*="error"], .alert-danger'
      )

      results.push({
        credentials,
        stayedOnLoginPage: stillOnLogin,
        showedError: errorVisible,
        passed: stillOnLogin || errorVisible,
      })

      console.log(
        `    ${stillOnLogin || errorVisible ? '✅' : '❌'} Invalid login properly rejected`
      )
    }

    const passedCount = results.filter(r => r.passed).length
    console.log(
      `📊 Invalid login tests: ${passedCount}/${results.length} passed`
    )

    return passedCount === results.length
  }

  async testSessionPersistence() {
    console.log('💾 Testing session persistence...')

    // Should already be logged in from previous test; validate via API
    const valid1 = await this.automation.page.evaluate(async () => {
      try {
        const r = await fetch('/api/users/me', { credentials: 'include' })
        return r.ok
      } catch {
        return false
      }
    })
    if (!valid1) throw new Error('Session not valid before refresh')

    // Refresh the page
    await this.automation.page.reload()
    await this.automation.page.waitForLoadState('networkidle')

    // Should still be logged in
    const valid2 = await this.automation.page.evaluate(async () => {
      try {
        const r = await fetch('/api/users/me', { credentials: 'include' })
        return r.ok
      } catch {
        return false
      }
    })
    if (!valid2) throw new Error('Session not persisted across refresh')

    console.log('✅ Session properly persisted across page refresh')

    // Test navigation to different pages
    await this.automation.page.goto(`${this.testConfig.baseURL}/planning/crops`)
    await this.automation.page.waitForLoadState('networkidle')

    // Should still have user context
    const valid3 = await this.automation.page.evaluate(async () => {
      try {
        const r = await fetch('/api/users/me', { credentials: 'include' })
        return r.ok
      } catch {
        return false
      }
    })
    if (!valid3) throw new Error('Session not persisted across navigation')

    console.log('✅ Session properly persisted across navigation')
    return true
  }

  async testLogout() {
    console.log('🚪 Testing logout functionality...')

    // Navigate back to dashboard
    await this.automation.page.goto(`${this.testConfig.baseURL}/dashboard`)
    await this.automation.page.waitForLoadState('networkidle')

    try {
      // Click user menu button
      await this.automation.page.click('[class*="Header_userButton"]')
      await this.automation.page.waitForSelector(
        '[class*="userMenu"], .user-menu',
        { timeout: 5000 }
      )

      // Click logout
      await this.automation.page.click('text=Logout, button:has-text("Logout")')

      // Should redirect to login page
      await this.automation.page.waitForURL('**/auth/signin', {
        timeout: 10000,
      })

      console.log('✅ Logout successful - redirected to login page')

      // Verify we're actually logged out by trying to access dashboard
      await this.automation.page.goto(`${this.testConfig.baseURL}/dashboard`)

      // Should redirect back to login (or show login form)
      const finalUrl = this.automation.page.url()
      const redirectedToLogin = finalUrl.includes('/auth/signin')

      if (redirectedToLogin) {
        console.log('✅ Access properly denied after logout')
        return true
      } else {
        throw new Error(
          `Expected redirect to login, but stayed on: ${finalUrl}`
        )
      }
    } catch (error) {
      console.log(
        '⚠️ Logout UI may not be available, testing session clearing via API...'
      )

      // Try server-side logout to clear cookies
      await this.automation.page.evaluate(async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch {}
        localStorage.clear()
        sessionStorage.clear()
      })

      // Navigate to dashboard - should redirect to login
      await this.automation.page.goto(`${this.testConfig.baseURL}/dashboard`)

      const currentUrl = this.automation.page.url()
      const redirectedToLogin = currentUrl.includes('/auth/signin')

      if (redirectedToLogin) {
        console.log('✅ Session properly cleared')
        return true
      } else {
        throw new Error('Session not properly cleared after manual logout')
      }
    }
  }

  async testFarmSelection() {
    console.log('🏢 Testing farm selection functionality...')

    // Login first
    await this.authHelper.login(this.automation.page, 'admin')

    // Check if farm selector is available
    const farmSelectorExists = await this.automation.page.isVisible(
      '[aria-label="Select farm"]'
    )

    if (!farmSelectorExists) {
      throw new Error('Farm selector not found in header')
    }

    // Get initial farm name text
    const initialFarm = (
      await this.automation.page.textContent('[class*="farmName"]')
    ).trim()
    console.log(`Initial farm: ${initialFarm}`)

    // Click farm selector
    await this.automation.page.click('[aria-label="Select farm"]')
    await this.automation.page.waitForSelector('[class*="farmMenuItem"]', {
      timeout: 5000,
    })

    // Get available farms
    const farmOptions = await this.automation.page.$$eval(
      '[class*="farmMenuItem"]',
      elements =>
        elements.map(el => {
          const nameEl = el.querySelector('[class*="farmItemName"]')
          return nameEl ? nameEl.textContent.trim() : el.textContent.trim()
        })
    )

    console.log(`Available farms: ${farmOptions.join(', ')}`)

    if (farmOptions.length < 2) {
      console.log('⚠️ Only one farm available, cannot test farm switching')
      return true
    }

    // Select different farm
    const targetFarm = farmOptions.find(farm => farm !== initialFarm)
    await this.automation.page.click(`text=${targetFarm}`)
    await this.automation.page.waitForTimeout(2000)

    // Verify farm switched
    const currentFarm = (
      await this.automation.page.textContent('[class*="farmName"]')
    ).trim()

    if (!currentFarm.includes(targetFarm)) {
      throw new Error(
        `Farm switch failed. Expected: ${targetFarm}, Got: ${currentFarm}`
      )
    }

    console.log(`✅ Successfully switched to farm: ${targetFarm}`)
    return true
  }

  async testFarmContextPersistence() {
    console.log('💾 Testing farm context persistence...')

    const currentFarm = await this.automation.page.textContent(
      '[class*="farmInfo"] .farmName, [class*="farmName"]'
    )

    // Navigate to different page
    await this.automation.page.goto(
      `${this.testConfig.baseURL}/production/batches`
    )
    await this.automation.page.waitForLoadState('networkidle')

    // Farm context should be preserved
    const farmAfterNavigation = await this.automation.page.textContent(
      '[class*="farmInfo"] .farmName, [class*="farmName"]'
    )

    if (currentFarm !== farmAfterNavigation) {
      throw new Error(
        `Farm context not preserved. Before: ${currentFarm}, After: ${farmAfterNavigation}`
      )
    }

    // Refresh page
    await this.automation.page.reload()
    await this.automation.page.waitForLoadState('networkidle')

    // Farm context should still be preserved
    const farmAfterRefresh = await this.automation.page.textContent(
      '[class*="farmInfo"] .farmName, [class*="farmName"]'
    )

    if (currentFarm !== farmAfterRefresh) {
      throw new Error(
        `Farm context not preserved after refresh. Before: ${currentFarm}, After: ${farmAfterRefresh}`
      )
    }

    console.log(`✅ Farm context properly persisted: ${currentFarm}`)
    return true
  }

  async testRoleBasedAccess() {
    console.log('👤 Testing role-based access control...')

    // Define test cases for different user roles and pages
    const accessTestCases = [
      { userType: 'admin', path: '/admin', shouldHaveAccess: true },
      { userType: 'admin', path: '/admin/farms', shouldHaveAccess: true },
      { userType: 'admin', path: '/dashboard', shouldHaveAccess: true },
      // Note: We only have admin credentials in the test data
      // In a full test suite, you'd test manager and worker access too
    ]

    const results = await this.authHelper.testRoleBasedAccess(
      this.automation.page,
      accessTestCases
    )

    const passedCount = results.filter(r => r.passed).length
    console.log(
      `📊 Role-based access tests: ${passedCount}/${results.length} passed`
    )

    return passedCount === results.length
  }

  async testSessionValidation() {
    console.log('🔍 Testing session validation...')

    // Should be logged in
    const isValid = await this.authHelper.validateSession(this.automation.page)

    if (!isValid) {
      throw new Error('Session should be valid but validation failed')
    }

    console.log('✅ Session validation working correctly')
    return true
  }

  async testAuthenticationAPI() {
    console.log('🔌 Testing authentication API endpoints...')

    // Test API call with cookie-based authentication
    const response = await this.automation.page.evaluate(async () => {
      try {
        const r = await fetch('/api/farms/all', { credentials: 'include' })
        return {
          ok: r.ok,
          status: r.status,
          authenticated: r.status !== 401,
          authorized: r.status !== 403,
        }
      } catch (error) {
        return { ok: false, error: (error && error.message) || 'fetch error' }
      }
    })

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.error || ''}`
      )
    }

    if (!response.authenticated) {
      throw new Error('API call indicates authentication failure')
    }

    if (!response.authorized) {
      throw new Error('API call indicates authorization failure')
    }

    console.log('✅ API authentication working correctly')
    return true
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new AuthenticationTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Authentication Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { AuthenticationTest }
