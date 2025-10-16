/**
 * OFMS Browser Automation Script
 * Automates data entry into the Organic Farm Management System
 *
 * Usage: node automation/ofms-data-entry.js
 */

const { chromium } = require('@playwright/test')

class OFMSAutomation {
  constructor() {
    this.browser = null
    this.page = null
    this.baseURL = 'http://localhost:3005'
  }

  async init() {
    console.log('🚀 Initializing OFMS Automation...')
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      slowMo: 200, // Optimized for faster execution
    })
    this.page = await this.browser.newPage()
  }

  async login(email = 'admin@ofms.com', password = 'REDACTED_TEST_PASSWORD') {
    console.log('🔐 Logging in...')
    await this.page.goto(`${this.baseURL}/auth/signin`)

    // Wait for login form
    await this.page.waitForSelector('input[type="email"]')

    // Fill login credentials
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)

    // Submit login
    await this.page.click('button[type="submit"]')

    // Wait for dashboard to load
    await this.page.waitForURL('**/dashboard', { timeout: 10000 }) // Wait up to 10 seconds for redirect
    console.log('✅ Successfully logged in')

    // Wait for the main app layout to be ready before proceeding
    console.log('⏳ Waiting for application to initialize...')
    await this.page.waitForSelector('[class*="Header_userName"]', {
      timeout: 10000,
    })
    console.log('✅ Application initialized.')
  }

  async selectFarm(farmName = 'Shared Oxygen Farms') {
    console.log(`🏢 Selecting farm: ${farmName}`)

    try {
      // Wait for page to fully load after login
      await this.page.waitForTimeout(3000)

      // Look for farm selector button in header
      const farmSelector = this.page.locator('[aria-label="Select farm"]')
      await farmSelector.waitFor({ timeout: 10000 })

      console.log('🔍 Found farm selector button, clicking...')
      await farmSelector.click()

      // Wait for dropdown to appear and find farm
      console.log('⏳ Waiting for farm dropdown...')
      await this.page.waitForSelector('[class*="farmMenuItem"]', {
        timeout: 10000,
      })

      // Click the specific farm
      const farmButton = this.page.locator(
        `[class*="farmMenuItem"]:has-text("${farmName}")`
      )
      await farmButton.waitFor({ timeout: 5000 })
      await farmButton.click()

      console.log(`✅ Selected farm: ${farmName}`)
      await this.page.waitForTimeout(3000) // Wait for farm context to update
    } catch (error) {
      console.log(
        `ℹ️  Farm selector not available or farm already selected: ${error.message}`
      )
      // Continue with demo even if farm selection fails
    }
  }

  async createSeedVariety(seedData) {
    console.log('🌱 Creating new seed variety...')

    // Navigate to Seeds & Genetics
    await this.page.goto(`${this.baseURL}/production/seeds`)
    await this.page.waitForLoadState('networkidle')

    // Click "Add New Variety" button
    await this.page.click('button:has-text("Add New Variety")')

    // Wait for modal to open
    await this.page.waitForSelector('.modal')

    // Fill seed variety form
    await this.page.fill('input[name="name"]', seedData.name)
    await this.page.fill(
      'input[name="scientificName"]',
      seedData.scientificName
    )
    await this.page.fill('input[name="supplier"]', seedData.supplier)
    await this.page.fill(
      'input[name="stockQuantity"]',
      seedData.stockQuantity.toString()
    )
    await this.page.fill(
      'input[name="minStockLevel"]',
      seedData.minStockLevel.toString()
    )
    await this.page.fill(
      'input[name="costPerUnit"]',
      seedData.costPerUnit.toString()
    )
    await this.page.fill(
      'input[name="germinationRate"]',
      seedData.germinationRate.toString()
    )
    await this.page.fill(
      'input[name="daysToHarvest"]',
      seedData.daysToHarvest.toString()
    )

    // Submit form
    await this.page.click('button:has-text("Save")')

    // Wait for modal to close
    await this.page.waitForSelector('.modal', { state: 'hidden' })
    console.log(`✅ Created seed variety: ${seedData.name}`)
  }

  async createGrowingEnvironment(environmentData) {
    console.log('🏠 Creating growing environment...')

    // Navigate to Growing Environments
    await this.page.goto(`${this.baseURL}/production/environments`)
    await this.page.waitForLoadState('networkidle')

    // Click "Add Environment" button
    await this.page.click('button:has-text("Add Environment")')

    // Wait for form/modal
    await this.page.waitForSelector('input[name="name"], .modal')

    // Fill environment form
    await this.page.fill('input[name="name"]', environmentData.name)
    await this.page.fill('input[name="location"]', environmentData.location)
    await this.page.fill('input[name="size"]', environmentData.size.toString())
    await this.page.selectOption(
      'select[name="environmentType"]',
      environmentData.type
    )

    // Submit form
    await this.page.click('button:has-text("Save"), button:has-text("Create")')

    console.log(`✅ Created environment: ${environmentData.name}`)
  }

  async createCustomer(customerData) {
    console.log('👥 Creating B2B customer...')

    // Navigate to B2B Customers
    await this.page.goto(`${this.baseURL}/sales/b2b-customers`)
    await this.page.waitForLoadState('networkidle')

    // Click "Add Customer" button
    await this.page.click(
      'button:has-text("Add Customer"), button:has-text("Add New")'
    )

    // Wait for form
    await this.page.waitForSelector(
      'input[name="companyName"], input[name="name"]'
    )

    // Fill customer form
    const nameField = await this.page
      .locator('input[name="companyName"], input[name="name"]')
      .first()
    await nameField.fill(customerData.name)

    if (await this.page.locator('input[name="contactPerson"]').isVisible()) {
      await this.page.fill(
        'input[name="contactPerson"]',
        customerData.contactPerson
      )
    }

    if (await this.page.locator('input[name="email"]').isVisible()) {
      await this.page.fill('input[name="email"]', customerData.email)
    }

    if (await this.page.locator('input[name="phone"]').isVisible()) {
      await this.page.fill('input[name="phone"]', customerData.phone)
    }

    // Submit form
    await this.page.click('button:has-text("Save"), button:has-text("Create")')

    console.log(`✅ Created customer: ${customerData.name}`)
  }

  async submitFeedback(feedbackData) {
    console.log('💬 Submitting feedback...')

    // Click floating feedback button
    await this.page.click('.feedbackButton.floating')

    // Wait for feedback modal
    await this.page.waitForSelector('.feedbackModal')

    // Fill feedback form
    await this.page.fill('input[name="title"]', feedbackData.title)
    await this.page.selectOption('select[name="type"]', feedbackData.type)
    await this.page.selectOption(
      'select[name="priority"]',
      feedbackData.priority
    )
    await this.page.fill(
      'textarea[name="description"]',
      feedbackData.description
    )

    // Submit feedback
    await this.page.click('button:has-text("Submit")')

    // Wait for success message
    await this.page.waitForSelector('.toast', { timeout: 10000 })
    console.log(`✅ Submitted feedback: ${feedbackData.title}`)
  }

  async runDemo() {
    try {
      await this.init()
      await this.login()

      // Select microgreens farm for this test run
      await this.selectFarm('Curry Island Microgreens')

      // Execute a new end-to-end test for Curry Island
      await this.runCurryIslandE2ETest()

      console.log('🎉 Demo completed successfully!')
    } catch (error) {
      console.error('❌ Automation failed:', error)
    }
  }

  async runCurryIslandE2ETest() {
    console.log('🧪 Starting End-to-End Test for Curry Island Microgreens...')
    console.log('---------------------------------------------------------')

    // Phase 1: Planning
    await this.testCropPlanning()

    // Phase 2: Production
    await this.testProductionOperations()

    console.log('✅ End-to-End Test for Curry Island Microgreens completed.')
    console.log('-----------------------------------------------------------')
  }

  async testCropPlanning() {
    console.log('\nPHASE 1: TESTING CROP PLANNING...')
    await this.page.goto(`${this.baseURL}/planning/crops`)
    await this.page.waitForLoadState('networkidle')

    const planName = `Automated Arugula Plan ${Date.now()}`
    console.log(`📝 Creating new crop plan: "${planName}"`)

    // --- DIAGNOSTIC STEP ---
    console.log('📸 Taking screenshot and dumping HTML for debugging...')
    await this.page.screenshot({ path: 'debug_screenshot.png', fullPage: true })
    const pageHtml = await this.page.content()
    require('fs').writeFileSync('debug_page.html', pageHtml)
    console.log(
      '✅ Diagnostic files saved to debug_screenshot.png and debug_page.html in the automation directory.'
    )
    // -----------------------

    // Click "New Crop Plan" button, now with the correct emoji
    await this.page.click('button:has-text("➕ New Crop Plan")')

    // Wait for modal and fill form
    await this.page.waitForSelector('div[class*="modalOverlay"]')
    console.log('🔍 Modal opened, filling form...')

    await this.page.fill('input[name="planName"]', planName)

    // Final selector fix: Wait for options to be attached (not necessarily visible)
    console.log('⏳ Waiting for seed variety options to populate...');
    await this.page.waitForSelector('select[name="seedVarietyId"] > option[value*="seed-"]', { state: 'attached' });
    console.log('✅ Seed varieties are attached to the DOM.');

    const arugulaValue = await this.page.$eval('select[name="seedVarietyId"] > option:has-text("Arugula")', el => el.value);
    await this.page.selectOption('select[name="seedVarietyId"]', arugulaValue);
    console.log(`🌱 Selected Arugula (Value: ${arugulaValue})`);

    // Fill the rest of the form
    await this.page.fill('input[name="plannedQuantity"]', '100')
    await this.page.fill('input[name="plannedStartDate"]', '2025-09-01')
    await this.page.fill('input[name="plannedEndDate"]', '2025-09-22')
    await this.page.fill('input[name="expectedYield"]', '50') // Assuming lbs

    // Zone is also a required field. We need to wait for zones to load as well.
    // Also wait for the zone options to populate
    console.log('⏳ Waiting for zone options to populate...')
    await this.page.waitForSelector(
      'select[name="zoneId"] > option[value*="zone-"]',
      { state: 'attached' }
    )
    console.log('✅ Zones are attached to the DOM.')

    const firstZoneValue = await this.page.$eval(
      'select[name="zoneId"] > option[value*="zone-"]',
      el => el.value
    )
    await this.page.selectOption('select[name="zoneId"]', firstZoneValue)
    console.log(`📍 Selected first available zone (Value: ${firstZoneValue})`)

    // Save the plan
    await this.page.click('button[type="submit"]')
    console.log('💾 Saving plan...')

    // Wait for page to refresh after save
    await this.page.waitForTimeout(2000);

    // Verify the plan was created by looking for the new card
    await this.page.waitForSelector(`text=${planName}`);
    console.log(`✅ Successfully created and verified crop plan.`)
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      console.log('🏁 Browser closed')
    }
  }
}

