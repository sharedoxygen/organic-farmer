/**
 * Test Configuration for OFMS Automation Suite
 * Central configuration for all test settings
 */

module.exports = {
  // Base configuration
  baseURL: process.env.OFMS_URL || 'http://localhost:3005',

  // Browser settings
  browser: {
    headless: process.env.HEADLESS === 'true',
    slowMo: parseInt(process.env.SLOW_MO) || 200,
    devtools: process.env.DEVTOOLS === 'true',
    timeout: parseInt(process.env.TIMEOUT) || 30000,
  },

  // Authentication
  auth: {
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@ofms.com',
      password: process.env.ADMIN_PASSWORD || 'REDACTED_TEST_PASSWORD',
    },
    manager: {
      email: process.env.MANAGER_EMAIL || 'manager@ofms.com',
      password: process.env.MANAGER_PASSWORD || 'REDACTED_TEST_PASSWORD',
    },
    worker: {
      email: process.env.WORKER_EMAIL || 'worker@ofms.com',
      password: process.env.WORKER_PASSWORD || 'REDACTED_TEST_PASSWORD',
    },
  },

  // Test farms for multi-tenant testing
  farms: {
    cannabis: 'Shared Oxygen Farms',
    microgreens: 'Curry Island Microgreens',
  },

  // Test data prefixes
  testData: {
    prefix: 'AUTO_TEST',
    cleanup: process.env.CLEANUP_TEST_DATA !== 'false',
  },

  // Test categories and their configurations
  testCategories: {
    authentication: {
      enabled: true,
      timeout: 15000,
      priority: 1,
    },
    navigation: {
      enabled: true,
      timeout: 10000,
      priority: 2,
    },
    dashboard: {
      enabled: true,
      timeout: 15000,
      priority: 3,
    },
    planning: {
      enabled: true,
      timeout: 20000,
      priority: 4,
      subTests: ['crops', 'calendar', 'forecasting', 'resources'],
    },
    production: {
      enabled: true,
      timeout: 25000,
      priority: 5,
      subTests: [
        'batches',
        'environments',
        'seeds',
        'harvesting',
        'post-harvest',
      ],
    },
    quality: {
      enabled: true,
      timeout: 20000,
      priority: 6,
      subTests: [
        'control',
        'food-safety',
        'organic',
        'certifications',
        'audits',
      ],
    },
    inventory: {
      enabled: true,
      timeout: 20000,
      priority: 7,
      subTests: ['stock', 'supplies', 'equipment', 'packaging'],
    },
    sales: {
      enabled: true,
      timeout: 20000,
      priority: 8,
      subTests: [
        'orders',
        'b2b-customers',
        'b2c-customers',
        'pricing',
        'delivery',
      ],
    },
    traceability: {
      enabled: true,
      timeout: 15000,
      priority: 9,
      subTests: ['seed-to-sale', 'lots'],
    },
    tasks: {
      enabled: true,
      timeout: 15000,
      priority: 10,
      subTests: ['daily', 'work-orders', 'assignments'],
    },
    equipment: {
      enabled: true,
      timeout: 15000,
      priority: 11,
      subTests: ['management', 'maintenance', 'sensors'],
    },
    analytics: {
      enabled: true,
      timeout: 20000,
      priority: 12,
      subTests: ['production', 'financial', 'yield', 'market'],
    },
    aiInsights: {
      enabled: true,
      timeout: 15000,
      priority: 13,
    },
    integrations: {
      enabled: true,
      timeout: 15000,
      priority: 14,
    },
    admin: {
      enabled: true,
      timeout: 15000,
      priority: 15,
      subTests: ['dashboard', 'farms'],
    },
    compliance: {
      enabled: true,
      timeout: 15000,
      priority: 16,
      subTests: ['fda-fsma', 'usda-organic'],
    },
    settings: {
      enabled: true,
      timeout: 15000,
      priority: 17,
      subTests: ['users', 'notifications', 'calculator'],
    },
    dataIntegrity: {
      enabled: true,
      timeout: 30000,
      priority: 99, // Run last
    },
  },

  // API testing configuration
  api: {
    timeout: 10000,
    retries: 3,
    endpoints: [
      'farms',
      'users',
      'batches',
      'customers',
      'orders',
      'inventory',
      'equipment',
      'cropPlans',
      'seedVarieties',
      'environments',
      'zones',
      'tasks',
      'assignments',
      'workOrders',
      'qualityChecks',
      'forecasts',
      'feedback',
      'cropAnalysis',
      'demandForecast',
      'analytics',
    ],
  },

  // Performance benchmarks
  performance: {
    pageLoadTimeout: 5000, // Pages should load within 5 seconds
    apiResponseTimeout: 3000, // API calls should respond within 3 seconds
    formSubmissionTimeout: 10000, // Form submissions should complete within 10 seconds
    maxMemoryUsage: 500, // MB
    maxCpuUsage: 80, // Percentage
  },

  // Data integrity testing
  dataIntegrity: {
    testReferentialIntegrity: true,
    testCascadeDeletes: true,
    testMultiTenantIsolation: true,
    testDataValidation: true,

    // Entity relationships to test
    relationships: [
      { parent: 'farms', child: 'users', via: 'farm_users' },
      { parent: 'farms', child: 'batches', via: 'farm_id' },
      { parent: 'farms', child: 'customers', via: 'farm_id' },
      { parent: 'farms', child: 'orders', via: 'farm_id' },
      { parent: 'batches', child: 'tasks', via: 'batch_id' },
      { parent: 'customers', child: 'orders', via: 'customer_id' },
      { parent: 'seedVarieties', child: 'batches', via: 'seed_variety_id' },
    ],
  },

  // Reporting configuration
  reporting: {
    generateScreenshots: process.env.SCREENSHOTS === 'true',
    generateHtmlReports: true,
    generateJsonReports: true,
    saveFailureLogs: true,
    reportDirectory: './test-reports',

    // Report formats
    formats: {
      console: true,
      html: true,
      json: true,
      junit: process.env.CI === 'true',
    },
  },

  // Parallel execution settings
  parallel: {
    enabled: process.env.PARALLEL === 'true',
    maxWorkers: parseInt(process.env.MAX_WORKERS) || 4,
    workerTimeout: 300000, // 5 minutes
  },

  // Environment-specific overrides
  environments: {
    development: {
      baseURL: 'http://localhost:3005',
      browser: { slowMo: 500 },
    },
    staging: {
      baseURL: process.env.STAGING_URL,
      browser: { headless: true, slowMo: 100 },
    },
    production: {
      baseURL: process.env.PRODUCTION_URL,
      browser: { headless: true, slowMo: 0 },
      testData: { cleanup: false }, // Don't cleanup in production
    },
  },

  // Feature flags for conditional testing
  features: {
    aiInsights: process.env.FEATURE_AI !== 'false',
    integrations: process.env.FEATURE_INTEGRATIONS !== 'false',
    analytics: process.env.FEATURE_ANALYTICS !== 'false',
    mobileView: process.env.TEST_MOBILE === 'true',
    accessibility: process.env.TEST_A11Y === 'true',
  },

  // Debugging and troubleshooting
  debug: {
    verbose: process.env.DEBUG === 'true',
    savePageSource: process.env.SAVE_PAGE_SOURCE === 'true',
    saveNetworkLogs: process.env.SAVE_NETWORK_LOGS === 'true',
    pauseOnFailure: process.env.PAUSE_ON_FAILURE === 'true',
  },
}

