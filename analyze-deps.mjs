#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, dirname } from 'path';

const srcDir = './src/lib';
const results = {
  files: {},
  cycles: [],
  duplicateCode: [],
  scatteredConcepts: {},
  longChains: [],
  stats: {}
};

// Find all TypeScript files
function findFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  files.forEach(file => {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.match(/\.(ts|tsx)$/)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Extract imports from a file
function extractImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const imports = [];

  // Match ES6 imports
  const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|[\w,\s]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Only track internal imports (relative paths)
    if (importPath.startsWith('.') || importPath.startsWith('../')) {
      imports.push({
        path: importPath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
  }

  return imports;
}

// Resolve relative import to absolute path
function resolveImport(fromFile, importPath) {
  const fromDir = dirname(fromFile);
  let resolved = join(fromDir, importPath);

  // Handle .js extensions that refer to .ts files
  if (resolved.endsWith('.js')) {
    resolved = resolved.replace(/\.js$/, '.ts');
  }

  // Try adding extensions
  if (!resolved.match(/\.(ts|tsx)$/)) {
    if (statSync(resolved + '.ts', { throwIfNoEntry: false })) {
      resolved += '.ts';
    } else if (statSync(resolved + '.tsx', { throwIfNoEntry: false })) {
      resolved += '.tsx';
    } else if (statSync(join(resolved, 'index.ts'), { throwIfNoEntry: false })) {
      resolved = join(resolved, 'index.ts');
    }
  }

  return resolved;
}

// Build dependency graph
const files = findFiles(srcDir);
console.log(`Found ${files.length} TypeScript files\n`);

files.forEach(file => {
  const relativePath = relative('.', file);
  const imports = extractImports(file);

  results.files[relativePath] = {
    imports: imports.map(imp => {
      try {
        const resolved = resolveImport(file, imp.path);
        return relative('.', resolved);
      } catch {
        return imp.path;
      }
    }),
    size: readFileSync(file, 'utf-8').split('\n').length
  };
});

// Detect circular dependencies using DFS
function findCycles() {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        const cycle = [...path.slice(cycleStart), node];
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(node)) return;

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const deps = results.files[node]?.imports || [];
    deps.forEach(dep => {
      if (results.files[dep]) {
        dfs(dep, [...path]);
      }
    });

    recursionStack.delete(node);
  }

  Object.keys(results.files).forEach(file => {
    dfs(file);
  });

  return cycles;
}

results.cycles = findCycles();

// Find duplicate code patterns
function findDuplicates() {
  const patterns = [
    {
      name: 'HTML Escape Function',
      regex: /function\s+escapeHtml\s*\([^)]*\)[^{]*\{[^}]+htmlEscapes[^}]+\}/s,
      files: []
    },
    {
      name: 'Base64 Encoding (inline)',
      regex: /Buffer\.from\([^)]+\)\.toString\(['"]base64['"]\)/g,
      files: []
    },
    {
      name: 'Highlighter Creation',
      regex: /createHighlighter\s*\(\{[^}]+themes:[^}]+langs:[^}]+\}\)/s,
      files: []
    }
  ];

  files.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = relative('.', file);

    patterns.forEach(pattern => {
      if (content.match(pattern.regex)) {
        pattern.files.push(relativePath);
      }
    });
  });

  return patterns.filter(p => p.files.length > 1);
}

results.duplicateCode = findDuplicates();

// Find scattered concepts
function findScatteredConcepts() {
  const concepts = {
    'Base64 Encoding': [],
    'HTML Escaping': [],
    'Syntax Highlighting': [],
    'Tree Parsing': [],
    'Navigation': [],
    'Frontmatter': [],
    'Screenshot': []
  };

  files.forEach(file => {
    const content = readFileSync(file, 'utf-8');
    const relativePath = relative('.', file);

    if (content.match(/base64|Base64|encodeBase64|decodeBase64/i)) {
      concepts['Base64 Encoding'].push(relativePath);
    }
    if (content.match(/escapeHtml|htmlEscapes/)) {
      concepts['HTML Escaping'].push(relativePath);
    }
    if (content.match(/createHighlighter|shiki|highlight/i)) {
      concepts['Syntax Highlighting'].push(relativePath);
    }
    if (content.match(/parseTree|TreeNode|tree-parser/)) {
      concepts['Tree Parsing'].push(relativePath);
    }
    if (content.match(/navigation|DocsSection|DocsLink/i)) {
      concepts['Navigation'].push(relativePath);
    }
    if (content.match(/frontmatter|parseYaml/i)) {
      concepts['Frontmatter'].push(relativePath);
    }
    if (content.match(/screenshot|playwright|chromium/i)) {
      concepts['Screenshot'].push(relativePath);
    }
  });

  return Object.entries(concepts)
    .filter(([_, files]) => files.length > 1)
    .reduce((acc, [concept, files]) => {
      acc[concept] = files;
      return acc;
    }, {});
}

