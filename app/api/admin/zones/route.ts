import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";

export async function GET() {
  await requireAdminSession();
  const zones = await prisma.zone.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ zones });
}

export async function POST(req: Request) {
  await requireAdminSession();
  const body = await req.json();
  const translations = normalizeTranslations(body.translations || { en: body.name || "New Zone" });
  
  const zone = await prisma.zone.create({
    data: {
      name: translations.en || body.name?.trim() || "New Zone",
      nameTranslations: translations,
      coordinates: [],
    },
  });
  return NextResponse.json(zone, { status: 201 });
}
