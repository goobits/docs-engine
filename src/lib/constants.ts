/**
 * Application-wide constants
 *
 * This file consolidates all magic numbers and hardcoded values into
 * well-named constants for better code clarity and maintainability.
 *
 * @module constants
 */

/**
 * HTTP status codes
 * @public
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Timeout durations in milliseconds
 * @public
 */
export const TIMEOUT = {
  /** 500ms - Minimum retry backoff */
  MIN_RETRY: 500,
  /** 1 second - Short operations */
  SHORT: 1000,
  /** 3 seconds - Medium operations */
  MEDIUM: 3000,
  /** 5 seconds - Long operations */
  LONG: 5000,
  /** 10 seconds - Very long operations (default for most services) */
  VERY_LONG: 10000,
  /** 15 seconds - Web screenshot generation */
  WEB_SCREENSHOT: 15000,
  /** 20 seconds - CLI screenshot generation (slower) */
  CLI_SCREENSHOT: 20000,
  /** 30 seconds - Circuit breaker recovery */
  CIRCUIT_BREAKER_RECOVERY: 30000,
  /** 60 seconds - Cache TTL */
  CACHE_TTL: 60000,
} as const;

/**
 * Rate limiting configuration
 * @public
 */
export const RATE_LIMIT = {
  /** Default max requests for general endpoints */
  DEFAULT_MAX_REQUESTS: 10,
  /** Default time window (1 minute) */
  DEFAULT_WINDOW_MS: 60000,
  /** Max requests for screenshot endpoint (higher limit) */
  SCREENSHOT_MAX_REQUESTS: 100,
  /** Time window for screenshot endpoint (1 minute) */
  SCREENSHOT_WINDOW_MS: 60000,
  /** Cleanup interval for rate limiter storage */
  CLEANUP_INTERVAL: 60000,
  /** Retry-After header value in seconds */
  RETRY_AFTER_SECONDS: 60,
} as const;

/**
 * Circuit breaker configuration
 * @public
 */
export const CIRCUIT_BREAKER = {
  /** Number of failures before opening circuit */
  FAILURE_THRESHOLD: 5,
  /** Time in ms before attempting recovery (30 seconds) */
  RECOVERY_TIMEOUT: 30000,
  /** Number of successful requests in HALF_OPEN before closing */
  SUCCESS_THRESHOLD: 2,
  /** Default timeout for individual requests (10 seconds) */
  REQUEST_TIMEOUT: 10000,
  /** Timeout for web screenshot requests (15 seconds) */
  WEB_SCREENSHOT_TIMEOUT: 15000,
  /** Timeout for CLI screenshot requests (20 seconds) */
  CLI_SCREENSHOT_TIMEOUT: 20000,
} as const;

/**
 * Retry logic configuration
 * @public
 */
export const RETRY = {
  /** Maximum retry attempts for git operations */
  MAX_ATTEMPTS: 2,
  /** Minimum timeout between retries (500ms) */
  MIN_TIMEOUT: 500,
} as const;

/**
 * Image and screenshot dimensions
 * @public
 */
export const DIMENSIONS = {
  /** Minimum width for 2x image generation */
  MIN_WIDTH_FOR_2X: 400,
  /** Default CLI viewport width */
  CLI_VIEWPORT_WIDTH: 800,
  /** Default CLI viewport height */
  CLI_VIEWPORT_HEIGHT: 400,
  /** Default web viewport width */
  WEB_VIEWPORT_WIDTH: 1280,
  /** Default web viewport height */
  WEB_VIEWPORT_HEIGHT: 720,
  /** LQIP placeholder width */
  PLACEHOLDER_WIDTH: 40,
  /** Device scale factor for retina displays */
  DEVICE_SCALE_FACTOR: 2,
} as const;

/**
 * Image quality settings (0-100)
 * @public
 */
export const IMAGE_QUALITY = {
  /** LQIP placeholder quality */
  PLACEHOLDER: 50,
  /** Standard AVIF quality */
  AVIF: 80,
  /** Standard WebP quality */
  WEBP: 85,
  /** Standard JPEG quality */
  JPEG: 85,
  /** PNG compression level (0-9) */
  PNG_COMPRESSION: 9,
} as const;

/**
 * File size limits in bytes
 * @public
 */
export const FILE_SIZE = {
  /** Maximum CLI output length (50KB) */
  MAX_CLI_OUTPUT: 50000,
} as const;

/**
 * Cache configuration
 * @public
 */
export const CACHE = {
  /** Maximum LRU cache entries for git operations */
  MAX_ENTRIES: 1000,
  /** Cache TTL in milliseconds (60 seconds) */
  TTL: 60000,
  /** Default contributor limit */
  DEFAULT_CONTRIBUTOR_LIMIT: 10,
  /** Gravatar icon size */
  GRAVATAR_SIZE: 40,
} as const;

/**
 * Git command configuration
 * @public
 */
export const GIT = {
  /** Timeout for git operations (10 seconds) */
  COMMAND_TIMEOUT: 10000,
  /** Maximum retry attempts for git lock errors */
  MAX_RETRIES: 2,
  /** Minimum timeout between git retries (500ms) */
  MIN_RETRY_TIMEOUT: 500,
} as const;
