import api from "./api";

export async function getPublicReviews(params = {}) {
  const response = await api.get("/api/reviews", { params });
  return response.data;
}

export async function getHotelsByDistrict(districtName) {
  const response = await api.get("/api/reviews/hotels-by-district", {
    params: { districtName },
  });
  return response.data;
}

export async function getPublicProviderProfile(targetType, targetId) {
  const response = await api.get(`/api/reviews/profile/${targetType}/${targetId}`);
  return response.data;
}

export async function getMyBookingsForReview() {
  const response = await api.get("/api/reviews/bookings/my");
  return response.data;
}

export async function getMyReviews() {
  const response = await api.get("/api/reviews/my");
  return response.data;
}

export async function createReview(payload) {
  const response = await api.post("/api/reviews", payload);
  return response.data;
}

export async function updateReview(reviewId, payload) {
  const response = await api.put(`/api/reviews/${reviewId}`, payload);
  return response.data;
}

export async function deleteReview(reviewId) {
  const response = await api.delete(`/api/reviews/${reviewId}`);
  return response.data;
}
