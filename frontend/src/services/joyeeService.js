import api from "./api";

const OPEN_WEATHER_API_KEY = "c8369f80f1653814c71baaeedefea0d9";

export async function getRecommendations(budget, tags) {
  const response = await api.get("/recommendations", {
    params: { budget, tags },
  });
  return response.data;
}

export async function searchAccommodations(location) {
  const response = await api.get("/booking/accommodations", {
    params: { location },
  });
  return response.data;
}

export async function searchWellnessCenters(location) {
  const response = await api.get("/booking/wellness", {
    params: { location },
  });
  return response.data;
}

export async function bookLodging(hotelId) {
  const response = await api.post("/booking/plan/book-lodging", { hotelId });
  return response.data;
}

export async function bookWellness(wellnessId) {
  const response = await api.post("/booking/plan/book-wellness", { wellnessId });
  return response.data;
}

export async function getUnifiedItinerary() {
  const response = await api.get("/booking/plan/unified-itinerary");
  return response.data;
}

export async function deleteLodging(id) {
  const response = await api.delete(`/booking/plan/lodging/${id}`);
  return response.data;
}

export async function getNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}

export async function markNotificationAsRead(id) {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
}

export async function fetchWeatherData(location) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
  );
  return response.json();
}
