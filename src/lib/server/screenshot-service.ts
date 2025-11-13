import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import type { MarkdownDocsConfig } from '../config/index.js';
import type { ScreenshotRequest, ScreenshotResponse } from './types.js';
import { CliExecutor } from './cli-executor.js';
import { getVersion } from '../utils/version.js';
import { createLogger } from './logger.js';
import { CircuitBreaker, CircuitBreakerError } from './circuit-breaker.js';
import { checkRateLimit } from './rate-limiter.js';
import {
  HTTP_STATUS,
  RATE_LIMIT,
  CIRCUIT_BREAKER,
  DIMENSIONS,
  IMAGE_QUALITY,
} from '../constants.js';

const logger = createLogger('screenshot-service');

/**
 * Allowed domains for screenshot generation (SSRF protection)
 * Add your production domains here
 */
const ALLOWED_DOMAINS = ['localhost', '127.0.0.1', 'docs.anthropic.com', 'claude.ai'];

/**
 * Validates URL to prevent SSRF attacks
 * @param url - URL to validate
 * @throws Error if URL is not allowed
 */
function validateUrl(url: string): void {
  const parsed = new URL(url);

  // Block private IP ranges (RFC 1918)
  if (/^(10|172\.(1[6-9]|2[0-9]|3[01])|192\.168)\./.test(parsed.hostname)) {
    throw new Error('Private IP addresses are not allowed');
  }

  // Block cloud metadata endpoint
  if (parsed.hostname === '169.254.169.254') {
    throw new Error('Cloud metadata endpoint access denied');
  }

  // Block localhost variants (except explicitly allowed)
  if (
    parsed.hostname.startsWith('127.') &&
    parsed.hostname !== '127.0.0.1' &&
    !ALLOWED_DOMAINS.includes(parsed.hostname)
  ) {
    throw new Error('Localhost variants not allowed');
  }

  // Allowlist check
  const isAllowed = ALLOWED_DOMAINS.some(
    (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
  );

  if (!isAllowed) {
    throw new Error(`Domain ${parsed.hostname} is not in allowlist`);
  }
}

// Circuit breakers for web and CLI screenshot generation (prevents cascading failures)
const webScreenshotBreaker = new CircuitBreaker({
  name: 'web-screenshot',
  failureThreshold: CIRCUIT_BREAKER.FAILURE_THRESHOLD,
  recoveryTimeout: CIRCUIT_BREAKER.RECOVERY_TIMEOUT,
  requestTimeout: CIRCUIT_BREAKER.WEB_SCREENSHOT_TIMEOUT,
});

const cliScreenshotBreaker = new CircuitBreaker({
  name: 'cli-screenshot',
  failureThreshold: CIRCUIT_BREAKER.FAILURE_THRESHOLD,
  recoveryTimeout: CIRCUIT_BREAKER.RECOVERY_TIMEOUT,
  requestTimeout: CIRCUIT_BREAKER.CLI_SCREENSHOT_TIMEOUT, // CLI can be slower
});

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
    maxOutputLength: config.screenshots.cli?.maxOutputLength,
  });

  return async ({ request, fetch, getClientAddress }) => {
    const clientIp = getClientAddress();

    // Rate limiting: 100 requests per minute per IP
    if (
      !checkRateLimit(clientIp, RATE_LIMIT.SCREENSHOT_MAX_REQUESTS, RATE_LIMIT.SCREENSHOT_WINDOW_MS)
    ) {
      logger.warn({ ip: clientIp }, 'Rate limit exceeded for screenshot endpoint');
      return json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        } as ScreenshotResponse,
        {
          status: HTTP_STATUS.TOO_MANY_REQUESTS,
          headers: {
            'Retry-After': String(RATE_LIMIT.RETRY_AFTER_SECONDS),
          },
        }
      );
    }
    try {
      const {
        name,
        url,
        version: requestVersion,
        config: screenshotConfig,
      } = (await request.json()) as ScreenshotRequest;

      if (!name) {
        return json(
          {
            success: false,
            error: 'Missing required parameter: name',
          } as ScreenshotResponse,
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }

      const version = requestVersion || config.screenshots.version || getVersion();

      // Determine screenshot type
      const type = screenshotConfig?.type || 'web';

      logger.info(
        {
          name,
          type,
          url: url || undefined,
          ip: clientIp,
        },
        'Processing screenshot request'
      );

      if (type === 'cli') {
        return await cliScreenshotBreaker.execute(() =>
          generateCliScreenshot({
            name,
            version,
            config: screenshotConfig,
            cliExecutor,
            fetch,
            screenshotsConfig: config.screenshots,
          })
        );
      } else {
        return await webScreenshotBreaker.execute(() =>
          generateWebScreenshot({
            name,
            url,
            version,
            config: screenshotConfig,
            screenshotsConfig: config.screenshots,
          })
        );
      }
    } catch (error: unknown) {
      if (error instanceof CircuitBreakerError) {
        logger.error({ breaker: error.message }, 'Circuit breaker is open');
        return json(
          {
            success: false,
            error: 'Screenshot service temporarily unavailable. Please try again later.',
          } as ScreenshotResponse,
          { status: HTTP_STATUS.SERVICE_UNAVAILABLE }
        );
      }

      logger.error({ err: error }, 'Screenshot generation failed');
      const message = error instanceof Error ? error.message : String(error);
      return json(
        {
          success: false,
          error: message,
        } as ScreenshotResponse,
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }
  };
}

