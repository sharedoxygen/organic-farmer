# OFMS Playwright Automation - Technical Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

---

## Overview

The OFMS Playwright Automation tool provides browser-based automation for the Organic Farm Management System, enabling automated testing, data entry, and user workflow simulation.

### Key Features
- 🔐 **Authentication Management** - Automated login/logout flows
- 🏢 **Multi-Tenant Support** - Farm switching and context management
- 📝 **Data Entry Automation** - Complex form filling and validation
- 🧪 **Testing Framework** - E2E testing capabilities
- 📊 **Batch Operations** - Bulk data creation and management

### Use Cases
1. **Quality Assurance** - Automated regression testing
2. **Data Population** - Demo data creation
3. **Load Testing** - Multi-user simulation
4. **Training** - Consistent demo workflows
5. **Monitoring** - Health checks and validation

---

## Architecture

### Technology Stack
```
┌─────────────────────────────────────┐
│         Playwright Test             │
│    (Browser Automation Engine)      │
├─────────────────────────────────────┤
│         Chromium Browser            │
│      (Headless/Headed Mode)         │
├─────────────────────────────────────┤
│      OFMS Next.js Application       │
│        (localhost:3005)              │
├─────────────────────────────────────┤
│        PostgreSQL Database          │
│         (Data Persistence)          │
└─────────────────────────────────────┘
```

### File Structure
```
automation/
├── ofms-data-entry.js      # Main automation class
├── test-login.js           # Simple login test
├── package.json            # Dependencies & scripts
├── README.md               # Quick start guide
└── TECHNICAL_GUIDE.md      # This document
```

---

## Setup & Installation

### Prerequisites
- **Node.js** ≥ 16.x
- **npm** or **yarn**
- **OFMS Application** running on localhost:3005
- **PostgreSQL** database configured

### Installation Steps

```bash
# 1. Navigate to automation directory
cd /path/to/organic-farmer-app/automation

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install chromium

# 4. Verify OFMS app is running
curl http://localhost:3005

# 5. Setup admin user (if needed)
cd .. && node scripts/reset-admin-password.js
```

### Environment Configuration

Create `.env` file (optional):
```env
# OFMS Configuration
OFMS_URL=http://localhost:3005
OFMS_ADMIN_EMAIL=admin@ofms.com
OFMS_ADMIN_PASSWORD=REDACTED_TEST_PASSWORD

# Playwright Configuration
HEADLESS=false
SLOW_MO=1000
TIMEOUT=30000
```

---

## Configuration

### Default Settings

```javascript
// ofms-data-entry.js
class OFMSAutomation {
  constructor() {
    this.baseURL = 'http://localhost:3005'  // OFMS URL
    this.browser = null
    this.page = null
  }

  async init() {
    this.browser = await chromium.launch({
      headless: false,     // Show browser (true = hidden)
      slowMo: 1000,       // Delay between actions (ms)
      devtools: false,    // Open DevTools
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    })
  }
}
```

### Customization Options

| Option | Default | Description |
|--------|---------|-------------|
| `headless` | `false` | Run browser in background |
| `slowMo` | `1000ms` | Delay between actions |
| `timeout` | `30000ms` | Default wait timeout |
| `viewport` | `1280x720` | Browser window size |
| `screenshots` | `false` | Capture screenshots |

---

## Usage Guide

### Quick Start

```bash
# Run full demo
npm run demo

# Test login only
npm run test-login

# Custom execution
node ofms-data-entry.js
```

### Basic Usage

```javascript
const { OFMSAutomation } = require('./ofms-data-entry')

async function runAutomation() {
  const automation = new OFMSAutomation()
  
  try {
    await automation.init()
    await automation.login('admin@ofms.com', 'REDACTED_TEST_PASSWORD')
    await automation.selectFarm('Shared Oxygen Farms')
    
    // Your automation tasks here
    
  } finally {
    await automation.close()
  }
}
```

### Advanced Usage

```javascript
// Multiple farm operations
async function multiTenantDemo() {
  const automation = new OFMSAutomation()
  await automation.init()
  
  const farms = [
    'Shared Oxygen Farms',
    'Curry Island Microgreens'
  ]
  
  for (const farm of farms) {
    await automation.login()
    await automation.selectFarm(farm)
    
    // Farm-specific operations
    if (farm.includes('Cannabis')) {
      await createCannabisData(automation)
    } else {
      await createMicrogreensData(automation)
    }
    
    await automation.logout()
  }
  
  await automation.close()
}
```

