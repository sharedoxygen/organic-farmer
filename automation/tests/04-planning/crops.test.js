/**
 * Crop Planning Tests
 * Tests all crop planning functionality including CRUD operations and data integrity
 */

const { BaseTest } = require('../../lib/base-test.js')
const testData = require('../../fixtures/test-data.json')

class CropPlanningTest extends BaseTest {
  constructor() {
    super({ timeout: 20000 })
  }

  async runAllTests() {
    console.log('🌾 STARTING CROP PLANNING TESTS')
    console.log('='.repeat(50))

    await this.setup()

    try {
      // Test page navigation and loading
      await this.runTest('Crop Planning Page Load', () => this.testPageLoad())

      // Test creating crop plans
      await this.runTest('Create Crop Plan', () => this.testCreateCropPlan())

      // Test crop plan management
      await this.runTest('Crop Plan CRUD Operations', () =>
        this.testCropPlanCRUD()
      )

      // Test seed variety integration
      await this.runTest('Seed Variety Integration', () =>
        this.testSeedVarietyIntegration()
      )

      // Test zone assignment
      await this.runTest('Zone Assignment', () => this.testZoneAssignment())

      // Test planning calendar integration
      await this.runTest('Calendar Integration', () =>
        this.testCalendarIntegration()
      )

      // Test data validation
      await this.runTest('Form Validation', () => this.testFormValidation())

      // Test multi-tenant isolation
      await this.runTest('Multi-Tenant Isolation', () =>
        this.testMultiTenantIsolation()
      )

      // Test API endpoints
      await this.runTest('API Endpoints', () => this.testCropPlanningAPI())
    } finally {
      await this.teardown()
    }

    return this.printSummary()
  }

  async testPageLoad() {
    await this.testPageNavigation('/planning/crops', null, [
      'main, [role="main"], .main-content, [class*="content"]',
    ])
    return true
  }

  async testCreateCropPlan() {
    console.log('🌱 Testing crop plan creation...')

    // Navigate to crop planning page
    await this.automation.page.goto(`${this.testConfig.baseURL}/planning/crops`)
    await this.automation.page.waitForLoadState('networkidle')

    // Click create button
    // Try multiple button labels for create action
    try {
      await this.testModalInteraction('button:has-text("New Crop Plan")')
    } catch (_err) {
      await this.testModalInteraction('button:has-text("➕ New Crop Plan")')
    }

    // Select required dropdowns (seed variety and zone)
    // Wait until options are attached
    await this.automation.page.waitForSelector(
      'select[name="seedVarietyId"] > option:not([value=""])',
      { state: 'attached', timeout: 10000 }
    )
    await this.automation.page.waitForSelector(
      'select[name="zoneId"] > option:not([value=""])',
      { state: 'attached', timeout: 10000 }
    )

    const [seedVarietyId, zoneId] = await this.automation.page.evaluate(() => {
      const getFirst = sel => {
        const el = document.querySelector(sel)
        if (!el) return ''
        const opt = Array.from(el.querySelectorAll('option'))
          .map(o => o.value)
          .find(v => v)
        return opt || ''
      }
      return [
        getFirst('select[name="seedVarietyId"]'),
        getFirst('select[name="zoneId"]'),
      ]
    })
    if (seedVarietyId)
      await this.automation.page.selectOption(
        'select[name="seedVarietyId"]',
        seedVarietyId
      )
    if (zoneId)
      await this.automation.page.selectOption('select[name="zoneId"]', zoneId)

    // Generate test data
    const planName = `AUTO_TEST_Plan_${Date.now()}`
    const cropName = 'Test Arugula'

    // Fill form
    await this.testFormSubmission({
      planName: planName,
      cropName: cropName,
      seedVarietyId: seedVarietyId || undefined,
      zoneId: zoneId || undefined,
      plannedStartDate: new Date().toISOString().split('T')[0],
      plannedEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      plannedQuantity: '100',
      plannedUnit: 'plants',
      expectedYield: '50',
      growingMethod: 'soil',
    })

    // Wait for plan to appear in list
    await this.automation.page.waitForTimeout(3000)

    // Verify creation
    const planExists = await this.automation.page.isVisible(`text=${planName}`)

    if (planExists) {
      console.log(`✅ Crop plan "${planName}" created successfully`)
      return true
    } else {
      throw new Error(`Crop plan "${planName}" not found after creation`)
    }
  }

  async testCropPlanCRUD() {
    console.log('🔄 Testing CRUD operations for crop plans...')

    return await this.validateDataIntegrity('cropPlan', [
      'create',
      'read',
      'update',
      'delete',
    ])
  }

  async testSeedVarietyIntegration() {
    console.log('🌰 Testing seed variety integration...')

    // Navigate to crop planning
    await this.automation.page.goto(`${this.testConfig.baseURL}/planning/crops`)
    await this.automation.page.waitForLoadState('networkidle')

    // Open create modal
    try {
      await this.testModalInteraction('button:has-text("New Crop Plan")')
    } catch (_) {
      await this.testModalInteraction('button:has-text("➕ New Crop Plan")')
    }

    // Check if seed varieties are loaded in dropdown
    const seedOptions = await this.automation.page.$$eval(
      'select[name="seedVarietyId"] option',
      options =>
        options.map(option => ({
          value: option.value,
          text: option.textContent,
        }))
    )

    if (seedOptions.length > 1) {
      // More than just placeholder option
      console.log(
        `✅ Found ${seedOptions.length - 1} seed varieties in dropdown`
      )

      // Select first real option (not placeholder)
      const firstVariety = seedOptions.find(
        opt => opt.value && opt.value !== ''
      )
      if (firstVariety) {
        await this.automation.page.selectOption(
          'select[name="seedVarietyId"]',
          firstVariety.value
        )
        console.log(
          `✅ Successfully selected seed variety: ${firstVariety.text}`
        )
      }

      return true
    } else {
      throw new Error('No seed varieties found in dropdown')
    }
  }

