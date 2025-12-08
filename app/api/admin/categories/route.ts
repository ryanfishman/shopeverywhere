import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { normalizeTranslations } from "@/lib/i18n";

type CategoryNode = {
  id: string;
  parentId: string | null;
  nameTranslations: Record<string, string>;
  children: CategoryNode[];
};

const buildTree = (categories: CategoryNode[]) => {
  const map = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  map.forEach((cat) => {
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children.push(cat);
      } else {
        roots.push(cat);
      }
    } else {
      roots.push(cat);
    }
  });

  return roots;
};

export async function GET() {
  await requireAdminSession();
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
  });

  const nodes: CategoryNode[] = categories.map((cat) => ({
    id: cat.id,
    parentId: cat.parentId,
    nameTranslations: cat.nameTranslations as Record<string, string>,
    children: [],
  }));

  return NextResponse.json({ categories: buildTree(nodes) });
}

export async function POST(req: Request) {
  await requireAdminSession();
  const { parentId, translations } = await req.json();

  const payload = normalizeTranslations(translations) || {};

  const category = await prisma.category.create({
    data: {
      parentId: parentId || null,
      nameTranslations: payload,
    },
  });

  return NextResponse.json(category, { status: 201 });
}






