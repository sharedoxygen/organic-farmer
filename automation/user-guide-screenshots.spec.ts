import { test } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const FARM_ID = '00000000-0000-0000-0000-000000000020'

test.setTimeout(10 * 60 * 1000)

test.use({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1, // Reduced from 2 to minimize file size
})

function env(name: string, fallback?: string): string | undefined {
    const v = process.env[name]
    if (typeof v === 'string' && v.trim().length > 0) return v.trim()
    return fallback
}

async function ensureDir(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true })
}

async function setFarmContext(page: any): Promise<void> {
    // Set farm context via localStorage, sessionStorage, and cookies
    await page.evaluate((farmId: string) => {
        try {
            localStorage.setItem('ofms_current_farm', farmId)
            localStorage.setItem('ofms_farm_id', farmId)
            localStorage.setItem('selectedFarmId', farmId)
            localStorage.setItem('currentFarmId', farmId)
            sessionStorage.setItem('ofms_current_farm', farmId)
            sessionStorage.setItem('selectedFarmId', farmId)
            document.cookie = `ofms_farm=${encodeURIComponent(farmId)}; path=/`
            document.cookie = `selectedFarmId=${encodeURIComponent(farmId)}; path=/`
            document.cookie = `currentFarmId=${encodeURIComponent(farmId)}; path=/`
        } catch {
        }
    }, FARM_ID)

    // Try API call to select farm
    try {
        await page.request.post('/api/tenant/select-farm', { data: { farmId: FARM_ID } })
    } catch {
    }
}

async function selectFarmViaUI(page: any): Promise<boolean> {
    // Try to click the farm selector dropdown and select Shared Oxygen
    try {
        // Dismiss any overlays first
        await page.keyboard.press('Escape')
        await page.waitForTimeout(300)

        // Find the farm selector button
        const farmDropdown = page.locator('button:has-text("FARM:")').first()
        if (await farmDropdown.isVisible({ timeout: 2000 })) {
            await farmDropdown.click({ force: true })
            await page.waitForTimeout(500)

            // Look for Shared Oxygen in the dropdown
            const sharedOxygenOption = page.locator('text=Shared Oxygen Farms').first()
            if (await sharedOxygenOption.isVisible({ timeout: 1500 })) {
                await sharedOxygenOption.click({ force: true })
                await page.waitForTimeout(1000)
                return true
            }

            // Close dropdown
            await page.keyboard.press('Escape')
        }
    } catch {
    }
    return false
}

async function dismissOverlays(page: any): Promise<void> {
    try {
        await page.keyboard.press('Escape')
    } catch {
    }

    const candidates = [
        'button:has-text("Close")',
        'button:has-text("Dismiss")',
        'button[aria-label="Close"]',
        '[data-testid="close"]',
    ]

    for (const sel of candidates) {
        try {
            const loc = page.locator(sel)
            if (await loc.count()) {
                await loc.first().click({ timeout: 500 })
            }
        } catch {
        }
    }
}

test('capture buyer-friendly user guide screenshots (cannabis demo farm)', async ({ page }) => {
    const email = env('DOCS_DEMO_EMAIL', env('TEST_ADMIN_EMAIL', 'demo.admin@ofms.example'))!
    const password = env('DOCS_DEMO_PASSWORD', env('TEST_ADMIN_PASSWORD', 'ofms_demo_admin_please_change'))!

    const screenshotRoot = path.resolve(process.cwd(), 'docs', 'screenshots')
    await ensureDir(screenshotRoot)

    await page.goto('/auth/signin')

    await page.locator('#email').fill(email)
    await page.locator('#password').fill(password)

    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 })

    try {
        await page.emulateMedia({ reducedMotion: 'reduce' })
    } catch {
    }

    // Set farm context via storage/cookies first
    await setFarmContext(page)
    await page.reload()
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 })
    await page.waitForTimeout(2000)

    // Then select Shared Oxygen Farms via UI dropdown
    await selectFarmViaUI(page)
    await page.waitForTimeout(1000)

    // Essential pages for complete farm-to-table narrative with full data
    const pages: Array<{ route: string; file: string }> = [
        { route: '/dashboard', file: 'dashboard.png' },
        { route: '/production/batches', file: 'production-batches.png' },
        { route: '/production/environments', file: 'production-environments.png' },
        { route: '/production/seeds', file: 'production-seeds.png' },
        { route: '/quality/control', file: 'quality-control.png' },
        { route: '/inventory/stock', file: 'inventory-stock.png' },
        { route: '/sales/orders', file: 'sales-orders.png' },
        { route: '/traceability/custody', file: 'traceability-custody.png' },
        { route: '/traceability/recalls', file: 'traceability-recalls.png' },
        { route: '/traceability/lots', file: 'traceability-lots.png' },
        { route: '/traceability/seed-to-sale', file: 'traceability-seed-to-sale.png' },
        { route: '/tasks/daily', file: 'tasks-daily.png' },
        { route: '/equipment/environmental', file: 'equipment-environmental.png' },
        { route: '/analytics/yield', file: 'analytics-yield.png' },
        { route: '/analytics/production', file: 'analytics-production.png' },
        { route: '/ai-insights', file: 'ai-insights.png' },
        { route: '/ai-dashboard', file: 'ai-dashboard.png' },
        { route: '/feedback', file: 'feedback.png' },
        { route: '/settings/users', file: 'settings-users.png' },
    ]

    for (const p of pages) {
        const outPath = path.join(screenshotRoot, p.file)
        let lastErr: unknown = null
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await page.goto(p.route, { waitUntil: 'domcontentloaded', timeout: 120_000 })
                try {
                    await page.waitForLoadState('networkidle', { timeout: 30_000 })
                } catch {
                }

                // Extra wait for data-heavy pages to ensure content loads
                if (p.route.includes('traceability') || p.route.includes('analytics') || p.route.includes('ai-')) {
                    await page.waitForTimeout(3000)
                } else {
                    await page.waitForTimeout(1500)
                }

                await dismissOverlays(page)
                await page.screenshot({ path: outPath, fullPage: false })
                lastErr = null
                break
            } catch (err) {
                lastErr = err
                try {
                    await page.waitForTimeout(1500)
                } catch {
                }
            }
        }

        if (lastErr) {
            process.stderr.write(`Failed to capture ${p.route}: ${String((lastErr as any)?.message || lastErr)}\n`)
        }
    }
})
