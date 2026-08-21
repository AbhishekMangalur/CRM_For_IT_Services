// manages authentication state and provides authentication-related functions to the rest of the application
"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

import { api } from "@/lib/api";
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from "@/lib/auth-storage";
import { API_ENDPOINTS, ROUTES } from "@/lib/constants";
import type {
  AuthContextValue,
  AuthUser,
  CurrentUser,
  LoginRequest,
  LoginResponse,
} from "@/types/auth";

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [dashboardPath, setDashboardPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasRestoredSession = useRef(false);

  const clearSession = useCallback(() => {
    removeAccessToken();
    setUser(null);
    setDashboardPath(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.replace(ROUTES.LOGIN);
  }, [clearSession, router]);

  const refreshUser = useCallback(async (): Promise<void> => {
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      setDashboardPath(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<CurrentUser>(
        API_ENDPOINTS.CURRENT_USER,
      );

      setUser({
        id: response.data.id,
        full_name: response.data.full_name,
        email: response.data.email,
        role: response.data.role,
        dashboard_path: response.data.dashboard_path,
      });

      setDashboardPath(response.data.dashboard_path);
    } catch (error) {
      clearSession();

      if (
        axios.isAxiosError(error) &&
        error.response?.status !== 401
      ) {
        console.error("Unable to restore authentication session:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [clearSession]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<string> => {
      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.LOGIN,
        credentials,
      );

      const {
        access_token,
        dashboard_path,
        user: loggedInUser,
      } = response.data;

      setAccessToken(access_token);
      setUser({
        ...loggedInUser,
        dashboard_path,
      });
      setDashboardPath(dashboard_path);

      return dashboard_path;
    },
    [],
  );

  useEffect(() => {
    if (hasRestoredSession.current) {
      return;
    }

    hasRestoredSession.current = true;
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (
      !isLoading &&
      user &&
      dashboardPath &&
      pathname === ROUTES.LOGIN
    ) {
      router.replace(dashboardPath);
    }
  }, [
    dashboardPath,
    isLoading,
    pathname,
    router,
    user,
  ]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      dashboardPath,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [
      dashboardPath,
      isLoading,
      login,
      logout,
      refreshUser,
      user,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
