import axios, {
  AxiosError,
  AxiosHeaders,
  InternalAxiosRequestConfig,
} from "axios";

import { getAccessToken, removeAccessToken } from "@/lib/auth-storage";
import { API_ENDPOINTS, ROUTES } from "@/lib/constants";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  console.warn(
    "NEXT_PUBLIC_API_BASE_URL is not configured. Add it to .env.local.",
  );
}

export const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (!token) {
      return config;
    }

    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }

    config.headers.set("Authorization", `Bearer ${token}`);

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";
    const isLoginRequest = requestUrl.includes(API_ENDPOINTS.LOGIN);

    if (
      status === 401 &&
      !isLoginRequest &&
      typeof window !== "undefined"
    ) {
      removeAccessToken();

      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.replace(ROUTES.LOGIN);
      }
    }

    return Promise.reject(error);
  },
);