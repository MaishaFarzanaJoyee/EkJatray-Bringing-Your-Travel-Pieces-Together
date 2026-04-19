import api from "./api";

export async function searchTransportTickets(params = {}) {
  const response = await api.get("/api/transport/search", { params });
  return response.data;
}

export async function createTransportTicket(payload) {
  const response = await api.post("/api/transport", payload);
  return response.data;
}

export async function updateTransportTicket(ticketId, payload) {
  const response = await api.put(`/api/transport/${ticketId}`, payload);
  return response.data;
}

export async function deleteTransportTicket(ticketId) {
  const response = await api.delete(`/api/transport/${ticketId}`);
  return response.data;
}
