#!/usr/bin/env node
/**
 * Adds errorResponse import and normalizes catch blocks in API routes using ensureFarmAccess.
 */
import fs from 'fs';
import path from 'path';

const API_ROOT = new URL('../src/app/api', import.meta.url).pathname;

function walk(dir) {
    const files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else if (entry.name === 'route.ts') files.push(full);
    }
    return files;
}

function ensureErrorResponseImport(content) {
    if (content.includes('errorResponse')) return content;

    return content.replace(
        /import\s*\{([^}]+)\}\s*from\s*'@\/lib\/middleware\/requestGuards'/g,
        (match, imports) => {
            if (imports.includes('errorResponse')) return match;
            return `import {${imports}, errorResponse } from '@/lib/middleware/requestGuards'`;
        }
    );
}

function normalizeCatchBlocks(content) {
    let updated = content;

    // HttpError inline pattern
    updated = updated.replace(
        /\} catch \(error(?:: any)?\) \{\s*const status = error instanceof HttpError \? error\.status : 500\s*return NextResponse\.json\(\{ success: false, error: error\?\.message \|\| '([^']+)' \}, \{ status \}\)\s*\}/g,
        "} catch (error) {\n    return errorResponse(error, '$1')\n  }"
    );

    // console.error + single-line NextResponse 500 with success: false
    updated = updated.replace(
        /\} catch \(error(?:: any)?\) \{\s*console\.error\([^;]+;\s*return NextResponse\.json\(\s*\{ success: false, error: '([^']+)' \},\s*\{ status: 500 \}\s*\);\s*\}/g,
        "} catch (error) {\n        return errorResponse(error, '$1');\n    }"
    );

    // Multiline console.error + NextResponse 500 with success: false
    updated = updated.replace(
        /\} catch \(error(?:: any)?\) \{\s*console\.error\([^;]+;\s*return NextResponse\.json\(\s*\{\s*success: false,\s*error: '([^']+)'\s*\},\s*\{\s*status: 500\s*\}\s*\);\s*\}/gs,
        "} catch (error) {\n        return errorResponse(error, '$1');\n    }"
    );

    // console.error + NextResponse with extra fields (e.g. data: [])
    updated = updated.replace(
        /\} catch \(error(?:: any)?\) \{\s*console\.error\([^;]+;\s*return NextResponse\.json\(\s*\{[\s\S]*?success: false,\s*error: '([^']+)'[\s\S]*?\},\s*\{ status: 500 \}\s*\);\s*\}/g,
        "} catch (error) {\n    return errorResponse(error, '$1');\n  }"
    );

    // error?.message fallback pattern
    updated = updated.replace(
        /\} catch \(error(?:: any)?\) \{\s*console\.error\([^;]+;\s*return NextResponse\.json\(\s*\{ success: false, error: error\?\.message \|\| '([^']+)' \},\s*\{ status: 500 \}\s*\);\s*\}/g,
        "} catch (error) {\n        return errorResponse(error, '$1');\n    }"
    );

    // console.error + NextResponse with only error key (no success)
    updated = updated.replace(
        /\} catch \(error(?:: any)?\) \{\s*console\.error\([^;]+;\s*return NextResponse\.json\(\s*\{ error: '([^']+)' \},\s*\{ status: 500 \}\s*\);\s*\}/g,
        "} catch (error) {\n        return errorResponse(error, '$1');\n    }"
    );

    return updated;
}

let changed = 0;
for (const file of walk(API_ROOT)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('ensureFarmAccess')) continue;

    const next = normalizeCatchBlocks(ensureErrorResponseImport(content));
    if (next !== content) {
        fs.writeFileSync(file, next);
        changed++;
        console.log('updated:', path.relative(API_ROOT, file));
    }
}

console.log(`Done. Updated ${changed} route file(s).`);
