/**
 * Product Details Extractor
 * Extracts full product details from individual product pages
 */

import { Page } from 'puppeteer';
import { BASE_URL, MAX_RETRIES, RETRY_DELAY, PRODUCT_PAGE_TIMEOUT } from '../config';
import { ProductDetails, ScrapedProduct } from '../types';
import { delay, dismissCookiePopup } from '../helpers';

/**
 * Extract full product details from a product page URL
 */
export async function extractProductDetailsFromUrl(
  page: Page,
  url: string,
  debug: boolean = false
): Promise<ProductDetails> {
  // Navigate with retry logic
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: PRODUCT_PAGE_TIMEOUT });
      } catch (e) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      }
      await delay(2000);
      await dismissCookiePopup(page);
      lastError = null;
      break;
    } catch (error) {
      lastError = error as Error;
      if (attempt < MAX_RETRIES) {
        if (debug) console.log(`      ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY/1000}s...`);
        await delay(RETRY_DELAY);
      }
    }
  }
  
  if (lastError) {
    throw new Error(`Failed to load product page after ${MAX_RETRIES} attempts: ${lastError.message}`);
  }

  // Wait for product name to appear
  try {
    await page.waitForSelector('.product-name__item--name', { timeout: 10000 });
  } catch (e) {
    if (debug) console.log('  DEBUG: Product name selector not found, continuing anyway...');
  }

  // Extract product details
  const details = await page.evaluate(() => {
    let name = '';
    const nameEl1 = document.querySelector('h1.product-name__item--name');
    const nameEl2 = document.querySelector('.product-name__item--name');
    const nameEl3 = document.querySelector('h1[title]');
    if (nameEl1) {
      name = nameEl1.textContent?.trim() || '';
    } else if (nameEl2) {
      name = nameEl2.textContent?.trim() || '';
    } else if (nameEl3) {
      name = nameEl3.getAttribute('title') || nameEl3.textContent?.trim() || '';
    }

    let price = '';
    const priceEls = document.querySelectorAll('.price__value');
    for (const el of Array.from(priceEls)) {
      const text = el.textContent?.trim() || '';
      if (text.startsWith('$')) {
        price = text.replace('$', '').trim();
        break;
      }
    }

    const descEl = document.querySelector('.product-description-text__text');
    const description = descEl?.textContent?.trim() || '';

    let imageUrl = '';
    const imgEl1 = document.querySelector('img.responsive-image--product-details-page');
    const imgEl2 = document.querySelector('.product-images img.responsive-image');
    const imgEl3 = document.querySelector('.product-details-page-details__image-list img');
    if (imgEl1) {
      imageUrl = imgEl1.getAttribute('src') || '';
    } else if (imgEl2) {
      imageUrl = imgEl2.getAttribute('src') || '';
    } else if (imgEl3) {
      imageUrl = imgEl3.getAttribute('src') || '';
    }

    return { name, price, description, imageUrl };
  });

  if (debug) {
    console.log(`  DEBUG: Name: ${details.name}`);
    console.log(`  DEBUG: Price: $${details.price}`);
    console.log(`  DEBUG: Description: ${details.description.substring(0, 80)}...`);
    console.log(`  DEBUG: ImageURL: ${details.imageUrl}`);
  }

  return details;
}

/**
 * Get product description and code from a product page
 */
export async function getProductDescription(
  page: Page,
  productUrl: string
): Promise<{ description: string; productCode: string }> {
  let description = '';
  let productCode = '';

  try {
    const fullUrl = productUrl.startsWith('http') ? productUrl : `${BASE_URL}${productUrl}`;
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(500);

    await dismissCookiePopup(page);

    // Click on "Product description" button to expand if collapsed
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const descBtn = buttons.find(b => 
        (b.textContent?.toLowerCase() || '').includes('product description')
      );
      if (descBtn) {
        descBtn.click();
      }
    });
    
    await delay(300);

    const data = await page.evaluate(() => {
      let desc = '';
      let code = '';

      const descEl = document.querySelector('.product-description-text__text');
      if (descEl) {
        desc = descEl.textContent?.trim() || '';
      }

      const codeEl = document.querySelector('.product-number__code');
      if (codeEl) {
        code = codeEl.textContent?.trim() || '';
      }
      if (!code) {
        const urlMatch = window.location.pathname.match(/\/p\/([A-Z0-9_]+)/i);
        if (urlMatch) code = urlMatch[1];
      }

      return { desc, code };
    });

    description = data.desc;
    productCode = data.code;

  } catch (error) {
    // Ignore errors
  }

  return { description, productCode };
}

/**
 * Enrich all products with full details
 */
export async function enrichProductsWithDetails(
  page: Page,
  products: ScrapedProduct[]
): Promise<{ successCount: number; errorCount: number }> {
  console.log(`\n📦 Enriching ${products.length} products with full details...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    
    if (!product.url) {
      console.log(`   ⚠️ [${i + 1}/${products.length}] Skipping ${product.name} (no URL)`);
      errorCount++;
      continue;
    }
    
    try {
      console.log(`   [${i + 1}/${products.length}] ${product.name}`);
      
      const details = await extractProductDetailsFromUrl(page, product.url, false);
      
      product.price = parseFloat(details.price) || 0;
      product.description = details.description;
      product.descriptionTranslations = { en: details.description, fr: details.description };
      product.imageUrl = details.imageUrl;
      
      successCount++;
      await delay(500);
      
    } catch (error) {
      console.log(`   ❌ Error fetching details for ${product.name}: ${error}`);
      errorCount++;
    }
  }
  
  console.log(`\n    ✓ Enriched ${successCount} products successfully`);
  if (errorCount > 0) {
    console.log(`    ⚠️ ${errorCount} products had errors or were skipped`);
  }

  return { successCount, errorCount };
}



