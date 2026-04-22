import api from "./api";

export async function searchSafetyContacts(params = {}) {
  const response = await api.get("/api/safety-contacts/search", { params });
  return response.data;
}

export async function createSafetyContact(payload) {
  const response = await api.post("/api/safety-contacts", payload);
  return response.data;
}

export async function updateSafetyContact(contactId, payload) {
  const response = await api.put(`/api/safety-contacts/${contactId}`, payload);
  return response.data;
}

export async function deleteSafetyContact(contactId) {
  const response = await api.delete(`/api/safety-contacts/${contactId}`);
  return response.data;
}
