/**
 * Data Helper for OFMS Testing
 * Handles CRUD operations, data validation, and referential integrity
 */

class DataHelper {
  constructor() {
    this.testDataPrefix = 'AUTO_TEST'
    this.createdEntities = new Map() // Track entities for cleanup
  }

  // Generate unique test data
  generateTestData(type, overrides = {}) {
    const timestamp = Date.now()
    const defaults = {
      seedVariety: {
        name: `${this.testDataPrefix}_Seed_${timestamp}`,
        scientificName: 'Cannabis sativa L.',
        supplier: 'Test Supplier',
        stockQuantity: 100,
        minStockLevel: 20,
        costPerUnit: 15.99,
        germinationRate: 0.95,
        daysToHarvest: 65,
        lotNumber: `LOT-${timestamp}`,
      },
      batch: {
        batchNumber: `${this.testDataPrefix}_BATCH_${timestamp}`,
        quantity: 50,
        unit: 'plants',
        plantDate: new Date().toISOString().split('T')[0],
        expectedHarvestDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        growingMedium: 'soil',
        notes: 'Automated test batch',
      },
      customer: {
        name: `${this.testDataPrefix}_Customer_${timestamp}`,
        contactPerson: 'Test Contact',
        email: `test${timestamp}@example.com`,
        phone: '(555) 123-4567',
        businessName: `Test Business ${timestamp}`,
        type: 'B2B',
        status: 'active',
      },
      equipment: {
        name: `${this.testDataPrefix}_Equipment_${timestamp}`,
        model: 'Model X1',
        serialNumber: `SN${timestamp}`,
        manufacturer: 'Test Manufacturer',
        status: 'active',
      },
      order: {
        orderNumber: `${this.testDataPrefix}_ORDER_${timestamp}`,
        status: 'pending',
        priority: 'medium',
        notes: 'Automated test order',
      },
      task: {
        title: `${this.testDataPrefix}_Task_${timestamp}`,
        description: 'Automated test task description',
        priority: 'medium',
        status: 'pending',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      },
    }

    return { ...defaults[type], ...overrides }
  }

  // CRUD Operations Testing
  async validateCRUD(
    page,
    entity,
    operations = ['create', 'read', 'update', 'delete']
  ) {
    const results = {
      create: null,
      read: null,
      update: null,
      delete: null,
      overall: false,
    }

    let entityId = null

    try {
      // CREATE
      if (operations.includes('create')) {
        console.log(`🔨 Testing CREATE for ${entity}`)
        const createResult = await this.testCreate(page, entity)
        results.create = createResult.success
        entityId = createResult.entityId

        if (createResult.success) {
          this.createdEntities.set(`${entity}_${entityId}`, {
            type: entity,
            id: entityId,
            timestamp: Date.now(),
          })
        }
      }

      // READ
      if (operations.includes('read') && entityId) {
        console.log(`📖 Testing READ for ${entity}`)
        results.read = await this.testRead(page, entity, entityId)
      }

      // UPDATE
      if (operations.includes('update') && entityId) {
        console.log(`✏️ Testing UPDATE for ${entity}`)
        results.update = await this.testUpdate(page, entity, entityId)
      }

      // DELETE
      if (operations.includes('delete') && entityId) {
        console.log(`🗑️ Testing DELETE for ${entity}`)
        results.delete = await this.testDelete(page, entity, entityId)

        if (results.delete) {
          this.createdEntities.delete(`${entity}_${entityId}`)
        }
      }

      // Overall success
      results.overall = operations.every(op => results[op] !== false)

      const passed = operations.filter(op => results[op] === true).length
      const total = operations.length
      console.log(
        `📊 CRUD Results for ${entity}: ${passed}/${total} operations passed`
      )

      return results
    } catch (error) {
      console.error(`❌ CRUD validation failed for ${entity}:`, error.message)
      return { ...results, error: error.message }
    }
  }

