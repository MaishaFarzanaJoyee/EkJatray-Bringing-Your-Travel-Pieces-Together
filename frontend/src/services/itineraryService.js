import api from "./api";

const ITINERARY_CACHE_KEY = "ekjatraySavedItineraries";

function readItineraryCache() {
  try {
    return JSON.parse(localStorage.getItem(ITINERARY_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function cacheItinerary(itinerary) {
  if (!itinerary?.id) {
    return;
  }

  const cache = readItineraryCache();
  cache[itinerary.id] = itinerary;
  localStorage.setItem(ITINERARY_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedItinerary(itineraryId) {
  const cache = readItineraryCache();
  return cache[itineraryId] || null;
}

export async function checkoutTrip(payload) {
  const response = await api.post("/api/itineraries/checkout", payload);
  const itinerary = response.data?.itinerary || null;
  if (itinerary) {
    cacheItinerary(itinerary);
  }
  return response.data;
}

export async function getItinerary(itineraryId) {
  const response = await api.get(`/api/itineraries/${itineraryId}`);
  const itinerary = response.data?.itinerary || null;
  if (itinerary) {
    cacheItinerary(itinerary);
  }
  return response.data;
}
