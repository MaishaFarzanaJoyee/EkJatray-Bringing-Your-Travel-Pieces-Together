import api from "./api";

export async function searchLocalDiscoveryItems(params = {}) {
  const response = await api.get("/api/local-discovery/search", { params });
  return response.data;
}

export async function createLocalDiscoveryItem(payload) {
  const response = await api.post("/api/local-discovery", payload);
  return response.data;
}

export async function updateLocalDiscoveryItem(itemId, payload) {
  const response = await api.put(`/api/local-discovery/${itemId}`, payload);
  return response.data;
}

export async function deleteLocalDiscoveryItem(itemId) {
  const response = await api.delete(`/api/local-discovery/${itemId}`);
  return response.data;
}
