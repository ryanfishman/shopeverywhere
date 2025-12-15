/**
 * Product List Extractor
 * Extracts product listings from category pages
 */

import { Page } from 'puppeteer';
import { BASE_URL, STORE_ID, MAX_RETRIES, RETRY_DELAY } from '../config';
import { ScrapedProduct, ProductListItem, ProductDataItem } from '../types';
import { delay, dismissCookiePopup, scrollToLoadContent } from '../helpers';
import { getProductDescription } from './product-details-extractor';

/**
 * Extract high-level product info (name and URL only) from a category URL
 */
export async function extractProductsFromUrl(
  page: Page,
  url: string,
  debug: boolean = false
): Promise<ProductListItem[]> {
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
        if (debug) console.log(`      ⚠️ Attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${RETRY_DELAY/1000}s...`);
        await delay(RETRY_DELAY);
      }
    }
  }
  
  if (lastError) {
    console.log(`      ❌ Failed to load after ${MAX_RETRIES} attempts: ${lastError.message}`);
    return [];
  }

  await delay(500);

  // Debug logging
  if (debug) {
    const debugInfo = await page.evaluate(() => {
      const allProductGrids = document.querySelectorAll('[data-testid="product-grid-component"]');
      const productGrid = allProductGrids.length > 0 ? allProductGrids[allProductGrids.length - 1] : null;
      
      const gridLinkboxes = productGrid ? productGrid.querySelectorAll('.chakra-linkbox') : [];
      const gridTitles = productGrid ? productGrid.querySelectorAll('[data-testid="product-title"]') : [];
      const allLinkboxes = document.querySelectorAll('.chakra-linkbox');
      const allTitles = document.querySelectorAll('[data-testid="product-title"]');
      
      const gridCounts = Array.from(allProductGrids).map((g, i) => ({
        index: i,
        linkboxes: g.querySelectorAll('.chakra-linkbox').length,
        titles: g.querySelectorAll('[data-testid="product-title"]').length
      }));
      
      const titlesInGrid = Array.from(gridTitles).slice(0, 5).map(t => t.textContent?.trim());
      
      return {
        numGrids: allProductGrids.length,
        gridCounts,
        gridLinkboxesCount: gridLinkboxes.length,
        gridTitlesCount: gridTitles.length,
        allLinkboxesCount: allLinkboxes.length,
        allTitlesCount: allTitles.length,
        titlesInGrid
      };
    });
    console.log(`  DEBUG: Number of product grids: ${debugInfo.numGrids}`);
    console.log(`  DEBUG: Grid counts:`, debugInfo.gridCounts);
    console.log(`  DEBUG: Linkboxes IN last grid: ${debugInfo.gridLinkboxesCount}`);
    console.log(`  DEBUG: Titles IN last grid: ${debugInfo.gridTitlesCount}`);
    console.log(`  DEBUG: Linkboxes on page: ${debugInfo.allLinkboxesCount}`);
    console.log(`  DEBUG: Titles on page: ${debugInfo.allTitlesCount}`);
    console.log(`  DEBUG: Titles in grid: ${debugInfo.titlesInGrid.join(', ')}`);
  }

  // Extract products from the product grid
  const products = await page.evaluate((baseUrl: string) => {
    const items: { name: string; url: string }[] = [];
    
    const allGrids = document.querySelectorAll('[data-testid="product-grid-component"]');
    if (allGrids.length === 0) return items;
    
    // Find the grid with the most linkboxes
    let mainGrid = allGrids[0];
    let maxLinkboxes = 0;
    for (const grid of Array.from(allGrids)) {
      const count = grid.querySelectorAll('.chakra-linkbox').length;
      if (count > maxLinkboxes) {
        maxLinkboxes = count;
        mainGrid = grid;
      }
    }
    
    const linkboxes = mainGrid.querySelectorAll('.chakra-linkbox');
    
    for (const linkbox of Array.from(linkboxes)) {
      const titleEl = linkbox.querySelector('[data-testid="product-title"]');
      const name = titleEl?.textContent?.trim() || '';
      
      const linkEl = linkbox.querySelector('a.chakra-linkbox__overlay');
      let url = linkEl?.getAttribute('href') || '';
      
      if (url && url.startsWith('/')) {
        url = baseUrl + url;
      }
      
      if (name && url) {
        items.push({ name, url });
      }
    }
    
    return items;
  }, BASE_URL);

  return products;
}

