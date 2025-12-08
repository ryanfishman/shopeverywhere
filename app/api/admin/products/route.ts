import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";
import { generateObjectKey, uploadToSpaces } from "@/lib/upload";

export async function POST(req: Request) {
  await requireAdminSession();
  const formData = await req.formData();

  const storeId = formData.get("storeId")?.toString();
  const categoryId = formData.get("categoryId")?.toString();
  const price = parseFloat(formData.get("price")?.toString() || "0");

  if (!storeId || !categoryId) {
    return NextResponse.json({ error: "storeId and categoryId are required" }, { status: 400 });
  }

  const translations = normalizeTranslations(JSON.parse(formData.get("nameTranslations")?.toString() || "{}"));
  const shortDesc = normalizeTranslations(JSON.parse(formData.get("shortDescription")?.toString() || "{}"));
  const longDesc = normalizeTranslations(JSON.parse(formData.get("longDescription")?.toString() || "{}"));

  let imageUrl = formData.get("imageUrl")?.toString() || "";
  const file = formData.get("file");

  if (file && file instanceof File) {
    const key = generateObjectKey("products", file.name);
    const upload = await uploadToSpaces(key, file);
    imageUrl = upload.url;
  }

  const product = await prisma.product.create({
    data: {
      name: translations.en || "Product",
      nameTranslations: translations,
      shortDescriptionTranslations: shortDesc,
      descriptionTranslations: longDesc,
      categoryId,
      storeId,
      imageUrl,
    },
  });

  // Create storeproduct entry with price
  await prisma.storeproduct.create({
    data: {
      storeId,
      productId: product.id,
      price,
      stock: 0,
    },
  });

  return NextResponse.json({ ...product, price }, { status: 201 });
}

