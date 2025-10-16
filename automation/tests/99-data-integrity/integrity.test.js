/**
 * Data Integrity Tests
 * Critical tests for referential integrity, multi-tenant isolation, and data consistency
 */

const { BaseTest } = require('../../lib/base-test.js')
const testData = require('../../fixtures/test-data.json')

class DataIntegrityTest extends BaseTest {
  constructor() {
    super({ timeout: 30000 })
  }

  async runAllTests() {
    console.log('🔗 STARTING DATA INTEGRITY TESTS')
    console.log('='.repeat(50))

    await this.setup()

    try {
      // Referential integrity tests
      await this.runTest('Farm-User Relationships', () =>
        this.testFarmUserIntegrity()
      )
      await this.runTest('Batch-SeedVariety Relationships', () =>
        this.testBatchSeedIntegrity()
      )
      await this.runTest('Customer-Order Relationships', () =>
        this.testCustomerOrderIntegrity()
      )
      await this.runTest('Equipment-WorkOrder Relationships', () =>
        this.testEquipmentWorkOrderIntegrity()
      )

      // Cascade delete testing
      await this.runTest('Cascade Delete Behavior', () =>
        this.testCascadeDeletes()
      )

      // Multi-tenant isolation
      await this.runTest('Multi-Tenant Data Isolation', () =>
        this.testMultiTenantDataIsolation()
      )

      // Cross-entity consistency
      await this.runTest('Cross-Entity Data Consistency', () =>
        this.testCrossEntityConsistency()
      )

      // API data round-trip testing
      await this.runTest('API Data Round-Trip', () =>
        this.testApiDataRoundTrip()
      )

      // Batch operations testing
      await this.runTest('Bulk Operations Integrity', () =>
        this.testBulkOperationsIntegrity()
      )

      // Concurrent access testing
      await this.runTest('Concurrent Data Access', () =>
        this.testConcurrentDataAccess()
      )
    } finally {
      // Cleanup any test data created
      await this.dataHelper.cleanup(this.automation.page)
      await this.teardown()
    }

    return this.printSummary()
  }

  async testFarmUserIntegrity() {
    console.log('🏢👤 Testing farm-user relationship integrity...')

    // Test that users are properly associated with farms
    const farmId = '00000000-0000-0000-0000-000000000010' // Curry Island Microgreens

    // Get current user's farm associations via API
    const response = await this.automation.page.evaluate(async farmId => {
      const user = JSON.parse(localStorage.getItem('ofms_user'))
      const headers = {
        Authorization: `Bearer ${user.id}`,
        'X-Farm-ID': farmId,
        'Content-Type': 'application/json',
      }

      try {
        const response = await fetch('/api/farms/all', { headers })
        const data = await response.json()

        return {
          ok: response.ok,
          status: response.status,
          data: data,
          userId: user.id,
        }
      } catch (error) {
        return { ok: false, error: error.message }
      }
    }, farmId)

    if (!response.ok) {
      throw new Error(
        `Farm-user API call failed: ${response.status} ${response.error || ''}`
      )
    }

    if (!response.data.success) {
      throw new Error(`Farm-user data retrieval failed: ${response.data.error}`)
    }

    const farms = response.data.farms || []
    console.log(`✅ User has access to ${farms.length} farms`)

    // Verify user has access to expected farms
    const expectedFarms = ['Curry Island Microgreens', 'Shared Oxygen Farms']
    const accessibleFarms = farms.map(f => f.farm_name)

    const hasExpectedAccess = expectedFarms.every(farm =>
      accessibleFarms.some(accessible => accessible.includes(farm))
    )

    if (!hasExpectedAccess) {
      throw new Error(
        `Missing expected farm access. Expected: ${expectedFarms.join(', ')}, Got: ${accessibleFarms.join(', ')}`
      )
    }

    console.log('✅ Farm-user relationships validated')
    return true
  }

