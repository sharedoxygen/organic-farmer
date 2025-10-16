# OFMS Automation - Quick Reference

## 🚀 Quick Start (2 minutes)

```bash
# Setup (one-time)
cd automation/
npm install
npx playwright install chromium

# Ensure admin exists
cd .. && node scripts/reset-admin-password.js

# Run automation
cd automation/
npm run demo
```

## 📋 Essential Commands

| Task | Command | Description |
|------|---------|-------------|
| **Full Demo** | `npm run demo` | Complete automation demo |
| **Test Login** | `npm run test-login` | Quick login verification |
| **Custom Run** | `node ofms-data-entry.js` | Run with defaults |
| **Debug Mode** | `DEBUG=pw:api node ofms-data-entry.js` | Verbose output |

## 🔑 Default Credentials

```javascript
URL:      http://localhost:3005
Email:    admin@ofms.com
Password: REDACTED_TEST_PASSWORD
Farm:     Shared Oxygen Farms
```

## 💻 Code Snippets

### Basic Automation
```javascript
const { OFMSAutomation } = require('./ofms-data-entry')

async function run() {
  const auto = new OFMSAutomation()
  await auto.init()
  await auto.login()
  await auto.selectFarm('Shared Oxygen Farms')
  // Your tasks here
  await auto.close()
}
run()
```

### Create Seed Variety
```javascript
await auto.createSeedVariety({
  name: 'Blue Dream',
  scientificName: 'Cannabis sativa',
  supplier: 'Seeds Co',
  stockQuantity: 100,
  minStockLevel: 20,
  costPerUnit: 15.99,
  germinationRate: 0.95,
  daysToHarvest: 65
})
```

### Create Customer
```javascript
await auto.createCustomer({
  name: 'Green Dispensary',
  contactPerson: 'John Doe',
  email: 'john@green.com',
  phone: '(555) 123-4567'
})
```

## 🔧 Common Fixes

| Issue | Solution |
|-------|----------|
| **Connection refused** | Start OFMS: `cd .. && npm run dev` |
| **Wrong port** | Edit `baseURL` in `ofms-data-entry.js` |
| **Login fails** | Reset password: `node scripts/reset-admin-password.js` |
| **Timeout errors** | Increase timeout: `{ timeout: 60000 }` |
| **Element not found** | Add wait: `await page.waitForTimeout(2000)` |

## 📁 File Structure
```
automation/
├── ofms-data-entry.js     # Main class
├── test-login.js          # Login test
├── package.json           # Scripts
├── TECHNICAL_GUIDE.md     # Full docs
└── QUICK_REFERENCE.md     # This file
```

## 🎯 Available Methods

- `init()` - Initialize browser
- `login(email, password)` - Authenticate
- `selectFarm(name)` - Switch farms
- `createSeedVariety(data)` - Add seeds
- `createGrowingEnvironment(data)` - Add environments
- `createCustomer(data)` - Add customers
- `submitFeedback(data)` - Send feedback
- `close()` - Clean up

## 🏃 Speed Tips

```javascript
// Run headless (faster)
this.browser = await chromium.launch({
  headless: true,
  slowMo: 0
})

// Skip animations
await page.addInitScript(() => {
  window.localStorage.setItem('reduceMotion', 'true')
})

// Parallel operations
await Promise.all([
  auto.createSeedVariety(seed1),
  auto.createSeedVariety(seed2)
])
```

## 📊 Sample Data Sets

```javascript
const CANNABIS = {
  seeds: [
    { name: 'Blue Dream', type: 'Sativa' },
    { name: 'OG Kush', type: 'Indica' },
    { name: 'Gelato', type: 'Hybrid' }
  ],
  customers: [
    { name: 'CA Cannabis Co' },
    { name: 'Bay Dispensary' }
  ]
}

const MICROGREENS = {
  seeds: [
    { name: 'Arugula', daysToHarvest: 14 },
    { name: 'Kale', daysToHarvest: 16 }
  ],
  customers: [
    { name: 'Farm to Table' },
    { name: 'Whole Foods' }
  ]
}
```

---
*For detailed documentation, see [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)*

