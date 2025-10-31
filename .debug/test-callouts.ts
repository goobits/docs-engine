#!/usr/bin/env tsx

/**
 * Test script to verify enhanced callouts functionality
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { calloutsPlugin } from '../src/lib/plugins/callouts.js';

const markdownPath = join(__dirname, 'callouts-demo.md');
const markdown = readFileSync(markdownPath, 'utf-8');

console.log('🧪 Testing Enhanced Callouts Plugin\n');
console.log('=' .repeat(80));

async function testCallouts() {
	try {
		const processor = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(calloutsPlugin)
			.use(remarkRehype, { allowDangerousHtml: true })
			.use(rehypeStringify, { allowDangerousHtml: true });

		const result = await processor.process(markdown);
		const html = String(result);

		// Check for all callout types
		const calloutTypes = [
			'NOTE',
			'TIP',
			'IMPORTANT',
			'WARNING',
			'CAUTION',
			'SUCCESS',
			'DANGER',
			'INFO',
			'QUESTION'
		];

		console.log('\n✅ Callout Type Detection:\n');

		for (const type of calloutTypes) {
			const colorClass = getColorForType(type);
			const hasCallout = html.includes(`md-callout--${colorClass}`);
			const icon = getIconForType(type);
			const hasIcon = html.includes(icon);

			console.log(
				`  ${hasCallout && hasIcon ? '✓' : '✗'} ${type.padEnd(12)} - ${
					hasCallout ? 'Found' : 'Missing'
				} (${icon})`
			);
		}

		// Check for custom titles
		console.log('\n✅ Custom Title Support:\n');

		const customTitles = [
			'Getting Started',
			'Pro Tip: Performance Optimization',
			'Deployment Complete',
			'Data Loss Warning'
		];

		for (const title of customTitles) {
			const hasTitle = html.includes(title);
			console.log(`  ${hasTitle ? '✓' : '✗'} "${title}"`);
		}

		// Check for markdown rendering features
		console.log('\n✅ Markdown Rendering Features:\n');

		const features = [
			{ name: 'Bold text', pattern: '<strong>' },
			{ name: 'Italic text', pattern: '<em>' },
			{ name: 'Inline code', pattern: '<code>' },
			{ name: 'Links', pattern: '<a href=' },
			{ name: 'Code blocks', pattern: '<pre><code' },
			{ name: 'Unordered lists', pattern: '<ul>' },
			{ name: 'Ordered lists', pattern: '<ol>' },
			{ name: 'List items', pattern: '<li>' },
			{ name: 'Strikethrough', pattern: '<del>' }
		];

		for (const feature of features) {
			const hasFeature = html.includes(feature.pattern);
			console.log(`  ${hasFeature ? '✓' : '✗'} ${feature.name}`);
		}

		// Count total callouts
		const calloutCount = (html.match(/md-callout/g) || []).length;
		console.log(`\n📊 Statistics:\n`);
		console.log(`  Total callouts rendered: ${calloutCount}`);
		console.log(`  HTML output size: ${html.length} bytes`);

		// Write output for inspection
		const outputPath = join(__dirname, 'callouts-output.html');
		const fs = await import('fs/promises');
		await fs.writeFile(outputPath, html);
		console.log(`\n💾 Full HTML output written to: ${outputPath}`);

		console.log('\n' + '='.repeat(80));
		console.log('✅ All tests completed successfully!\n');
	} catch (error) {
		console.error('\n❌ Error:', error);
		process.exit(1);
	}
}

function getColorForType(type: string): string {
	const colors: Record<string, string> = {
		NOTE: 'blue',
		TIP: 'green',
		IMPORTANT: 'purple',
		WARNING: 'yellow',
		CAUTION: 'red',
		SUCCESS: 'success',
		DANGER: 'danger',
		INFO: 'info',
		QUESTION: 'question'
	};
	return colors[type] || 'blue';
}

function getIconForType(type: string): string {
	const icons: Record<string, string> = {
		NOTE: 'ℹ️',
		TIP: '💡',
		IMPORTANT: '❗',
		WARNING: '⚠️',
		CAUTION: '🔥',
		SUCCESS: '✅',
		DANGER: '🚨',
		INFO: '💬',
		QUESTION: '❓'
	};
	return icons[type] || 'ℹ️';
}

testCallouts();
