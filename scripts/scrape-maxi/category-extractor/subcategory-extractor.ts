/**
 * Subcategory Extractor
 * Extracts subcategories from a single category URL
 */

import { Page } from 'puppeteer';
import { BASE_URL, MAX_RETRIES, RETRY_DELAY } from '../config';
import { SubcategoryItem } from '../types';
import { delay, dismissCookiePopup } from '../helpers';

/**
 * Extract subcategories from a given category URL
 */
export async function extractSubcategoriesFromUrl(
  page: Page,
  url: string,
  debug: boolean = false
): Promise<SubcategoryItem[]> {
  // Navigate with retry logic
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await delay(1000);
      await dismissCookiePopup(page);
      lastError = null;
      break;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        console.log(`      ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY/1000}s...`);
        await delay(RETRY_DELAY);
      }
    }
  }
  
  if (lastError) {
    throw new Error(`Failed to load ${url} after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }

  await delay(500);

  // Debug logging
  if (debug) {
    const debugInfo = await page.evaluate(() => {
      const ulRoleList = document.querySelectorAll('ul[role="list"]');
      const linkListItems = document.querySelectorAll('[data-testid="link-list-item"]');
      const navLinks = document.querySelectorAll('[data-testid="nav-list-link"]');
      const allUls = document.querySelectorAll('ul');
      const allAs = document.querySelectorAll('a');
      
      const linkTexts = Array.from(navLinks).map(a => ({
        text: a.textContent?.trim(),
        href: a.getAttribute('href')
      }));
      
      const sidebarLinks = document.querySelectorAll('aside a, nav a, [class*="sidebar"] a, [class*="nav"] a');
      
      return {
        ulRoleListCount: ulRoleList.length,
        linkListItemsCount: linkListItems.length,
        navLinksCount: navLinks.length,
        totalUls: allUls.length,
        totalAs: allAs.length,
        sidebarLinksCount: sidebarLinks.length,
        linkTexts: linkTexts.slice(0, 20)
      };
    });
    console.log(`  DEBUG: ul[role="list"]: ${debugInfo.ulRoleListCount}`);
    console.log(`  DEBUG: link-list-items: ${debugInfo.linkListItemsCount}`);
    console.log(`  DEBUG: nav-links: ${debugInfo.navLinksCount}`);
    console.log(`  DEBUG: sidebar links: ${debugInfo.sidebarLinksCount}`);
    console.log(`  DEBUG: total ULs: ${debugInfo.totalUls}, total As: ${debugInfo.totalAs}`);
    console.log(`  DEBUG: Found nav-list-link items:`);
    debugInfo.linkTexts.forEach((item, i) => {
      console.log(`    ${i + 1}. "${item.text}" -> ${item.href}`);
    });
  }

  // Extract subcategories
  const subcategories = await page.evaluate((baseUrl: string) => {
    const cats: { name: string; url: string }[] = [];
    
    const navLinks = document.querySelectorAll('a[data-testid="nav-list-link"]');
    
    for (const anchor of Array.from(navLinks)) {
      const name = anchor.textContent?.trim() || '';
      let href = anchor.getAttribute('href') || '';
      
      // Skip "See All" links
      if (name.toLowerCase() === 'see all') {
        continue;
      }
      
      // Make URL absolute
      if (href && href.startsWith('/')) {
        href = baseUrl + href;
      }
      
      if (name && href) {
        cats.push({ name, url: href });
      }
    }
    
    return cats;
  }, BASE_URL);

  return subcategories;
}