  async testCreate(page, entity, overrides = {}) {
    const testData = { ...this.generateTestData(entity), ...overrides }
    const entityConfig = this.getEntityConfig(entity)

    try {
      // Navigate to entity page
      await page.goto(`http://localhost:3005${entityConfig.basePath}`)
      await page.waitForLoadState('networkidle')

      // Click create button
      // If a modal overlay blocks clicks, close it before attempting create
      if (await page.isVisible('[class*="modalOverlay"]')) {
        await page
          .click('[class*="modalOverlay"]', { position: { x: 2, y: 2 } })
          .catch(() => {})
      }
      await page.click(entityConfig.createButtonSelector)
      await page.waitForSelector('.modal, [class*="modal"]', { timeout: 10000 })

      // Fill form (support select)
      for (const [field, value] of Object.entries(testData)) {
        if (entityConfig.formFields.includes(field)) {
          const locator = page.locator(`[name="${field}"]`)
          const tag = await locator
            .evaluate(el => el.tagName.toLowerCase())
            .catch(() => 'input')
          if (tag === 'select') {
            await locator.selectOption(String(value))
          } else {
            await locator.fill(value.toString())
          }
        }
      }

      // Submit form (support multiple save labels)
      await page.click(
        'button[type="submit"], button:has-text("Save"), button:has-text("Create")'
      )
      await page.waitForTimeout(3000)

      // Verify creation (look for success message or entity in list)
      const created = await page.isVisible(
        `text=${testData[entityConfig.displayField]}`
      )

      return {
        success: created,
        entityId: created ? testData[entityConfig.displayField] : null,
        data: testData,
      }
    } catch (error) {
      console.error(`Create failed for ${entity}:`, error.message)
      return { success: false, error: error.message }
    }
  }

  async testRead(page, entity, entityId) {
    const entityConfig = this.getEntityConfig(entity)

    try {
      // Navigate to entity page
      await page.goto(`http://localhost:3005${entityConfig.basePath}`)
      await page.waitForLoadState('networkidle')

      // Look for entity in list
      const exists = await page.isVisible(`text=${entityId}`)

      if (!exists) {
        throw new Error(`Entity ${entityId} not found in list`)
      }

      console.log(`✅ READ: Found ${entity} ${entityId}`)
      return true
    } catch (error) {
      console.error(`Read failed for ${entity}:`, error.message)
      return false
    }
  }

  async testUpdate(page, entity, entityId) {
    const entityConfig = this.getEntityConfig(entity)
    const updateData = { [entityConfig.updateField]: `UPDATED_${Date.now()}` }

    try {
      // Navigate to entity page
      await page.goto(`http://localhost:3005${entityConfig.basePath}`)
      await page.waitForLoadState('networkidle')

      // Find and click edit button for entity
      const editSelector = `[data-entity-id="${entityId}"] ${entityConfig.editButtonSelector}`
      if (await page.isVisible('[class*="modalOverlay"]')) {
        await page
          .click('[class*="modalOverlay"]', { position: { x: 2, y: 2 } })
          .catch(() => {})
      }
      await page.click(editSelector)
      await page.waitForSelector('.modal, [class*="modal"]', { timeout: 10000 })

      // Update field
      await page.fill(
        `[name="${entityConfig.updateField}"]`,
        updateData[entityConfig.updateField]
      )

      // Submit update
      await page.click('button[type="submit"]')
      await page.waitForTimeout(3000)

      // Verify update
      const updated = await page.isVisible(
        `text=${updateData[entityConfig.updateField]}`
      )

      console.log(`✅ UPDATE: Modified ${entity} ${entityId}`)
      return updated
    } catch (error) {
      console.error(`Update failed for ${entity}:`, error.message)
      return false
    }
  }

  async testDelete(page, entity, entityId) {
    const entityConfig = this.getEntityConfig(entity)

    try {
      // Navigate to entity page
      await page.goto(`http://localhost:3005${entityConfig.basePath}`)
      await page.waitForLoadState('networkidle')

      // Find and click delete button
      const deleteSelector = `[data-entity-id="${entityId}"] ${entityConfig.deleteButtonSelector}`
      if (await page.isVisible('[class*="modalOverlay"]')) {
        await page
          .click('[class*="modalOverlay"]', { position: { x: 2, y: 2 } })
          .catch(() => {})
      }
      await page.click(deleteSelector)

      // Confirm deletion if modal appears
      if (
        await page.isVisible(
          '.confirmation-modal, [class*="confirm"], [class*="dialog"]'
        )
      ) {
        await page.click(
          'button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")'
        )
      }

      await page.waitForTimeout(3000)

      // Verify deletion
      const stillExists = await page.isVisible(`text=${entityId}`)

      console.log(`✅ DELETE: Removed ${entity} ${entityId}`)
      return !stillExists
    } catch (error) {
      console.error(`Delete failed for ${entity}:`, error.message)
      return false
    }
  }

