
import axios from "axios";
import { API_URL } from "../config/env.js";

// Create a variable to hold the logout function
let logoutCallback = null;

// Export a function to set the logout callback
export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

const API_BASE_URL = `${API_URL}/api`;

// Create an Axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - runs before each request
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("tokenNomina");

    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - runs after each response
api.interceptors.response.use(
  (response) => {
    // Return just the data part of the response
    return response.data;
  },
  (error) => {
    // Handle errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const message = error.response.data.message || "An error occurred";
      if (message == "Unauthenticated.") {
        // Call the logout callback if it exists
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject("Unauthenticated");
      }
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // The request was made but no response was received
      return Promise.reject(new Error("No response from server"));
    } else {
      // Something happened in setting up the request that triggered an Error
      return Promise.reject(error);
    }
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post("/login", credentials),
  logout: () => api.post("/admin/logout"),
  forgotPassword: (email) => api.post("/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/admin/reset-password", { token, password }),

  // Nuevos métodos para activación de cuenta
  verifyInvitationToken: (token) =>
    api.post(`/verify-invitation`,{token}),
  activateAccount: (token, password) =>
    api.post("/activate-account", { token, password }),
  verifyResetToken: (token) =>
    api.get(`/verify-reset-token?token=${token}`),
  resetPassword: (token, password) =>
    api.post("/reset-password", { token, password }),
};

// Users API endpoints
export const usersAPI = {
  getProfile: () => api.get("/admin/users/profile"),
  updateProfile: (userData) => api.put("/admin/users/profile", userData),
  getAllUsers: (params) => api.get("/admin/users", { params }),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const payrollAPI = {
  getWorkers: (params) => api.get("/admin/pay-sheets", { params }),
  createWorker: (workerData) => api.post("/admin/pay-sheets", workerData, { headers: { "Content-Type": "multipart/form-data" } }),
  updateWorker: (id, workerData) =>
    api.put(`/admin/pay-sheets/${id}`, workerData),
  updatePhoto: (id, photo) => api.post(`/admin/pay-sheets/photo/${id}`, photo, { headers: { "Content-Type": "multipart/form-data" } }),
  deleteWorker: (id) => api.delete(`/admin/pay-sheets/${id}`),
  importExcel: (file) => api.post("/admin/pay-sheets/sheet", file, { headers: { "Content-Type": "multipart/form-data" } }),
  getHistory: (id) => api.get(`/admin/pay-sheets/${id}`),
};

export const asicAPI = {
  getASIC: () => api.get("/admin/administrative-locations"),
};

export const censusAPI = {
  getCensus: (params) => api.get("/admin/censuses", { params }),
  createCensus: (censusData) => api.post("/admin/censuses", censusData),
  deleteCensus: (id) => api.delete(`/admin/censuses/${id}`),
}

export const activitiesAPI = {
  getActivities: (params) => api.get("/admin/activities", { params }),
}

export const typePaySheetsAPI = {
  getPaySheets: () => api.get("/admin/type-pay-sheets"),
}
// Export the api instance for direct use if needed
export default api;
