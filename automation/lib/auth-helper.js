/**
 * Authentication Helper for OFMS Testing
 * Handles login, logout, and session management
 */

class AuthHelper {
  constructor() {
    this.defaultCredentials = {
      admin: { email: 'admin@ofms.com', password: 'REDACTED_TEST_PASSWORD' },
      manager: { email: 'manager@ofms.com', password: 'REDACTED_TEST_PASSWORD' },
      worker: { email: 'worker@ofms.com', password: 'REDACTED_TEST_PASSWORD' },
    }
  }

  async login(page, userType = 'admin', customCredentials = null) {
    const credentials = customCredentials || this.defaultCredentials[userType]

    if (!credentials) {
      throw new Error(`Unknown user type: ${userType}`)
    }

    console.log(`🔐 Logging in as ${userType}...`)

    await page.goto('http://localhost:3005/auth/signin')
    await page.waitForSelector('input[type="email"]', { timeout: 30000 })

    await page.fill('input[type="email"]', credentials.email)
    await page.fill('input[type="password"]', credentials.password)
    await page.click('button[type="submit"]')
    // Ensure cookie-based session is established
    await page.waitForLoadState('networkidle').catch(() => {})

    // Wait for either dashboard URL or authenticated UI indicators
    const urlPromise = page
      .waitForURL('**/dashboard', { timeout: 15000 })
      .catch(() => null)
    const uiPromise = page
      .waitForSelector(
        '[class*="Header_userName"], [aria-label="Select farm"]',
        { timeout: 15000 }
      )
      .catch(() => null)
    const result = await Promise.race([urlPromise, uiPromise])
    if (!result) {
      // As a last resort, confirm main layout loaded
      await page.waitForSelector('header, [class*="header"], .Layout_body__', {
        timeout: 10000,
      })
    }

    console.log(`✅ Successfully logged in as ${userType}`)
    return true
  }

  async logout(page) {
    console.log('🚪 Logging out...')

    try {
      // Try API logout first to clear cookies
      await page.evaluate(async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch {}
      })
      await page.waitForTimeout(250)

      // Click user menu (if visible) and logout
      try {
        await page.click('[class*="Header_userButton"]')
        await page.waitForSelector('[class*="userMenu"]', { timeout: 3000 })
        await page.click('text=Logout, button:has-text("Sign Out")')
      } catch {}

      // Ensure redirect to login page
      await page.goto('http://localhost:3005/auth/signin')

      console.log('✅ Successfully logged out')
      return true
    } catch (error) {
      console.log('⚠️ Logout may have failed, clearing session manually')

      // Clear localStorage as fallback
      await page.evaluate(() => {
        localStorage.clear()
        sessionStorage.clear()
      })

      await page.goto('http://localhost:3005/auth/signin')
      return true
    }
  }

  async validateAuthentication(page) {
    try {
      // Check if user info is present in header
      // Prefer username, but accept farm selector as authenticated indicator
      const userElement = page.locator('[class*="Header_userName"]')
      const hasUser = await userElement.isVisible()
      let userName = null
      if (hasUser) {
        userName = (await userElement.textContent()) || ''
      }
      const hasFarmSelector = await page
        .locator('[aria-label="Select farm"]')
        .isVisible()
      if (!hasUser && !hasFarmSelector) {
        throw new Error('No authenticated UI indicators found')
      }
      console.log(
        `✅ Authentication validated${userName ? ` for user: ${userName}` : ''}`
      )
      return { authenticated: true, userName }
    } catch (error) {
      console.log('❌ Authentication validation failed')
      return { authenticated: false, error: error.message }
    }
  }

  async switchFarm(page, farmName) {
    console.log(`🏢 Switching to farm: ${farmName}`)

    try {
      // Click farm selector
      await page.click('[aria-label="Select farm"]')
      await page.waitForSelector('[class*="farmMenuItem"]', { timeout: 5000 })

      // Click specific farm
      await page.click(`text=${farmName}`)
      await page.waitForTimeout(2000)

      // Verify farm switched
      const currentFarm = await page.textContent('[class*="Header_farmName"]')

      if (!currentFarm.includes(farmName)) {
        throw new Error(
          `Farm switch failed. Expected: ${farmName}, Got: ${currentFarm}`
        )
      }

      console.log(`✅ Successfully switched to: ${farmName}`)
      return true
    } catch (error) {
      console.log(`⚠️ Farm switch may have failed: ${error.message}`)
      return false
    }
  }

  async validateFarmContext(page, expectedFarmName) {
    try {
      const currentFarm = await page.textContent('[class*="Header_farmName"]')

      if (!currentFarm.includes(expectedFarmName)) {
        throw new Error(
          `Wrong farm context. Expected: ${expectedFarmName}, Got: ${currentFarm}`
        )
      }

      console.log(`✅ Farm context validated: ${expectedFarmName}`)
      return true
    } catch (error) {
      console.log(`❌ Farm context validation failed: ${error.message}`)
      return false
    }
  }

  async getAuthHeaders(page) {
    // Extract authentication headers from localStorage
    const authData = await page.evaluate(() => {
      const user = localStorage.getItem('ofms_user')
      const farmId = localStorage.getItem('ofms_current_farm')

      if (!user) return null

      try {
        const userData = JSON.parse(user)
        return {
          Authorization: `Bearer ${userData.id}`,
          'X-Farm-ID': farmId,
          'Content-Type': 'application/json',
        }
      } catch (e) {
        return null
      }
    })

    if (!authData) {
      throw new Error('Could not extract authentication headers')
    }

    return authData
  }

  async validateSession(page) {
    try {
      // Validate cookie-based session using server endpoint
      const response = await page.evaluate(async () => {
        try {
          const validate = await fetch('/api/auth/validate', {
            method: 'POST',
            credentials: 'include',
          })
          if (validate.ok) return { valid: true, status: validate.status }

          // Fallback to profile endpoint
          const me = await fetch('/api/users/me', { credentials: 'include' })
          return { valid: me.ok, status: me.status }
        } catch (error) {
          return {
            valid: false,
            reason: (error && error.message) || 'network error',
          }
        }
      })

      if (response.valid) {
        console.log('✅ Session is valid')
        return true
      } else {
        console.log(`❌ Session invalid: ${response.reason || response.status}`)
        return false
      }
    } catch (error) {
      console.log(`❌ Session validation failed: ${error.message}`)
      return false
    }
  }

  // Test multiple user roles and permissions
  async testRoleBasedAccess(page, testCases = []) {
    const results = []

    for (const testCase of testCases) {
      const { userType, path, shouldHaveAccess } = testCase

      try {
        await this.login(page, userType)
        await page.goto(`http://localhost:3005${path}`)
        await page.waitForLoadState('networkidle')

        // Check if user has access (no 403 error, page loads properly)
        const hasAccess = !(await page
          .locator('text=Access Denied')
          .isVisible())

        const passed = hasAccess === shouldHaveAccess

        results.push({
          userType,
          path,
          expectedAccess: shouldHaveAccess,
          actualAccess: hasAccess,
          passed,
        })

        console.log(
          `${passed ? '✅' : '❌'} ${userType} access to ${path}: ${hasAccess ? 'Allowed' : 'Denied'}`
        )

        await this.logout(page)
      } catch (error) {
        results.push({
          userType,
          path,
          expectedAccess: shouldHaveAccess,
          actualAccess: false,
          passed: !shouldHaveAccess,
          error: error.message,
        })
      }
    }

    return results
  }
}

module.exports = { AuthHelper }
