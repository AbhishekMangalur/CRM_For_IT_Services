import { ACCESS_TOKEN_KEY } from "@/lib/constants";

const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

export const getAccessToken = (): string | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Unable to read access token:", error);
    return null;
  }
};

export const setAccessToken = (token: string): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch (error) {
    console.error("Unable to store access token:", error);
  }
};

export const removeAccessToken = (): void => {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (error) {
    console.error("Unable to remove access token:", error);
  }
};

export const hasAccessToken = (): boolean => {
  return Boolean(getAccessToken());
};