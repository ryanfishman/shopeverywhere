import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET: Fetch cart items
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const cartId = searchParams.get("cartId");
  const userId = session?.user ? (session.user as any).id : null;

  let cart = null;
  let user = null;

  // Get user's saved address if logged in
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        address: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        zoneId: true,
      },
    });
  }

  // Valid statuses for active carts (not delivered or expired)
  const activeStatuses = ["shopping", "pending_payment", "paid"];

  if (userId) {
    // Logged in user - find their active cart (prioritize shopping, then pending_payment, then paid)
    cart = await prisma.shoppingcart.findFirst({
      where: {
        userId,
        status: { in: activeStatuses },
      },
      orderBy: {
        // Prioritize: shopping first, then by most recent
        createdAt: "desc",
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                store: true,
              },
            },
          },
        },
      },
    });
  } else if (cartId) {
    // Anonymous user with existing cart
    cart = await prisma.shoppingcart.findFirst({
      where: {
        id: cartId,
        status: { in: activeStatuses },
        userId: null,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                store: true,
              },
            },
          },
        },
      },
    });
  }

  if (!cart) {
    // Create new cart - populate with user's address if available
    cart = await prisma.shoppingcart.create({
      data: {
        userId,
        status: "shopping",
        // Populate from user's saved address if available
        address: user?.address || null,
        city: user?.city || null,
        state: user?.state || null,
        country: user?.country || null,
        postalCode: user?.postalCode || null,
        latitude: user?.latitude || null,
        longitude: user?.longitude || null,
        zoneId: user?.zoneId || null,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                store: true,
              },
            },
          },
        },
      },
    });
  } else if (userId && user && !cart.address && user.address) {
    // Cart exists but has no address - sync from user profile
    cart = await prisma.shoppingcart.update({
      where: { id: cart.id },
      data: {
        address: user.address,
        city: user.city,
        state: user.state,
        country: user.country,
        postalCode: user.postalCode,
        latitude: user.latitude,
        longitude: user.longitude,
        zoneId: user.zoneId,
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                store: true,
              },
            },
          },
        },
      },
    });
  }

  // Transform items for frontend
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      imageUrl: item.product.imageUrl,
      minPrice: Number(item.price),
      ownerStoreName: item.product.store?.name || "Unknown Store",
      storeId: item.product.storeId,
      categoryTranslations: item.product.category?.nameTranslations || {},
    },
  }));

  return NextResponse.json({
    cartId: cart.id,
    items,
    address: cart.address,
    city: cart.city,
    state: cart.state,
    country: cart.country,
    postalCode: cart.postalCode,
    latitude: cart.latitude,
    longitude: cart.longitude,
    zoneId: cart.zoneId,
  });
}

// POST: Add item to cart
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { cartId, productId, quantity = 1 } = body;

  // Find or create cart
  let cart = null;

  if (session?.user) {
    cart = await prisma.shoppingcart.findFirst({
      where: {
        userId: (session.user as any).id,
        status: "shopping",
      },
    });
  } else if (cartId) {
    cart = await prisma.shoppingcart.findFirst({
      where: {
        id: cartId,
        status: "shopping",
      },
    });
  }

  if (!cart) {
    cart = await prisma.shoppingcart.create({
      data: {
        userId: session?.user ? (session.user as any).id : null,
        status: "shopping",
      },
    });
  }

  // Get product and price
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      stores: {
        take: 1,
        orderBy: { price: "asc" },
      },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Validate that product hasn't expired (validUntil must be greater than current date)
  const now = new Date();
  if (product.validUntil && product.validUntil <= now) {
    return NextResponse.json({ error: "This product is no longer available" }, { status: 400 });
  }

  const price = product.stores[0]?.price || 0;
  const storeProductId = product.stores[0]?.id || "";

  // Check if item already in cart
  const existingItem = await prisma.shoppingcartitem.findFirst({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.shoppingcartitem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Add new item
    await prisma.shoppingcartitem.create({
      data: {
        cartId: cart.id,
        productId,
        storeProductId,
        quantity,
        price,
      },
    });
  }

  return NextResponse.json({ success: true, cartId: cart.id });
}

// PUT: Update item quantity
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  const body = await req.json();
  const { cartId, productId, quantity } = body;

  // Find cart
  let cart = null;

  if (session?.user) {
    cart = await prisma.shoppingcart.findFirst({
      where: {
        userId: (session.user as any).id,
        status: "shopping",
      },
    });
  } else if (cartId) {
    cart = await prisma.shoppingcart.findFirst({
      where: {
        id: cartId,
        status: "shopping",
      },
    });
  }

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  // Find item
  const item = await prisma.shoppingcartitem.findFirst({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (quantity <= 0) {
    // Remove item
    await prisma.shoppingcartitem.delete({
      where: { id: item.id },
    });
  } else {
    // Update quantity
    await prisma.shoppingcartitem.update({
      where: { id: item.id },
      data: { quantity },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Remove item from cart
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);
  const cartId = searchParams.get("cartId");
  const productId = searchParams.get("productId");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  // Find cart
  let cart = null;

  if (session?.user) {
    cart = await prisma.shoppingcart.findFirst({
      where: {
        userId: (session.user as any).id,
        status: "shopping",
      },
    });
  } else if (cartId) {
    cart = await prisma.shoppingcart.findFirst({
      where: {
        id: cartId,
        status: "shopping",
      },
    });
  }

  if (!cart) {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }

  // Delete item
  await prisma.shoppingcartitem.deleteMany({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  return NextResponse.json({ success: true });
}
