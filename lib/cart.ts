import { prisma } from "@/lib/prisma";

export const removeItemsOutsideZone = async (cartId: string, allowedStoreIds: string[]) => {
  if (!allowedStoreIds || allowedStoreIds.length === 0) {
    await prisma.shoppingcartitem.deleteMany({ where: { cartId } });
    return;
  }

  await prisma.shoppingcartitem.deleteMany({
    where: {
      cartId,
      storeProduct: {
        storeId: { notIn: allowedStoreIds },
      },
    },
  });
};