---

## API Reference

### Core Methods

#### `init()`
Initializes browser and creates new page context.
```javascript
await automation.init()
```

#### `login(email, password)`
Authenticates user and navigates to dashboard.
```javascript
await automation.login('admin@ofms.com', 'REDACTED_TEST_PASSWORD')
```

#### `selectFarm(farmName)`
Switches to specified farm context.
```javascript
await automation.selectFarm('Shared Oxygen Farms')
```

#### `createSeedVariety(seedData)`
Creates new seed variety with specified data.
```javascript
await automation.createSeedVariety({
  name: 'Purple Kush',
  scientificName: 'Cannabis sativa L.',
  supplier: 'Premium Seeds',
  stockQuantity: 100,
  minStockLevel: 20,
  costPerUnit: 15.99,
  germinationRate: 0.95,
  daysToHarvest: 65
})
```

#### `createGrowingEnvironment(environmentData)`
Creates new growing environment.
```javascript
await automation.createGrowingEnvironment({
  name: 'Grow Room A',
  location: 'Building 1',
  size: 500,
  type: 'INDOOR'
})
```

#### `createCustomer(customerData)`
Adds new B2B customer.
```javascript
await automation.createCustomer({
  name: 'Green Dispensary',
  contactPerson: 'John Doe',
  email: 'john@green.com',
  phone: '(555) 123-4567'
})
```

#### `submitFeedback(feedbackData)`
Submits user feedback.
```javascript
await automation.submitFeedback({
  title: 'Feature Request',
  type: 'ENHANCEMENT',
  priority: 'HIGH',
  description: 'Add batch import feature'
})
```

### Utility Methods

#### `waitForElement(selector, timeout)`
Waits for element to appear.
```javascript
await automation.page.waitForSelector('.modal', { timeout: 5000 })
```

#### `fillForm(formData)`
Fills form with provided data.
```javascript
await automation.page.fill('input[name="email"]', 'user@example.com')
```

#### `screenshot(filename)`
Captures screenshot.
```javascript
await automation.page.screenshot({ path: 'dashboard.png' })
```

---

## Examples

### Example 1: Cannabis Farm Setup

```javascript
async function setupCannabisFarm() {
  const automation = new OFMSAutomation()
  
  await automation.init()
  await automation.login()
  await automation.selectFarm('Shared Oxygen Farms')
  
  // Create cannabis strains
  const strains = [
    { name: 'Blue Dream', type: 'Sativa', thc: 18 },
    { name: 'OG Kush', type: 'Indica', thc: 22 },
    { name: 'Gelato', type: 'Hybrid', thc: 20 }
  ]
  
  for (const strain of strains) {
    await automation.createSeedVariety({
      name: strain.name,
      scientificName: `Cannabis ${strain.type.toLowerCase()}`,
      stockQuantity: 50,
      costPerUnit: 25.00
    })
  }
  
  await automation.close()
}
```

### Example 2: Batch Testing

```javascript
async function batchTest() {
  const automation = new OFMSAutomation()
  const results = []
  
  await automation.init()
  
  // Test multiple user roles
  const users = [
    { email: 'admin@ofms.com', role: 'ADMIN' },
    { email: 'manager@ofms.com', role: 'MANAGER' },
    { email: 'worker@ofms.com', role: 'WORKER' }
  ]
  
  for (const user of users) {
    try {
      await automation.login(user.email, 'password123')
      
      // Verify permissions
      const hasAccess = await automation.page.isVisible('.admin-panel')
      
      results.push({
        user: user.email,
        role: user.role,
        adminAccess: hasAccess,
        status: 'SUCCESS'
      })
      
    } catch (error) {
      results.push({
        user: user.email,
        error: error.message,
        status: 'FAILED'
      })
    }
  }
  
  console.table(results)
  await automation.close()
}
```

### Example 3: Data Validation

