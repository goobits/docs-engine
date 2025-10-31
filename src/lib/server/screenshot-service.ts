import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import type { MarkdownDocsConfig } from '../config/index.js';
import type { ScreenshotRequest, ScreenshotResponse } from './types.js';
import { CliExecutor } from './cli-executor.js';

/**
 * Creates a screenshot endpoint handler for generating screenshots
 * @param config - Configuration options for screenshot generation
 * @returns A SvelteKit RequestHandler
 */
export function createScreenshotEndpoint(config: MarkdownDocsConfig): RequestHandler {
  // Initialize CLI executor with allowed commands
  const cliExecutor = new CliExecutor({
    allowedCommands: config.screenshots.cli?.allowedCommands || [],
    timeout: config.screenshots.cli?.timeout,
    maxOutputLength: config.screenshots.cli?.maxOutputLength
  });

  return async ({ request, fetch }) => {
    try {
      const { name, url, version: requestVersion, config: screenshotConfig } = await request.json() as ScreenshotRequest;

      if (!name) {
        return json({
          success: false,
          error: 'Missing required parameter: name'
        } as ScreenshotResponse, { status: 400 });
      }

      const version = requestVersion || config.screenshots.version || '1.0.0';

      // Determine screenshot type
      const type = screenshotConfig?.type || 'web';

      if (type === 'cli') {
        return await generateCliScreenshot({
          name,
          version,
          config: screenshotConfig,
          cliExecutor,
          fetch,
          screenshotsConfig: config.screenshots
        });
      } else {
        return await generateWebScreenshot({
          name,
          url,
          version,
          config: screenshotConfig,
          screenshotsConfig: config.screenshots
        });
      }
    } catch (error: any) {
      console.error('Screenshot generation failed:', error);
      return json({
        success: false,
        error: error.message
      } as ScreenshotResponse, { status: 500 });
    }
  };
}

