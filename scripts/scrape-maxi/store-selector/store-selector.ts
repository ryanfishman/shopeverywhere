/**
 * Store selector for Maxi.ca
 * Handles selecting a specific store location
 */

import { Page } from 'puppeteer';
import { STORE_LOCATOR_URL, STORE_NAME } from '../config';
import { delay, dismissCookiePopup } from '../helpers';

/**
 * Select a store by navigating to the store locator and selecting the specified store
 */
export async function selectStore(page: Page): Promise<boolean> {
  console.log(`📍 Selecting store: ${STORE_NAME}`);
  
  // Navigate to store locator
  console.log(`    Navigating to: ${STORE_LOCATOR_URL}`);
  await page.goto(STORE_LOCATOR_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await delay(2000);
  await dismissCookiePopup(page);

  // Step 1: Wait for the location-list ul to appear
  console.log('    Waiting for location-list to load...');
  let locationListFound = false;
  for (let attempt = 0; attempt < 10; attempt++) {
    locationListFound = await page.evaluate(() => {
      return document.querySelector('ul.location-list') !== null;
    });
    
    if (locationListFound) break;
    console.log(`    ... waiting (${attempt + 1}/10)`);
    await delay(1000);
  }

  if (!locationListFound) {
    console.log('    ❌ ERROR: Could not find ul.location-list on the page after 10 seconds');
    throw new Error('Store locator page did not load correctly - ul.location-list not found');
  }
  console.log('    ✓ Found location-list');

  // Step 1b: Search for the store
  console.log(`    Searching for "${STORE_NAME}"...`);
  const searchInput = await page.$('#location-search__search__input');
  
  if (searchInput) {
    const searchText = 'H9A 2V7';
    let typingSuccess = false;
    
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`    ... typing attempt ${attempt}/10`);
      
      await searchInput.focus();
      await delay(300);
      
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await delay(300);
      
      await page.type('#location-search__search__input', searchText, { delay: 50 });
      await delay(500);
      
      const inputValue = await page.evaluate(() => {
        const input = document.querySelector('#location-search__search__input') as HTMLInputElement;
        return input?.value || '';
      });
      
      if (inputValue.includes(searchText)) {
        console.log(`    ✓ Successfully typed "${searchText}"`);
        typingSuccess = true;
        break;
      }
      
      console.log(`    ... input value is "${inputValue}", retrying...`);
      await delay(500);
    }
    
    if (!typingSuccess) {
      console.log(`    ❌ ERROR: Failed to type "${searchText}" after 10 attempts`);
      throw new Error('Failed to type in search input');
    }
    
    await page.keyboard.press('Enter');
    
    // Wait for store to appear in results
    let storeFound = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      console.log(`    ... waiting to find "${STORE_NAME}" (${attempt}/10)`);
      
      storeFound = await page.evaluate((storeName: string) => {
        const locationList = document.querySelector('ul.location-list');
        if (!locationList) return false;
        
        const h2Elements = locationList.querySelectorAll('h2.location-list-item-details__title');
        for (const h2 of Array.from(h2Elements)) {
          const h2Text = h2.textContent?.trim().toUpperCase() || '';
          if (h2Text.includes(storeName.toUpperCase()) || storeName.toUpperCase().includes(h2Text)) {
            return true;
          }
        }
        return false;
      }, STORE_NAME);
      
      if (storeFound) {
        console.log(`    ✓ Found "${STORE_NAME}" in search results`);
        break;
      }
      await delay(1000);
    }
    
    if (!storeFound) {
      console.log(`    ❌ ERROR: "${STORE_NAME}" not found after 10 seconds`);
      throw new Error(`Store "${STORE_NAME}" not found in search results`);
    }
  } else {
    console.log('    ❌ ERROR: Could not find search input #location-search__search__input');
    throw new Error('Search input not found');
  }

  // Step 2: Find and check/click the store
  const storeResult = await page.evaluate((storeName: string) => {
    const locationList = document.querySelector('ul.location-list');
    if (!locationList) return { found: false, error: 'location-list not found' };

    const h2Elements = locationList.querySelectorAll('h2.location-list-item-details__title');
    let targetLi: HTMLLIElement | null = null;

    for (const h2 of Array.from(h2Elements)) {
      const h2Text = h2.textContent?.trim().toUpperCase() || '';
      if (h2Text.includes(storeName.toUpperCase()) || storeName.toUpperCase().includes(h2Text)) {
        targetLi = h2.closest('li.location-list__item') as HTMLLIElement;
        break;
      }
    }

    if (!targetLi) {
      return { found: false, error: `Store "${storeName}" not found in location list` };
    }

    const actionsDiv = targetLi.querySelector('div.location-list-item__actions');
    if (!actionsDiv) {
      return { found: true, error: 'actions div not found', status: 'no_actions' };
    }

    const selectedSpan = actionsDiv.querySelector('span.location-set-store__button');
    if (selectedSpan && selectedSpan.textContent?.trim() === 'Selected location') {
      return { found: true, status: 'already_selected' };
    }

    const selectButton = actionsDiv.querySelector('button.location-set-store__button');
    if (selectButton && selectButton.textContent?.trim() === 'Select location') {
      return { found: true, status: 'needs_selection' };
    }

    return { found: true, status: 'unknown', error: 'Could not determine store selection state' };
  }, STORE_NAME);

  if (!storeResult.found) {
    console.log(`    ❌ ERROR: ${storeResult.error}`);
    throw new Error(storeResult.error || 'Store not found');
  }

  console.log(`    ✓ Found store element: ${STORE_NAME}`);

  if (storeResult.status === 'already_selected') {
    console.log('    ✓ Store is already selected');
    return true;
  }

  if (storeResult.status === 'needs_selection') {
    console.log('    Clicking "Select location" button...');
    
    await page.evaluate((storeName: string) => {
      const locationList = document.querySelector('ul.location-list');
      if (!locationList) return;

      const h2Elements = locationList.querySelectorAll('h2.location-list-item-details__title');
      for (const h2 of Array.from(h2Elements)) {
        if (h2.textContent?.trim().toUpperCase() === storeName.toUpperCase()) {
          const targetLi = h2.closest('li.location-list__item');
          if (targetLi) {
            const selectButton = targetLi.querySelector('button.location-set-store__button');
            if (selectButton) {
              (selectButton as HTMLButtonElement).click();
            }
          }
          break;
        }
      }
    }, STORE_NAME);

    console.log('    Waiting for store selection to complete...');
    
    let selectionConfirmed = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      await delay(1000);
      
      selectionConfirmed = await page.evaluate((storeName: string) => {
        const locationList = document.querySelector('ul.location-list');
        if (!locationList) return false;

        const h2Elements = locationList.querySelectorAll('h2.location-list-item-details__title');
        for (const h2 of Array.from(h2Elements)) {
          if (h2.textContent?.trim().toUpperCase() === storeName.toUpperCase()) {
            const targetLi = h2.closest('li.location-list__item');
            if (targetLi) {
              const selectedSpan = targetLi.querySelector('span.location-set-store__button');
              if (selectedSpan && selectedSpan.textContent?.trim() === 'Selected location') {
                return true;
              }
            }
            break;
          }
        }
        return false;
      }, STORE_NAME);

      if (selectionConfirmed) {
        console.log('    ✓ Store selection confirmed');
        break;
      }
    }

    if (!selectionConfirmed) {
      console.log('    ⚠️ Could not confirm store selection, but continuing...');
    }
  }

  return true;
}



