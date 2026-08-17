"use client";

import { useConfirm } from "@/providers/ConfirmProvider";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  BarChart3,
  Building2,
  Edit3,
  Eye,
  FileUp,
  HeartPulse,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerHealthRecord,
  deleteCustomerHealthRecord,
  getAccounts,
  getCustomerHealthRecords,
  importCustomerHealthCsv,
  replaceCustomerHealthRecord,
} from "@/lib/account-director-api";
import type {
  AccountDirectorAccount,
  CreateCustomerHealthRequest,
  CustomerHealthImportResult,
  CustomerHealthRecord,
} from "@/types/account-director";

interface HealthFormState {
  account_id: string;
  delivery_score: string;
  financial_score: string;
  customer_satisfaction_score: string;
  sla_score: string;
  risk_reason: string;
}

const EMPTY_FORM: HealthFormState = {
  account_id: "",
  delivery_score: "",
  financial_score: "",
  customer_satisfaction_score: "",
  sla_score: "",
  risk_reason: "",
};

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
  }

  if (!error.response) {
    return "Unable to connect to the backend.";
  }

  const detail = error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return "The request could not be completed.";
}

function getHealthClasses(status: string): string {
  switch (status.toUpperCase()) {
    case "GREEN":
      return "bg-emerald-100 text-emerald-700";

    case "YELLOW":
      return "bg-amber-100 text-amber-700";

    case "RED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getScoreClasses(score: number): string {
  if (score >= 75) {
    return "text-emerald-700";
  }

  if (score >= 50) {
    return "text-amber-700";
  }

  return "text-red-700";
}

function healthRecordToForm(
  record: CustomerHealthRecord,
): HealthFormState {
  return {
    account_id: record.account_id.toString(),
    delivery_score:
      record.delivery_score.toString(),
    financial_score:
      record.financial_score.toString(),
    customer_satisfaction_score:
      record.customer_satisfaction_score.toString(),
    sla_score: record.sla_score.toString(),
    risk_reason: record.risk_reason ?? "",
  };
}

function formToPayload(
  form: HealthFormState,
): CreateCustomerHealthRequest {
  return {
    account_id: Number(form.account_id),
    delivery_score: Number(
      form.delivery_score,
    ),
    financial_score: Number(
      form.financial_score,
    ),
    customer_satisfaction_score: Number(
      form.customer_satisfaction_score,
    ),
    sla_score: Number(form.sla_score),
    risk_reason:
      form.risk_reason.trim() || null,
  };
}

interface HealthFormModalProps {
  record: CustomerHealthRecord | null;
  accounts: AccountDirectorAccount[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateCustomerHealthRequest,
  ) => Promise<void>;
}

function HealthFormModal({
  record,
  accounts,
  isSaving,
  error,
  onClose,
  onSubmit,
}: HealthFormModalProps) {
  const [form, setForm] =
    useState<HealthFormState>(
      record
        ? healthRecordToForm(record)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function isValidScore(value: string): boolean {
    if (!value) {
      return false;
    }

    const score = Number(value);

    return (
      Number.isFinite(score) &&
      score >= 0 &&
      score <= 100
    );
  }

  const isInvalid =
    !form.account_id ||
    !isValidScore(form.delivery_score) ||
    !isValidScore(form.financial_score) ||
    !isValidScore(
      form.customer_satisfaction_score,
    ) ||
    !isValidScore(form.sla_score);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  const previewScore =
    !isInvalid
      ? (
          (Number(form.delivery_score) +
            Number(form.financial_score) +
            Number(
              form.customer_satisfaction_score,
            ) +
            Number(form.sla_score)) /
          4
        ).toFixed(2)
      : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {record
                ? "Edit Health Assessment"
                : "Record Customer Health"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter delivery, financial, satisfaction,
              and SLA scores.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            {error && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="account_id">
                Account *
              </Label>

              <select
                id="account_id"
                name="account_id"
                value={form.account_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
                required
              >
                <option value="">
                  Select an account
                </option>

                {accounts.map((account) => (
                  <option
                    key={account.id}
                    value={account.id}
                  >
                    #{account.id} -{" "}
                    {account.account_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_score">
                Delivery score *
              </Label>

              <Input
                id="delivery_score"
                name="delivery_score"
                type="number"
                min="0"
                max="100"
                value={form.delivery_score}
                onChange={handleChange}
                placeholder="85"
                required
              />

              <p className="text-xs text-slate-500">
                Delivery quality and milestone
                performance.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial_score">
                Financial score *
              </Label>

              <Input
                id="financial_score"
                name="financial_score"
                type="number"
                min="0"
                max="100"
                value={form.financial_score}
                onChange={handleChange}
                placeholder="80"
                required
              />

              <p className="text-xs text-slate-500">
                Billing, payment, and profitability
                health.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_satisfaction_score">
                Customer satisfaction score *
              </Label>

              <Input
                id="customer_satisfaction_score"
                name="customer_satisfaction_score"
                type="number"
                min="0"
                max="100"
                value={
                  form.customer_satisfaction_score
                }
                onChange={handleChange}
                placeholder="90"
                required
              />

              <p className="text-xs text-slate-500">
                Customer feedback and relationship
                satisfaction.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sla_score">
                SLA score *
              </Label>

              <Input
                id="sla_score"
                name="sla_score"
                type="number"
                min="0"
                max="100"
                value={form.sla_score}
                onChange={handleChange}
                placeholder="88"
                required
              />

              <p className="text-xs text-slate-500">
                Service-level agreement compliance.
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="risk_reason">
                Risk reason
              </Label>

              <Textarea
                id="risk_reason"
                name="risk_reason"
                value={form.risk_reason}
                onChange={handleChange}
                placeholder="Describe delivery delays, SLA issues, financial concerns, or customer dissatisfaction..."
                rows={4}
              />
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 md:col-span-2">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Estimated overall health score
                  </p>

                  <p className="mt-2 text-3xl font-bold text-indigo-700">
                    {previewScore ?? "—"}
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  The backend calculates and stores the
                  final health score and status.
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white/95 px-6 py-4 backdrop-blur">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800"
              disabled={isSaving || isInvalid}
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {record
                ? "Save changes"
                : "Record health"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface HealthDetailsModalProps {
  record: CustomerHealthRecord;
  account?: AccountDirectorAccount;
  onClose: () => void;
}

function HealthDetailsModal({
  record,
  account,
  onClose,
}: HealthDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Customer Health Assessment
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {account?.account_name ??
                `Account #${record.account_id}`}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Overall health score
            </p>

            <p className="mt-2 text-4xl font-bold">
              {record.overall_health_score.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
            <p className="text-sm text-slate-500">
              Health status
            </p>

            <Badge
              className={`mt-3 ${getHealthClasses(
                record.health_status,
              )}`}
            >
              {formatLabel(record.health_status)}
            </Badge>
          </div>

          {[
            {
              label: "Delivery",
              value: record.delivery_score,
            },
            {
              label: "Financial",
              value: record.financial_score,
            },
            {
              label: "Customer Satisfaction",
              value:
                record.customer_satisfaction_score,
            },
            {
              label: "SLA",
              value: record.sla_score,
            },
          ].map((score) => (
            <div
              key={score.label}
              className="rounded-xl border border-blue-100 p-4"
            >
              <p className="text-xs text-slate-500">
                {score.label}
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${getScoreClasses(
                  score.value,
                )}`}
              >
                {score.value}
              </p>
            </div>
          ))}

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-sm font-medium text-slate-800">
              Risk reason
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {record.risk_reason ||
                "No risk reason was recorded."}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Recorded at
            </p>

            <p className="mt-1 font-medium">
              {formatDateTime(record.recorded_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountDirectorHealthPage() {
  const confirm = useConfirm();
  const [records, setRecords] = useState<
    CustomerHealthRecord[]
  >([]);

  const [accounts, setAccounts] = useState<
    AccountDirectorAccount[]
  >([]);

  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] =
    useState("ALL");
  const [healthFilter, setHealthFilter] =
    useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [isImporting, setIsImporting] =
    useState(false);

  const [importError, setImportError] =
    useState("");
  const [importResult, setImportResult] =
    useState<CustomerHealthImportResult | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState("");
  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingRecord, setEditingRecord] =
    useState<CustomerHealthRecord | null>(null);

  const [viewingRecord, setViewingRecord] =
    useState<CustomerHealthRecord | null>(null);

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [healthRecords, accountRecords] =
          await Promise.all([
            getCustomerHealthRecords({
              skip: 0,
              limit: 100,
            }),
            getAccounts({
              skip: 0,
              limit: 100,
            }),
          ]);

        setRecords(healthRecords);
        setAccounts(accountRecords);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const filteredRecords = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const account = accounts.find(
        (item) => item.id === record.account_id,
      );

      const matchesSearch =
        !normalizedSearch ||
        account?.account_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        record.risk_reason
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesAccount =
        accountFilter === "ALL" ||
        record.account_id ===
          Number(accountFilter);

      const matchesHealth =
        healthFilter === "ALL" ||
        record.health_status === healthFilter;

      return (
        matchesSearch &&
        matchesAccount &&
        matchesHealth
      );
    });
  }, [
    accountFilter,
    accounts,
    healthFilter,
    records,
    search,
  ]);

  const greenRecords = records.filter(
    (record) =>
      record.health_status === "GREEN",
  ).length;

  const yellowRecords = records.filter(
    (record) =>
      record.health_status === "YELLOW",
  ).length;

  const redRecords = records.filter(
    (record) =>
      record.health_status === "RED",
  ).length;

  const averageHealthScore =
    records.length > 0
      ? records.reduce(
          (total, record) =>
            total +
            Number(record.overall_health_score),
          0,
        ) / records.length
      : 0;

  async function handleSaveRecord(
    payload: CreateCustomerHealthRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingRecord) {
        const updated =
          await replaceCustomerHealthRecord(
            editingRecord.id,
            payload,
          );

        setRecords((current) =>
          current.map((record) =>
            record.id === updated.id
              ? updated
              : record,
          ),
        );
      } else {
        const created =
          await createCustomerHealthRecord(
            payload,
          );

        setRecords((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingRecord(null);

      // Refresh account data because backend updates
      // health status and risk level on the account.
      const refreshedAccounts =
        await getAccounts({
          skip: 0,
          limit: 100,
        });

      setAccounts(refreshedAccounts);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteRecord(
    record: CustomerHealthRecord,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete health record #${record.id}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomerHealthRecord(
        record.id,
      );

      setRecords((current) =>
        current.filter(
          (item) => item.id !== record.id,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleHealthImport(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setImportError("Please select a CSV file.");
      return;
    }

    setIsImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const result = await importCustomerHealthCsv(selectedFile);
      setImportResult(result);
      await loadData();
    } catch (requestError) {
      setImportError(getErrorMessage(requestError));
    } finally {
      setIsImporting(false);
    }
  }

  function findAccount(
    accountId: number,
  ): AccountDirectorAccount | undefined {
    return accounts.find(
      (account) => account.id === accountId,
    );
  }

  function openCreateForm(): void {
    setEditingRecord(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    record: CustomerHealthRecord,
  ): void {
    setEditingRecord(record);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="ACCOUNT_DIRECTOR">
      <DashboardLayout
        title="Customer Health"
        description="Record and monitor delivery, financial, satisfaction, and SLA health."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Average Health Score"
              value={averageHealthScore.toFixed(1)}
              description="Average across all assessments"
              icon={BarChart3}
              variant="blue"
            />

            <StatCard
              title="Healthy Assessments"
              value={greenRecords.toLocaleString(
                "en-US",
              )}
              description="Assessments with green status"
              icon={HeartPulse}
              variant="indigo"
            />

            <StatCard
              title="Needs Attention"
              value={yellowRecords.toLocaleString(
                "en-US",
              )}
              description="Assessments with yellow status"
              icon={TrendingUp}
              variant="cyan"
            />

            <StatCard
              title="Critical Assessments"
              value={redRecords.toLocaleString(
                "en-US",
              )}
              description="Assessments with red status"
              icon={ShieldAlert}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Customer Health Records
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {records.length} assessment
                    {records.length === 1 ? "" : "s"}{" "}
                    loaded from the database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => void handleHealthImport(event)}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadData()
                    }
                    disabled={isLoading}
                  >
                    <RefreshCcw
                      className={`mr-2 h-4 w-4 ${
                        isLoading
                          ? "animate-spin"
                          : ""
                      }`}
                    />
                    Refresh
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => importInputRef.current?.click()}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileUp className="mr-2 h-4 w-4" />
                    )}
                    {isImporting ? "Importing..." : "Import Health CSV"}
                  </Button>

                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={openCreateForm}
                    disabled={accounts.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Record Health
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {importError && (
                <Alert variant="destructive" className="mb-5">
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert
                  variant="destructive"
                  className="mb-5"
                >
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {!isLoading &&
                accounts.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      Create an account before recording
                      customer health.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_250px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search account or risk reason..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={accountFilter}
                  onChange={(event) =>
                    setAccountFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All accounts
                  </option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.account_name}
                    </option>
                  ))}
                </select>

                <select
                  value={healthFilter}
                  onChange={(event) =>
                    setHealthFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All health statuses
                  </option>
                  <option value="GREEN">
                    Green
                  </option>
                  <option value="YELLOW">
                    Yellow
                  </option>
                  <option value="RED">Red</option>
                </select>
              </div>

              <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold">
                <span className="text-slate-500">
                  Health score legend:
                </span>

                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  75–100 Green
                </span>

                <span className="inline-flex items-center gap-2 text-amber-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  50–74 Yellow
                </span>

                <span className="inline-flex items-center gap-2 text-red-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  Below 50 Red
                </span>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <HeartPulse className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No health records found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Record customer health or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1250px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Account
                        </th>
                        <th className="px-4 py-3">
                          Delivery
                        </th>
                        <th className="px-4 py-3">
                          Financial
                        </th>
                        <th className="px-4 py-3">
                          Satisfaction
                        </th>
                        <th className="px-4 py-3">
                          SLA
                        </th>
                        <th className="px-4 py-3">
                          Overall
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3">
                          Recorded
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredRecords.map(
                        (record) => {
                          const account = findAccount(
                            record.account_id,
                          );

                          return (
                            <tr
                              key={record.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <Building2 className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {account?.account_name ??
                                        `Account #${record.account_id}`}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td
                                className={`px-4 py-4 font-semibold ${getScoreClasses(
                                  record.delivery_score,
                                )}`}
                              >
                                {record.delivery_score}
                              </td>

                              <td
                                className={`px-4 py-4 font-semibold ${getScoreClasses(
                                  record.financial_score,
                                )}`}
                              >
                                {record.financial_score}
                              </td>

                              <td
                                className={`px-4 py-4 font-semibold ${getScoreClasses(
                                  record.customer_satisfaction_score,
                                )}`}
                              >
                                {
                                  record.customer_satisfaction_score
                                }
                              </td>

                              <td
                                className={`px-4 py-4 font-semibold ${getScoreClasses(
                                  record.sla_score,
                                )}`}
                              >
                                {record.sla_score}
                              </td>

                              <td className="px-4 py-4">
                                <span
                                  className={`text-lg font-bold ${getScoreClasses(
                                    record.overall_health_score,
                                  )}`}
                                >
                                  {record.overall_health_score.toFixed(
                                    2,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getHealthClasses(
                                    record.health_status,
                                  )}
                                >
                                  {formatLabel(
                                    record.health_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatDateTime(
                                  record.recorded_at,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View assessment"
                                    onClick={() =>
                                      setViewingRecord(
                                        record,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit assessment"
                                    onClick={() =>
                                      openEditForm(record)
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete assessment"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteRecord(
                                        record,
                                      )
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <HealthFormModal
            record={editingRecord}
            accounts={accounts}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingRecord(null);
              }
            }}
            onSubmit={handleSaveRecord}
          />
        )}

        {viewingRecord && (
          <HealthDetailsModal
            record={viewingRecord}
            account={findAccount(
              viewingRecord.account_id,
            )}
            onClose={() =>
              setViewingRecord(null)
            }
          />
        )}

        {importResult && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl rounded-2xl border border-emerald-100 bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="health-import-title"
            >
              <div className="flex items-start justify-between border-b border-emerald-100 p-5">
                <div>
                  <h2
                    id="health-import-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Customer Health Import Completed
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Scores and health statuses have been recalculated by the
                    backend.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close import results"
                  onClick={() => setImportResult(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs text-slate-500">Rows processed</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      {importResult.rows_processed}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs text-slate-500">Records updated</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {importResult.records_updated}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cyan-50 p-4">
                    <p className="text-xs text-slate-500">Records created</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-700">
                      {importResult.records_created}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs text-slate-500">Failed</p>
                    <p className="mt-1 text-2xl font-bold text-red-700">
                      {importResult.failed_rows}
                    </p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold text-slate-800">
                      Import errors
                    </h3>
                    <div className="max-h-64 overflow-auto rounded-xl border border-red-100">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead className="sticky top-0 bg-red-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Account ID</th>
                            <th className="px-4 py-3">Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-50">
                          {importResult.errors.map((item, index) => (
                            <tr key={`${item.row}-${item.account_id}-${index}`}>
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {item.row}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {item.account_id || "-"}
                              </td>
                              <td className="px-4 py-3 text-red-700">
                                {item.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end border-t border-emerald-100 p-5">
                <Button
                  type="button"
                  className="bg-blue-700 hover:bg-blue-800"
                  onClick={() => setImportResult(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