results.scatteredConcepts = findScatteredConcepts();

// Find long dependency chains
function findLongChains() {
  const chains = [];

  function findChain(node, visited = new Set(), depth = 0) {
    if (depth > 3 || visited.has(node)) return [];

    visited.add(node);
    const deps = results.files[node]?.imports || [];

    if (deps.length === 0) {
      return [[node]];
    }

    const allChains = [];
    deps.forEach(dep => {
      if (results.files[dep]) {
        const subChains = findChain(dep, new Set(visited), depth + 1);
        subChains.forEach(chain => {
          allChains.push([node, ...chain]);
        });
      }
    });

    return allChains;
  }

  Object.keys(results.files).forEach(file => {
    const fileChains = findChain(file);
    fileChains.forEach(chain => {
      if (chain.length > 3) {
        chains.push(chain);
      }
    });
  });

  return chains.slice(0, 10); // Top 10 longest chains
}

results.longChains = findLongChains();

// Calculate stats
results.stats = {
  totalFiles: files.length,
  totalDependencies: Object.values(results.files).reduce((sum, f) => sum + f.imports.length, 0),
  avgDependenciesPerFile: (Object.values(results.files).reduce((sum, f) => sum + f.imports.length, 0) / files.length).toFixed(2),
  filesWithNoDeps: Object.values(results.files).filter(f => f.imports.length === 0).length
};

// Output results
console.log('='.repeat(80));
console.log('DEPENDENCY ANALYSIS REPORT');
console.log('='.repeat(80));
console.log();

console.log('📊 STATISTICS');
console.log('-'.repeat(80));
console.log(`Total Files: ${results.stats.totalFiles}`);
console.log(`Total Dependencies: ${results.stats.totalDependencies}`);
console.log(`Average Dependencies per File: ${results.stats.avgDependenciesPerFile}`);
console.log(`Files with No Dependencies: ${results.stats.filesWithNoDeps}`);
console.log();

console.log('🔄 CIRCULAR DEPENDENCIES');
console.log('-'.repeat(80));
if (results.cycles.length === 0) {
  console.log('✅ No circular dependencies found!');
} else {
  console.log(`❌ Found ${results.cycles.length} circular dependency cycle(s):`);
  results.cycles.forEach((cycle, i) => {
    console.log(`\n  ${i + 1}. ${cycle.join(' → ')}`);
  });
}
console.log();

console.log('📋 DUPLICATE CODE PATTERNS');
console.log('-'.repeat(80));
if (results.duplicateCode.length === 0) {
  console.log('✅ No significant code duplication found!');
} else {
  results.duplicateCode.forEach(pattern => {
    console.log(`\n  ${pattern.name}: ${pattern.files.length} occurrences`);
    pattern.files.forEach(file => console.log(`    - ${file}`));
  });
}
console.log();

console.log('🔀 SCATTERED CONCEPTS');
console.log('-'.repeat(80));
Object.entries(results.scatteredConcepts).forEach(([concept, fileList]) => {
  if (fileList.length > 2) {
    console.log(`\n  ${concept}: ${fileList.length} files`);
    fileList.slice(0, 5).forEach(file => console.log(`    - ${file}`));
    if (fileList.length > 5) {
      console.log(`    ... and ${fileList.length - 5} more`);
    }
  }
});
console.log();

console.log('⛓️  LONG DEPENDENCY CHAINS (>3 hops)');
console.log('-'.repeat(80));
if (results.longChains.length === 0) {
  console.log('✅ No long dependency chains found!');
} else {
  results.longChains.slice(0, 5).forEach((chain, i) => {
    console.log(`\n  ${i + 1}. ${chain.length}-hop chain:`);
    console.log(`     ${chain.join(' →\n     ')}`);
  });
}
console.log();

// Save detailed results
import { writeFileSync } from 'fs';
writeFileSync('./dependency-analysis.json', JSON.stringify(results, null, 2));
console.log('💾 Detailed analysis saved to: dependency-analysis.json');
console.log();
