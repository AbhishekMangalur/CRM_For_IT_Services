import { api } from "@/lib/api";

export interface RoleOption {
  id: number;
  name: string;
  display_name: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  role_id: number;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  message: string;

  user: {
    id: number;
    full_name: string;
    email: string;
    role_id: number;
    role: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export async function getRoles(): Promise<RoleOption[]> {
  const response =
    await api.get<RoleOption[]>(
      "/api/roles",
    );

  return response.data;
}

export async function registerUser(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  const response =
    await api.post<RegisterResponse>(
      "/api/auth/register",
      payload,
    );

  return response.data;
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const response =
    await api.post<ForgotPasswordResponse>(
      "/api/auth/forgot-password",
      payload,
    );

  return response.data;
}