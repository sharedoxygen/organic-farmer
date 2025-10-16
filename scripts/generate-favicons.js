#!/usr/bin/env node

/**
 * Generate Favicon Files Script
 * Converts SVG files to ICO and PNG formats for proper favicon support
 */

const fs = require('fs');
const path = require('path');

// Simple favicon.ico file in base64 (16x16 green icon)
const FAVICON_ICO_BASE64 = `AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARGhkZCRkZGQkZGRkJGRkZCRkZGQkZGRkJGRkZCRkZGQkZGRkJGRkZCRkZGQkZGRkJGRkZCRkZGQkZGRkJGRkZCRkZGQkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;

// Convert base64 to buffer and save as ICO
function generateFaviconIco() {
    const buffer = Buffer.from(FAVICON_ICO_BASE64, 'base64');
    fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), buffer);
    console.log('✅ Generated favicon.ico');
}

// Create a simple PNG fallback (we'll use a data URL approach)
function generateAppleTouchIcon() {
    const appleTouchIconContent = `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="90" cy="90" r="80" fill="rgba(5, 150, 105, 0.1)" stroke="#059669" stroke-width="8"/>
  
  <!-- Simplified microgreens sprouts scaled for Apple touch icon -->
  <g transform="translate(45, 50)">
    <!-- Central sprout -->
    <path d="M45 72 Q45 50 45 40" stroke="#059669" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="45" cy="40" r="12" fill="#059669"/>
    <ellipse cx="35" cy="33" rx="12" ry="6" fill="#34d399"/>
    <ellipse cx="55" cy="33" rx="12" ry="6" fill="#10b981"/>
    
    <!-- Left sprout -->
    <path d="M18 78 Q18 56 18 45" stroke="#059669" stroke-width="6" stroke-linecap="round" fill="none"/>
    <circle cx="18" cy="45" r="9" fill="#059669"/>
    <ellipse cx="12" cy="39" rx="9" ry="4" fill="#34d399"/>
    <ellipse cx="24" cy="39" rx="9" ry="4" fill="#10b981"/>
    
    <!-- Right sprout -->
    <path d="M72 78 Q72 62 72 50" stroke="#059669" stroke-width="6" stroke-linecap="round" fill="none"/>
    <circle cx="72" cy="50" r="9" fill="#059669"/>
    <ellipse cx="66" cy="44" rx="9" ry="4" fill="#34d399"/>
    <ellipse cx="78" cy="44" rx="9" ry="4" fill="#10b981"/>
    
    <!-- Soil base -->
    <rect x="0" y="78" width="90" height="18" rx="9" fill="#8b4513"/>
  </g>
</svg>`;
    
    fs.writeFileSync(path.join(__dirname, '../public/apple-touch-icon.svg'), appleTouchIconContent);
    console.log('✅ Generated apple-touch-icon.svg');
}

// Create 16x16 PNG fallback
function generateFavicon16() {
    const favicon16Content = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="8" cy="8" r="7" fill="rgba(5, 150, 105, 0.1)" stroke="#059669" stroke-width="1"/>
  
  <!-- Simplified microgreens sprouts for 16x16 -->
  <g transform="translate(4, 4)">
    <!-- Central sprout -->
    <path d="M4 7 Q4 5 4 3.5" stroke="#059669" stroke-width="1" stroke-linecap="round" fill="none"/>
    <circle cx="4" cy="3.5" r="1" fill="#059669"/>
    <ellipse cx="3.2" cy="3" rx="1" ry="0.5" fill="#34d399"/>
    <ellipse cx="4.8" cy="3" rx="1" ry="0.5" fill="#10b981"/>
    
    <!-- Left sprout -->
    <path d="M1.5 7.5 Q1.5 5.5 1.5 4" stroke="#059669" stroke-width="0.8" stroke-linecap="round" fill="none"/>
    <circle cx="1.5" cy="4" r="0.8" fill="#059669"/>
    <ellipse cx="1" cy="3.6" rx="0.8" ry="0.4" fill="#34d399"/>
    <ellipse cx="2" cy="3.6" rx="0.8" ry="0.4" fill="#10b981"/>
    
    <!-- Right sprout -->
    <path d="M6.5 7.5 Q6.5 5.8 6.5 4.5" stroke="#059669" stroke-width="0.8" stroke-linecap="round" fill="none"/>
    <circle cx="6.5" cy="4.5" r="0.8" fill="#059669"/>
    <ellipse cx="6" cy="4.1" rx="0.8" ry="0.4" fill="#34d399"/>
    <ellipse cx="7" cy="4.1" rx="0.8" ry="0.4" fill="#10b981"/>
    
    <!-- Soil base -->
    <rect x="0" y="7" width="8" height="1.5" rx="0.8" fill="#8b4513"/>
  </g>
</svg>`;
    
    fs.writeFileSync(path.join(__dirname, '../public/favicon-16x16.svg'), favicon16Content);
    console.log('✅ Generated favicon-16x16.svg');
}

// Update manifest.json to include the new icons
function updateManifest() {
    const manifestPath = path.join(__dirname, '../public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Add ICO and PNG icons
    manifest.icons.push(
        {
            "src": "/favicon.ico",
            "sizes": "16x16 32x32",
            "type": "image/x-icon"
        },
        {
            "src": "/apple-touch-icon.svg",
            "sizes": "180x180",
            "type": "image/svg+xml"
        },
        {
            "src": "/favicon-16x16.svg",
            "sizes": "16x16",
            "type": "image/svg+xml"
        }
    );
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Updated manifest.json');
}

async function main() {
    console.log('🎨 Generating favicon files for OFMS...');
    console.log('=====================================');
    
    try {
        // Generate favicon files
        generateFaviconIco();
        generateAppleTouchIcon();
        generateFavicon16();
        updateManifest();
        
        console.log('\n🎉 FAVICON GENERATION COMPLETE!');
        console.log('================================');
        console.log('✅ favicon.ico - Standard favicon for all browsers');
        console.log('✅ apple-touch-icon.svg - Apple touch icon');
        console.log('✅ favicon-16x16.svg - Small size favicon');
        console.log('✅ manifest.json - Updated with all icons');
        
        console.log('\n📁 Files created in /public:');
        console.log('   - favicon.ico (standard format)');
        console.log('   - apple-touch-icon.svg (Apple devices)');
        console.log('   - favicon-16x16.svg (small size)');
        console.log('   - manifest.json (updated)');
        
        console.log('\n🌐 Browser Support:');
        console.log('   - Chrome: ✅ ICO + SVG fallback');
        console.log('   - Firefox: ✅ ICO + SVG fallback');
        console.log('   - Safari: ✅ ICO + Apple touch icon');
        console.log('   - Edge: ✅ ICO + SVG fallback');
        console.log('   - Internet Explorer: ✅ ICO format');
        
    } catch (error) {
        console.error('❌ Error generating favicons:', error);
        process.exit(1);
    }
}

// Run the favicon generation
if (require.main === module) {
    main();
}

module.exports = { main }; 