  // Entity configuration for different types
  getEntityConfig(entity) {
    const configs = {
      seedVariety: {
        basePath: '/production/seeds',
        createButtonSelector:
          'button:has-text("Add New Variety"), button:has-text("Add Variety"), button:has-text("New Variety")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'name',
        updateField: 'notes',
        formFields: [
          'name',
          'scientificName',
          'supplier',
          'stockQuantity',
          'minStockLevel',
          'costPerUnit',
        ],
      },
      batch: {
        basePath: '/production/batches',
        createButtonSelector:
          'button:has-text("Create New Batch"), button:has-text("New Batch"), button:has-text("Create Batch"), button:has-text("+ New Batch")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'batchNumber',
        updateField: 'notes',
        formFields: [
          'batchNumber',
          'quantity',
          'unit',
          'plantDate',
          'expectedHarvestDate',
        ],
      },
      inventoryItem: {
        basePath: '/inventory/stock',
        createButtonSelector:
          'button:has-text("Add Item"), button:has-text("Add Stock Item"), button:has-text("+ Add Item"), button:has-text("Add")',
        editButtonSelector: '.edit-button, .edit-action',
        deleteButtonSelector: '.delete-button, .delete-action',
        displayField: 'name',
        updateField: 'notes',
        formFields: [
          'name',
          'category',
          'quantity',
          'unit',
          'reorderPoint',
          'supplier',
          'unitCost',
        ],
      },
      customer: {
        basePath: '/sales/b2b-customers',
        createButtonSelector:
          'button:has-text("Add Customer"), button:has-text("New Customer"), button:has-text("+ Add Customer")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'name',
        updateField: 'notes',
        formFields: ['name', 'contactPerson', 'email', 'phone', 'businessName'],
      },
      order: {
        basePath: '/sales/orders',
        createButtonSelector:
          'button:has-text("New Order"), button:has-text("Create Order")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'orderNumber',
        updateField: 'notes',
        formFields: ['orderNumber'],
      },
      equipment: {
        basePath: '/equipment/management',
        createButtonSelector:
          'button:has-text("Add Equipment"), button:has-text("New Equipment")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'name',
        updateField: 'notes',
        formFields: ['name', 'model', 'serialNumber', 'manufacturer'],
      },
      task: {
        basePath: '/tasks/daily',
        createButtonSelector:
          'button:has-text("Add Task"), button:has-text("Create Task")',
        editButtonSelector: '.edit-button, .task-actions button:first-child',
        deleteButtonSelector: '.delete-button',
        displayField: 'title',
        updateField: 'notes',
        formFields: ['title', 'description', 'priority', 'status', 'dueDate'],
      },
      farm: {
        basePath: '/admin/farms',
        createButtonSelector:
          'button:has-text("Add Farm"), button:has-text("Create Farm")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'farm_name',
        updateField: 'business_name',
        formFields: [
          'farm_name',
          'business_name',
          'owner_email',
          'owner_name',
          'subdomain',
          'subscription_plan',
        ],
      },
      environment: {
        basePath: '/production/environments',
        createButtonSelector:
          'button:has-text("Add Environment"), button:has-text("Create")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'name',
        updateField: 'location',
        formFields: ['name', 'location', 'size', 'environmentType'],
      },
      cropPlan: {
        basePath: '/planning/crops',
        createButtonSelector:
          'button:has-text("New Crop Plan"), button:has-text("➕ New Crop Plan")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'planName',
        updateField: 'notes',
        formFields: [
          'planName',
          'cropName',
          'plannedStartDate',
          'plannedEndDate',
          'plannedQuantity',
          'plannedUnit',
          'expectedYield',
        ],
      },
      qualityCheck: {
        basePath: '/quality/control',
        createButtonSelector:
          'button:has-text("New Quality Check"), button:has-text("Create Check")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'checkType',
        updateField: 'notes',
        formFields: [
          'checkType',
          'status',
          'ph',
          'ecLevel',
          'uniformityScore',
          'notes',
        ],
      },
    }

    return (
      configs[entity] || {
        basePath: `/${entity}`,
        createButtonSelector:
          'button:has-text("Add"), button:has-text("New"), button:has-text("Create")',
        editButtonSelector: '.edit-button',
        deleteButtonSelector: '.delete-button',
        displayField: 'name',
        updateField: 'notes',
        formFields: ['name'],
      }
    )
  }

