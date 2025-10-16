/**
 * API Helper for OFMS Testing
 * Handles API endpoint testing, validation, and integration checks
 */

class ApiHelper {
  constructor() {
    this.baseURL = process.env.OFMS_URL || 'http://localhost:3005'
    this.endpoints = this.getEndpointConfig()
  }

  // API endpoint configurations
  getEndpointConfig() {
    return {
      // Core entities
      farms: { path: '/api/farms', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      users: { path: '/api/users', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      batches: {
        path: '/api/batches',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      customers: {
        path: '/api/customers',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      orders: {
        path: '/api/orders',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      inventory: {
        path: '/api/inventory',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      equipment: {
        path: '/api/equipment',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },

      // Planning & Production
      cropPlans: {
        path: '/api/crop-plans',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      seedVarieties: {
        path: '/api/seed-varieties',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      environments: {
        path: '/api/environments',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      zones: { path: '/api/zones', methods: ['GET', 'POST', 'PUT', 'DELETE'] },

      // Task Management
      tasks: { path: '/api/tasks', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      assignments: {
        path: '/api/assignments',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      workOrders: {
        path: '/api/work-orders',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },

      // Quality & Analytics
      qualityChecks: {
        path: '/api/quality-checks',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      forecasts: {
        path: '/api/forecasts',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      feedback: {
        path: '/api/feedback',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
      },

      // AI & Analytics
      cropAnalysis: { path: '/api/ai/crop-analysis', methods: ['GET', 'POST'] },
      demandForecast: {
        path: '/api/ai/demand-forecast',
        methods: ['GET', 'POST'],
      },
      analytics: { path: '/api/analytics/dashboard', methods: ['GET'] },

      // Authentication
      auth: { path: '/api/auth/login', methods: ['POST'] },
      authValidate: { path: '/api/auth/validate', methods: ['POST'] },
    }
  }

  // Build request options using cookie-based auth and farm header
  async buildRequestOptions(page, method, data) {
    const farmId = await page.evaluate(() =>
      localStorage.getItem('ofms_current_farm')
    )
    const headers = { 'Content-Type': 'application/json' }
    if (farmId) headers['X-Farm-ID'] = farmId
    const options = { method, headers, credentials: 'include' }
    if (data && method !== 'GET') options['body'] = JSON.stringify(data)
    return options
  }

  // Test API endpoint with authentication
  async testEndpoint(page, endpointName, method = 'GET', data = null) {
    const endpoint = this.endpoints[endpointName]
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointName}`)
    }

    if (!endpoint.methods.includes(method)) {
      throw new Error(
        `Method ${method} not supported for endpoint ${endpointName}`
      )
    }

    try {
      const options = await this.buildRequestOptions(page, method, data)
      const url = `${this.baseURL}${endpoint.path}`

      console.log(`🔌 Testing API: ${method} ${url}`)

      const response = await page.evaluate(
        async ({ url, options }) => {
          try {
            const response = await fetch(url, options)
            const responseData = await response.json()

            return {
              ok: response.ok,
              status: response.status,
              statusText: response.statusText,
              data: responseData,
              headers: Object.fromEntries(response.headers.entries()),
            }
          } catch (error) {
            return {
              ok: false,
              error: error.message,
            }
          }
        },
        { url, options }
      )

      console.log(
        `${response.ok ? '✅' : '❌'} API Response: ${response.status} ${response.statusText}`
      )

      return response
    } catch (error) {
      console.error(`❌ API test failed for ${endpointName}:`, error.message)
      return { ok: false, error: error.message }
    }
  }

  // Validate API response structure
  async validateResponse(page, endpointName, expectedStructure = {}) {
    const response = await this.testEndpoint(page, endpointName, 'GET')

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      )
    }

    // Validate response structure
    const validation = this.validateObjectStructure(
      response.data,
      expectedStructure
    )

    if (!validation.valid) {
      throw new Error(
        `Response structure validation failed: ${validation.errors.join(', ')}`
      )
    }

    console.log(`✅ API response validation passed for ${endpointName}`)
    return response.data
  }

  // Validate object structure recursively
  validateObjectStructure(obj, expected, path = '') {
    const errors = []

    for (const [key, expectedType] of Object.entries(expected)) {
      const currentPath = path ? `${path}.${key}` : key

      if (!(key in obj)) {
        errors.push(`Missing property: ${currentPath}`)
        continue
      }

      const actualValue = obj[key]
      const actualType = Array.isArray(actualValue)
        ? 'array'
        : typeof actualValue

      if (typeof expectedType === 'string') {
        // Simple type check
        if (actualType !== expectedType) {
          errors.push(
            `Type mismatch at ${currentPath}: expected ${expectedType}, got ${actualType}`
          )
        }
      } else if (
        typeof expectedType === 'object' &&
        !Array.isArray(expectedType)
      ) {
        // Nested object validation
        if (actualType === 'object' && actualValue !== null) {
          const nestedValidation = this.validateObjectStructure(
            actualValue,
            expectedType,
            currentPath
          )
          errors.push(...nestedValidation.errors)
        } else {
          errors.push(`Expected object at ${currentPath}, got ${actualType}`)
        }
      } else if (Array.isArray(expectedType) && expectedType.length > 0) {
        // Array validation
        if (actualType === 'array' && actualValue.length > 0) {
          const itemValidation = this.validateObjectStructure(
            actualValue[0],
            expectedType[0],
            `${currentPath}[0]`
          )
          errors.push(...itemValidation.errors)
        } else if (actualType !== 'array') {
          errors.push(`Expected array at ${currentPath}, got ${actualType}`)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // Test CRUD operations for an endpoint
  async testCRUDOperations(page, endpointName, testData = {}) {
    const results = { create: null, read: null, update: null, delete: null }
    let entityId = null

    try {
      // CREATE
      if (this.endpoints[endpointName].methods.includes('POST')) {
        console.log(`🔨 Testing CREATE API for ${endpointName}`)
        const createResponse = await this.testEndpoint(
          page,
          endpointName,
          'POST',
          testData
        )
        results.create = createResponse.ok

        if (
          createResponse.ok &&
          createResponse.data &&
          createResponse.data.id
        ) {
          entityId = createResponse.data.id
        }
      }

      // READ
      if (this.endpoints[endpointName].methods.includes('GET')) {
        console.log(`📖 Testing READ API for ${endpointName}`)
        const readResponse = await this.testEndpoint(page, endpointName, 'GET')
        results.read = readResponse.ok
      }

      // UPDATE
      if (this.endpoints[endpointName].methods.includes('PUT') && entityId) {
        console.log(`✏️ Testing UPDATE API for ${endpointName}`)
        const updateData = {
          ...testData,
          id: entityId,
          updatedField: 'Updated by automation',
        }
        const updateResponse = await this.testEndpoint(
          page,
          endpointName,
          'PUT',
          updateData
        )
        results.update = updateResponse.ok
      }

      // DELETE
      if (this.endpoints[endpointName].methods.includes('DELETE') && entityId) {
        console.log(`🗑️ Testing DELETE API for ${endpointName}`)
        const deleteResponse = await this.testEndpoint(
          page,
          endpointName,
          'DELETE',
          { id: entityId }
        )
        results.delete = deleteResponse.ok
      }

      const successCount = Object.values(results).filter(r => r === true).length
      const totalTests = Object.values(results).filter(r => r !== null).length

      console.log(
        `📊 CRUD API Results for ${endpointName}: ${successCount}/${totalTests} operations passed`
      )

      return { ...results, overall: successCount === totalTests }
    } catch (error) {
      console.error(
        `❌ CRUD API testing failed for ${endpointName}:`,
        error.message
      )
      return { ...results, error: error.message, overall: false }
    }
  }

  // Test multi-tenant farm isolation in API
  async validateFarmIsolation(page, endpointName, farm1Id, farm2Id) {
    console.log(`🏢 Testing farm isolation for API ${endpointName}`)

    try {
      // Set farm context to farm1
      await page.evaluate(farmId => {
        localStorage.setItem('ofms_current_farm', farmId)
      }, farm1Id)

      // Create entity in farm1
      const farm1Data = {
        name: `Farm1_Entity_${Date.now()}`,
        farmSpecific: true,
      }
      const createResponse = await this.testEndpoint(
        page,
        endpointName,
        'POST',
        farm1Data
      )

      if (!createResponse.ok) {
        throw new Error('Failed to create entity in farm1')
      }

      // Switch to farm2
      await page.evaluate(farmId => {
        localStorage.setItem('ofms_current_farm', farmId)
      }, farm2Id)

      // Try to read entities - should not see farm1 entity
      const readResponse = await this.testEndpoint(page, endpointName, 'GET')

      if (!readResponse.ok) {
        throw new Error('Failed to read entities from farm2')
      }

      // Check if farm1 entity is visible in farm2 (it shouldn't be)
      const farm1EntityVisible =
        readResponse.data.data &&
        readResponse.data.data.some(item => item.name === farm1Data.name)

      const isolationWorking = !farm1EntityVisible

      console.log(
        `${isolationWorking ? '✅' : '❌'} Farm isolation for ${endpointName}: ${isolationWorking ? 'Working' : 'Failed'}`
      )

      return {
        isolationWorking,
        farm1Created: createResponse.ok,
        farm2CanRead: readResponse.ok,
        crossFarmVisible: farm1EntityVisible,
      }
    } catch (error) {
      console.error(
        `❌ Farm isolation test failed for ${endpointName}:`,
        error.message
      )
      return { error: error.message, isolationWorking: false }
    }
  }

  // Test API performance and response times
  async testPerformance(page, endpointName, iterations = 5) {
    console.log(`⚡ Testing performance for API ${endpointName}`)

    const results = []

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now()

      try {
        const response = await this.testEndpoint(page, endpointName, 'GET')
        const duration = Date.now() - startTime

        results.push({
          iteration: i + 1,
          success: response.ok,
          duration,
          status: response.status,
        })
      } catch (error) {
        results.push({
          iteration: i + 1,
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
        })
      }
    }

    const successfulResults = results.filter(r => r.success)
    const averageDuration =
      successfulResults.length > 0
        ? Math.round(
            successfulResults.reduce((sum, r) => sum + r.duration, 0) /
              successfulResults.length
          )
        : 0

    const successRate = Math.round(
      (successfulResults.length / iterations) * 100
    )

    console.log(`📊 Performance Results for ${endpointName}:`)
    console.log(`   Success Rate: ${successRate}%`)
    console.log(`   Average Response Time: ${averageDuration}ms`)
    console.log(
      `   Min Response Time: ${Math.min(...successfulResults.map(r => r.duration))}ms`
    )
    console.log(
      `   Max Response Time: ${Math.max(...successfulResults.map(r => r.duration))}ms`
    )

    return {
      endpointName,
      iterations,
      successRate,
      averageDuration,
      results,
    }
  }

  // Test all endpoints comprehensively
  async testAllEndpoints(page) {
    console.log('🔌 Testing all API endpoints...')

    const results = {}
    const endpointNames = Object.keys(this.endpoints)

    for (let i = 0; i < endpointNames.length; i++) {
      const endpointName = endpointNames[i]

      console.log(
        `\n[${i + 1}/${endpointNames.length}] Testing ${endpointName}`
      )
      console.log('-'.repeat(50))

      try {
        // Basic endpoint availability test
        const response = await this.testEndpoint(page, endpointName, 'GET')

        results[endpointName] = {
          available: response.ok,
          status: response.status,
          authenticated: response.status !== 401,
          authorized: response.status !== 403,
          error: response.error || null,
        }

        // If endpoint supports CRUD, test those operations
        if (this.endpoints[endpointName].methods.length > 1) {
          const crudResults = await this.testCRUDOperations(
            page,
            endpointName,
            {
              name: `Test_${endpointName}_${Date.now()}`,
              description: 'Automated API test',
            }
          )

          results[endpointName].crud = crudResults
        }
      } catch (error) {
        results[endpointName] = {
          available: false,
          error: error.message,
        }
      }

      // Small delay between tests
      await page.waitForTimeout(500)
    }

    // Print summary
    const available = Object.values(results).filter(r => r.available).length
    const total = Object.keys(results).length

    console.log('\n' + '='.repeat(60))
    console.log('📊 API ENDPOINT TEST SUMMARY')
    console.log('='.repeat(60))
    console.log(`📋 Total Endpoints: ${total}`)
    console.log(`✅ Available: ${available}`)
    console.log(`❌ Unavailable: ${total - available}`)
    console.log(
      `📈 Availability Rate: ${Math.round((available / total) * 100)}%`
    )

    return results
  }
}

module.exports = { ApiHelper }
