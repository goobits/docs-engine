#!/usr/bin/env node
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// CLI commands to screenshot (safe subset)
const commands = [
  {
    id: 'git-status',
    command: 'git status',
    theme: 'dracula',
    prompt: '$ ',
  },
  {
    id: 'git-log',
    command: 'git log --oneline -5',
    theme: 'monokai',
    prompt: '$ ',
  },
  {
    id: 'ls-plugins',
    command: 'ls -la src/lib/plugins/',
    theme: 'solarized',
    prompt: '$ ',
  },
  {
    id: 'package-json',
    command: 'head -20 package.json',
    theme: 'dracula',
    prompt: '$ ',
  },
  {
    id: 'pnpm-test',
    command: 'echo "Test Results"',
    theme: 'dracula',
    prompt: '$ ',
    mockOutput: `pnpm run test

> @goobits/docs-engine@1.0.0 test
> vitest

✓ src/lib/plugins/katex.test.ts (28 tests)
✓ src/lib/plugins/code-highlight.test.ts (13 tests)
✓ src/lib/server/sitemap.test.ts (12 tests)

Test Files  8 passed (8)
     Tests  108 passed (108)`,
  },
  {
    id: 'tsx-generate',
    command: 'tsx generate-symbols.ts',
    theme: 'dracula',
    prompt: '$ ',
    mockOutput: `🚀 Generating symbol map for docs-engine...

🔍 Scanning TypeScript files...
   Found 49 TypeScript files

✅ Generated symbol map: 166 symbols
   Output: docs/.generated/symbol-map.json`,
  },
];

// Theme colors
const themes = {
  dracula: {
    bg: '#282a36',
    fg: '#f8f8f2',
    prompt: '#50fa7b',
    command: '#8be9fd',
  },
  monokai: {
    bg: '#272822',
    fg: '#f8f8f2',
    prompt: '#a6e22e',
    command: '#66d9ef',
  },
  solarized: {
    bg: '#002b36',
    fg: '#839496',
    prompt: '#859900',
    command: '#268bd2',
  },
  nord: {
    bg: '#2e3440',
    fg: '#d8dee9',
    prompt: '#a3be8c',
    command: '#88c0d0',
  },
};

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createTerminalSVG(command, output, theme = 'dracula', prompt = '$ ') {
  const colors = themes[theme];
  const lines = output.split('\n');
  const lineHeight = 20;
  const padding = 20;
  const width = 900;
  const height = Math.max(200, (lines.length + 2) * lineHeight + padding * 2);

  let yPos = padding + 20;
  let textElements = '';

  // Command line
  textElements += `<text x="${padding}" y="${yPos}" fill="${colors.prompt}" font-weight="bold">${escapeXml(prompt)}</text>`;
  textElements += `<text x="${padding + 30}" y="${yPos}" fill="${colors.command}">${escapeXml(command)}</text>`;
  yPos += lineHeight * 1.5;

  // Output lines
  for (const line of lines) {
    if (line.trim()) {
      textElements += `<text x="${padding}" y="${yPos}" fill="${colors.fg}">${escapeXml(line)}</text>`;
    }
    yPos += lineHeight;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${colors.bg}" rx="6"/>
  <g font-family="Monaco, Menlo, monospace" font-size="14" text-anchor="start">
    ${textElements}
  </g>
</svg>`;
}

function generateScreenshot(cmd) {
  console.log(`\n📸 Generating screenshot: ${cmd.id}`);

  // Execute command or use mock output
  let output = '';
  if (cmd.mockOutput) {
    output = cmd.mockOutput.trim();
  } else {
    try {
      output = execSync(cmd.command, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 10000,
      }).trim();
    } catch (error) {
      output = error.stdout || error.message;
    }
  }

  // Truncate if too long
  if (output.length > 2000) {
    output = output.substring(0, 2000) + '\n... (truncated)';
  }

  // Create SVG
  const svg = createTerminalSVG(cmd.command, output, cmd.theme, cmd.prompt);

  // Ensure output directory exists
  const outputDir = 'static/screenshots/examples';
  mkdirSync(outputDir, { recursive: true });

  // Save SVG
  const outputPath = join(outputDir, `${cmd.id}.svg`);
  writeFileSync(outputPath, svg, 'utf-8');

  console.log(`   ✓ Saved: ${outputPath}`);
}

function main() {
  console.log('🎬 Starting CLI screenshot generation (SVG)...\n');
  console.log(`Commands to process: ${commands.length}`);

  for (const cmd of commands) {
    generateScreenshot(cmd);
  }

  console.log('\n✅ All screenshots generated successfully!');
  console.log(`\nScreenshots saved to: static/screenshots/examples/`);
  console.log('\n💡 Tip: SVG screenshots can be converted to PNG using: convert file.svg file.png');
}

main();
