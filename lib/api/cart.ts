/**
 * Cart API service - handles all cart-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "./client";
import type { CartResponse, CartItem, Product } from "./types";

interface AddToCartResponse {
  cartId: string;
  item: CartItem;
}

interface UpdateCartResponse {
  success: boolean;
}

interface RemoveFromCartResponse {
  success: boolean;
}

/**
 * Fetch cart data from the backend
 * If cartId is provided, fetches that specific cart
 * Otherwise creates/returns a new cart
 */
export async function fetchCart(cartId?: string | null): Promise<CartResponse> {
  return apiGet<CartResponse>("/api/cart", { cartId: cartId || undefined });
}

/**
 * Add a product to the cart
 */
export async function addToCart(
  productId: string,
  quantity: number = 1,
  cartId?: string | null
): Promise<AddToCartResponse> {
  return apiPost<AddToCartResponse>("/api/cart", {
    cartId,
    productId,
    quantity,
  });
}

/**
 * Update quantity of an item in the cart
 */
export async function updateCartItem(
  productId: string,
  quantity: number,
  cartId: string
): Promise<UpdateCartResponse> {
  return apiPut<UpdateCartResponse>("/api/cart", {
    cartId,
    productId,
    quantity,
  });
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(
  productId: string,
  cartId: string
): Promise<RemoveFromCartResponse> {
  return apiDelete<RemoveFromCartResponse>("/api/cart", {
    cartId,
    productId,
  });
}

/**
 * Parse cart response into structured location data
 */
export function parseCartLocation(data: CartResponse) {
  if (!data.latitude || !data.longitude || !data.address) {
    return null;
  }

  return {
    location: {
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    zone: data.zoneId ? { inZone: true, zoneId: data.zoneId } : null,
  };
}

/**
 * Parse cart items from response
 */
export function parseCartItems(data: CartResponse): CartItem[] {
  if (!data.items || !Array.isArray(data.items)) {
    return [];
  }
  return data.items.map((item) => ({
    product: item.product,
    quantity: item.quantity,
  }));
}

/**
 * Calculate cart totals with taxes
 */
export function calculateCartTotals(items: CartItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.minPrice * item.quantity,
    0
  );
  const gst = subtotal * 0.05; // 5% GST
  const qst = subtotal * 0.09975; // 9.975% QST
  const total = subtotal + gst + qst;

  return {
    subtotal,
    gst,
    qst,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Update local cart items after adding a product
 */
export function updateCartItemsAfterAdd(
  currentItems: CartItem[],
  product: Product,
  quantity: number
): CartItem[] {
  const existing = currentItems.find((item) => item.product.id === product.id);
  if (existing) {
    return currentItems.map((item) =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  }
  return [...currentItems, { product, quantity }];
}

/**
 * Update local cart items after quantity change
 */
export function updateCartItemQuantity(
  currentItems: CartItem[],
  productId: string,
  quantity: number
): CartItem[] {
  return currentItems.map((item) =>
    item.product.id === productId ? { ...item, quantity } : item
  );
}

/**
 * Remove item from local cart items
 */
export function removeCartItem(
  currentItems: CartItem[],
  productId: string
): CartItem[] {
  return currentItems.filter((item) => item.product.id !== productId);
}

