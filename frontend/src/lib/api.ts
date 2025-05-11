import axios, { AxiosInstance, AxiosError } from "axios";
import {
  ApiResponse,
  ApiError,
  FoodListing,
  User,
  Notification,
  Stats,
  PaginationParams,
} from "./types";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8090";

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      Cookies.remove("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    token: string;
    data: User;
  }> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (
    userData: Partial<User>
  ): Promise<{
    success: boolean;
    token: string;
    data: User;
  }> => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getCurrentUser: () => api.get("/auth/me"),

  updateProfile: (userData: Partial<User>) =>
    api.patch("/auth/update", userData),

  forgotPassword: async (
    email: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  },
};

// Food Listings API
export const foodListingsAPI = {
  getAll: async (
    params?: PaginationParams
  ): Promise<ApiResponse<FoodListing[]>> => {
    const response = await api.get("/food/all", { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<FoodListing>> => {
    const response = await api.get(`/food/${id}`);
    return response.data;
  },

  getNearby: (latitude: number, longitude: number, distance?: number) =>
    api.get("/food/nearby", { params: { latitude, longitude, distance } }),

  create: async (
    data: Partial<FoodListing>
  ): Promise<ApiResponse<FoodListing>> => {
    const response = await api.post("/food/create", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<FoodListing>
  ): Promise<ApiResponse<FoodListing>> => {
    const response = await api.patch(`/food/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/food/${id}`);
    return response.data;
  },
};

// NGO API
export const ngoAPI = {
  getAvailableFood: async (
    params?: PaginationParams
  ): Promise<ApiResponse<FoodListing[]>> => {
    const response = await api.get("/ngo/available", { params });
    return response.data;
  },

  claimFood: async (
    id: string,
    pickupDetails: Partial<FoodListing["pickupDetails"]>
  ): Promise<ApiResponse<FoodListing>> => {
    const response = await api.post(`/ngo/claim/${id}`, pickupDetails);
    return response.data;
  },

  getClaimedPickups: (status?: string) =>
    api.get("/ngo/claimed", { params: { status } }),

  updatePickupStatus: (
    pickupId: string,
    statusData: { status: FoodListing["status"] }
  ) => api.patch(`/ngo/pickup/${pickupId}`, statusData),

  getHistory: () => api.get("/ngo/history"),
};

// Admin API
export const adminAPI = {
  getUsers: async (params?: PaginationParams): Promise<ApiResponse<User[]>> => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  verifyUser: (
    userId: string,
    verificationData: {
      isVerified: boolean;
      verificationNotes?: string;
    }
  ) => api.patch(`/admin/verify/${userId}`, verificationData),

  removeUser: (userId: string) => api.delete(`/admin/remove/${userId}`),

  getReports: () => api.get("/admin/reports"),

  getStats: async (): Promise<ApiResponse<Stats>> => {
    const response = await api.get("/admin/stats");
    return response.data;
  },
};

// Reputation API
export const reputationAPI = {
  getVendorReport: (vendorId: string) =>
    api.get(`/reputation/vendor/${vendorId}`),

  getNGOReport: (ngoId: string) => api.get(`/reputation/ngo/${ngoId}`),

  getLeaderboard: () => api.get("/reputation/leaderboard"),
};

// Notification API
export const notificationAPI = {
  getAll: async (): Promise<ApiResponse<Notification[]>> => {
    const response = await api.get("/notify");
    return response.data;
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    const response = await api.put(`/notify/${id}/read`);
    return response.data;
  },
};

// Platform Stats API
export const statsAPI = {
  getPlatformStats: () => api.get("/stats"),
};

export default api;
