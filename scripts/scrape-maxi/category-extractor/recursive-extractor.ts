/**
 * Recursive Category Extractor
 * Recursively extracts all subcategories from the category tree
 */

import { Page } from 'puppeteer';
import { ScrapedCategory } from '../types';
import { countLeafCategories } from '../helpers';
import { extractSubcategoriesFromUrl } from './subcategory-extractor';

/**
 * Recursively extract all subcategories from a list of categories
 * Any category without subcategories on its page is treated as a leaf category
 */
export async function extractAllSubcategoriesRecursive(
  page: Page,
  categories: ScrapedCategory[],
  depth: number = 1,
  path: string = ''
): Promise<number> {
  let totalFound = 0;

  for (const category of categories) {
    const fullPath = path ? `${path} > ${category.name}` : category.name;
    
    // Skip if no URL
    if (!category.url) {
      console.log(`${'  '.repeat(depth)}⚠️ ${category.name} (no URL - skipping)`);
      continue;
    }

    // Skip if already has children (already processed)
    if (category.children.length > 0) {
      const childCount = await extractAllSubcategoriesRecursive(page, category.children, depth + 1, fullPath);
      totalFound += childCount;
      continue;
    }

    try {
      const subcategories = await extractSubcategoriesFromUrl(page, category.url);

      if (subcategories.length > 0) {
        // Has subcategories - add them as children
        for (const subcat of subcategories) {
          category.children.push({
            name: subcat.name,
            nameTranslations: { en: subcat.name, fr: subcat.name },
            url: subcat.url,
            children: []
          });
        }
        console.log(`${'  '.repeat(depth)}📁 ${category.name}: ${subcategories.length} subcategories`);
        totalFound += subcategories.length;

        // Recurse into the new children
        const childCount = await extractAllSubcategoriesRecursive(page, category.children, depth + 1, fullPath);
        totalFound += childCount;
      } else {
        // No subcategories - this is a LEAF category
        console.log(`${'  '.repeat(depth)}🍃 ${category.name}: LEAF (no subcategories)`);
      }

    } catch (error) {
      console.log(`${'  '.repeat(depth)}⚠️ Error extracting ${category.name}: ${(error as Error).message}`);
    }
  }

  return totalFound;
}

/**
 * Extract all subcategories starting from the L3 level
 */
export async function extractAllSubcategories(
  page: Page,
  categories: ScrapedCategory[]
): Promise<void> {
  console.log('\n📂 Extracting all subcategories recursively...');
  console.log('   (Categories without subcategories will be treated as leaf categories)\n');

  let totalSubcategories = 0;

  // Process each L2 category's children (L3 categories)
  for (const l2Category of categories) {
    console.log(`\n📁 ${l2Category.name}`);
    
    const found = await extractAllSubcategoriesRecursive(page, l2Category.children, 2, l2Category.name);
    totalSubcategories += found;
  }

  // Count total categories at each level
  const countAtDepth = (cats: ScrapedCategory[], depth: number, counts: number[] = []): number[] => {
    if (!counts[depth]) counts[depth] = 0;
    counts[depth] += cats.length;
    for (const cat of cats) {
      if (cat.children.length > 0) {
        countAtDepth(cat.children, depth + 1, counts);
      }
    }
    return counts;
  };
  
  const counts = countAtDepth(categories, 0);
  const totalCategories = counts.reduce((a, b) => a + b, 0);
  const leafCount = countLeafCategories(categories);

  console.log(`\n    ✓ Total subcategories found: ${totalSubcategories}`);
  console.log(`    ✓ Total categories: ${totalCategories}`);
  console.log(`    ✓ Leaf categories (for product scraping): ${leafCount}`);
}



