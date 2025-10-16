#!/usr/bin/env node

/**
 * Add BackButton to All Pages
 * 
 * This script adds the BackButton component to all page.tsx files
 * that don't already have it.
 * 
 * @author Shared Oxygen, LLC
 * @copyright 2025 Shared Oxygen, LLC. All rights reserved.
 */

const fs = require('fs');
const path = require('path');

// Pages that should NOT have back button (entry points)
const EXCLUDE_PAGES = [
    '/src/app/page.tsx',                    // Landing page
    '/src/app/dashboard/page.tsx',          // Main dashboard
    '/src/app/auth/signin/page.tsx',        // Login page
];

// Map of pages to their fallback paths
const FALLBACK_PATHS = {
    // Admin pages
    '/src/app/admin/page.tsx': '/dashboard',
    '/src/app/admin/farms/page.tsx': '/admin',
    '/src/app/admin/farms/[farmId]/page.tsx': '/admin/farms',
    '/src/app/admin/feedback/page.tsx': '/admin',
    '/src/app/admin/utilities/ai-models/page.tsx': '/admin',
    '/src/app/admin/utilities/connected-users/page.tsx': '/admin',
    
    // Analytics pages
    '/src/app/analytics/page.tsx': '/dashboard',
    '/src/app/analytics/financial/page.tsx': '/analytics',
    '/src/app/analytics/market/page.tsx': '/analytics',
    '/src/app/analytics/production/page.tsx': '/analytics',
    '/src/app/analytics/sustainability/page.tsx': '/analytics',
    '/src/app/analytics/yield/page.tsx': '/analytics',
    
    // Compliance pages
    '/src/app/compliance/page.tsx': '/dashboard',
    '/src/app/compliance/fda-fsma/page.tsx': '/compliance',
    '/src/app/compliance/usda-organic/page.tsx': '/compliance',
    
    // Equipment pages
    '/src/app/equipment/page.tsx': '/dashboard',
    '/src/app/equipment/maintenance/page.tsx': '/equipment',
    '/src/app/equipment/management/page.tsx': '/equipment',
    '/src/app/equipment/sensors/page.tsx': '/equipment',
    
    // Inventory pages
    '/src/app/inventory/page.tsx': '/dashboard',
    '/src/app/inventory/equipment/page.tsx': '/inventory',
    '/src/app/inventory/packaging/page.tsx': '/inventory',
    '/src/app/inventory/stock/page.tsx': '/inventory',
    '/src/app/inventory/supplies/page.tsx': '/inventory',
    
    // Planning pages
    '/src/app/planning/page.tsx': '/dashboard',
    '/src/app/planning/calendar/page.tsx': '/planning',
    '/src/app/planning/crops/page.tsx': '/planning',
    '/src/app/planning/forecasting/page.tsx': '/planning',
    '/src/app/planning/production/page.tsx': '/planning',
    '/src/app/planning/resources/page.tsx': '/planning',
    
    // Production pages
    '/src/app/production/page.tsx': '/dashboard',
    '/src/app/production/batches/page.tsx': '/production',
    '/src/app/production/environments/page.tsx': '/production',
    '/src/app/production/harvesting/page.tsx': '/production',
    '/src/app/production/post-harvest/page.tsx': '/production',
    '/src/app/production/seeds/page.tsx': '/production',
    
    // Quality pages
    '/src/app/quality/page.tsx': '/dashboard',
    '/src/app/quality/audits/page.tsx': '/quality',
    '/src/app/quality/certifications/page.tsx': '/quality',
    '/src/app/quality/control/page.tsx': '/quality',
    '/src/app/quality/food-safety/page.tsx': '/quality',
    
    // Sales pages
    '/src/app/sales/page.tsx': '/dashboard',
    '/src/app/sales/b2b-customers/page.tsx': '/sales',
    '/src/app/sales/b2c-customers/page.tsx': '/sales',
    '/src/app/sales/contracts/page.tsx': '/sales',
    '/src/app/sales/orders/page.tsx': '/sales',
    '/src/app/sales/pricing/page.tsx': '/sales',
    
    // Settings pages
    '/src/app/settings/page.tsx': '/dashboard',
    
    // Tasks pages
    '/src/app/tasks/page.tsx': '/dashboard',
    '/src/app/tasks/assignments/page.tsx': '/tasks',
    '/src/app/tasks/calendar/page.tsx': '/tasks',
    '/src/app/tasks/work-orders/page.tsx': '/tasks',
    
    // Team pages
    '/src/app/team/page.tsx': '/dashboard',
    '/src/app/team/directory/page.tsx': '/team',
    '/src/app/team/performance/page.tsx': '/team',
    
    // Traceability pages
    '/src/app/traceability/page.tsx': '/dashboard',
    '/src/app/traceability/lots/page.tsx': '/traceability',
    '/src/app/traceability/seed-to-sale/page.tsx': '/traceability',
    
    // Other pages
    '/src/app/ai-insights/page.tsx': '/dashboard',
    '/src/app/feedback/page.tsx': '/dashboard',
    '/src/app/integrations/page.tsx': '/dashboard',
};

function addBackButtonToFile(filePath, fallbackPath) {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if BackButton is already imported
    if (content.includes('BackButton')) {
        console.log(`✅ Already has BackButton: ${filePath}`);
        return false;
    }
    
    // Add BackButton to imports
    const importRegex = /from ['"]@\/components\/ui['"]/;
    if (importRegex.test(content)) {
        // Add to existing ui import
        content = content.replace(
            /import\s*{([^}]+)}\s*from\s*['"]@\/components\/ui['"]/,
            (match, imports) => {
                const trimmedImports = imports.trim();
                return `import { ${trimmedImports}, BackButton } from '@/components/ui'`;
            }
        );
    } else {
        // Add new import after other imports
        const lastImportIndex = content.lastIndexOf("import ");
        if (lastImportIndex !== -1) {
            const endOfImport = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfImport + 1) + 
                     `import { BackButton } from '@/components/ui';\n` +
                     content.slice(endOfImport + 1);
        }
    }
    
    // Add BackButton after opening container div
    const containerPatterns = [
        /<div className={styles\.container}>/,
        /<div className={styles\.page}>/,
        /<div className={styles\.pageContainer}>/,
        /<main className={styles\.container}>/,
        /<main className={styles\.main}>/,
    ];
    
    let replaced = false;
    for (const pattern of containerPatterns) {
        if (pattern.test(content)) {
            content = content.replace(
                pattern,
                (match) => `${match}\n            <BackButton fallbackPath="${fallbackPath}" />\n`
            );
            replaced = true;
            break;
        }
    }
    
    if (!replaced) {
        console.log(`⚠️  Could not find container div: ${filePath}`);
        return false;
    }
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Added BackButton: ${filePath}`);
    return true;
}

function main() {
    console.log('🚀 Adding BackButton to all pages...\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const [filePath, fallbackPath] of Object.entries(FALLBACK_PATHS)) {
        if (EXCLUDE_PAGES.includes(filePath)) {
            console.log(`⏭️  Skipping (entry point): ${filePath}`);
            skipCount++;
            continue;
        }
        
        try {
            if (addBackButtonToFile(filePath, fallbackPath)) {
                successCount++;
            } else {
                skipCount++;
            }
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            errorCount++;
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   ✅ Added: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Total: ${Object.keys(FALLBACK_PATHS).length}`);
}

main();
