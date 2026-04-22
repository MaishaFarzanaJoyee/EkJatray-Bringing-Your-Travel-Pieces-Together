import api from "./api";

export async function getAdminAnalytics() {
  const response = await api.get("/api/admin/analytics");
  return response.data;
}

export async function getAdminUsers() {
  const response = await api.get("/api/admin/users");
  return response.data;
}

export async function updateUserModeration(userId, payload) {
  const response = await api.put(`/api/admin/users/${userId}/moderation`, payload);
  return response.data;
}

export async function getAdminReviews() {
  const response = await api.get("/api/admin/reviews");
  return response.data;
}

export async function deleteAdminReview(reviewId) {
  const response = await api.delete(`/api/admin/reviews/${reviewId}`);
  return response.data;
}

export async function getAdminDestinations() {
  const response = await api.get("/api/admin/destinations");
  return response.data;
}

export async function createAdminDestination(payload) {
  const response = await api.post("/api/admin/destinations", payload);
  return response.data;
}

export async function updateAdminDestination(destinationId, payload) {
  const response = await api.put(`/api/admin/destinations/${destinationId}`, payload);
  return response.data;
}

export async function deleteAdminDestination(destinationId) {
  const response = await api.delete(`/api/admin/destinations/${destinationId}`);
  return response.data;
}
