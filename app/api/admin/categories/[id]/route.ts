import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const body = await req.json();
  const translations = normalizeTranslations(body.translations);

  const category = await prisma.category.update({
    where: { id },
    data: {
      nameTranslations: translations,
    },
  });

  return NextResponse.json(category);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  
  // Check if category exists first
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  
  await prisma.category.delete({
    where: { id },
  });
  
  return NextResponse.json({ success: true });
}
