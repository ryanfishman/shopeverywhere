import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Construct DATABASE_URL from individual env vars if not present
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
}

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // Clear existing data (optional, but good for idempotent seed)
  // Be careful in prod!
  // await prisma.storeProduct.deleteMany();
  // await prisma.product.deleteMany();
  // await prisma.store.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.zone.deleteMany();

  // 1. Categories
  const makeTranslations = (en: string, fr: string, es: string) => ({
    en,
    fr,
    es,
  });

  const catElectronics = await prisma.category.create({
    data: { nameTranslations: makeTranslations('Electronics', 'Électronique', 'Electrónica') },
  });
  const catPhones = await prisma.category.create({
    data: { nameTranslations: makeTranslations('Phones', 'Téléphones', 'Teléfonos'), parentId: catElectronics.id },
  });
  const catLaptops = await prisma.category.create({
    data: { nameTranslations: makeTranslations('Laptops', 'Ordinateurs portables', 'Portátiles'), parentId: catElectronics.id },
  });
  
  const catHome = await prisma.category.create({
    data: { nameTranslations: makeTranslations('Home & Garden', 'Maison et jardin', 'Hogar y jardín') },
  });
  const catKitchen = await prisma.category.create({
    data: { nameTranslations: makeTranslations('Kitchen', 'Cuisine', 'Cocina'), parentId: catHome.id },
  });
  const catFurniture = await prisma.category.create({
    data: { nameTranslations: makeTranslations('Furniture', 'Meubles', 'Muebles'), parentId: catHome.id },
  });

  const categories = [catPhones, catLaptops, catKitchen, catFurniture];

  // 2. Zones (Montreal Area approx)
  const zoneDowntown = await prisma.zone.create({
    data: {
      name: 'Downtown Montreal',
      coordinates: [
        { lat: 45.490, lng: -73.590 },
        { lat: 45.520, lng: -73.590 },
        { lat: 45.520, lng: -73.550 },
        { lat: 45.490, lng: -73.550 }
      ]
    }
  });

  const zoneWestIsland = await prisma.zone.create({
      data: {
          name: 'West Island',
          coordinates: [
            { lat: 45.430, lng: -73.850 },
            { lat: 45.500, lng: -73.850 },
            { lat: 45.500, lng: -73.700 },
            { lat: 45.430, lng: -73.700 }
          ]
      }
  });

  // 3. Stores
  const stores = [];
  for (let i = 0; i < 10; i++) {
    const store = await prisma.store.create({
      data: {
        name: `Store ${i + 1}`,
        nameTranslations: makeTranslations(`Store ${i + 1}`, `Magasin ${i + 1}`, `Tienda ${i + 1}`),
        shortDescriptionTranslations: makeTranslations(
          "Neighborhood shop for daily needs",
          "Magasin de quartier pour les besoins quotidiens",
          "Tienda de barrio para las necesidades diarias"
        ),
        descriptionTranslations: makeTranslations(
          "We pride ourselves on carrying a curated selection of essentials.",
          "Nous sommes fiers de proposer une sélection soignée d'essentiels.",
          "Nos enorgullecemos de tener una selección curada de esenciales."
        ),
        description: `Best prices in town`,
        latitude: 45.5017 + (Math.random() - 0.5) * 0.1,
        longitude: -73.5673 + (Math.random() - 0.5) * 0.1,
        address: `${100 + i} Saint-Catherine St`,
        city: "Montreal",
        state: "QC",
        country: "Canada",
        postalCode: `H3B ${10 + i}`,
      }
    });
    stores.push(store);
  }

  // 4. Zone Stores
  // Assign random stores to zones
  for (const store of stores) {
      if (Math.random() > 0.5) {
          await prisma.zonestore.create({
              data: { zoneId: zoneDowntown.id, storeId: store.id }
          });
      }
      if (Math.random() > 0.5) {
          await prisma.zonestore.create({
              data: { zoneId: zoneWestIsland.id, storeId: store.id }
          });
      }
  }

  // 5. Products
  const products = [];
  for (let i = 0; i < 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const ownerStore = stores[Math.floor(Math.random() * stores.length)];
    
    const product = await prisma.product.create({
      data: {
        name: `Product ${i + 1}`,
        nameTranslations: makeTranslations(
          `Product ${i + 1}`,
          `Produit ${i + 1}`,
          `Producto ${i + 1}`
        ),
        shortDescriptionTranslations: makeTranslations(
          "Perfect for everyday use.",
          "Parfait pour une utilisation quotidienne.",
          "Perfecto para uso diario."
        ),
        descriptionTranslations: makeTranslations(
          `Amazing ${(category.nameTranslations as any)?.en ?? 'category'} item.`,
          `Incroyable article de ${(category.nameTranslations as any)?.fr ?? 'catégorie'}.`,
          `Increíble artículo de ${(category.nameTranslations as any)?.es ?? 'categoría'}.`
        ),
        description: `Amazing ${(category.nameTranslations as any)?.en ?? 'category'} item.`,
        categoryId: category.id,
        storeId: ownerStore.id,
        imageUrl: `https://picsum.photos/seed/${i + 1}/200/200`,
      }
    });
    products.push(product);
  }

  // 6. Offers (StoreProduct)
  for (const product of products) {
      // Each product available in 1-5 random stores
      const numOffers = Math.floor(Math.random() * 5) + 1;
      const shuffledStores = [...stores].sort(() => 0.5 - Math.random());
      
      for (let k = 0; k < numOffers; k++) {
          const store = shuffledStores[k];
          await prisma.storeproduct.create({
              data: {
                  storeId: store.id,
                  productId: product.id,
                  price: Math.floor(Math.random() * 100) + 10,
                  stock: Math.floor(Math.random() * 50)
              }
          });
      }
  }

  // User
  const hashedPassword = await hash('password123', 12);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Demo User',
      password: hashedPassword,
      latitude: 45.5017,
      longitude: -73.5673
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