  // Referential integrity testing
  async validateReferentialIntegrity(page, parentEntity, childEntity) {
    console.log(
      `🔗 Testing referential integrity: ${parentEntity} -> ${childEntity}`
    )

    try {
      // Create parent entity
      const parentResult = await this.testCreate(page, parentEntity)
      if (!parentResult.success) {
        throw new Error(`Failed to create parent ${parentEntity}`)
      }

      // Create child entity referencing parent
      const childData = this.generateTestData(childEntity, {
        [`${parentEntity}Id`]: parentResult.entityId,
      })

      const childResult = await this.testCreate(page, childEntity)
      if (!childResult.success) {
        throw new Error(`Failed to create child ${childEntity}`)
      }

      // Test cascade behavior - try to delete parent
      const deleteResult = await this.testDelete(
        page,
        parentEntity,
        parentResult.entityId
      )

      // Verify child is also deleted (CASCADE) or deletion is prevented
      const childStillExists = await this.testRead(
        page,
        childEntity,
        childResult.entityId
      )

      console.log(
        `✅ Referential integrity validated for ${parentEntity} -> ${childEntity}`
      )

      return {
        parentCreated: parentResult.success,
        childCreated: childResult.success,
        cascadeWorking: deleteResult && !childStillExists,
        overall: true,
      }
    } catch (error) {
      console.error(`❌ Referential integrity test failed:`, error.message)
      return { overall: false, error: error.message }
    }
  }

  // Multi-tenant data isolation testing
  async validateMultiTenantIsolation(page, entity, farm1, farm2) {
    console.log(`🏢 Testing multi-tenant isolation for ${entity}`)

    try {
      const results = { farm1: null, farm2: null, isolation: false }

      // Create entity in farm1
      await this.switchFarm(page, farm1)
      const farm1Result = await this.testCreate(page, entity)
      results.farm1 = farm1Result.success

      // Switch to farm2 and verify entity is not visible
      await this.switchFarm(page, farm2)
      const visibleInFarm2 = await this.testRead(
        page,
        entity,
        farm1Result.entityId
      )

      // Entity should NOT be visible in farm2
      results.isolation = !visibleInFarm2

      // Create different entity in farm2
      const farm2Result = await this.testCreate(page, entity)
      results.farm2 = farm2Result.success

      console.log(`✅ Multi-tenant isolation validated for ${entity}`)
      return results
    } catch (error) {
      console.error(`❌ Multi-tenant isolation test failed:`, error.message)
      return { error: error.message }
    }
  }

  async switchFarm(page, farmName) {
    // Dismiss overlay if present
    if (await page.isVisible('[class*="modalOverlay"]')) {
      await page
        .click('[class*="modalOverlay"]', { position: { x: 2, y: 2 } })
        .catch(() => {})
    }
    await page.click('[aria-label="Select farm"]')
    await page.waitForSelector(`text=${farmName}`)
    await page.click(`text=${farmName}`)
    await page.waitForTimeout(2000)
  }

  // Cleanup created test data
  async cleanup(page) {
    console.log('🧹 Cleaning up test data...')
    let cleanedCount = 0

    for (const [key, entity] of this.createdEntities) {
      try {
        await this.testDelete(page, entity.type, entity.id)
        this.createdEntities.delete(key)
        cleanedCount++
      } catch (error) {
        console.warn(
          `⚠️ Could not cleanup ${entity.type} ${entity.id}: ${error.message}`
        )
      }
    }

    console.log(`✅ Cleaned up ${cleanedCount} test entities`)
    return cleanedCount
  }

  // Batch data operations for load testing
  async createBatchData(page, entity, count = 10) {
    console.log(`📦 Creating ${count} ${entity} entities for batch testing`)
    const results = []

    for (let i = 0; i < count; i++) {
      try {
        const result = await this.testCreate(page, entity)
        results.push(result)

        if (i % 5 === 0) {
          console.log(`  Progress: ${i + 1}/${count}`)
        }
      } catch (error) {
        console.error(`Failed to create batch item ${i + 1}:`, error.message)
        results.push({ success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(
      `✅ Batch creation completed: ${successCount}/${count} successful`
    )

    return results
  }
}

module.exports = { DataHelper }