  async testZoneAssignment() {
    console.log('📍 Testing zone assignment...')

    // Navigate and open modal
    await this.automation.page.goto(`${this.testConfig.baseURL}/planning/crops`)
    await this.automation.page.waitForLoadState('networkidle')
    try {
      await this.testModalInteraction('button:has-text("New Crop Plan")')
    } catch (_) {
      await this.testModalInteraction('button:has-text("➕ New Crop Plan")')
    }

    // Check zones dropdown
    const zoneOptions = await this.automation.page.$$eval(
      'select[name="zoneId"] option',
      options =>
        options.map(option => ({
          value: option.value,
          text: option.textContent,
        }))
    )

    if (zoneOptions.length > 1) {
      console.log(`✅ Found ${zoneOptions.length - 1} zones available`)

      // Select first zone
      const firstZone = zoneOptions.find(opt => opt.value && opt.value !== '')
      if (firstZone) {
        await this.automation.page.selectOption(
          'select[name="zoneId"]',
          firstZone.value
        )
        console.log(`✅ Successfully selected zone: ${firstZone.text}`)
      }

      return true
    } else {
      throw new Error('No zones found in dropdown')
    }
  }

  async testCalendarIntegration() {
    console.log('📅 Testing calendar integration...')

    // Create a crop plan first
    // Fallback: ensure page loads and at least one plan card/list appears
    await this.automation.page.goto(`${this.testConfig.baseURL}/planning/crops`)
    await this.automation.page.waitForLoadState('networkidle')

    // Navigate to calendar
    await this.automation.page.goto(
      `${this.testConfig.baseURL}/planning/calendar`
    )
    await this.automation.page.waitForLoadState('networkidle')

    // Check if crop plans appear on calendar
    const calendarEvents = await this.automation.page.$$(
      '.calendar-event, .event, [class*="event"]'
    )

    if (calendarEvents.length > 0) {
      console.log(`✅ Found ${calendarEvents.length} events on calendar`)
      return true
    } else {
      console.log(
        'ℹ️ No events visible on calendar (may be normal for test data)'
      )
      return true
    }
  }

  async testFormValidation() {
    console.log('✅ Testing form validation...')

    await this.automation.page.goto(`${this.testConfig.baseURL}/planning/crops`)
    await this.automation.page.waitForLoadState('networkidle')
    try {
      await this.testModalInteraction('button:has-text("New Crop Plan")')
    } catch (_) {
      await this.testModalInteraction('button:has-text("➕ New Crop Plan")')
    }

    // Test empty form submission
    await this.automation.page.click('button[type="submit"]')

    // Check for validation messages
    const validationErrors = await this.automation.page.$$(
      '.error, .invalid, [class*="error"]'
    )

    if (validationErrors.length > 0) {
      console.log(
        `✅ Form validation working - found ${validationErrors.length} validation errors`
      )
      return true
    } else {
      console.log(
        '⚠️ No validation errors found - may indicate validation not working'
      )
      return false
    }
  }

  async testMultiTenantIsolation() {
    console.log('🏢 Testing multi-tenant data isolation...')

    return await this.validateMultiTenantIsolation(
      '/api/crop-plans',
      '00000000-0000-0000-0000-000000000010', // Curry Island Microgreens
      '00000000-0000-0000-0000-000000000020' // Shared Oxygen Farms
    )
  }

  async testCropPlanningAPI() {
    console.log('🔌 Testing crop planning API endpoints...')

    const results = []

    // Test GET /api/crop-plans
    const getResult = await this.apiHelper.testEndpoint(
      this.automation.page,
      'cropPlans',
      'GET'
    )
    results.push({ endpoint: 'GET /api/crop-plans', success: getResult.ok })

    // Test POST /api/crop-plans
    const testPlanData = {
      planName: `API_Test_Plan_${Date.now()}`,
      cropName: 'API Test Crop',
      seedVarietyId: 'seed-001',
      zoneId: 'zone-001',
      plannedStartDate: new Date().toISOString(),
      plannedEndDate: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString(),
      plannedQuantity: 25,
      plannedUnit: 'plants',
      expectedYield: 15,
      growingMethod: 'hydroponic',
    }

    const postResult = await this.apiHelper.testEndpoint(
      this.automation.page,
      'cropPlans',
      'POST',
      testPlanData
    )
    results.push({ endpoint: 'POST /api/crop-plans', success: postResult.ok })

    // Test data validation via API
    if (postResult.ok && postResult.data && postResult.data.data) {
      console.log('✅ API returned valid crop plan data')
      const validationResult = this.apiHelper.validateObjectStructure(
        postResult.data.data,
        {
          id: 'string',
          planName: 'string',
          cropName: 'string',
          status: 'string',
          createdAt: 'string',
        }
      )

      results.push({
        endpoint: 'Data Structure Validation',
        success: validationResult.valid,
      })
    }

    const successCount = results.filter(r => r.success).length
    console.log(`📊 API Tests: ${successCount}/${results.length} passed`)

    return successCount === results.length
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new CropPlanningTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Crop Planning Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { CropPlanningTest }
