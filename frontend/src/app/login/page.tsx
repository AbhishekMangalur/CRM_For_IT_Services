"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
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
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormData {
  email: string;
  password: string;
}

interface FastAPIErrorResponse {
  detail?:
    | string
    | Array<{
        msg?: string;
        loc?: Array<string | number>;
      }>;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const {
    login,
    dashboardPath,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (
      !isAuthLoading &&
      isAuthenticated &&
      dashboardPath
    ) {
      router.replace(dashboardPath);
    }
  }, [
    dashboardPath,
    isAuthenticated,
    isAuthLoading,
    router,
  ]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement>,
  ): void {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  }

  function getBackendErrorMessage(
    data: FastAPIErrorResponse | undefined,
  ): string | null {
    if (!data) {
      return null;
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          const field = item.loc?.at(-1);
          const message = item.msg ?? "Invalid value";

          return field
            ? `${String(field)}: ${message}`
            : message;
        })
        .join(", ");
    }

    if (typeof data.message === "string") {
      return data.message;
    }

    return null;
  }

  function validateForm(): string | null {
    const email = formData.email.trim();

    if (!email) {
      return "Email address is required.";
    }

    if (!email.includes("@")) {
      return "Enter a valid email address.";
    }

    if (!formData.password) {
      return "Password is required.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const returnedDashboardPath = await login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      router.replace(returnedDashboardPath);
    } catch (error) {
      if (axios.isAxiosError<FastAPIErrorResponse>(error)) {
        if (!error.response) {
          setErrorMessage(
            "Unable to connect to the server. Check whether the backend is running.",
          );
          return;
        }

        if (error.response.status === 401) {
          setErrorMessage("Incorrect email or password.");
          return;
        }

        const backendMessage = getBackendErrorMessage(
          error.response.data,
        );

        setErrorMessage(
          backendMessage ??
            "Unable to sign in. Please try again.",
        );

        return;
      }

      setErrorMessage(
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (
    isAuthLoading ||
    (isAuthenticated && dashboardPath)
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4 text-white">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <Loader2 className="h-7 w-7 animate-spin" />
          </div>

          <p className="text-sm text-slate-300">
            Restoring your CRM session...
          </p>
        </div>
      </main>
    );
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
            Sales to Delivery
          </p>

          <h2 className="text-5xl font-bold leading-tight tracking-tight">
            Turn opportunities into profitable and
            deliverable projects.
          </h2>

          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">
            Connect sales, account management, presales,
            resource allocation and executive leadership
            through one secure CRM platform.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">5</p>
              <p className="mt-1 text-xs text-blue-100">
                Role-based workspaces
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">360°</p>
              <p className="mt-1 text-xs text-blue-100">
                Business visibility
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-2xl font-bold">JWT</p>
              <p className="mt-1 text-xs text-blue-100">
                Secure authentication
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
          <CardHeader className="space-y-3 pb-6">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-700/20 lg:hidden">
              <Building2 className="h-6 w-6" />
            </div>

            <div className="space-y-1 lg:hidden">
              <p className="text-sm font-semibold text-blue-700">
                IT Services CRM
              </p>
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </CardTitle>

            <CardDescription className="text-base text-slate-500">
              Sign in to access your role-based workspace.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert
                variant="destructive"
                className="mb-6"
              >
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
              noValidate
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email address
                </Label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="h-12 border-slate-300 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
                    disabled={isSubmitting}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </Label>

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    id="password"
                    name="password"
                    type={
                      showPassword ? "text" : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="h-12 border-slate-300 bg-white px-10 text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:ring-blue-600/20"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full bg-blue-700 text-base font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>

            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs leading-5 text-slate-500">
              <LockKeyhole className="h-3.5 w-3.5" />

              <span>
                Access is restricted to authorized users.
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
