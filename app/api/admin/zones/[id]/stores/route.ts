import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";
import { syncZoneMembership } from "@/lib/zones";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const { storeId } = await req.json();

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  await prisma.zonestore.upsert({
    where: {
      zoneId_storeId: {
        zoneId: id,
        storeId,
      },
    },
    update: {},
    create: {
      zoneId: id,
      storeId,
    },
  });

  await syncZoneMembership(id);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const { storeId } = await req.json();

  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  await prisma.zonestore.deleteMany({
    where: {
      zoneId: id,
      storeId,
    },
  });

  await syncZoneMembership(id);

  return NextResponse.json({ success: true });
}
