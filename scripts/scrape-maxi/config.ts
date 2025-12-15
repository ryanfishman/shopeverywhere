/**
 * Configuration constants for the Maxi.ca scraper
 */

// URLs
export const BASE_URL = 'https://www.maxi.ca';
export const STORE_LOCATOR_URL = `${BASE_URL}/en/store-locator?type=store&icta=pickup-details-modal`;

// Store configuration
export const STORE_NAME = 'MAXI & CIE PIERREFONDS SAINT-JEAN';
export const STORE_ID = '1';

// Output
export const OUTPUT_FILE = 'maxi-data.json';

// Retry configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 2000; // 2 seconds between retries

// Timeouts
export const DEFAULT_TIMEOUT = 15000;
export const PRODUCT_PAGE_TIMEOUT = 30000;

// Browser configuration
export const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--window-size=1920x1080'
];

export const VIEWPORT = { width: 1920, height: 1080 };

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';