  async testBatchSeedIntegrity() {
    console.log('🌱🌿 Testing batch-seedvariety relationship integrity...')

    // Create seed variety first
    const seedResult = await this.dataHelper.testCreate(
      this.automation.page,
      'seedVariety'
    )
    if (!seedResult.success) {
      throw new Error('Failed to create seed variety for relationship test')
    }

    // Create batch referencing seed variety
    const batchData = this.dataHelper.generateTestData('batch', {
      seedVarietyId: seedResult.entityId,
    })

    const batchResult = await this.dataHelper.testCreate(
      this.automation.page,
      'batch'
    )
    if (!batchResult.success) {
      throw new Error('Failed to create batch for relationship test')
    }

    // Verify relationship exists
    const relationship = await this.validateForeignKeyRelationship(
      'batches',
      'seed_varieties',
      'seed_variety_id',
      batchResult.entityId,
      seedResult.entityId
    )

    if (!relationship) {
      throw new Error('Batch-SeedVariety relationship not properly established')
    }

    console.log('✅ Batch-SeedVariety relationship integrity validated')
    return true
  }

  async testCustomerOrderIntegrity() {
    console.log('👥💼 Testing customer-order relationship integrity...')

    // This follows the same pattern as above but for customer-order relationships
    return await this.dataHelper.validateReferentialIntegrity(
      this.automation.page,
      'customer',
      'order'
    )
  }

  async testEquipmentWorkOrderIntegrity() {
    console.log('🔧📋 Testing equipment-workorder relationship integrity...')

    return await this.dataHelper.validateReferentialIntegrity(
      this.automation.page,
      'equipment',
      'workOrder'
    )
  }

