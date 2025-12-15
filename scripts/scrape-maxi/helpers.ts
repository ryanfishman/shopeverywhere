/**
 * Helper utilities for the Maxi.ca scraper
 */

import { Page } from 'puppeteer';
import { MAX_RETRIES, RETRY_DELAY, DEFAULT_TIMEOUT } from './config';

/**
 * Delay execution for a specified number of milliseconds
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dismiss cookie popup if present
 */
export async function dismissCookiePopup(page: Page): Promise<boolean> {
  try {
    await delay(1000);
    
    const dismissed = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const okButton = buttons.find(b => {
        const text = b.textContent?.trim().toLowerCase() || '';
        return text === 'ok' || text.includes('confirm') || text.includes('accept');
      });
      if (okButton) {
        (okButton as HTMLButtonElement).click();
        return true;
      }
      return false;
    });
    
    if (dismissed) {
      console.log('    ✓ Cookie popup dismissed');
      await delay(500);
    }
    
    return dismissed;
  } catch (e) {
    return false;
  }
}

/**
 * Navigate to a URL with retry logic
 */
export async function navigateWithRetry(
  page: Page,
  url: string,
  options: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
    timeout?: number;
    onRetry?: (attempt: number) => void;
    dismissCookie?: boolean;
  } = {}
): Promise<boolean> {
  const {
    waitUntil = 'domcontentloaded',
    timeout = DEFAULT_TIMEOUT,
    onRetry,
    dismissCookie = true
  } = options;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await page.goto(url, { waitUntil, timeout });
      await delay(1000);
      
      if (dismissCookie) {
        await dismissCookiePopup(page);
      }
      
      return true;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        if (onRetry) {
          onRetry(attempt);
        } else {
          console.log(`      ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY/1000}s...`);
        }
        await delay(RETRY_DELAY);
      }
    }
  }
  
  console.log(`      ❌ Failed to load after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  return false;
}

/**
 * Scroll down to load lazy-loaded content
 */
export async function scrollToLoadContent(page: Page, scrollCount: number = 3): Promise<void> {
  try {
    for (let i = 0; i < scrollCount; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await delay(1000);
    }
    // Scroll back to top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await delay(500);
  } catch (e) {
    // Ignore scroll errors
  }
}

/**
 * Count categories recursively
 */
export function countNestedCategories(categories: { children: any[] }[]): number {
  let count = categories.length;
  for (const cat of categories) {
    count += countNestedCategories(cat.children);
  }
  return count;
}

/**
 * Count leaf categories (those without children)
 */
export function countLeafCategories(categories: { children: any[]; url?: string }[]): number {
  let count = 0;
  for (const cat of categories) {
    if (cat.children.length === 0 && cat.url) {
      count++;
    } else {
      count += countLeafCategories(cat.children);
    }
  }
  return count;
}



