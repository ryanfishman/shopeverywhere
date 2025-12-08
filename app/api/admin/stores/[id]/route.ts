import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";
import { generateStoreImageKey, uploadToSpaces } from "@/lib/upload";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const store = await prisma.store.findUnique({
    where: { id },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const products = await prisma.product.findMany({
    where: { storeId: id },
    include: {
      category: true,
      stores: {
        where: { storeId: id },
        select: { price: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Transform products to include price at top level
  const productsWithPrice = products.map((p) => ({
    id: p.id,
    categoryId: p.categoryId,
    storeId: p.storeId,
    nameTranslations: p.nameTranslations,
    shortDescriptionTranslations: p.shortDescriptionTranslations,
    descriptionTranslations: p.descriptionTranslations,
    imageUrl: p.imageUrl,
    price: p.stores[0]?.price ? Number(p.stores[0].price) : 0,
  }));

  return NextResponse.json({ store, products: productsWithPrice });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  
  const contentType = req.headers.get("content-type") || "";
  
  let translations;
  let shortDescription;
  let longDescription;
  let latitude;
  let longitude;
  let address;
  let city;
  let state;
  let country;
  let postalCode;
  let imageUrl: string | undefined | null;

  if (contentType.includes("multipart/form-data")) {
    // Handle FormData with potential file upload
    const formData = await req.formData();
    
    translations = normalizeTranslations(JSON.parse(formData.get("translations")?.toString() || "{}"));
    shortDescription = normalizeTranslations(JSON.parse(formData.get("shortDescription")?.toString() || "{}"));
    longDescription = normalizeTranslations(JSON.parse(formData.get("longDescription")?.toString() || "{}"));
    latitude = parseFloat(formData.get("latitude")?.toString() || "0");
    longitude = parseFloat(formData.get("longitude")?.toString() || "0");
    address = formData.get("address")?.toString() || null;
    city = formData.get("city")?.toString() || null;
    state = formData.get("state")?.toString() || null;
    country = formData.get("country")?.toString() || null;
    postalCode = formData.get("postalCode")?.toString() || null;
    
    // Handle image upload
    const file = formData.get("image");
    const existingImageUrl = formData.get("imageUrl")?.toString();
    const removeImage = formData.get("removeImage")?.toString() === "true";
    
    if (removeImage) {
      imageUrl = null;
    } else if (file && file instanceof File && file.size > 0) {
      const key = generateStoreImageKey(file.name);
      const upload = await uploadToSpaces(key, file);
      imageUrl = upload.url;
    } else if (existingImageUrl) {
      imageUrl = existingImageUrl;
    }
  } else {
    // Handle JSON body
    const body = await req.json();
    translations = normalizeTranslations(body.translations);
    shortDescription = normalizeTranslations(body.shortDescription);
    longDescription = normalizeTranslations(body.longDescription);
    latitude = body.latitude ?? 0;
    longitude = body.longitude ?? 0;
    address = body.address || null;
    city = body.city || null;
    state = body.state || null;
    country = body.country || null;
    postalCode = body.postalCode || null;
    imageUrl = body.imageUrl;
  }

  const updateData: Record<string, unknown> = {
    name: translations.en || "Store",
    nameTranslations: translations,
    shortDescriptionTranslations: shortDescription,
    descriptionTranslations: longDescription,
    latitude,
    longitude,
    address,
    city,
    state,
    country,
    postalCode,
  };

  // Only update imageUrl if it was explicitly set
  if (imageUrl !== undefined) {
    updateData.imageUrl = imageUrl;
  }

  const store = await prisma.store.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(store);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  
  // Check if store exists first
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }
  
  await prisma.storeproduct.deleteMany({ where: { storeId: id } });
  await prisma.zonestore.deleteMany({ where: { storeId: id } });
  await prisma.store.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}
