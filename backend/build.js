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
        .replace(/import\s+['"`]([^'"`]+)['"`];?/g, 'require(\'$1\');')
        // export default -> module.exports =
        .replace(/export\s+default\s+/g, 'module.exports = ')
        // export { named } -> module.exports = { named }
        .replace(/export\s+\{\s*([^}]+)\s*\};?/g, 'module.exports = { $1 };')
        // export const/function/class -> module.exports.name =
        .replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, '$1 $2')
        // Remove export from function/class declarations and add module.exports assignment
        .replace(/export\s+(function|class)\s+(\w+)/g, '$1 $2\nmodule.exports.$2 = $2;');

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
            // Copy .ts files as .js files with full conversion
            const destPath = path.join(destDir, item.replace('.ts', '.js'));
            let content = fs.readFileSync(srcPath, 'utf8');

            // Convert imports/exports first
            content = convertImportsToRequire(content);

            // Basic TypeScript to JavaScript conversion
            content = content
                .replace(/import\s+type\s+.*?from\s+.*?;/g, '') // Remove type imports
                .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*=/g, ' =') // Remove type annotations in assignments
                .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*\)/g, ')') // Remove type annotations in function params
                .replace(/:\s*\w+(\[\])?(\s*\|\s*\w+)*\s*;/g, ';') // Remove type annotations in declarations
                .replace(/export\s+interface\s+.*?\{[\s\S]*?\}/g, '') // Remove interfaces
                .replace(/export\s+type\s+.*?=.*?;/g, '') // Remove type aliases
                .replace(/as\s+\w+/g, '') // Remove type assertions
                .replace(/\?\s*:/g, ':') // Remove optional property markers
                .replace(/public\s+|private\s+|protected\s+/g, '') // Remove access modifiers
                .replace(/readonly\s+/g, ''); // Remove readonly

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
    console.log('Generated files:');

    function listFiles(dir, prefix = '') {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                console.log(`${prefix}📁 ${item}/`);
                listFiles(fullPath, prefix + '  ');
            } else {
                console.log(`${prefix}📄 ${item}`);
            }
        }
    }

    listFiles('dist');
    process.exit(0);

} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}