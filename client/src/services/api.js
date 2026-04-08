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
  },
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
  },
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post("/login", credentials),
  logout: () => api.post("/admin/logout"),
  forgotPassword: (email) => api.post("/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/admin/reset-password", { token, password }),

  // Nuevos métodos para activación de cuenta
  verifyInvitationToken: (token) => api.post(`/verify-invitation`, { token }),
  activateAccount: (token, password) =>
    api.post("/activate-account", { token, password }),
  verifyResetToken: (token) => api.get(`/verify-reset-token?token=${token}`),
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
  createWorker: (workerData) =>
    api.post("/admin/pay-sheets", workerData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateWorker: (id, workerData) =>
    api.put(`/admin/pay-sheets/${id}`, workerData),
  updatePhoto: (id, photo) =>
    api.post(`/admin/pay-sheets/photo/${id}`, photo, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteWorker: (id) => api.delete(`/admin/pay-sheets/${id}`),
  importExcel: (file) =>
    api.post("/admin/pay-sheets/sheet", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getHistory: (id) => api.get(`/admin/pay-sheets/${id}`),
  getReport: () => api.get("/admin/pay-sheets/generate/report"),
};

export const asicAPI = {
  getASIC: () => api.get("/admin/administrative-locations"),
};

export const censusAPI = {
  getCensus: (params) => api.get("/admin/censuses", { params }),
  createCensus: (censusData) => api.post("/admin/censuses", censusData),
  deleteCensus: (id) => api.delete(`/admin/censuses/${id}`),
  exportCensus: () => api.get("/admin/censuses/export"),
  importCensus: (data) => api.post("/admin/censuses/import", data),
};

export const activitiesAPI = {
  getActivities: (params) => api.get("/admin/activities", { params }),
};

export const typePaySheetsAPI = {
  getPaySheets: () => api.get("/admin/type-pay-sheets"),
};

export const ASICAPI = {
  getASIC: () => api.get("/admin/asics"),
  createASIC: (asicData) => api.post("/admin/asics", asicData),
  getASICRelations: (id) => api.get(`/admin/asics/${id}`),
  updateASIC: (id, asicData) => api.put(`/admin/asics/${id}`, asicData),
  deleteASIC: (id) => api.delete(`/admin/asics/${id}`),
};

export const dependenciesAPI = {
  getDependencies: (params) => api.get("/admin/dependencies", { params }),
  createDependency: (dependencyData) =>
    api.post("/admin/dependencies", dependencyData),
  updateDependency: (id, dependencyData) =>
    api.put(`/admin/dependencies/${id}`, dependencyData),
  deleteDependency: (id) => api.delete(`/admin/dependencies/${id}`),
};

export const administrativeUnitsAPI = {
  getUnits: (params) => api.get("/admin/administrative-units", { params }),
  createUnit: (unitData) => api.post("/admin/administrative-units", unitData),
  updateUnit: (id, unitData) =>
    api.put(`/admin/administrative-units/${id}`, unitData),
  deleteUnit: (id) => api.delete(`/admin/administrative-units/${id}`),
};

export const departmentAPI = {
  getDepartments: (params) => api.get("/admin/departments", { params }),
  createDepartment: (departmentData) =>
    api.post("/admin/departments", departmentData),
  updateDepartment: (id, departmentData) =>
    api.put(`/admin/departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
};

export const servicesAPI = {
  getServices: (params) => api.get("/admin/services", { params }),
  createService: (serviceData) => api.post("/admin/services", serviceData),
  updateService: (id, serviceData) =>
    api.put(`/admin/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
};

export const activePersonnelAPI = {
  getPersonnel: (params) => api.get("/admin/active-personnel", { params }),
  getPersonnelById: (id) => api.get(`/admin/active-personnel/${id}`),
  createPersonnel: (personnelData) =>
    api.post("/admin/active-personnel", personnelData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updatePersonnel: (id, personnelData) =>
    api.put(`/admin/active-personnel/${id}`, personnelData),
  updatePersonnelPhoto: (id, photo) =>
    api.post(`/admin/active-personnel/photos/${id}`, photo, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePersonnel: (id) => api.delete(`/admin/active-personnel/${id}`),
};

// Export the api instance for direct use if needed
export default api;
