import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin";

const PAGE_SIZE = 100;

export async function GET(req: Request) {
  await requireAdminSession();
  const { searchParams } = new URL(req.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const search = searchParams.get("search") || "";
  const addressQuery = searchParams.get("address") || "";

  const where: any = {};

  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ];
  }

  if (addressQuery) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { address: { contains: addressQuery } },
          { city: { contains: addressQuery } },
          { state: { contains: addressQuery } },
          { country: { contains: addressQuery } },
          { postalCode: { contains: addressQuery } },
        ],
      },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const payload = users.map((user) => {
    const orderCount = user.orders.length;
    const hasPendingOrder = user.orders.some(
      (order) => order.status !== "completed" && order.status !== "delivered"
    );

    const orders = user.orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        storeName: item.storeName,
        product: item.product
          ? {
              id: item.product.id,
              nameTranslations: item.product.nameTranslations,
              shortDescriptionTranslations: item.product.shortDescriptionTranslations,
              descriptionTranslations: item.product.descriptionTranslations,
              imageUrl: item.product.imageUrl,
            }
          : null,
      })),
    }));

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      address: user.address,
      city: user.city,
      state: user.state,
      country: user.country,
      postalCode: user.postalCode,
      orderCount,
      hasPendingOrder,
      orders,
    };
  });

  return NextResponse.json({
    users: payload,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}








