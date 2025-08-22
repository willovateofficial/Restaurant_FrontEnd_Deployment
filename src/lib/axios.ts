import axios from "axios";
import { baseUrl } from "../config";

export const axiosInstance = axios.create({
  baseURL: "https://restaurant-backend-deployment.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Safe interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error); // Return error to avoid hanging
  }
);