/**
 * Scrape all products from a category page including their details
 */
export async function scrapeProductsFromCategory(
  page: Page,
  categoryUrl: string,
  categoryName: string
): Promise<ScrapedProduct[]> {
  const products: ScrapedProduct[] = [];
  
  try {
    const fullUrl = categoryUrl.startsWith('http') ? categoryUrl : `${BASE_URL}${categoryUrl}`;
    console.log(`      URL: ${fullUrl}`);
    
    // Navigate with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await delay(3000);
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
      console.log(`      ❌ Failed to load after ${MAX_RETRIES} attempts: ${lastError.message}`);
      return products;
    }

    await scrollToLoadContent(page);

    // Extract product data
    const productData = await page.evaluate(() => {
      const items: ProductDataItem[] = [];

      const productGrid = document.querySelector('[data-testid="product-grid-component"]');
      if (!productGrid) {
        console.log('No product grid found');
        return items;
      }

      const productCards = productGrid.querySelectorAll('.chakra-linkbox');
      
      productCards.forEach(card => {
        try {
          const titleEl = card.querySelector('[data-testid="product-title"]');
          const name = titleEl?.textContent?.trim() || '';
          
          let price = '';
          const salePriceEl = card.querySelector('[data-testid="sale-price"]');
          const regularPriceEl = card.querySelector('[data-testid="regular-price"]');
          if (salePriceEl) {
            price = salePriceEl.textContent?.replace(/sale/i, '').trim() || '';
          } else if (regularPriceEl) {
            price = regularPriceEl.textContent?.trim() || '';
          }
          
          const linkEl = card.querySelector('a[href*="/p/"]') as HTMLAnchorElement | null;
          const productUrl = linkEl?.getAttribute('href') || '';
          
          const imgEl = card.querySelector('[data-testid="product-image"] img') as HTMLImageElement | null;
          let imageUrl = imgEl?.src || '';
          
          const brandEl = card.querySelector('[data-testid="product-brand"]');
          const brand = brandEl?.textContent?.trim();
          
          const sizeEl = card.querySelector('[data-testid="product-package-size"]');
          const unit = sizeEl?.textContent?.trim() || '';
          
          const stockBadge = card.querySelector('[data-testid="inventory-badge-text"]');
          const outOfStock = stockBadge?.textContent?.toLowerCase().includes('out of stock') || false;
          
          const hasValidImage = imageUrl.includes('digital.loblaws.ca');
          
          if (name && name.length > 1 && !outOfStock && hasValidImage) {
            if (!items.find(i => i.name === name)) {
              items.push({ name, price, imageUrl, productUrl, brand, unit, outOfStock });
            }
          }
        } catch (e) {
          // Skip problematic cards
        }
      });

      return items;
    }) as ProductDataItem[];

    console.log(`      Found ${productData.length} products in listing`);

    // Process all products
    for (let i = 0; i < productData.length; i++) {
      const item = productData[i];
      
      try {
        const priceMatch = item.price.match(/[\d.,]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '')) : 0;

        let description = '';
        let productCode = '';
        
        if (item.productUrl) {
          const descData = await getProductDescription(page, item.productUrl);
          description = descData.description;
          productCode = descData.productCode;
        }

        const product: ScrapedProduct = {
          name: item.name,
          nameTranslations: { en: item.name, fr: item.name },
          shortDescription: item.unit || '',
          shortDescriptionTranslations: { en: item.unit || '', fr: item.unit || '' },
          description,
          descriptionTranslations: { en: description, fr: description },
          imageUrl: item.imageUrl,
          price,
          categoryName,
          storeId: STORE_ID,
          brand: item.brand,
          productCode
        };

        products.push(product);
        
        if ((i + 1) % 10 === 0) {
          console.log(`        Processed ${i + 1}/${productData.length} products`);
        }
      } catch (error) {
        console.error(`        ⚠️ Error processing product:`, (error as Error).message);
      }
    }

  } catch (error) {
    console.error(`    ⚠️ Error scraping category:`, (error as Error).message);
  }

  return products;
}



