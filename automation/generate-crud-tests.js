#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const config = require('./config/test-config.js')

function pascalCase(str) {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function getSectionFolder(name) {
  const map = {
    authentication: '01-authentication',
    navigation: '02-navigation',
    dashboard: '03-dashboard',
    planning: '04-planning',
    production: '05-production',
    quality: '06-quality',
    inventory: '07-inventory',
    sales: '08-sales',
    traceability: '09-traceability',
    tasks: '10-tasks',
    equipment: '11-equipment',
    analytics: '12-analytics',
    aiInsights: '13-ai-insights',
    integrations: '14-integrations',
    admin: '15-admin',
    compliance: '16-compliance',
    settings: '17-settings',
    dataIntegrity: '99-data-integrity',
  }
  return map[name] || name
}

// Route and CRUD entity mappings
const routeMap = {
  planning: {
    crops: '/planning/crops',
    calendar: '/planning/calendar',
    forecasting: '/planning/forecasting',
    resources: '/planning/resources',
  },
  production: {
    batches: '/production/batches',
    environments: '/production/environments',
    seeds: '/production/seeds',
    harvesting: '/production/harvesting',
    'post-harvest': '/production/post-harvest',
  },
  quality: {
    control: '/quality/control',
    'food-safety': '/quality/food-safety',
    organic: '/quality/organic',
    certifications: '/quality/certifications',
    audits: '/quality/audits',
  },
  inventory: {
    stock: '/inventory/stock',
    supplies: '/inventory/supplies',
    equipment: '/inventory/equipment',
    packaging: '/inventory/packaging',
  },
  sales: {
    orders: '/sales/orders',
    'b2b-customers': '/sales/b2b-customers',
    'b2c-customers': '/sales/b2c-customers',
    pricing: '/sales/pricing',
    delivery: '/sales/delivery',
  },
  traceability: {
    'seed-to-sale': '/traceability/seed-to-sale',
    lots: '/traceability/lots',
  },
  tasks: {
    daily: '/tasks/daily',
    'work-orders': '/tasks/work-orders',
    assignments: '/tasks/assignments',
  },
  equipment: {
    management: '/equipment/management',
    maintenance: '/equipment/maintenance',
    sensors: '/equipment/sensors',
  },
  analytics: {
    production: '/analytics/production',
    financial: '/analytics/financial',
    yield: '/analytics/yield',
    market: '/analytics/market',
  },
  admin: {
    dashboard: '/admin',
    farms: '/admin/farms',
  },
  compliance: {
    'fda-fsma': '/compliance/fda-fsma',
    'usda-organic': '/compliance/usda-organic',
  },
  settings: {
    users: '/settings/users',
    notifications: '/settings/notifications',
    calculator: '/settings/calculator',
  },
}

const entityMap = {
  planning: { crops: 'cropPlan' },
  production: {
    batches: 'batch',
    environments: 'environment',
    seeds: 'seedVariety',
  },
  inventory: { stock: 'inventoryItem' },
  sales: { orders: 'order', 'b2b-customers': 'customer' },
  tasks: { daily: 'task' },
  admin: { farms: 'farm' },
  quality: { control: 'qualityCheck' },
}

function generateTests() {
  const baseTestsDir = path.join(__dirname, 'tests')
  for (const [category, catCfg] of Object.entries(config.testCategories)) {
    if (!catCfg.enabled) continue
    const sectionFolder = getSectionFolder(category)
    const subTests =
      Array.isArray(catCfg.subTests) && catCfg.subTests.length
        ? catCfg.subTests
        : ['index']
    const sectionDir = path.join(baseTestsDir, sectionFolder)
    if (!fs.existsSync(sectionDir)) {
      fs.mkdirSync(sectionDir, { recursive: true })
    }
    for (const subTest of subTests) {
      const testFile = path.join(sectionDir, `${subTest}.test.js`)
      if (fs.existsSync(testFile)) continue
      const className = pascalCase(subTest) + 'Test'
      const routePath =
        (routeMap[category] && routeMap[category][subTest]) ||
        `/${category}/${subTest}`
      const entity =
        (entityMap[category] && entityMap[category][subTest]) || null
      const content = `const { BaseTest } = require('../../lib/base-test.js');

class ${className} extends BaseTest {
  constructor() {
    super({ timeout: 20000 });
  }

  async runAllTests() {
    await this.setup();
    try {
      await this.runTest('Page Load - ${category}/${subTest}', async () => {
        return await this.testPageNavigation('${routePath}');
      });

      ${
        entity
          ? `await this.runTest('CRUD - ${entity}', async () => {
        const result = await this.validateDataIntegrity('${entity}', ['create','read','update','delete']);
        return result.overall !== false;
      });`
          : '// No CRUD on this page; load-only test.'
      }
    } finally {
      await this.teardown();
    }
    return this.printSummary();
  }
}

module.exports = { ${className} };
`
      fs.writeFileSync(testFile, content)
      console.log(`✅ Generated test: ${testFile}`)
    }
  }
}

generateTests()
