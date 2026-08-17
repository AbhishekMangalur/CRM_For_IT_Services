"use client";

import {
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
} from "lucide-react";

import {
  forgotPassword,
} from "@/lib/auth-api";
import {
  isStrongPassword,
  PASSWORD_REQUIREMENTS_MESSAGE,
} from "@/lib/password-validation";

import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ForgotPasswordForm {
  email: string;
  new_password: string;
  confirm_password: string;
}

const INITIAL_FORM: ForgotPasswordForm = {
  email: "",
  new_password: "",
  confirm_password: "",
};

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return "Something went wrong.";
  }

  const detail =
    error.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return "Unable to update password.";
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<ForgotPasswordForm>(
      INITIAL_FORM,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    showNewPassword,
    setShowNewPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  function updateField(
    field: keyof ForgotPasswordForm,
    value: string,
  ): void {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!isStrongPassword(form.new_password)) {
      setError(PASSWORD_REQUIREMENTS_MESSAGE);
      return;
    }

    if (
      form.new_password !==
      form.confirm_password
    ) {
      setError(
        "New password and confirm password do not match.",
      );
      return;
    }

    if (
      !form.email.trim() ||
      !form.new_password ||
      !form.confirm_password
    ) {
      setError(
        "Please fill in all required fields.",
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await forgotPassword({
          email:
            form.email.trim(),

          new_password:
            form.new_password,

          confirm_password:
            form.confirm_password,
        });

      setSuccess(
        response.message,
      );

      setForm(INITIAL_FORM);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
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
            Secure account access
          </p>

          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Reset your password and get back to work.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Update your password quickly using your registered email, then return to your CRM workspace.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Secure</p>
              <p className="mt-1 text-xs text-blue-100">
                Password reset flow
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Fast</p>
              <p className="mt-1 text-xs text-blue-100">
                Back to login in moments
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">Safe</p>
              <p className="mt-1 text-xs text-blue-100">
                Verified by email
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
                Reset password
              </h1>

              <p className="text-base text-slate-500">
                Enter your registered email and create a new password.
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
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  <AlertDescription>
                    {success}. Redirecting to login...
                  </AlertDescription>
                </Alert>
              )}

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
                    onChange={(event) =>
                      updateField(
                        "email",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    minLength={8}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="new_password"
                  className="text-sm font-medium text-slate-700"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="h-12 pl-10 pr-11"
                    value={form.new_password}
                    onChange={(event) =>
                      updateField(
                        "new_password",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-700"
                    onClick={() =>
                      setShowNewPassword((current) => !current)
                    }
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
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
                  Confirm New Password
                </label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="h-12 pl-10 pr-11"
                    value={form.confirm_password}
                    onChange={(event) =>
                      updateField(
                        "confirm_password",
                        event.target.value,
                      )
                    }
                    disabled={loading}
                    required
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-blue-700"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {form.confirm_password && (
                <p
                  className={`text-xs font-medium ${
                    form.new_password === form.confirm_password
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {form.new_password === form.confirm_password
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}

              <Button
                type="submit"
                className="h-12 w-full bg-blue-700 hover:bg-blue-800"
                disabled={loading || Boolean(success)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>

              <div className="flex justify-center">
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
