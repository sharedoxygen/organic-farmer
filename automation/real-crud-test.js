const { chromium } = require('@playwright/test')

class RealCRUDTest {
  constructor() {
    this.browser = null
    this.page = null
    this.baseURL = 'http://localhost:3005'
  }

  async init() {
    console.log('🚀 Initializing Real CRUD Test...')
    const headless = process.env.HEADLESS === 'true'
    this.browser = await chromium.launch({ headless })
    this.page = await this.browser.newPage()
  }

  async login(email = 'admin@ofms.com', password = 'REDACTED_TEST_PASSWORD') {
    console.log('🔐 Logging in...')
    await this.page.goto(`${this.baseURL}/auth/signin`)
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')
    await this.page.waitForURL('**/dashboard')
    console.log('✅ Logged in')
  }

  async selectFarm(farmName = 'Curry Island Microgreens') {
    console.log(`🏢 Selecting farm: ${farmName}`)
    await this.page.click('[aria-label="Select farm"]')
    await this.page.click(`text=${farmName}`)
    await this.page.waitForTimeout(1000)
    console.log('✅ Farm selected')
  }

  async getDashboardBatchCount() {
    console.log('📊 Checking dashboard batch count...')
    await this.page.goto(`${this.baseURL}/dashboard`)
    await this.page.waitForLoadState('networkidle')
    const countText = await this.page.innerText(
      '[class*="metric"]:has-text("Total Batches") .value, .card:has-text("Total Batches") h3'
    )
    const count = parseInt(countText.trim(), 10)
    console.log(`Current Total Batches: ${count}`)
    return count
  }

  async testProductionBatchesCRUD() {
    console.log('\n🔨 Starting Real CRUD Test for Production Batches')

    // Get initial count
    const initialCount = await this.getDashboardBatchCount()

    // 1. Create
    console.log('1. Creating new batch...')
    await this.page.goto(`${this.baseURL}/production/batches`)
    await this.page.click(
      'button:has-text("Create Batch"), button:has-text("New Batch"), .Button_primary__*'
    )
    await this.page.waitForSelector('.modal, [class*="Modal"]')

    const testBatch = {
      number: `TEST_BATCH_${Date.now()}`,
      quantity: '50',
      unit: 'plants',
      seedVariety: 'Arugula', // Assuming this exists
      plantDate: new Date().toISOString().split('T')[0],
      harvestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      notes: 'Test batch for automation',
    }

    await this.page.fill('input[name="batchNumber"]', testBatch.number)
    await this.page.fill('input[name="quantity"]', testBatch.quantity)
    await this.page.selectOption('select[name="unit"]', testBatch.unit)
    await this.page.selectOption('select[name="seedVarietyId"]', {
      label: testBatch.seedVariety,
    })
    await this.page.fill('input[name="plantDate"]', testBatch.plantDate)
    await this.page.fill(
      'input[name="expectedHarvestDate"]',
      testBatch.harvestDate
    )
    await this.page.fill('textarea[name="notes"]', testBatch.notes)

    await this.page.click('button[type="submit"], button:has-text("Create")')
    await this.page.waitForTimeout(2000)

    // Verify creation
    const created = await this.page.isVisible(`text=${testBatch.number}`)
    if (!created) throw new Error('Batch creation failed')
    console.log('✅ Batch created')

    // 2. Verify dashboard increment
    const newCount = await this.getDashboardBatchCount()
    if (newCount !== initialCount + 1)
      throw new Error(`Count did not increment: ${initialCount} -> ${newCount}`)
    console.log('✅ Dashboard count incremented')

    // 3. Update
    console.log('3. Updating batch...')
    await this.page.goto(`${this.baseURL}/production/batches`)
    await this.page.click(
      `[data-batch="${testBatch.number}"] .edit-button, button:has-text("Edit")`
    )
    await this.page.waitForSelector('.modal')

    const updatedNotes = 'Updated test batch notes'
    await this.page.fill('textarea[name="notes"]', updatedNotes)
    await this.page.click('button[type="submit"]')
    await this.page.waitForTimeout(2000)

    const updated = await this.page.isVisible(`text=${updatedNotes}`)
    if (!updated) throw new Error('Batch update failed')
    console.log('✅ Batch updated')

    // 4. Delete
    console.log('4. Deleting batch...')
    await this.page.goto(`${this.baseURL}/production/batches`)
    await this.page.click(
      `[data-batch="${testBatch.number}"] .delete-button, button:has-text("Delete")`
    )
    if (await this.page.isVisible('.confirmation-modal')) {
      await this.page.click('button:has-text("Confirm")')
    }
    await this.page.waitForTimeout(2000)

    const deleted = !(await this.page.isVisible(`text=${testBatch.number}`))
    if (!deleted) throw new Error('Batch deletion failed')
    console.log('✅ Batch deleted')

    // 5. Verify cleanup and dashboard decrement
    const finalCount = await this.getDashboardBatchCount()
    if (finalCount !== initialCount)
      throw new Error(
        `Count did not return to original: ${finalCount} != ${initialCount}`
      )
    console.log('✅ Dashboard count restored - cleanup complete')

    return true
  }

  async close() {
    await this.browser.close()
    console.log('🏁 Test complete')
  }
}

async function main() {
  const test = new RealCRUDTest()
  await test.init()
  await test.login()
  await test.selectFarm()

  try {
    await test.testProductionBatchesCRUD()
    console.log('\n🎉 All Real CRUD Tests Passed!')
  } catch (error) {
    console.error('\n❌ Test Failed:', error)
  } finally {
    await test.close()
  }
}

if (require.main === module) {
  main()
}
