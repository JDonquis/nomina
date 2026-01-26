import axios from "axios";
import { API_URL } from "../config/env.js";

const API_BASE_URL = `${API_URL}/api/`;

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
  forgotPassword: (email) => api.post("/admin/forgot-password", { email }),
  resetPassword: (token, password) =>
    api.post("/admin/reset-password", { token, password }),

  // Nuevos métodos para activación de cuenta
  verifyInvitationToken: (token) =>
    api.get(`/admin/verify-invitation?token=${token}`),
  activateAccount: (token, password) =>
    api.post("/admin/activate-account", { token, password }),
  verifyResetToken: (token) => api.get(`/admin/verify-reset-token?token=${token}`),
  resetPassword: (token, password) =>
    api.post("/admin/reset-password", { token, password }),
};

// Users API endpoints
export const usersAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (userData) => api.put("/users/profile", userData),
  getAllUsers: () => api.get("/users"),
  createUser: (userData) => api.post("/users", userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const examinationTypesAPI = {
  getExaminationTypes: () => api.get("/examination-types"),
};

export const originsAPI = {
  getOrigins: () => api.get("/origins"),
};

export const examsAPI = {
  createExam: (examData) => api.post("/exams", examData),
  getExams: (params) => api.get("/exams", { params }),
  getExamById: (id) => api.get(`/exams/${id}`),
  updateExam: (id, examData) => api.put(`/exams/${id}`, examData),
  deleteExam: (id) => api.delete(`/exams/${id}`),
  validateExam: (id) => api.put("/exams/validate-exam", { id }),
  getChartData: (period, params) => {
    return api.get(`/exams/chart-data/${period}`, { params });
  },
};

// Public API for exam results (no authentication required)
export const examResultsAPI = {
  getByToken: (token) => axios.get(`${API_BASE_URL}/results/${token}`),
  downloadPDF: (token) =>
    axios.get(`${API_BASE_URL}/results/${token}/pdf`, {
      responseType: "blob",
    }),
  generateToken: (data) => api.post("/exams/generate-results-token", data),
  sendExamResults: (data) => api.post("/exams/send-results", data),
  updateMessageStatus: (id, status) =>
    api.put(`/exams/update-message-status/${id}`, { status }),
};

// Export the api instance for direct use if needed
export default api;