async function generateCliScreenshot(options: {
  name: string;
  version: string;
  config: any;
  cliExecutor: CliExecutor;
  fetch: typeof fetch;
  screenshotsConfig: any;
}): Promise<Response> {
  const { name, version, config: screenshotConfig, cliExecutor, fetch, screenshotsConfig } = options;

  if (!screenshotConfig?.command) {
    return json({
      success: false,
      error: 'CLI screenshot requires command parameter'
    } as ScreenshotResponse, { status: 400 });
  }

  // Execute command
  const result = await cliExecutor.execute(screenshotConfig.command);
  const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');

  // Import playwright
  let chromium;
  try {
    chromium = (await import('playwright')).chromium;
  } catch {
    return json({
      success: false,
      error: 'Playwright not installed. Run: bun add -D playwright'
    } as ScreenshotResponse, { status: 500 });
  }

  // Get terminal HTML from renderer route
  const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3230';
  const renderResponse = await fetch(`${baseUrl}/api/screenshots/terminal-render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      output,
      theme: screenshotConfig.theme || 'dracula',
      showPrompt: screenshotConfig.showPrompt ?? true,
      promptText: screenshotConfig.promptText || '$'
    })
  });

  if (!renderResponse.ok) {
    throw new Error('Failed to render terminal output');
  }

  const terminalHtml = await renderResponse.text();

  // Parse viewport
  const viewportDimensions = screenshotConfig.viewport
    ? screenshotConfig.viewport.split('x').map(Number)
    : [800, 400];

  const [width, height] = viewportDimensions;

  // Launch browser and screenshot the terminal HTML
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2 // Capture at 2x resolution for retina displays
  });
  const page = await context.newPage();

  // Set content directly (faster than navigating)
  await page.setContent(terminalHtml);

  // Create output directory
  const outputDir = path.join(
    process.cwd(),
    'static',
    screenshotsConfig.basePath.replace(/^\//, ''),
    `v${version}`
  );
  await mkdir(outputDir, { recursive: true });

  // Generate screenshot at 2x resolution for retina displays (better to downscale than upscale)
  const screenshot2xPath = path.join(outputDir, `${name}@2x.png`);
  await page.screenshot({
    path: screenshot2xPath,
    fullPage: false,
    scale: 'device' // Use device pixel ratio
  });

  await browser.close();

  // Generate multiple formats and resolutions
  const basePath = `${screenshotsConfig.basePath}/v${version}`;
  const sharpImage = sharp(screenshot2xPath);
  const metadata = await sharpImage.metadata();

  // Generate 2x WebP (from high-res source)
  const webp2xPath = path.join(outputDir, `${name}@2x.webp`);
  await sharpImage.clone().webp({ quality: 85 }).toFile(webp2xPath);

  // Downscale to 1x using bicubic interpolation for better quality
  const webpPath = path.join(outputDir, `${name}.webp`);
  const screenshotPath = path.join(outputDir, `${name}.png`);

  if (metadata.width && metadata.width >= 400) {
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / 2),
        kernel: 'cubic' // Bicubic interpolation for sharp downscaling
      })
      .webp({ quality: 85 })
      .toFile(webpPath);

    // Also save 1x PNG
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / 2),
        kernel: 'cubic'
      })
      .png()
      .toFile(screenshotPath);
  } else {
    // If too small, just use the 2x as-is
    await sharpImage.clone().webp({ quality: 85 }).toFile(webpPath);
    await sharpImage.clone().png().toFile(screenshotPath);
  }

  const publicPath = `${basePath}/${name}.png`;

  // Return 1x dimensions for the img element
  const displayWidth = metadata.width ? Math.floor(metadata.width / 2) : metadata.width;
  const displayHeight = metadata.height ? Math.floor(metadata.height / 2) : metadata.height;

  return json({
    success: true,
    path: publicPath,
    webpPath: `${basePath}/${name}.webp`,
    webp2xPath: metadata.width && metadata.width >= 400 ? `${basePath}/${name}@2x.webp` : undefined,
    width: displayWidth,
    height: displayHeight
  } as ScreenshotResponse);
}

async function generateWebScreenshot(options: {
  name: string;
  url?: string;
  version: string;
  config: any;
  screenshotsConfig: any;
}): Promise<Response> {
  const { name, url, version, config: screenshotConfig, screenshotsConfig } = options;

  if (!url) {
    return json({
      success: false,
      error: 'Web screenshot requires url parameter'
    } as ScreenshotResponse, { status: 400 });
  }

  // Import playwright dynamically (it's optional)
  let chromium;
  try {
    chromium = (await import('playwright')).chromium;
  } catch {
    return json({
      success: false,
      error: 'Playwright not installed. Run: bun add -D playwright'
    } as ScreenshotResponse, { status: 500 });
  }

  // Parse viewport dimensions
  const viewportDimensions = screenshotConfig?.viewport
    ? screenshotConfig.viewport.split('x').map(Number)
    : [1280, 720];

  const [width, height] = viewportDimensions;

  // Launch browser
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2 // Capture at 2x resolution for retina displays
  });
  const page = await context.newPage();

  // Navigate to URL
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for selector if specified
  if (screenshotConfig?.waitFor) {
    await page.waitForSelector(screenshotConfig.waitFor, { timeout: 10000 });
  }

  // Determine screenshot target
  const element = screenshotConfig?.selector
    ? await page.locator(screenshotConfig.selector)
    : page;

  // Create output directory
  const outputDir = path.join(process.cwd(), 'static', screenshotsConfig.basePath.replace(/^\//, ''), `v${version}`);
  await mkdir(outputDir, { recursive: true });

  // Generate screenshot at 2x resolution for retina displays (better to downscale than upscale)
  const screenshot2xPath = path.join(outputDir, `${name}@2x.png`);
  await element.screenshot({
    path: screenshot2xPath,
    fullPage: screenshotConfig?.fullPage ?? false,
    scale: 'device' // Use device pixel ratio
  });

  // Cleanup
  await browser.close();

  // Generate multiple formats and resolutions
  const basePath = `${screenshotsConfig.basePath}/v${version}`;
  const sharpImage = sharp(screenshot2xPath);
  const metadata = await sharpImage.metadata();

  // Generate 2x WebP (from high-res source)
  const webp2xPath = path.join(outputDir, `${name}@2x.webp`);
  await sharpImage.clone().webp({ quality: 85 }).toFile(webp2xPath);

  // Downscale to 1x using bicubic interpolation for better quality
  const webpPath = path.join(outputDir, `${name}.webp`);
  const screenshotPath = path.join(outputDir, `${name}.png`);

  if (metadata.width && metadata.width >= 400) {
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / 2),
        kernel: 'cubic' // Bicubic interpolation for sharp downscaling
      })
      .webp({ quality: 85 })
      .toFile(webpPath);

    // Also save 1x PNG
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / 2),
        kernel: 'cubic'
      })
      .png()
      .toFile(screenshotPath);
  } else {
    // If too small, just use the 2x as-is
    await sharpImage.clone().webp({ quality: 85 }).toFile(webpPath);
    await sharpImage.clone().png().toFile(screenshotPath);
  }

  const publicPath = `${basePath}/${name}.png`;

  // Return 1x dimensions for the img element
  const displayWidth = metadata.width ? Math.floor(metadata.width / 2) : metadata.width;
  const displayHeight = metadata.height ? Math.floor(metadata.height / 2) : metadata.height;

  return json({
    success: true,
    path: publicPath,
    webpPath: `${basePath}/${name}.webp`,
    webp2xPath: metadata.width && metadata.width >= 400 ? `${basePath}/${name}@2x.webp` : undefined,
    width: displayWidth,
    height: displayHeight
  } as ScreenshotResponse);
}
