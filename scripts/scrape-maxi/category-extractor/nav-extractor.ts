/**
 * Navigation Menu Category Extractor
 * Extracts L2 and L3 categories from the Grocery dropdown menu
 */

import { Page } from 'puppeteer';
import { BASE_URL } from '../config';
import { ScrapedCategory } from '../types';
import { delay, dismissCookiePopup } from '../helpers';

/**
 * Extract main grocery categories (L2 and L3) from the navigation menu
 */
export async function extractMainGroceryCategories(page: Page): Promise<ScrapedCategory[]> {
  const categories: ScrapedCategory[] = [];
  
  console.log('\n📂 Extracting grocery categories from navigation menu...');
  
  // Navigate to home page
  console.log('  Navigating to home page...');
  await page.goto(`${BASE_URL}/en`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await delay(1000);
  await dismissCookiePopup(page);
  
  // Step 1: Click on the "Grocery" button
  console.log('  Step 1: Opening Grocery dropdown...');
  
  const groceryButtonSelector = 'button[data-testid="iceberg-main-nav-l1-button"]';
  
  let groceryButtonClicked = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    groceryButtonClicked = await page.evaluate((selector: string) => {
      const buttons = document.querySelectorAll(selector);
      for (const btn of Array.from(buttons)) {
        const span = btn.querySelector('span');
        if (span && span.textContent?.trim().toLowerCase() === 'grocery') {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    }, groceryButtonSelector);
    
    if (groceryButtonClicked) break;
    
    if (attempt === 5) {
      const debugInfo = await page.evaluate((selector: string) => {
        const buttons = document.querySelectorAll(selector);
        const info = Array.from(buttons).map(btn => {
          const span = btn.querySelector('span');
          return span?.textContent?.trim() || 'no span';
        });
        return { count: buttons.length, texts: info };
      }, groceryButtonSelector);
      console.log(`    ... debug: found ${debugInfo.count} L1 buttons: ${debugInfo.texts.join(', ')}`);
    }
    
    console.log(`    ... waiting for Grocery button (${attempt}/10)`);
    await delay(1000);
  }

  if (!groceryButtonClicked) {
    console.log('    ❌ ERROR: Could not find Grocery button');
    throw new Error('Could not find Grocery button');
  }
  console.log('    ✓ Clicked Grocery button');
  await delay(500);

  // Step 2: Wait for L2 tabs list
  console.log('  Step 2: Waiting for L2 category tabs...');
  const l2TabsSelector = '[data-testid="iceberg-main-nav-l2-tabs-list"]';
  
  let l2TabsFound = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    l2TabsFound = await page.evaluate((selector: string) => {
      return document.querySelector(selector) !== null;
    }, l2TabsSelector);
    
    if (l2TabsFound) break;
    console.log(`    ... waiting for L2 tabs (${attempt}/10)`);
    await delay(500);
  }

  if (!l2TabsFound) {
    console.log('    ❌ ERROR: L2 tabs list not found');
    throw new Error('L2 tabs list not found');
  }
  console.log('    ✓ L2 tabs list found');

  // Step 3: Get all L2 category names
  console.log('  Step 3: Extracting L2 categories...');
  
  const l2Categories = await page.evaluate(() => {
    const cats: { name: string; index: number }[] = [];
    const buttons = document.querySelectorAll('[data-testid="iceberg-main-nav-l2-button"]');
    
    buttons.forEach((btn, index) => {
      const span = btn.querySelector('span');
      const name = span?.textContent?.trim() || '';
      if (name) {
        cats.push({ name, index });
      }
    });
    
    return cats;
  });

  console.log(`    ✓ Found ${l2Categories.length} L2 categories`);
  l2Categories.forEach(cat => console.log(`      - ${cat.name}`));

  // Step 4: For each L2 category, click and extract L3 subcategories
  console.log('  Step 4: Extracting L3 categories for each L2...');

  for (const l2Cat of l2Categories) {
    console.log(`\n    📁 ${l2Cat.name}`);
    
    const mainCategory: ScrapedCategory = {
      name: l2Cat.name,
      nameTranslations: { en: l2Cat.name, fr: l2Cat.name },
      url: '',
      children: []
    };

    // Check if this L2 item is a link vs a tab button
    const isLink = await page.evaluate((index: number) => {
      const buttons = document.querySelectorAll('[data-testid="iceberg-main-nav-l2-button"]');
      const btn = buttons[index];
      return btn?.tagName?.toLowerCase() === 'a';
    }, l2Cat.index);
    
    if (isLink) {
      console.log(`       ⚠️ Skipping ${l2Cat.name} (is a direct link, no subcategories)`);
      categories.push(mainCategory);
      continue;
    }
    
    // Click on the L2 tab
    const buttons = await page.$$('[data-testid="iceberg-main-nav-l2-button"]');
    if (!buttons[l2Cat.index]) {
      console.log(`       ⚠️ Could not find button for ${l2Cat.name}`);
      categories.push(mainCategory);
      continue;
    }
    
    await buttons[l2Cat.index].click();
    await delay(400);
    
    // Verify tab is active
    const tabStates = await page.evaluate(() => {
      const buttons = document.querySelectorAll('[data-testid="iceberg-main-nav-l2-button"]');
      return Array.from(buttons).map(btn => ({
        name: btn.querySelector('span')?.textContent?.trim() || '',
        ariaSelected: btn.getAttribute('aria-selected'),
        dataState: btn.getAttribute('data-state')
      }));
    });
    
    const activeTab = tabStates.find(t => t.ariaSelected === 'true' || t.dataState === 'active');
    const tabActive = activeTab?.name === l2Cat.name;

    if (!tabActive) {
      console.log(`       ⚠️ Tab did not become active for ${l2Cat.name} (active: ${activeTab?.name || 'none'})`);
    }
    
    await delay(300);

    // Extract L3 categories from the active tabpanel
    const l3Result = await page.evaluate((baseUrl: string) => {
      const cats: { name: string; url: string; isUnderlined: boolean }[] = [];
      
      const activePanel = document.querySelector('[data-testid="iceberg-main-nav-l2-tabs-content"][data-state="active"]');
      if (!activePanel) {
        const panels = document.querySelectorAll('[role="tabpanel"][data-state="active"]');
        if (panels.length === 0) return { categories: cats, hasNestedMenu: false, totalBeforeFilter: 0, underlinedCount: 0 };
      }
      
      const list = activePanel 
        ? activePanel.querySelector('[data-testid="iceberg-main-nav-l3-content-list"]')
        : document.querySelector('[role="tabpanel"][data-state="active"] [data-testid="iceberg-main-nav-l3-content-list"]');
        
      if (!list) return { categories: cats, hasNestedMenu: false, totalBeforeFilter: 0, underlinedCount: 0 };

      const listItems = list.querySelectorAll('li');
      // Skip the first item (it's the "See All" link)
      for (let i = 1; i < listItems.length; i++) {
        const li = listItems[i];
        const anchor = li.querySelector('a[data-testid="iceberg-main-nav-l3-button"]');
        if (anchor) {
          const name = anchor.textContent?.trim() || '';
          let href = anchor.getAttribute('href') || '';
          
          if (href && href.startsWith('/')) {
            href = baseUrl + href;
          }
          
          // Skip "See All" and "Shop More" items
          if (!name || !href) continue;
          if (name.toLowerCase().startsWith('see all')) continue;
          if (name.toLowerCase().startsWith('shop more')) continue;
          
          // Check if this item is underlined (indicates a main category in nested menus)
          const computedStyle = window.getComputedStyle(anchor);
          const isUnderlined = computedStyle.textDecoration.includes('underline') || 
                              computedStyle.textDecorationLine.includes('underline');
          
          cats.push({ name, url: href, isUnderlined });
        }
      }
      
      // Check if there are any underlined items (indicates nested menu structure)
      const underlinedCount = cats.filter(c => c.isUnderlined).length;
      const hasNestedMenu = underlinedCount > 0;
      const totalBeforeFilter = cats.length;
      
      // If there are any underlined items, only keep those (they're the main categories)
      if (hasNestedMenu) {
        const filtered = cats.filter(c => c.isUnderlined).map(c => ({ name: c.name, url: c.url }));
        return { categories: filtered, hasNestedMenu: true, totalBeforeFilter, underlinedCount };
      }
      
      // Otherwise return all items (normal case without nested menus)
      return { 
        categories: cats.map(c => ({ name: c.name, url: c.url })), 
        hasNestedMenu: false, 
        totalBeforeFilter, 
        underlinedCount: 0 
      };
    }, BASE_URL);

    const l3Categories = l3Result.categories;
    
    if (l3Result.hasNestedMenu) {
      console.log(`       🔗 Nested menu detected: found ${l3Result.underlinedCount} main categories (filtered from ${l3Result.totalBeforeFilter} items)`);
    }
    console.log(`       Found ${l3Categories.length} L3 subcategories`);

    for (const l3Cat of l3Categories) {
      mainCategory.children.push({
        name: l3Cat.name,
        nameTranslations: { en: l3Cat.name, fr: l3Cat.name },
        url: l3Cat.url,
        children: []
      });
    }

    categories.push(mainCategory);
  }

  const totalL2 = categories.length;
  const totalL3 = categories.reduce((acc, c) => acc + c.children.length, 0);

  console.log(`\n    ✓ Total L2 (main): ${totalL2}`);
  console.log(`    ✓ Total L3 (sub): ${totalL3}`);

  return categories;
}

