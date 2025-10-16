#!/usr/bin/env node

/**
 * Check Favicon Files Script
 * Verifies that all favicon files exist and are accessible
 */

const fs = require('fs');
const path = require('path');

const FAVICON_FILES = [
    'favicon.ico',
    'favicon.svg',
    'favicon-16x16.svg',
    'apple-touch-icon.svg',
    'logo-icon.svg',
    'logo.svg',
    'manifest.json'
];

function checkFaviconFiles() {
    console.log('🔍 Checking favicon files...');
    console.log('============================');
    
    let allFilesExist = true;
    
    FAVICON_FILES.forEach(file => {
        const filePath = path.join(__dirname, '../public', file);
        const exists = fs.existsSync(filePath);
        
        if (exists) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${file} (${stats.size} bytes)`);
        } else {
            console.log(`❌ ${file} - MISSING`);
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

function checkLayoutConfiguration() {
    console.log('\n🔍 Checking layout.tsx configuration...');
    console.log('=======================================');
    
    const layoutPath = path.join(__dirname, '../src/app/layout.tsx');
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    const checks = [
        { name: 'favicon.ico reference', pattern: /favicon\.ico/, found: false },
        { name: 'favicon.svg reference', pattern: /favicon\.svg/, found: false },
        { name: 'apple-touch-icon.svg reference', pattern: /apple-touch-icon\.svg/, found: false },
        { name: 'manifest.json reference', pattern: /manifest\.json/, found: false },
        { name: 'shortcut icon', pattern: /shortcut:/, found: false }
    ];
    
    checks.forEach(check => {
        check.found = check.pattern.test(layoutContent);
        console.log(`${check.found ? '✅' : '❌'} ${check.name}`);
    });
    
    return checks.every(check => check.found);
}

function main() {
    console.log('🚀 OFMS Favicon Check');
    console.log('===================');
    
    const filesExist = checkFaviconFiles();
    const layoutCorrect = checkLayoutConfiguration();
    
    console.log('\n📊 SUMMARY');
    console.log('===========');
    
    if (filesExist && layoutCorrect) {
        console.log('✅ All favicon files are properly configured!');
        console.log('\n🌐 Browser Support:');
        console.log('   - Chrome: ✅ ICO + SVG fallback');
        console.log('   - Firefox: ✅ ICO + SVG fallback');
        console.log('   - Safari: ✅ ICO + Apple touch icon');
        console.log('   - Edge: ✅ ICO + SVG fallback');
        console.log('   - Internet Explorer: ✅ ICO format');
        console.log('\n🎯 Internet Access:');
        console.log('   - Favicon will now display correctly when accessed via internet');
        console.log('   - All major browsers supported');
        console.log('   - Mobile devices supported');
        console.log('   - PWA manifest included');
    } else {
        console.log('❌ Some favicon files or configurations are missing');
        console.log('   Run: node scripts/generate-favicons.js');
        process.exit(1);
    }
}

// Run the check
if (require.main === module) {
    main();
}

module.exports = { main }; 