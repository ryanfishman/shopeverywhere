/**
 * Main Maxi Scraper Class
 * Orchestrates the scraping process
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  BROWSER_ARGS, 
  VIEWPORT, 
  USER_AGENT, 
  DEFAULT_TIMEOUT,
  STORE_NAME
} from './config';
import { ScrapedCategory, ScrapedProduct, ScrapedData } from './types';
import { delay, countNestedCategories, countLeafCategories } from './helpers';
import { selectStore } from './store-selector';
import { 
  extractMainGroceryCategories, 
  extractAllSubcategories,
  extractSubcategoriesFromUrl 
} from './category-extractor';
import { 
  scrapeProductsFromCategory,
  extractProductsFromUrl,
  extractProductDetailsFromUrl,
  enrichProductsWithDetails 
} from './product-extractor';

export class MaxiScraper {
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected categories: ScrapedCategory[] = [];
  protected products: ScrapedProduct[] = [];

  async init(): Promise<void> {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: false,
      args: BROWSER_ARGS
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport(VIEWPORT);
    await this.page.setUserAgent(USER_AGENT);
    
    this.page.setDefaultNavigationTimeout(DEFAULT_TIMEOUT);
    this.page.setDefaultTimeout(DEFAULT_TIMEOUT);
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  getPage(): Page {
    if (!this.page) throw new Error('Page not initialized');
    return this.page;
  }

  getCategories(): ScrapedCategory[] {
    return this.categories;
  }

  getProducts(): ScrapedProduct[] {
    return this.products;
  }

  async selectStore(): Promise<boolean> {
    return selectStore(this.getPage());
  }

  async extractMainGroceryCategories(): Promise<void> {
    this.categories = await extractMainGroceryCategories(this.getPage());
  }

  async extractAllSubcategories(): Promise<void> {
    await extractAllSubcategories(this.getPage(), this.categories);
  }

  async extractSubcategoriesFromUrl(url: string, debug: boolean = false) {
    return extractSubcategoriesFromUrl(this.getPage(), url, debug);
  }

  async extractProductsFromUrl(url: string, debug: boolean = false) {
    return extractProductsFromUrl(this.getPage(), url, debug);
  }

  async extractProductDetailsFromUrl(url: string, debug: boolean = false) {
    return extractProductDetailsFromUrl(this.getPage(), url, debug);
  }

  async scrapeAllProducts(): Promise<void> {
    console.log('\n🛒 Starting product scraping...\n');

    const categoriesToScrape: { name: string; url: string; fullPath: string }[] = [];
    
    const collectLeafCategories = (cats: ScrapedCategory[], path: string = '') => {
      for (const cat of cats) {
        const fullPath = path ? `${path} > ${cat.name}` : cat.name;
        
        if (cat.children.length > 0) {
          collectLeafCategories(cat.children, fullPath);
        } else if (cat.url) {
          categoriesToScrape.push({ name: cat.name, url: cat.url, fullPath });
        }
      }
    };
    
    collectLeafCategories(this.categories);

    console.log(`📋 Found ${categoriesToScrape.length} leaf categories to scrape\n`);

    for (let i = 0; i < categoriesToScrape.length; i++) {
      const cat = categoriesToScrape[i];
      
      console.log(`\n[${i + 1}/${categoriesToScrape.length}] 🏷️ ${cat.fullPath}`);
      
      const products = await scrapeProductsFromCategory(this.getPage(), cat.url, cat.name);
      this.products.push(...products);
      
      console.log(`    ✅ Added ${products.length} products (Total: ${this.products.length})`);

      await delay(500);
    }
  }

  async enrichProductsWithDetails(): Promise<void> {
    await enrichProductsWithDetails(this.getPage(), this.products);
  }

  async run(): Promise<ScrapedData> {
    try {
      await this.init();
      await this.selectStore();
      await this.extractMainGroceryCategories();
      await this.extractAllSubcategories();
      await this.scrapeAllProducts();

      const data: ScrapedData = {
        categories: this.categories,
        products: this.products,
        scrapedAt: new Date().toISOString(),
        totalProducts: this.products.length,
        totalCategories: countNestedCategories(this.categories),
        storeName: STORE_NAME
      };

      return data;

    } finally {
      await this.close();
    }
  }
}