```javascript
async function validateInventory() {
  const automation = new OFMSAutomation()
  
  await automation.init()
  await automation.login()
  
  // Navigate to inventory
  await automation.page.goto(`${automation.baseURL}/inventory/stock`)
  
  // Extract inventory data
  const items = await automation.page.evaluate(() => {
    const rows = document.querySelectorAll('.inventory-row')
    return Array.from(rows).map(row => ({
      name: row.querySelector('.item-name')?.textContent,
      quantity: row.querySelector('.quantity')?.textContent,
      status: row.querySelector('.status')?.textContent
    }))
  })
  
  // Validate data
  const lowStock = items.filter(item => 
    parseInt(item.quantity) < 10
  )
  
  if (lowStock.length > 0) {
    console.warn('⚠️ Low stock items:', lowStock)
  }
  
  await automation.close()
}
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Connection Refused Error
```
Error: net::ERR_CONNECTION_REFUSED at http://localhost:3005
```
**Solution:**
```bash
# Verify OFMS is running
lsof -i :3005

# Start OFMS if needed
cd .. && npm run dev
```

#### 2. Login Timeout
```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded
```
**Solution:**
```javascript
// Increase timeout
await page.waitForURL('**/dashboard', { timeout: 60000 })

// Or check credentials
node scripts/reset-admin-password.js
```

#### 3. Element Not Found
```
Error: waiting for selector ".modal" to be visible
```
**Solution:**
```javascript
// Use more specific selectors
await page.waitForSelector('[data-testid="modal"]')

// Or add retry logic
for (let i = 0; i < 3; i++) {
  try {
    await page.click('.button')
    break
  } catch {
    await page.waitForTimeout(1000)
  }
}
```

#### 4. Farm Selector Not Available
```
Farm selector not available or farm already selected
```
**Solution:**
```javascript
// Check user permissions
const isAdmin = await page.isVisible('[aria-label="Select farm"]')

// Or refresh context
await page.reload()
await page.waitForLoadState('networkidle')
```

### Debug Mode

Enable debug output:
```javascript
// Set DEBUG environment variable
DEBUG=pw:api node ofms-data-entry.js

// Or add verbose logging
automation.browser = await chromium.launch({
  headless: false,
  devtools: true,  // Open Chrome DevTools
  logger: {
    isEnabled: () => true,
    log: (name, severity, message) => {
      console.log(`[${severity}] ${name}: ${message}`)
    }
  }
})
```

---

## Performance Optimization

### Speed Improvements

```javascript
// 1. Disable animations
await page.addInitScript(() => {
  window.localStorage.setItem('reduceMotion', 'true')
})

// 2. Block unnecessary resources
await page.route('**/*.{png,jpg,jpeg}', route => route.abort())

// 3. Parallel execution
const promises = [
  automation.createSeedVariety(seed1),
  automation.createSeedVariety(seed2),
  automation.createSeedVariety(seed3)
]
await Promise.all(promises)

// 4. Reuse contexts
const context = await browser.newContext({
  storageState: 'auth.json'  // Save auth state
})
```

### Memory Management

```javascript
// Clean up properly
process.on('SIGINT', async () => {
  await automation.close()
  process.exit(0)
})

// Limit concurrent pages
const MAX_PAGES = 5
const pages = []
for (let i = 0; i < MAX_PAGES; i++) {
  pages.push(await context.newPage())
}
```

---

## Security Considerations

1. **Credentials Management**
   - Never hardcode production credentials
   - Use environment variables
   - Rotate test account passwords regularly

2. **Data Isolation**
   - Use separate test database
   - Clean up test data after runs
   - Avoid modifying production data

3. **Network Security**
   - Run on localhost only for testing
   - Use VPN for remote testing
   - Implement rate limiting

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm ci
          npx playwright install chromium
      
      - name: Run tests
        run: |
          npm run test:e2e
        env:
          OFMS_URL: ${{ secrets.OFMS_URL }}
          OFMS_ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

---

## Support & Resources

- **Documentation**: `/automation/README.md`
- **Issues**: Check console logs and browser DevTools
- **Updates**: Keep Playwright updated (`npm update @playwright/test`)
- **Community**: Playwright Discord and GitHub discussions

---

*Last Updated: August 2025*
*Version: 1.0.0*
*Compatible with OFMS v2.x*

