const fs = require('fs');
const path = require('path');

console.log('Starting CommonJS build process...');

function convertImportsToRequire(content) {
    // Convert ES6 imports to CommonJS requires
    content = content
        // import defaultExport from 'module' -> const defaultExport = require('module')
        .replace(/import\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`];?/g, 'const $1 = require(\'$2\');')
        // import { named } from 'module' -> const { named } = require('module')
        .replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"`]([^'"`]+)['"`];?/g, 'const { $1 } = require(\'$2\');')
        // import * as name from 'module' -> const name = require('module')
        .replace(/import\s+\*\s+as\s+(\w+)\s+from\s+['"`]([^'"`]+)['"`];?/g, 'const $1 = require(\'$2\');')
        // import 'module' -> require('module')
        .replace(/import\s+['"`]([^'"`]+)['"`];?/g, 'require(\'$1\');');

    return content;
}

function convertExports(content) {
    // Convert ES6 exports to CommonJS
    content = content
        // export default -> module.exports =
        .replace(/export\s+default\s+/g, 'module.exports = ')
        // export { named } -> module.exports = { named }
        .replace(/export\s+\{\s*([^}]+)\s*\};?/g, 'module.exports = { $1 };')
        // export const/let/var/function/class
        .replace(/export\s+(const|let|var)\s+(\w+)/g, '$1 $2')
        .replace(/export\s+(function|class)\s+(\w+)/g, '$1 $2');

    return content;
}

function removeTypeScriptSyntax(content) {
    // Remove TypeScript-specific syntax
    content = content
        // Remove import type statements
        .replace(/import\s+type\s+.*?from\s+.*?;?\n?/g, '')
        // Remove export type statements
        .replace(/export\s+type\s+.*?=.*?;?\n?/g, '')
        // Remove interface declarations
        .replace(/export\s+interface\s+\w+\s*\{[\s\S]*?\}\n?/g, '')
        .replace(/interface\s+\w+\s*\{[\s\S]*?\}\n?/g, '')
        // Remove type aliases
        .replace(/type\s+\w+\s*=[\s\S]*?;?\n?/g, '')
        // Remove type annotations from variable declarations
        .replace(/(const|let|var)\s+(\w+)\s*:\s*[^=\n;]+(\s*=)/g, '$1 $2$3')
        // Remove type annotations from function parameters
        .replace(/(\w+)\s*:\s*[^,\)=\n{]+(?=[,\)])/g, '$1')
        // Remove return type annotations
        .replace(/\)\s*:\s*[^{=\n;]+(\s*[{=])/g, ')$1')
        // Remove type assertions (as Type)
        .replace(/(\w+|\))\s+as\s+[^,\)\n;]+/g, '$1')
        // Remove optional property markers
        .replace(/(\w+)\?\s*:/g, '$1:')
        // Remove access modifiers
        .replace(/(public|private|protected|readonly)\s+/g, '')
        // Remove generic type parameters
        .replace(/(\w+)\s*<[^>]*>(\s*\()/g, '$1$2')
        // Clean up extra whitespace
        .replace(/\n\s*\n\s*\n/g, '\n\n');

    return content;
}

function copyAndRenameFiles(srcDir, destDir) {
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    const items = fs.readdirSync(srcDir);

    for (const item of items) {
        const srcPath = path.join(srcDir, item);
        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            const newDestDir = path.join(destDir, item);
            copyAndRenameFiles(srcPath, newDestDir);
        } else if (item.endsWith('.ts')) {
            // Copy .ts files as .js files with conversion
            const destPath = path.join(destDir, item.replace('.ts', '.js'));
            let content = fs.readFileSync(srcPath, 'utf8');

            // Apply conversions in order
            content = removeTypeScriptSyntax(content);
            content = convertImportsToRequire(content);
            content = convertExports(content);

            fs.writeFileSync(destPath, content);
            console.log(`Converted: ${srcPath} -> ${destPath}`);
        } else {
            // Copy other files as-is
            const destPath = path.join(destDir, item);
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

try {
    console.log('Converting TypeScript files to CommonJS JavaScript...');

    // Remove existing dist folder
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true, force: true });
    }

    // Copy and convert files
    copyAndRenameFiles('src', 'dist');

    console.log('Build completed successfully!');
    process.exit(0);

} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}