async function generateCliScreenshot(options: {
  name: string;
  version: string;
  config: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  cliExecutor: CliExecutor;
  fetch: typeof fetch;
  screenshotsConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<Response> {
  const {
    name,
    version,
    config: screenshotConfig,
    cliExecutor,
    fetch,
    screenshotsConfig,
  } = options;

  if (!screenshotConfig?.command) {
    return json(
      {
        success: false,
        error: 'CLI screenshot requires command parameter',
      } as ScreenshotResponse,
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Execute command
  logger.debug({ command: screenshotConfig.command }, 'Executing CLI command for screenshot');
  const result = await cliExecutor.execute(screenshotConfig.command);
  const output = result.stdout + (result.stderr ? '\n' + result.stderr : '');
  logger.debug({ outputLength: output.length }, 'CLI command executed successfully');

  // Import playwright
  let chromium;
  try {
    chromium = (await import('playwright')).chromium;
  } catch {
    return json(
      {
        success: false,
        error: 'Playwright not installed. Run: bun add -D playwright',
      } as ScreenshotResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
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
      promptText: screenshotConfig.promptText || '$',
    }),
  });

  if (!renderResponse.ok) {
    throw new Error('Failed to render terminal output');
  }

  const terminalHtml = await renderResponse.text();

  // Parse viewport
  const viewportDimensions = screenshotConfig.viewport
    ? screenshotConfig.viewport.split('x').map(Number)
    : [DIMENSIONS.CLI_VIEWPORT_WIDTH, DIMENSIONS.CLI_VIEWPORT_HEIGHT];

  const [width, height] = viewportDimensions;

  // Launch browser and screenshot the terminal HTML
  logger.debug({ width, height }, 'Launching browser for CLI screenshot');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: DIMENSIONS.DEVICE_SCALE_FACTOR, // Capture at 2x resolution for retina displays
    ignoreHTTPSErrors: true, // Allow self-signed certificates in development
  });
  const page = await context.newPage();

  // Set content directly (faster than navigating)
  await page.setContent(terminalHtml);
  logger.debug('Terminal HTML content set, capturing screenshot');

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
    scale: 'device', // Use device pixel ratio
  });

  await browser.close();
  logger.debug({ path: screenshot2xPath }, 'Screenshot captured, processing image formats');

  // Generate multiple formats and resolutions
  const basePath = `${screenshotsConfig.basePath}/v${version}`;
  const sharpImage = sharp(screenshot2xPath);
  const metadata = await sharpImage.metadata();

  // Generate 2x WebP (from high-res source)
  const webp2xPath = path.join(outputDir, `${name}@2x.webp`);
  await sharpImage.clone().webp({ quality: IMAGE_QUALITY.WEBP }).toFile(webp2xPath);

  // Downscale to 1x using bicubic interpolation for better quality
  const webpPath = path.join(outputDir, `${name}.webp`);
  const screenshotPath = path.join(outputDir, `${name}.png`);

  if (metadata.width && metadata.width >= DIMENSIONS.MIN_WIDTH_FOR_2X) {
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / DIMENSIONS.DEVICE_SCALE_FACTOR),
        kernel: 'cubic', // Bicubic interpolation for sharp downscaling
      })
      .webp({ quality: IMAGE_QUALITY.WEBP })
      .toFile(webpPath);

    // Also save 1x PNG
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / DIMENSIONS.DEVICE_SCALE_FACTOR),
        kernel: 'cubic',
      })
      .png()
      .toFile(screenshotPath);
  } else {
    // If too small, just use the 2x as-is
    await sharpImage.clone().webp({ quality: IMAGE_QUALITY.WEBP }).toFile(webpPath);
    await sharpImage.clone().png().toFile(screenshotPath);
  }

  const publicPath = `${basePath}/${name}.png`;

  // Return 1x dimensions for the img element
  const displayWidth = metadata.width
    ? Math.floor(metadata.width / DIMENSIONS.DEVICE_SCALE_FACTOR)
    : metadata.width;
  const displayHeight = metadata.height
    ? Math.floor(metadata.height / DIMENSIONS.DEVICE_SCALE_FACTOR)
    : metadata.height;

  logger.info(
    {
      name,
      publicPath,
      width: displayWidth,
      height: displayHeight,
    },
    'CLI screenshot generated successfully'
  );

  return json({
    success: true,
    path: publicPath,
    webpPath: `${basePath}/${name}.webp`,
    webp2xPath:
      metadata.width && metadata.width >= DIMENSIONS.MIN_WIDTH_FOR_2X
        ? `${basePath}/${name}@2x.webp`
        : undefined,
    width: displayWidth,
    height: displayHeight,
  } as ScreenshotResponse);
}

