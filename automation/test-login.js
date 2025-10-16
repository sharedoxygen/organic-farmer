/**
 * Simple login test for OFMS
 * Tests basic authentication functionality
 */

const { OFMSAutomation } = require('./ofms-data-entry.js')

async function testLogin() {
  const automation = new OFMSAutomation()

  try {
    console.log('🧪 Testing OFMS Login...')

    await automation.init()
    await automation.login()

    console.log('✅ Login test passed!')
    console.log('🏢 Available farms should be visible in header')

    // Keep browser open for 10 seconds to inspect
    console.log('⏳ Keeping browser open for inspection...')
    await automation.page.waitForTimeout(10000)
  } catch (error) {
    console.error('❌ Login test failed:', error)
  } finally {
    await automation.close()
  }
}

// Run if called directly
if (require.main === module) {
  testLogin()
}

module.exports = { testLogin }