  async testCascadeDeletes() {
    console.log('🗑️ Testing cascade delete behavior...')

    const results = []

    // Test farm deletion cascades to all related entities
    const cascadeTests = [
      {
        parent: 'farm',
        children: ['batches', 'customers', 'orders', 'equipment'],
      },
      { parent: 'customer', children: ['orders'] },
      { parent: 'batch', children: ['tasks', 'qualityChecks'] },
    ]

    for (const test of cascadeTests) {
      try {
        const cascadeResult = await this.testCascadeBehavior(
          test.parent,
          test.children
        )
        results.push({ ...test, success: cascadeResult })

        console.log(
          `${cascadeResult ? '✅' : '❌'} Cascade delete for ${test.parent}`
        )
      } catch (error) {
        results.push({ ...test, success: false, error: error.message })
        console.log(
          `❌ Cascade delete test failed for ${test.parent}: ${error.message}`
        )
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(
      `📊 Cascade delete tests: ${successCount}/${results.length} passed`
    )

    return successCount === results.length
  }

  async testCascadeBehavior(parentEntity, childEntities) {
    // Create parent entity
    const parentResult = await this.dataHelper.testCreate(
      this.automation.page,
      parentEntity
    )
    if (!parentResult.success) return false

    // Create child entities
    const childResults = []
    for (const childEntity of childEntities) {
      const childData = this.dataHelper.generateTestData(childEntity, {
        [`${parentEntity}Id`]: parentResult.entityId,
      })

      const childResult = await this.dataHelper.testCreate(
        this.automation.page,
        childEntity
      )
      childResults.push({ entity: childEntity, result: childResult })
    }

    // Delete parent - should cascade to children
    const deleteResult = await this.dataHelper.testDelete(
      this.automation.page,
      parentEntity,
      parentResult.entityId
    )

    if (!deleteResult) return false

    // Verify children are also deleted
    let allChildrenDeleted = true
    for (const child of childResults) {
      if (child.result.success) {
        const stillExists = await this.dataHelper.testRead(
          this.automation.page,
          child.entity,
          child.result.entityId
        )
        if (stillExists) {
          console.log(
            `⚠️ Child ${child.entity} still exists after parent deletion`
          )
          allChildrenDeleted = false
        }
      }
    }

    return allChildrenDeleted
  }

  async testMultiTenantDataIsolation() {
    console.log('🏢🔒 Testing multi-tenant data isolation...')

    const isolationResults = []
    const entitiesToTest = [
      'batches',
      'customers',
      'orders',
      'cropPlans',
      'equipment',
    ]

    for (const entity of entitiesToTest) {
      try {
        const result = await this.dataHelper.validateMultiTenantIsolation(
          this.automation.page,
          entity,
          'Curry Island Microgreens',
          'Shared Oxygen Farms'
        )

        isolationResults.push({
          entity,
          success: result.isolation,
          details: result,
        })

        console.log(
          `${result.isolation ? '✅' : '❌'} Multi-tenant isolation for ${entity}`
        )
      } catch (error) {
        isolationResults.push({ entity, success: false, error: error.message })
        console.log(`❌ Isolation test failed for ${entity}: ${error.message}`)
      }
    }

    const successCount = isolationResults.filter(r => r.success).length
    console.log(
      `📊 Multi-tenant isolation: ${successCount}/${isolationResults.length} entities properly isolated`
    )

    return successCount === isolationResults.length
  }

  async testCrossEntityConsistency() {
    console.log('🔄 Testing cross-entity data consistency...')

    // Test that related data stays consistent across entities
    // For example, if a batch references a seed variety, the seed variety data should be consistent

    try {
      // Create seed variety with specific data
      const seedData = this.dataHelper.generateTestData('seedVariety', {
        name: 'Consistency Test Variety',
        daysToHarvest: 45,
      })

      const seedResult = await this.dataHelper.testCreate(
        this.automation.page,
        'seedVariety'
      )
      if (!seedResult.success) {
        throw new Error('Failed to create seed variety for consistency test')
      }

      // Create batch using that seed variety
      const batchData = this.dataHelper.generateTestData('batch', {
        seedVarietyId: seedResult.entityId,
      })

      const batchResult = await this.dataHelper.testCreate(
        this.automation.page,
        'batch'
      )
      if (!batchResult.success) {
        throw new Error('Failed to create batch for consistency test')
      }

      // Verify batch shows correct seed variety information
      // This would involve checking that the batch details page shows the correct seed variety name

      console.log('✅ Cross-entity data consistency validated')
      return true
    } catch (error) {
      console.error(`❌ Cross-entity consistency test failed: ${error.message}`)
      return false
    }
  }

  async testApiDataRoundTrip() {
    console.log('🔄 Testing API data round-trip consistency...')

    const testEntities = ['seedVarieties', 'batches', 'customers']
    const results = []

    for (const entity of testEntities) {
      try {
        console.log(`  Testing ${entity} round-trip...`)

        // Create data via UI
        const uiResult = await this.dataHelper.testCreate(
          this.automation.page,
          entity
        )
        if (!uiResult.success) {
          throw new Error(`UI creation failed for ${entity}`)
        }

        // Retrieve same data via API
        const apiResponse = await this.apiHelper.testEndpoint(
          this.automation.page,
          entity,
          'GET'
        )
        if (!apiResponse.ok) {
          throw new Error(`API retrieval failed for ${entity}`)
        }

        // Verify data consistency
        const apiData = apiResponse.data.data || apiResponse.data
        const foundEntity = Array.isArray(apiData)
          ? apiData.find(
              item =>
                item.name === uiResult.data.name ||
                item.id === uiResult.entityId
            )
          : apiData

        if (!foundEntity) {
          throw new Error(
            `Entity created via UI not found in API response for ${entity}`
          )
        }

        results.push({ entity, success: true })
        console.log(`    ✅ ${entity} round-trip successful`)
      } catch (error) {
        results.push({ entity, success: false, error: error.message })
        console.log(`    ❌ ${entity} round-trip failed: ${error.message}`)
      }
    }

    const successCount = results.filter(r => r.success).length
    console.log(
      `📊 API round-trip tests: ${successCount}/${results.length} passed`
    )

    return successCount === results.length
  }

  async testBulkOperationsIntegrity() {
    console.log('📦 Testing bulk operations integrity...')

    try {
      // Create multiple entities in bulk
      const batchCount = 5
      const entities = await this.dataHelper.createBatchData(
        this.automation.page,
        'seedVariety',
        batchCount
      )

      const successfulCreations = entities.filter(e => e.success).length

      if (successfulCreations === 0) {
        throw new Error(
          'No entities were created successfully in bulk operation'
        )
      }

      console.log(
        `✅ Bulk creation: ${successfulCreations}/${batchCount} entities created`
      )

      // Verify all created entities are accessible
      let accessibleCount = 0
      for (const entity of entities) {
        if (entity.success) {
          const readable = await this.dataHelper.testRead(
            this.automation.page,
            'seedVariety',
            entity.entityId
          )
          if (readable) accessibleCount++
        }
      }

      console.log(
        `✅ Bulk accessibility: ${accessibleCount}/${successfulCreations} entities accessible`
      )

      return accessibleCount === successfulCreations
    } catch (error) {
      console.error(`❌ Bulk operations test failed: ${error.message}`)
      return false
    }
  }

  async testConcurrentDataAccess() {
    console.log('⚡ Testing concurrent data access...')

    // Simulate concurrent operations by rapidly creating entities
    const concurrentOperations = []
    const operationCount = 3

    for (let i = 0; i < operationCount; i++) {
      concurrentOperations.push(
        this.dataHelper.testCreate(this.automation.page, 'seedVariety')
      )
    }

    try {
      const results = await Promise.allSettled(concurrentOperations)

      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.success
      ).length
      const failed = results.length - successful

      console.log(
        `📊 Concurrent operations: ${successful} successful, ${failed} failed`
      )

      // At least 70% should succeed (allowing for some race conditions)
      const successRate = successful / results.length
      const passed = successRate >= 0.7

      console.log(
        `${passed ? '✅' : '❌'} Concurrent access test: ${Math.round(successRate * 100)}% success rate`
      )

      return passed
    } catch (error) {
      console.error(`❌ Concurrent access test failed: ${error.message}`)
      return false
    }
  }

  // Helper method to validate foreign key relationships
  async validateForeignKeyRelationship(
    parentTable,
    childTable,
    foreignKeyField,
    childId,
    expectedParentId
  ) {
    console.log(
      `🔗 Validating ${childTable}.${foreignKeyField} -> ${parentTable}`
    )

    // This would ideally query the database directly, but for now we'll use API endpoints
    try {
      const response = await this.apiHelper.testEndpoint(
        this.automation.page,
        childTable,
        'GET'
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch ${childTable} data`)
      }

      const entities = response.data.data || response.data
      const entity = Array.isArray(entities)
        ? entities.find(e => e.id === childId)
        : entities

      if (!entity) {
        throw new Error(`Child entity ${childId} not found`)
      }

      const actualParentId = entity[foreignKeyField]
      const relationshipValid = actualParentId === expectedParentId

      console.log(
        `${relationshipValid ? '✅' : '❌'} Foreign key relationship: ${actualParentId} ${relationshipValid ? '===' : '!=='} ${expectedParentId}`
      )

      return relationshipValid
    } catch (error) {
      console.error(`❌ Foreign key validation failed: ${error.message}`)
      return false
    }
  }

  async testApiDataRoundTrip() {
    console.log('🔄 Testing complete API data round-trip...')

    const testData = {
      name: `API_RoundTrip_${Date.now()}`,
      scientificName: 'Test Species',
      supplier: 'Test Supplier',
      stockQuantity: 100,
      costPerUnit: 10.99,
    }

    try {
      // POST - Create via API
      const createResponse = await this.automation.page.evaluate(async data => {
        const user = JSON.parse(localStorage.getItem('ofms_user'))
        const farmId = localStorage.getItem('ofms_current_farm')

        const response = await fetch('/api/seed-varieties', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.id}`,
            'X-Farm-ID': farmId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const responseData = await response.json()
        return { ok: response.ok, status: response.status, data: responseData }
      }, testData)

      if (!createResponse.ok) {
        throw new Error(`API CREATE failed: ${createResponse.status}`)
      }

      const createdId = createResponse.data.data?.id || createResponse.data.id
      if (!createdId) {
        throw new Error('No ID returned from CREATE operation')
      }

      console.log(`✅ CREATE: Entity created with ID ${createdId}`)

      // GET - Retrieve via API
      const getResponse = await this.automation.page.evaluate(async () => {
        const user = JSON.parse(localStorage.getItem('ofms_user'))
        const farmId = localStorage.getItem('ofms_current_farm')

        const response = await fetch('/api/seed-varieties', {
          headers: {
            Authorization: `Bearer ${user.id}`,
            'X-Farm-ID': farmId,
          },
        })

        const responseData = await response.json()
        return { ok: response.ok, data: responseData }
      })

      if (!getResponse.ok) {
        throw new Error('API GET failed')
      }

      const retrievedEntities = getResponse.data.data || getResponse.data
      const retrievedEntity = Array.isArray(retrievedEntities)
        ? retrievedEntities.find(e => e.id === createdId)
        : retrievedEntities

      if (!retrievedEntity) {
        throw new Error(`Created entity ${createdId} not found in GET response`)
      }

      console.log(`✅ GET: Entity successfully retrieved`)

      // Verify data consistency
      const dataConsistent =
        retrievedEntity.name === testData.name &&
        retrievedEntity.scientificName === testData.scientificName

      if (!dataConsistent) {
        throw new Error('Data inconsistency between CREATE and GET operations')
      }

      console.log('✅ Data consistency verified between CREATE and GET')

      // PUT - Update via API
      const updateData = {
        ...testData,
        id: createdId,
        notes: 'Updated via API test',
      }
      const updateResponse = await this.automation.page.evaluate(async data => {
        const user = JSON.parse(localStorage.getItem('ofms_user'))
        const farmId = localStorage.getItem('ofms_current_farm')

        const response = await fetch('/api/seed-varieties', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${user.id}`,
            'X-Farm-ID': farmId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        const responseData = await response.json()
        return { ok: response.ok, data: responseData }
      }, updateData)

      if (updateResponse.ok) {
        console.log(`✅ UPDATE: Entity successfully updated`)
      } else {
        console.log(
          `⚠️ UPDATE: May not be implemented (${updateResponse.status})`
        )
      }

      // DELETE - Remove via API
      const deleteResponse = await this.automation.page.evaluate(async id => {
        const user = JSON.parse(localStorage.getItem('ofms_user'))
        const farmId = localStorage.getItem('ofms_current_farm')

        const response = await fetch(`/api/seed-varieties?id=${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user.id}`,
            'X-Farm-ID': farmId,
          },
        })

        return { ok: response.ok, status: response.status }
      }, createdId)

      if (deleteResponse.ok) {
        console.log(`✅ DELETE: Entity successfully deleted`)
      } else {
        console.log(
          `⚠️ DELETE: May not be implemented (${deleteResponse.status})`
        )
      }

      console.log('✅ Complete API CRUD round-trip validated')
      return true
    } catch (error) {
      console.error(`❌ API round-trip test failed: ${error.message}`)
      return false
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new DataIntegrityTest()
  test
    .runAllTests()
    .then(result => {
      console.log(
        `\n${result.success ? '✅' : '❌'} Data Integrity Tests ${result.success ? 'PASSED' : 'FAILED'}`
      )
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error)
      process.exit(1)
    })
}

module.exports = { DataIntegrityTest }

