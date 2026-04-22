import axios from "axios";
import { API_URL } from "../config/env.js";

let logoutCallback = null;

export const setLogoutCallback = (callback) => {
  logoutCallback = callback;
};

const API_BASE_URL = `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tokenNomina");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const message = error.response.data.message || "An error occurred";
      if (message == "Unauthenticated.") {
        if (logoutCallback) {
          logoutCallback();
        }
        return Promise.reject("Unauthenticated");
      }
      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error("No response from server"));
    } else {
      return Promise.reject(error);
    }
  },
);

export const authAPI = {
  login: (credentials) => api.post("/login", credentials),
  logout: () => api.post("/admin/logout"),
  forgotPassword: (email) => api.post("/forgot-password", { email }),
  verifyInvitationToken: (token) => api.post(`/verify-invitation`, { token }),
  activateAccount: (token, password) => api.post("/activate-account", { token, password }),
  verifyResetToken: (token) => api.get(`/verify-reset-token?token=${token}`),
  resetPassword: (token, password) => api.post("/reset-password", { token, password }),
};

export const usersAPI = {
  getProfile: () => api.get("/admin/users/profile"),
  updateProfile: (userData) => api.put("/admin/users/profile", userData),
  getAllUsers: (params) => api.get("/admin/users", { params }),
  createUser: (userData) => api.post("/admin/users", userData),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const liveProofAPI = {
  getPersonnel: (params) => api.get("/admin/personnels/life_proof", { params }),
  createPersonnel: (workerData) =>
    api.post("/admin/personnels/life_proof", workerData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePersonnel: (id, workerData) =>
    api.put(`/admin/personnels/life_proof/${id}`, workerData),
  updatePersonnelPhoto: (id, photo) =>
    api.post(`/admin/personnels/life_proof/photo/${id}`, photo, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePersonnel: (id) => api.delete(`/admin/personnels/life_proof/${id}`),
  importExcel: (file) =>
    api.post("/admin/personnels/life_proof/sheet", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDetailById: (id) => api.get(`/admin/personnels/life_proof/${id}`),
  getReport: () => api.get("/admin/personnels/life_proof/generate_report"),
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

export const nominaNamesAPI = {
  get: () => api.get("/admin/type-personnels"),
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
  createDependency: (dependencyData) => api.post("/admin/dependencies", dependencyData),
  updateDependency: (id, dependencyData) => api.put(`/admin/dependencies/${id}`, dependencyData),
  deleteDependency: (id) => api.delete(`/admin/dependencies/${id}`),
};

export const administrativeUnitsAPI = {
  getUnits: (params) => api.get("/admin/administrative-units", { params }),
  createUnit: (unitData) => api.post("/admin/administrative-units", unitData),
  updateUnit: (id, unitData) => api.put(`/admin/administrative-units/${id}`, unitData),
  deleteUnit: (id) => api.delete(`/admin/administrative-units/${id}`),
};

export const departmentAPI = {
  getDepartments: (params) => api.get("/admin/departments", { params }),
  createDepartment: (departmentData) => api.post("/admin/departments", departmentData),
  updateDepartment: (id, departmentData) => api.put(`/admin/departments/${id}`, departmentData),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
};

export const servicesAPI = {
  getServices: (params) => api.get("/admin/services", { params }),
  createService: (serviceData) => api.post("/admin/services", serviceData),
  updateService: (id, serviceData) => api.put(`/admin/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
};

export const syncAPI = {
  lastSync: () => api.get("/admin/sync/last"),
  history: () => api.get("/admin/sync/history"),
  export: () => api.get("/admin/sync/export", { responseType: "blob" }),
  import: (file) =>
    api.post("/admin/sync/import", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  resolve: (data) => api.post("/admin/sync/resolve", data),
};

export const activePersonnelAPI = {
  getPersonnel: (params) => api.get("/admin/personnels/active", { params }),
  getPersonnelById: (id) => api.get(`/admin/personnels/active/${id}`),
  createPersonnel: (personnelData) =>
    api.post("/admin/personnels/active", personnelData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePersonnel: (id, personnelData) =>
    api.put(`/admin/personnels/active/${id}`, personnelData),
  updatePersonnelPhoto: (id, photo) =>
    api.post(`/admin/personnels/active/photo/${id}`, photo, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePersonnel: (id) => api.delete(`/admin/personnels/active/${id}`),
  importExcel: (file) => api.post("/admin/personnels/active/import-excel", file, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  getDetailById: (id) => api.get(`/admin/personnels/active/${id}`),
};

export default api;
