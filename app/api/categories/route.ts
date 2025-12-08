import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true,
          },
        },
      },
      where: {
        parentId: null,
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load categories", error);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}





