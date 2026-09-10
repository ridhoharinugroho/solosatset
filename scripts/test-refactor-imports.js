import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('scratch')) {
        results = results.concat(walk(fullPath));
      }
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.mjs')) {
      results.push(fullPath);
    }
  });
  return results;
}

function getExportsFromFile(filePath, visited = new Set()) {
  if (!fs.existsSync(filePath)) return new Set();
  const normalized = path.normalize(filePath);
  if (visited.has(normalized)) return new Set();
  visited.add(normalized);

  const exports = new Set();
  let content = '';
  try {
    content = fs.readFileSync(normalized, 'utf8');
  } catch (e) {
    return exports;
  }

  const directExportRegex = /export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z0-9_$]+)/g;
  let m;
  while ((m = directExportRegex.exec(content)) !== null) {
    exports.add(m[1]);
  }

  const namedExportClauseRegex = /export\s*\{([^}]+)\}(?:\s*from\s*['"]([^'"]+)['"])?/g;
  while ((m = namedExportClauseRegex.exec(content)) !== null) {
    const clause = m[1];
    const fromPath = m[2];
    if (fromPath) {
      const targetFile = resolveImportPath(normalized, fromPath);
      const targetExports = getExportsFromFile(targetFile, visited);
      const items = clause.split(',').map(s => s.trim()).filter(Boolean);
      items.forEach(item => {
        const parts = item.split(/\s+as\s+/);
        const originalName = parts[0].trim();
        const exportedName = (parts[1] || parts[0]).trim();
        if (targetExports.has(originalName) || originalName === '*') {
          exports.add(exportedName);
        }
      });
    } else {
      const items = clause.split(',').map(s => s.trim()).filter(Boolean);
      items.forEach(item => {
        const parts = item.split(/\s+as\s+/);
        const exportedName = (parts[1] || parts[0]).trim();
        exports.add(exportedName);
      });
    }
  }

  const wildcardReexportRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
  while ((m = wildcardReexportRegex.exec(content)) !== null) {
    const fromPath = m[1];
    const targetFile = resolveImportPath(normalized, fromPath);
    const targetExports = getExportsFromFile(targetFile, visited);
    targetExports.forEach(e => exports.add(e));
  }

  return exports;
}

function resolveImportPath(fromFile, importPath) {
  let resolved = path.normalize(path.join(path.dirname(fromFile), importPath));
  if (!fs.existsSync(resolved) && fs.existsSync(resolved + '.js')) {
    resolved += '.js';
  }
  return resolved;
}

const jsFiles = walk('./js');
const issues = [];

jsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importedSymbols = match[1];
    const importPath = match[2];

    if (!importPath.startsWith('.')) continue;

    const targetFile = resolveImportPath(file, importPath);

    if (!fs.existsSync(targetFile)) {
      issues.push(`[Broken Import Path] ${file} -> '${importPath}' (resolved: ${targetFile}) does not exist.`);
      continue;
    }

    const availableExports = getExportsFromFile(targetFile);

    if (importedSymbols.startsWith('{')) {
      const symbols = importedSymbols.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);

      symbols.forEach(symClause => {
        const parts = symClause.split(/\s+as\s+/);
        const symbol = parts[0].trim();
        if (!availableExports.has(symbol)) {
          issues.push(`[Missing Export] ${file} imports '${symbol}' from '${importPath}', but '${symbol}' is NOT exported in '${targetFile}'.`);
        }
      });
    }
  }
});

console.log('=== Solosatset Modularization & Import/Export Regression Tests ===');
if (issues.length > 0) {
  console.error(`❌ Regression test failed! Found ${issues.length} broken module imports/exports:`);
  issues.forEach(i => console.error('  - ' + i));
  process.exit(1);
} else {
  console.log(`✓ All ${jsFiles.length} JS files passed import/export resolution regression tests!`);
}