// Sample data sets for different scenarios
const SAMPLE_DATA = {
  cannabis: {
    seeds: [
      {
        name: 'Blue Dream',
        scientificName: 'Cannabis sativa L.',
        supplier: 'Elite Seeds',
        stockQuantity: 50,
        minStockLevel: 10,
        costPerUnit: 12.99,
        germinationRate: 0.92,
        daysToHarvest: 70,
      },
      {
        name: 'OG Kush',
        scientificName: 'Cannabis indica L.',
        supplier: 'Premium Genetics',
        stockQuantity: 75,
        minStockLevel: 15,
        costPerUnit: 18.5,
        germinationRate: 0.89,
        daysToHarvest: 60,
      },
    ],
    customers: [
      {
        name: 'California Cannabis Co.',
        contactPerson: 'Alice Johnson',
        email: 'alice@cacannabis.com',
        phone: '(555) 111-2222',
      },
      {
        name: 'Bay Area Dispensary',
        contactPerson: 'Bob Wilson',
        email: 'bob@baydispensary.com',
        phone: '(555) 333-4444',
      },
    ],
  },
  microgreens: {
    seeds: [
      {
        name: 'Arugula Microgreens',
        scientificName: 'Eruca sativa',
        supplier: 'Organic Seeds Ltd.',
        stockQuantity: 200,
        minStockLevel: 50,
        costPerUnit: 3.99,
        germinationRate: 0.98,
        daysToHarvest: 14,
      },
      {
        name: 'Kale Microgreens',
        scientificName: 'Brassica oleracea',
        supplier: 'Green Thumb Supply',
        stockQuantity: 150,
        minStockLevel: 30,
        costPerUnit: 4.25,
        germinationRate: 0.96,
        daysToHarvest: 16,
      },
    ],
    customers: [
      {
        name: 'Farm to Table Restaurant',
        contactPerson: 'Chef Maria',
        email: 'maria@farmtotable.com',
        phone: '(555) 555-6666',
      },
      {
        name: 'Whole Foods Market',
        contactPerson: 'David Kim',
        email: 'david.kim@wholefoods.com',
        phone: '(555) 777-8888',
      },
    ],
  },
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const automation = new OFMSAutomation()

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping automation...')
    await automation.close()
    process.exit(0)
  })

  // Run demo
  automation
    .runDemo()
    .then(() => {
      console.log('✨ Demo completed. Browser will remain open for inspection.')
      console.log('Press Ctrl+C to close.')
    })
    .catch(async error => {
      console.error('💥 Demo failed:', error)
      await automation.close()
      process.exit(1)
    })
}

module.exports = { OFMSAutomation, SAMPLE_DATA }