async function generateWebScreenshot(options: {
  name: string;
  url?: string;
  version: string;
  config: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  screenshotsConfig: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}): Promise<Response> {
  const { name, url, version, config: screenshotConfig, screenshotsConfig } = options;

  if (!url) {
    return json(
      {
        success: false,
        error: 'Web screenshot requires url parameter',
      } as ScreenshotResponse,
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }

  // Validate URL for SSRF protection
  try {
    validateUrl(url);
    logger.debug({ url }, 'URL validation passed');
  } catch (err) {
    logger.warn(
      { url, error: err instanceof Error ? err.message : 'Invalid URL' },
      'URL validation failed'
    );
    return json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Invalid URL',
      } as ScreenshotResponse,
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  // Import playwright dynamically (it's optional)
  let chromium;
  try {
    chromium = (await import('playwright')).chromium;
  } catch {
    return json(
      {
        success: false,
        error: 'Playwright not installed. Run: bun add -D playwright',
      } as ScreenshotResponse,
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  // Parse viewport dimensions
  const viewportDimensions = screenshotConfig?.viewport
    ? screenshotConfig.viewport.split('x').map(Number)
    : [DIMENSIONS.WEB_VIEWPORT_WIDTH, DIMENSIONS.WEB_VIEWPORT_HEIGHT];

  const [width, height] = viewportDimensions;

  // Launch browser
  logger.debug({ width, height, url }, 'Launching browser for web screenshot');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: DIMENSIONS.DEVICE_SCALE_FACTOR, // Capture at 2x resolution for retina displays
    ignoreHTTPSErrors: true, // Allow self-signed certificates in development
  });
  const page = await context.newPage();

  // Navigate to URL
  logger.debug({ url }, 'Navigating to URL');
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for selector if specified
  if (screenshotConfig?.waitFor) {
    logger.debug({ selector: screenshotConfig.waitFor }, 'Waiting for selector');
    await page.waitForSelector(screenshotConfig.waitFor, {
      timeout: CIRCUIT_BREAKER.REQUEST_TIMEOUT,
    });
  }

  // Determine screenshot target
  const element = screenshotConfig?.selector ? await page.locator(screenshotConfig.selector) : page;

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
  logger.debug(
    { selector: screenshotConfig?.selector, fullPage: screenshotConfig?.fullPage },
    'Capturing screenshot'
  );
  await element.screenshot({
    path: screenshot2xPath,
    fullPage: screenshotConfig?.fullPage ?? false,
    scale: 'device', // Use device pixel ratio
  });

  // Cleanup
  await browser.close();
  logger.debug({ path: screenshot2xPath }, 'Screenshot captured, processing image formats');

  // Generate multiple formats and resolutions
  const basePath = `${screenshotsConfig.basePath}/v${version}`;
  const sharpImage = sharp(screenshot2xPath);
  const metadata = await sharpImage.metadata();

  // Generate 2x WebP (from high-res source)
  const webp2xPath = path.join(outputDir, `${name}@2x.webp`);
  await sharpImage.clone().webp({ quality: IMAGE_QUALITY.WEBP }).toFile(webp2xPath);

  // Downscale to 1x using bicubic interpolation for better quality
  const webpPath = path.join(outputDir, `${name}.webp`);
  const screenshotPath = path.join(outputDir, `${name}.png`);

  if (metadata.width && metadata.width >= DIMENSIONS.MIN_WIDTH_FOR_2X) {
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / DIMENSIONS.DEVICE_SCALE_FACTOR),
        kernel: 'cubic', // Bicubic interpolation for sharp downscaling
      })
      .webp({ quality: IMAGE_QUALITY.WEBP })
      .toFile(webpPath);

    // Also save 1x PNG
    await sharp(screenshot2xPath)
      .resize({
        width: Math.floor(metadata.width / DIMENSIONS.DEVICE_SCALE_FACTOR),
        kernel: 'cubic',
      })
      .png()
      .toFile(screenshotPath);
  } else {
    // If too small, just use the 2x as-is
    await sharpImage.clone().webp({ quality: IMAGE_QUALITY.WEBP }).toFile(webpPath);
    await sharpImage.clone().png().toFile(screenshotPath);
  }

  const publicPath = `${basePath}/${name}.png`;

  // Return 1x dimensions for the img element
  const displayWidth = metadata.width
    ? Math.floor(metadata.width / DIMENSIONS.DEVICE_SCALE_FACTOR)
    : metadata.width;
  const displayHeight = metadata.height
    ? Math.floor(metadata.height / DIMENSIONS.DEVICE_SCALE_FACTOR)
    : metadata.height;

  logger.info(
    {
      name,
      url,
      publicPath,
      width: displayWidth,
      height: displayHeight,
    },
    'Web screenshot generated successfully'
  );

  return json({
    success: true,
    path: publicPath,
    webpPath: `${basePath}/${name}.webp`,
    webp2xPath:
      metadata.width && metadata.width >= DIMENSIONS.MIN_WIDTH_FOR_2X
        ? `${basePath}/${name}@2x.webp`
        : undefined,
    width: displayWidth,
    height: displayHeight,
  } as ScreenshotResponse);
}
