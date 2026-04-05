const fs = require('fs');
const path = require('path');

console.log('Starting FIXED CommonJS build process...');

// Specific fixes for known problematic patterns
function applySpecificFixes(content, filename) {
    // Fix logger.ts specific issues
    if (filename.includes('logger.ts')) {
        content = content
            // Fix the levels object
            .replace(/const levels = \{[\s\S]*?\};/g, `const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};`)
            // Fix the colors object
            .replace(/const colors = \{[\s\S]*?\};/g, `const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};`)
            // Fix winston format calls
            .replace(/winston\.format\.errors\(\s*\{\s*stack:\s*true\s*\}\s*\)/g, 'winston.format.errors({ stack: true })')
            .replace(/winston\.format\.timestamp\(\s*\{\s*format:\s*['"`][^'"`]*['"`]\s*\}\s*\)/g, 'winston.format.timestamp({ format: \'YYYY-MM-DD HH:mm:ss\' })')
            .replace(/winston\.format\.colorize\(\s*\{\s*all:\s*true\s*\}\s*\)/g, 'winston.format.colorize({ all: true })')
            // Fix file transport configurations
            .replace(/new winston\.transports\.File\(\s*\{\s*filename:\s*['"`]logs\/error\.log['"`],\s*level:\s*['"`]error['"`]\s*\}\s*\)/g, 'new winston.transports.File({ filename: \'logs/error.log\', level: \'error\' })')
            .replace(/new winston\.transports\.File\(\s*\{\s*filename:\s*['"`]logs\/all\.log['"`]\s*\}\s*\)/g, 'new winston.transports.File({ filename: \'logs/all.log\' })');
    }

    // Fix env.ts specific issues
    if (filename.includes('env.ts')) {
        // Fix Zod schema definitions
        content = content
            .replace(/PORT:\s*z\.string\(\)\.default\(['"`]5000['"`]\)/g, 'PORT: z.string().default(\'5000\')')
            .replace(/NODE_ENV:\s*z\.enum\(\[['"`]development['"`],\s*['"`]production['"`],\s*['"`]test['"`]\]\)\.default\(['"`]development['"`]\)/g, 'NODE_ENV: z.enum([\'development\', \'production\', \'test\']).default(\'development\')')
            .replace(/EMAIL_SERVICE:\s*z\.enum\(\[['"`]brevo['"`],\s*['"`]gmail['"`]\]\)\.default\(['"`]gmail['"`]\)/g, 'EMAIL_SERVICE: z.enum([\'brevo\', \'gmail\']).default(\'gmail\')');
    }

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
        // Remove type annotations from variable declarations (but not object properties)
        .replace(/(const|let|var)\s+(\w+)\s*:\s*[^=\n;{]+(\s*=)/g, '$1 $2$3')
        // Remove type annotations from function parameters (but preserve object properties)
        .replace(/(\w+)\s*:\s*[^,\)=\n{:]+(?=[,\)])/g, '$1')
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

            // Apply specific fixes first
            content = applySpecificFixes(content, srcPath);

            // Then apply general conversions
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