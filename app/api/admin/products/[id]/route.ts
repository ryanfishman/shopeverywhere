import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";
import { generateObjectKey, uploadToSpaces } from "@/lib/upload";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const formData = await req.formData();

  const translations = normalizeTranslations(JSON.parse(formData.get("nameTranslations")?.toString() || "{}"));
  const shortDesc = normalizeTranslations(JSON.parse(formData.get("shortDescription")?.toString() || "{}"));
  const longDesc = normalizeTranslations(JSON.parse(formData.get("longDescription")?.toString() || "{}"));
  const categoryId = formData.get("categoryId")?.toString();
  const storeId = formData.get("storeId")?.toString();
  const price = parseFloat(formData.get("price")?.toString() || "0");

  let imageUrl = formData.get("imageUrl")?.toString() || "";
  const file = formData.get("file");

  if (file && file instanceof File) {
    const key = generateObjectKey("products", file.name);
    const upload = await uploadToSpaces(key, file);
    imageUrl = upload.url;
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      name: translations.en || "Product",
      nameTranslations: translations,
      shortDescriptionTranslations: shortDesc,
      descriptionTranslations: longDesc,
      categoryId: categoryId || undefined,
      imageUrl,
    },
  });

  // Update or create storeproduct entry with price
  if (storeId) {
    await prisma.storeproduct.upsert({
      where: {
        storeId_productId: {
          storeId,
          productId: id,
        },
      },
      update: {
        price,
      },
      create: {
        storeId,
        productId: id,
        price,
        stock: 0,
      },
    });
  }

  return NextResponse.json({ ...product, price });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  
  // Check if product exists first
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  
  await prisma.storeproduct.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  
  return NextResponse.json({ success: true });
}
