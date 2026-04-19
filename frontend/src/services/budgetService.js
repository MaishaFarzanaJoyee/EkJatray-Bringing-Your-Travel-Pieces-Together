import api from "./api";

export async function createBudget(payload) {
  const response = await api.post("/api/budget/create", payload);
  return response.data;
}

export async function addBudgetExpense(payload) {
  const response = await api.post("/api/budget/expense", payload);
  return response.data;
}

export async function getBudgetSummary(budgetId) {
  const response = await api.get(`/api/budget/summary/${budgetId}`);
  return response.data;
}

export async function addBudgetCollaborator(payload) {
  const response = await api.post("/api/budget/collaborator", payload);
  return response.data;
}

export async function getBudgetHistory() {
  const response = await api.get("/api/budget/history");
  return response.data;
}

export async function deleteBudgetById(budgetId) {
  const response = await api.delete(`/api/budget/${budgetId}`);
  return response.data;
}
