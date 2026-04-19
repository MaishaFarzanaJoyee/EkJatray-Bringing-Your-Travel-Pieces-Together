import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const resolvedBaseURL = API_BASE_URL === "" ? undefined : API_BASE_URL;

const api = axios.create({
  baseURL: resolvedBaseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ekjatrayToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
