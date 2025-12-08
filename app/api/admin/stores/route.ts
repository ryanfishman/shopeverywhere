import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";

export async function GET(req: Request) {
  await requireAdminSession();
  const { search } = Object.fromEntries(new URL(req.url).searchParams);

  const stores = await prisma.store.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            {
              nameTranslations: {
                path: ["en"],
                string_contains: search,
              },
            },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    include: {
      zonestores: true,
      products: {
        select: { productId: true },
      },
    },
  });

  return NextResponse.json({ stores });
}

export async function POST(req: Request) {
  await requireAdminSession();
  const body = await req.json();
  const translations = normalizeTranslations(body.translations);

  const store = await prisma.store.create({
    data: {
      name: translations.en || "Unnamed Store",
      nameTranslations: translations,
      shortDescriptionTranslations: body.shortDescription
        ? normalizeTranslations(body.shortDescription)
        : {},
      descriptionTranslations: body.longDescription
        ? normalizeTranslations(body.longDescription)
        : {},
      latitude: body.latitude ?? 0,
      longitude: body.longitude ?? 0,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      postalCode: body.postalCode || null,
    },
  });

  return NextResponse.json(store, { status: 201 });
}
