"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  User,
  Users,
} from "lucide-react";

import {
  getRoles,
  registerUser,
  type RoleOption,
} from "@/lib/auth-api";
import {
  isStrongPassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "@/lib/password-validation";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface RegisterForm {
  full_name: string;
  email: string;
  role_id: string;
  password: string;
  confirm_password: string;
}

const INITIAL_FORM: RegisterForm = {
  full_name: "",
  email: "",
  role_id: "",
  password: "",
  confirm_password: "",
};

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong.";
  }

  const detail = error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).join(", ");
  }

  return "Unable to register.";
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [roles, setRoles] =
    useState<RoleOption[]>([]);

  const [loadingRoles, setLoadingRoles] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await getRoles();
        setRoles(data);
      } catch {
        setError("Unable to load roles.");
      } finally {
        setLoadingRoles(false);
      }
    }

    void loadRoles();
  }, []);

  function updateField(
    field: keyof RegisterForm,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    if (
      form.password !==
      form.confirm_password
    ) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await registerUser({
          full_name:
            form.full_name.trim(),
          email:
            form.email.trim(),
          role_id:
            Number(form.role_id),
          password: form.password,
          confirm_password:
            form.confirm_password,
        });

      setSuccess(response.message);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-950 lg:grid-cols-2">
      <section className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-950" />

        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />

        <div className="relative z-10 flex items-center gap-3 p-12 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur">
            <Building2 className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-xl font-bold">
              IT Services CRM
            </h1>

            <p className="text-sm text-blue-100">
              Unified business management platform
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl p-12 text-white">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-blue-200">
            Join the platform
          </p>

          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Create a secure workspace for your team.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Register once and access the CRM with the right role, permissions and tools for your day-to-day work.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">5</p>
              <p className="mt-1 text-xs text-blue-100">
                Role-based workspaces
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">JWT</p>
              <p className="mt-1 text-xs text-blue-100">
                Secure authentication
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">24/7</p>
              <p className="mt-1 text-xs text-blue-100">
                Always available
              </p>
            </div>
          </div>
        </div>

        <p className="relative z-10 p-12 text-sm text-blue-200">
          CRM for IT Services
        </p>
      </section>

      <section className="relative flex items-center justify-center overflow-hidden bg-slate-50 px-5 py-10 sm:px-8">
        <div className="absolute -right-20 top-10 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl lg:hidden" />

        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl lg:hidden" />

        <Card className="relative z-10 w-full max-w-md border-slate-200 bg-white/95 shadow-2xl shadow-slate-300/40">
          <CardContent className="p-8 sm:p-10">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
                <Building2 className="h-7 w-7" />
              </div>
            </div>

            <div className="space-y-1 text-center">
              <p className="text-sm font-semibold text-blue-700">
                IT Services CRM
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Create account
              </h1>

              <p className="text-base text-slate-500">
                Register to access your workspace.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="full_name"
                  className="text-sm font-medium text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="full_name"
                    placeholder="Enter full name"
                    className="h-12 pl-10"
                    value={form.full_name}
                    onChange={(e) =>
                      updateField(
                        "full_name",
                        e.target.value,
                      )
                    }
                    minLength={8}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="h-12 pl-10"
                    value={form.email}
                    onChange={(e) =>
                      updateField(
                        "email",
                        e.target.value,
                      )
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="role_id"
                  className="text-sm font-medium text-slate-700"
                >
                  Role
                </label>

                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <select
                    id="role_id"
                    className="h-12 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                    value={form.role_id}
                    onChange={(e) =>
                      updateField(
                        "role_id",
                        e.target.value,
                      )
                    }
                    disabled={loadingRoles}
                    required
                  >
                    <option value="">
                      Select Role
                    </option>

                    {roles.map((role) => (
                      <option
                        key={role.id}
                        value={role.id}
                      >
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="h-12 pl-10 pr-10"
                    value={form.password}
                    onChange={(e) =>
                      updateField(
                        "password",
                        e.target.value,
                      )
                    }
                    required
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Use 8+ characters with at least one uppercase letter, one lowercase letter, one number, and one special character.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm_password"
                  className="text-sm font-medium text-slate-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="h-12 pl-10 pr-10"
                    value={form.confirm_password}
                    onChange={(e) =>
                      updateField(
                        "confirm_password",
                        e.target.value,
                      )
                    }
                    required
                  />

                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-slate-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-blue-700 hover:bg-blue-800"
                disabled={loading || loadingRoles}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  Login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
