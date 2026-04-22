import api from "./api";

export async function getMyCart() {
  const response = await api.get("/api/cart-checkout/cart");
  return response.data;
}

export async function addTransportTicketToCart(payload) {
  const response = await api.post("/api/cart-checkout/cart/items/transport", payload);
  return response.data;
}

export async function updateCartItem(itemId, payload) {
  const response = await api.patch(`/api/cart-checkout/cart/items/${itemId}`, payload);
  return response.data;
}

export async function removeCartItem(itemId) {
  const response = await api.delete(`/api/cart-checkout/cart/items/${itemId}`);
  return response.data;
}

export async function clearMyCart() {
  const response = await api.delete("/api/cart-checkout/cart");
  return response.data;
}

export async function startCheckoutSession() {
  const response = await api.post("/api/cart-checkout/checkout/create-session");
  return response.data;
}

export async function getMyOrders() {
  const response = await api.get("/api/cart-checkout/orders");
  return response.data;
}

export async function getOrderById(orderId) {
  const response = await api.get(`/api/cart-checkout/orders/${orderId}`);
  return response.data;
}

export async function markOrderCompleted(orderId) {
  const response = await api.patch(`/api/cart-checkout/orders/${orderId}/complete`);
  return response.data;
}
