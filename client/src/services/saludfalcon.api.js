import axios from "axios";

// Create an Axios instance for the external API
const externalApi = axios.create({
  baseURL: "https://saludfalcon.org/api",
  headers: {
    "Content-Type": "application/json",
    "X-APP-KEY": import.meta.env.VITE_APP_KEY,
  },
});
// Request interceptor
externalApi.interceptors.request.use(
  (config) => {
    // If the external API requires authentication
    const externalApiToken = localStorage.getItem("externalApiToken");
    if (externalApiToken) {
      config.headers.Authorization = `Bearer ${externalApiToken}`;
    }

    // Add any other request modifications needed for this specific API
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
externalApi.interceptors.response.use(
  (response) => {
    // Standardize the response format
    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  },
  (error) => {
    // Standardize error responses
    if (error.response) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "External API request failed";
      return Promise.reject({
        success: false,
        message,
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      return Promise.reject({
        success: false,
        message: "No response received from external API",
        status: 0,
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || "Error setting up external API request",
        status: 0,
      });
    }
  }
);


export default externalApi;
