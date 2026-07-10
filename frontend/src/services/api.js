import axios from "axios";

// Use environment variable for API URL, fallback to relative path for production
const API_URL = import.meta.env.VITE_API_URL || "";
const FULL_API_URL = API_URL ? `${API_URL}/api` : "/api";

console.log("[API] Using API URL:", FULL_API_URL);

const api = axios.create({
  baseURL: FULL_API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  try {
    const userStr = sessionStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch (err) {
    console.error("Auth interception failed:", err);
  }
  return config;
});

// Handle 401 responses (Auto Logout)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear and redirect if we are not already on the login page
      if (!window.location.pathname.includes("/login")) {
        sessionStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export const authService = {
  register: (userData) => api.post("/auth/register", userData),
  login: (userData) => api.post("/auth/login", userData),
  getMe: () => api.get("/auth/me"),
  updateProfile: (userData) => api.put("/auth/profile", userData),
};

export const chatService = {
  getChats: () => api.get("/chats"),
  getChatById: (id) => api.get(`/chats/${id}`),
  sendMessage: (message, chatId, useSearch = false, files = []) => {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("message", message);
      if (chatId) formData.append("chatId", chatId);
      formData.append("useSearch", useSearch);

      // Append all files
      files.forEach((file) => {
        formData.append("files", file);
      });

      return api.post("/chats", formData);
    } else {
      return api.post("/chats", { message, chatId, useSearch });
    }
  },
  updateChat: (id, title) => api.put(`/chats/${id}`, { title }),
  deleteChat: (id) => api.delete(`/chats/${id}`),
  clearChats: () => api.delete("/chats"),
};

export const privacyService = {
  toggleEncryption: () => api.post("/privacy/encryption/toggle"),
  exportData: () => api.get("/privacy/data/export"),
  deleteAccount: () => api.post("/privacy/data/delete"),
  updateRetention: (days) => api.put("/privacy/retention-policy", { days }),
  updatePassword: (currentPassword, newPassword) =>
    api.put("/privacy/password/update", { currentPassword, newPassword }),
};

export const twoFactorService = {
  // Enable/Disable 2FA
  enable2FA: () => api.post("/2fa/enable"),
  disable2FA: (password) => api.post("/2fa/disable", { password }),

  // OTP Operations
  sendOTP: (email) => api.post("/2fa/send-otp", { email }),
  verifyOTP: (email, otp, trustDevice = false) =>
    api.post("/2fa/verify-otp", { email, otp, trustDevice }),
  verifyBackupCode: (email, backupCode) =>
    api.post("/2fa/verify-backup", { email, backupCode }),

  // Backup Codes
  regenerateBackupCodes: (password) =>
    api.post("/2fa/backup-codes/regenerate", { password }),

  // Status and Devices
  getStatus: () => api.get("/2fa/status"),
  checkDevice: (email, deviceId) =>
    api.post("/2fa/check-device", { email, deviceId }),
  removeTrustedDevice: (deviceId) =>
    api.delete(`/2fa/trusted-device/${deviceId}`),
};

export const settingsService = {
  getSettings: () => api.get("/settings"),
  updateSettings: (settings) => api.put("/settings", settings),
};

export default api;
