/**
 * Maxi.ca Product Scraper - Main Entry Point
 * 
 * Usage:
 *   npm run scrape:maxi              # Full scrape
 *   npm run scrape:maxi:categories   # Categories only
 *   
 *   # Test modes:
 *   npx ts-node scripts/scrape-maxi --test-subcategories
 *   npx ts-node scripts/scrape-maxi --test-subsubcategories
 *   npx ts-node scripts/scrape-maxi --test-products
 *   npx ts-node scripts/scrape-maxi --test-product-details
 * 
 * Output:
 *   Creates maxi-data.json with categories and products
 */

import * as fs from 'fs';
import { BASE_URL, STORE_NAME, STORE_ID, OUTPUT_FILE } from './config';
import { ScrapedData } from './types';
import { delay, countNestedCategories } from './helpers';
import { MaxiScraper } from './maxi-scraper';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Maxi.ca Product Scraper');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const categoriesOnly = args.includes('--categories-only');
  const testSubcategories = args.includes('--test-subcategories');
  const testSubSubcategories = args.includes('--test-subsubcategories');
  const testProducts = args.includes('--test-products');
  const testProductDetails = args.includes('--test-product-details');

  console.log(`Configuration:`);
  console.log(`  - Store: ${STORE_NAME}`);
  console.log(`  - Categories only: ${categoriesOnly}`);
  console.log(`  - Test subcategories: ${testSubcategories}`);
  console.log(`  - Test sub-subcategories: ${testSubSubcategories}`);
  console.log(`  - Test products: ${testProducts}`);
  console.log(`  - Test product details: ${testProductDetails}`);
  console.log(`  - Store ID: ${STORE_ID}`);
  console.log('');

  const scraper = new MaxiScraper();
  
  try {
    // Test mode: subcategory extraction (L3 -> L4)
    if (testSubcategories) {
      const testUrl = 'https://www.maxi.ca/en/food/fruits-vegetables/fresh-vegetables/c/28195?navid=flyout-L3-Fresh-Vegetables';
      console.log(`\n🧪 Testing subcategory extraction (L4) from:`);
      console.log(`   ${testUrl}\n`);
      
      await scraper.init();
      
      await scraper.getPage().goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await delay(1000);
      
      const subcategories = await scraper.extractSubcategoriesFromUrl(testUrl, true);
      
      console.log(`\n✅ Found ${subcategories.length} subcategories:`);
      subcategories.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name}`);
        console.log(`      URL: ${cat.url}`);
      });
      
      await scraper.close();
      return;
    }
    
    // Test mode: sub-subcategory extraction (L4 -> L5)
    if (testSubSubcategories) {
      const testUrl = 'https://www.maxi.ca/en/food/fruits-vegetables/fresh-vegetables/carrots-radish-root-vegetables/c/29593';
      console.log(`\n🧪 Testing sub-subcategory extraction (L5) from:`);
      console.log(`   ${testUrl}\n`);
      
      await scraper.init();
      
      await scraper.getPage().goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await delay(1000);
      
      const subsubcategories = await scraper.extractSubcategoriesFromUrl(testUrl, true);
      
      console.log(`\n✅ Found ${subsubcategories.length} sub-subcategories:`);
      subsubcategories.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name}`);
        console.log(`      URL: ${cat.url}`);
      });
      
      await scraper.close();
      return;
    }
    
    // Test mode: product extraction from category
    if (testProducts) {
      const testUrl = 'https://www.maxi.ca/en/food/fruits-vegetables/fresh-vegetables/carrots-radish-root-vegetables/carrots/c/34511';
      console.log(`\n🧪 Testing product extraction from L5 category:`);
      console.log(`   ${testUrl}\n`);
      
      await scraper.init();
      
      await scraper.getPage().goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await delay(1000);
      
      const products = await scraper.extractProductsFromUrl(testUrl, true);
      
      console.log(`\n✅ Found ${products.length} products:`);
      products.forEach((product, i) => {
        console.log(`   ${i + 1}. ${product.name}`);
        console.log(`      URL: ${product.url}`);
      });
      
      await scraper.close();
      return;
    }
    
    // Test mode: full product details extraction
    if (testProductDetails) {
      const testUrl = 'https://www.maxi.ca/en/carrots-3-lb-bag/p/20600927001_EA?source=nspt';
      console.log(`\n🧪 Testing full product details extraction:`);
      console.log(`   ${testUrl}\n`);
      
      await scraper.init();
      
      await scraper.getPage().goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await delay(1000);
      
      const details = await scraper.extractProductDetailsFromUrl(testUrl, true);
      
      console.log(`\n✅ Product Details:`);
      console.log(`   Name: ${details.name}`);
      console.log(`   Price: $${details.price}`);
      console.log(`   Description: ${details.description}`);
      console.log(`   ImageURL: ${details.imageUrl}`);
      
      await scraper.close();
      return;
    }
    
    // Main scraping modes
    let data: ScrapedData;
    
    if (categoriesOnly) {
      await scraper.init();
      await scraper.selectStore();
      await scraper.extractMainGroceryCategories();
      await scraper.extractAllSubcategories();
      
      data = {
        categories: scraper.getCategories(),
        products: [],
        scrapedAt: new Date().toISOString(),
        totalProducts: 0,
        totalCategories: countNestedCategories(scraper.getCategories()),
        storeName: STORE_NAME
      };
      
      await scraper.close();
    } else {
      data = await scraper.run();
    }

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   Scraping Complete!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📊 Summary:`);
    console.log(`   - Store: ${data.storeName}`);
    console.log(`   - Categories: ${data.totalCategories}`);
    console.log(`   - Products: ${data.totalProducts}`);
    console.log(`   - Output file: ${OUTPUT_FILE}`);
    console.log(`   - Scraped at: ${data.scrapedAt}`);

  } catch (error) {
    console.error('\n❌ Scraping failed:', (error as Error).message);
    await scraper.close();
    process.exit(1);
  }
}

main();
