import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get("zoneId");
  const query = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;
  const offset = (page - 1) * limit;

  // Zone check is now mandatory for availability logic as per "ZoneStores" requirement
  // "We will display products only from the stores that match that zone to the user."
  // If no zoneId provided, we can either return nothing or default behavior.
  // The prompt says "If not you need to put in the middle content that we currently don't operate in the zone you specify."
  // So the frontend should handle the "no zone" state. This API assumes we have a zone or we show nothing.

  if (!zoneId) {
     return NextResponse.json({ products: [], total: 0 });
  }

  // Find stores in this zone
  const zoneStores = await prisma.zonestore.findMany({
    where: { zoneId },
    select: { storeId: true }
  });
  
  const storeIds = zoneStores.map(zs => zs.storeId);

  if (storeIds.length === 0) {
      return NextResponse.json({ products: [], total: 0 });
  }

  // Build filter
  // Requirement: "Categories can have sub categories... When I click a category it will be used as a filter to show only items of that category and its child categories."
  // We need to fetch all descendant category IDs if a category is selected.
  
  let categoryIds = [];
  if (categoryId) {
      categoryIds.push(categoryId);
      // Simple recursive fetch for descendants
      // Since this is an API call, we should probably optimize this or use a closure table/path enumeration in DB.
      // For now, let's fetch all categories and filter in memory to find descendants (assuming < 1000 categories).
      const allCats = await prisma.category.findMany({ select: { id: true, parentId: true } });
      
      let currentLevel = [categoryId];
      while(currentLevel.length > 0) {
          const nextLevel = allCats.filter(c => c.parentId && currentLevel.includes(c.parentId)).map(c => c.id);
          categoryIds.push(...nextLevel);
          currentLevel = nextLevel;
      }
  }

  // Get current date for validUntil filter - only show products that haven't expired
  const now = new Date();

  const whereClause: any = {
      // Filter out expired products - validUntil must be greater than current date
      validUntil: {
          gt: now
      },
      // Products must be sold by stores in the zone.
      // The Product table has a `storeId` (owner). 
      // AND we have `StoreProduct` (offers).
      // If we display unique products, we check if the product is available in ANY of the zone stores via StoreProduct?
      // Or if the product owner is in the zone?
      // Prompt says: "The will be another table called ZoneStores. We will display products only from the stores that match that zone to the user."
      // And "all products need to be linked to a store... make those changes to product table".
      // Let's assume we filter products where EITHER:
      // 1. The product owner (storeId) is in the zone (if direct selling)
      // 2. OR there is a StoreProduct entry for a store in the zone.
      
      // Let's go with: Show products that have at least one offer (StoreProduct) from a store in the zone.
      stores: {
          some: {
              storeId: { in: storeIds }
          }
      }
  };

  if (query) {
      whereClause.OR = [
          { name: { contains: query } }, // Case insensitivity handled by DB usually, or need mode:'insensitive' for Postgres (MySQL is usually CI)
          { description: { contains: query } }
      ];
  }

  if (categoryIds.length > 0) {
      whereClause.categoryId = { in: categoryIds };
  }

  const [products, total] = await Promise.all([
      prisma.product.findMany({
          where: whereClause,
          include: {
              category: true,
              store: true, // Owner
              stores: { // Offers
                  where: {
                      storeId: { in: storeIds }
                  },
                  include: {
                      store: true
                  }
              }
          },
          take: limit,
          skip: offset,
      }),
      prisma.product.count({ where: whereClause })
  ]);

  // Transform for frontend
  const result = products.map(p => {
      // Find lowest price in zone
      const prices = p.stores.map(s => Number(s.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      
      return {
          id: p.id,
          name: p.name,
          nameTranslations: p.nameTranslations || {},
          description: p.description,
          shortDescriptionTranslations: p.shortDescriptionTranslations || {},
          descriptionTranslations: p.descriptionTranslations || {},
          imageUrl: p.imageUrl,
          categoryTranslations: p.category.nameTranslations,
          ownerStoreName: p.store.name,
          storeId: p.storeId,
          minPrice: minPrice,
          offers: p.stores.map(s => ({
              storeId: s.storeId,
              storeName: s.store.name,
              price: Number(s.price),
              stock: s.stock,
              storeProductId: s.id
          }))
      };
  });

  return NextResponse.json({ products: result, total, page, totalPages: Math.ceil(total / limit) });
}
