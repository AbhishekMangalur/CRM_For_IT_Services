export type UserRole =
  | "SALES"
  | "ACCOUNT_DIRECTOR"
  | "PRESALES"
  | "RESOURCE_MANAGER"
  | "EXECUTIVE";

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  dashboard_path: string;
}

export interface CurrentUser extends AuthUser {
  dashboard_path: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  dashboard_path: string;
  user: Omit<AuthUser, "dashboard_path">;
}

export interface AuthContextValue {
  user: AuthUser | null;
  dashboardPath: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
