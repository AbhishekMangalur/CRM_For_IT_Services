"use client";

import { useConfirm } from "@/providers/ConfirmProvider";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import {
  Calculator,
  CircleDollarSign,
  Edit3,
  Eye,
  Gauge,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { BlendedRateCalculator } from "@/components/presales/BlendedRateCalculator";
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

import {
  createEstimation,
  deleteEstimation,
  getEstimations,
  getSolutions,
  replaceEstimation,
} from "@/lib/presales-api";

import type {
  CreateEstimationRequest,
  Estimation,
  EstimationModel,
  Solution,
} from "@/types/presales";

interface EstimationFormState {
  solution_id: string;
  estimation_model: EstimationModel;
  resource_cost: string;
  infrastructure_cost: string;
  overhead_cost: string;
  contingency_percentage: string;
  billing_amount: string;
  currency: string;
}

const EMPTY_FORM: EstimationFormState = {
  solution_id: "",
  estimation_model: "FIXED_PRICE",
  resource_cost: "",
  infrastructure_cost: "",
  overhead_cost: "",
  contingency_percentage: "10",
  billing_amount: "",
  currency: "USD",
};

function formatCurrency(
  value: string | number,
  currency = "USD",
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ${currency}`;
  }
}

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

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
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

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
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

function getApprovalClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "READY_FOR_PROPOSAL":
      return "bg-emerald-100 text-emerald-700";

    case "APPROVAL_REQUIRED":
      return "bg-amber-100 text-amber-700";

    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getDisplayedApprovalStatus(status: string): string {
  return status === "READY_FOR_PROPOSAL" ? "APPROVED" : status;
}

function estimationToForm(
  estimation: Estimation,
): EstimationFormState {
  return {
    solution_id:
      estimation.solution_id.toString(),

    estimation_model:
      estimation.estimation_model,

    resource_cost:
      estimation.resource_cost,

    infrastructure_cost:
      estimation.infrastructure_cost,

    overhead_cost:
      estimation.overhead_cost,

    contingency_percentage:
      estimation.contingency_percentage.toString(),

    billing_amount:
      estimation.billing_amount,

    currency:
      estimation.currency,
  };
}

function formToPayload(
  form: EstimationFormState,
): CreateEstimationRequest {
  return {
    solution_id:
      Number(form.solution_id),

    estimation_model:
      form.estimation_model,

    resource_cost:
      Number(form.resource_cost),

    infrastructure_cost:
      Number(form.infrastructure_cost),

    overhead_cost:
      Number(form.overhead_cost),

    contingency_percentage:
      Number(
        form.contingency_percentage,
      ),

    billing_amount:
      Number(form.billing_amount),

    currency:
      form.currency.trim().toUpperCase(),
  };
}

interface EstimationFormModalProps {
  estimation: Estimation | null;
  solutions: Solution[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateEstimationRequest,
  ) => Promise<void>;
}

function EstimationFormModal({
  estimation,
  solutions,
  isSaving,
  error,
  onClose,
  onSubmit,
}: EstimationFormModalProps) {
  const [form, setForm] =
    useState<EstimationFormState>(
      estimation
        ? estimationToForm(estimation)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const resourceCost =
    Number(form.resource_cost) || 0;

  const infrastructureCost =
    Number(form.infrastructure_cost) || 0;

  const overheadCost =
    Number(form.overhead_cost) || 0;

  const contingencyPercentage =
    Number(
      form.contingency_percentage,
    ) || 0;

  const billingAmount =
    Number(form.billing_amount) || 0;

  const baseCost =
    resourceCost +
    infrastructureCost +
    overheadCost;

  const previewContingency =
    baseCost *
    (contingencyPercentage / 100);

  const previewDeliveryCost =
    baseCost + previewContingency;

  const previewProfit =
    billingAmount - previewDeliveryCost;

  const previewMargin =
    billingAmount > 0
      ? (previewProfit / billingAmount) *
        100
      : 0;

  const isInvalid =
    !form.solution_id ||
    !form.resource_cost ||
    Number(form.resource_cost) < 0 ||
    !form.infrastructure_cost ||
    Number(
      form.infrastructure_cost,
    ) < 0 ||
    !form.overhead_cost ||
    Number(form.overhead_cost) < 0 ||
    !form.billing_amount ||
    Number(form.billing_amount) <= 0 ||
    contingencyPercentage < 0 ||
    contingencyPercentage > 100;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {estimation
                ? "Edit Estimation"
                : "Create Estimation"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter commercial inputs. Final
              contingency, delivery cost, profit,
              and margin are calculated by the
              backend.
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

            <div className="space-y-2">
              <Label htmlFor="solution_id">
                Solution *
              </Label>

              <select
                id="solution_id"
                name="solution_id"
                value={form.solution_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
                required
              >
                <option value="">
                  Select a solution
                </option>

                {solutions.map(
                  (solution) => (
                    <option
                      key={solution.id}
                      value={solution.id}
                    >
                      #{solution.id} -{" "}
                      {solution.solution_name}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimation_model">
                Estimation model
              </Label>

              <select
                id="estimation_model"
                name="estimation_model"
                value={
                  form.estimation_model
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="FIXED_PRICE">
                  Fixed Price
                </option>

                <option value="TIME_AND_MATERIAL">
                  Time & Material
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_cost">
                Resource cost *
              </Label>

              <Input
                id="resource_cost"
                name="resource_cost"
                type="number"
                min="0"
                value={form.resource_cost}
                onChange={handleChange}
                placeholder="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="infrastructure_cost">
                Infrastructure cost *
              </Label>

              <Input
                id="infrastructure_cost"
                name="infrastructure_cost"
                type="number"
                min="0"
                value={
                  form.infrastructure_cost
                }
                onChange={handleChange}
                placeholder="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overhead_cost">
                Overhead cost *
              </Label>

              <Input
                id="overhead_cost"
                name="overhead_cost"
                type="number"
                min="0"
                value={form.overhead_cost}
                onChange={handleChange}
                placeholder="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contingency_percentage">
                Contingency (%)
              </Label>

              <Input
                id="contingency_percentage"
                name="contingency_percentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={
                  form.contingency_percentage
                }
                onChange={handleChange}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_amount">
                Billing amount *
              </Label>

              <Input
                id="billing_amount"
                name="billing_amount"
                type="number"
                min="1"
                value={form.billing_amount}
                onChange={handleChange}
                placeholder="1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency
              </Label>

              <Input
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                maxLength={3}
                placeholder="USD"
              />
            </div>

            <div className="md:col-span-2">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-800">
                    Commercial Preview
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Preview only. The backend
                    calculates and stores the final
                    values.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">
                      Contingency
                    </p>

                    <p className="mt-2 font-bold text-blue-700">
                      {formatCurrency(
                        previewContingency,
                        form.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">
                      Delivery Cost
                    </p>

                    <p className="mt-2 font-bold text-indigo-700">
                      {formatCurrency(
                        previewDeliveryCost,
                        form.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">
                      Expected Profit
                    </p>

                    <p
                      className={`mt-2 font-bold ${
                        previewProfit >= 0
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatCurrency(
                        previewProfit,
                        form.currency,
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="text-xs text-slate-500">
                      Expected Margin
                    </p>

                    <p
                      className={`mt-2 font-bold ${
                        previewMargin >= 0
                          ? "text-cyan-700"
                          : "text-red-700"
                      }`}
                    >
                      {previewMargin.toFixed(
                        2,
                      )}
                      %
                    </p>
                  </div>
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
              disabled={
                isSaving || isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {estimation
                ? "Save changes"
                : "Create estimation"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EstimationDetailsModalProps {
  estimation: Estimation;
  solution?: Solution;
  onClose: () => void;
}

function EstimationDetailsModal({
  estimation,
  solution,
  onClose,
}: EstimationDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Commercial Estimation
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {solution?.solution_name ?? "Linked solution unavailable"}
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
              Billing Amount
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                estimation.billing_amount,
                estimation.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Expected Margin
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {Number(
                estimation.expected_margin_percentage,
              ).toFixed(2)}
              %
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Solution
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {solution?.solution_name ??
                "Linked solution unavailable"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Estimation Model
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {formatLabel(
                estimation.estimation_model,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Approval Status
            </p>

            <Badge
              className={`mt-2 ${getApprovalClasses(
                estimation.approval_status,
              )}`}
            >
              {formatLabel(
                getDisplayedApprovalStatus(estimation.approval_status),
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Approved By
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {estimation.approved_by
                ? `User #${estimation.approved_by}`
                : getDisplayedApprovalStatus(
                      estimation.approval_status,
                    ) === "APPROVED"
                  ? "Automatically approved"
                  : "Not approved"}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-slate-500">
              Resource Cost
            </p>

            <p className="mt-2 text-lg font-bold text-blue-700">
              {formatCurrency(
                estimation.resource_cost,
                estimation.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs text-slate-500">
              Infrastructure Cost
            </p>

            <p className="mt-2 text-lg font-bold text-indigo-700">
              {formatCurrency(
                estimation.infrastructure_cost,
                estimation.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-cyan-50 p-4">
            <p className="text-xs text-slate-500">
              Overhead Cost
            </p>

            <p className="mt-2 text-lg font-bold text-cyan-700">
              {formatCurrency(
                estimation.overhead_cost,
                estimation.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs text-slate-500">
              Contingency
            </p>

            <p className="mt-2 text-lg font-bold text-amber-700">
              {formatCurrency(
                estimation.contingency_amount,
                estimation.currency,
              )}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {
                estimation.contingency_percentage
              }
              %
            </p>
          </div>

          <div className="rounded-xl bg-violet-50 p-4">
            <p className="text-xs text-slate-500">
              Total Delivery Cost
            </p>

            <p className="mt-2 text-lg font-bold text-violet-700">
              {formatCurrency(
                estimation.total_delivery_cost,
                estimation.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-slate-500">
              Expected Profit
            </p>

            <p className="mt-2 text-lg font-bold text-emerald-700">
              {formatCurrency(
                estimation.expected_profit,
                estimation.currency,
              )}
            </p>
          </div>

          {estimation.rejection_reason && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 sm:col-span-2">
              <p className="text-sm font-semibold text-red-700">
                Rejection Reason
              </p>

              <p className="mt-2 text-sm text-red-600">
                {
                  estimation.rejection_reason
                }
              </p>
            </div>
          )}

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-medium">
              {formatDate(
                estimation.created_at,
              )}
            </p>
          </div>

          {estimation.id && (
            <div className="sm:col-span-2">
              <BlendedRateCalculator
                estimationId={estimation.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PresalesEstimationsPage() {
  const confirm = useConfirm();
  const [
    estimations,
    setEstimations,
  ] = useState<Estimation[]>([]);

  const [solutions, setSolutions] =
    useState<Solution[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    approvalFilter,
    setApprovalFilter,
  ] = useState("ALL");

  const [
    modelFilter,
    setModelFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingEstimation,
    setEditingEstimation,
  ] = useState<Estimation | null>(null);

  const [
    viewingEstimation,
    setViewingEstimation,
  ] = useState<Estimation | null>(null);

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          estimationRecords,
          solutionRecords,
        ] = await Promise.all([
          getEstimations({
            skip: 0,
            limit: 100,
          }),

          getSolutions({
            skip: 0,
            limit: 100,
          }),
        ]);

        setEstimations(
          estimationRecords,
        );

        setSolutions(solutionRecords);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError),
        );
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

  const filteredEstimations =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return estimations.filter(
        (estimation) => {
          const solution =
            solutions.find(
              (record) =>
                record.id ===
                estimation.solution_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            solution?.solution_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            estimation.estimation_model
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesApproval =
            approvalFilter === "ALL" ||
            getDisplayedApprovalStatus(estimation.approval_status) ===
              approvalFilter;

          const matchesModel =
            modelFilter === "ALL" ||
            estimation.estimation_model ===
              modelFilter;

          return (
            matchesSearch &&
            matchesApproval &&
            matchesModel
          );
        },
      );
    }, [
      approvalFilter,
      estimations,
      modelFilter,
      search,
      solutions,
    ]);

  const approvalRequiredCount =
    estimations.filter(
      (estimation) =>
        estimation.approval_status ===
        "APPROVAL_REQUIRED",
    ).length;

  const approvedCount =
    estimations.filter(
      (estimation) =>
        getDisplayedApprovalStatus(estimation.approval_status) ===
        "APPROVED",
    ).length;

  const totalBilling =
    estimations.reduce(
      (total, estimation) =>
        total +
        (Number(
          estimation.billing_amount,
        ) || 0),
      0,
    );

  async function handleSaveEstimation(
    payload: CreateEstimationRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingEstimation) {
        const updated =
          await replaceEstimation(
            editingEstimation.id,
            payload,
          );

        setEstimations((current) =>
          current.map(
            (estimation) =>
              estimation.id ===
              updated.id
                ? updated
                : estimation,
          ),
        );
      } else {
        const created =
          await createEstimation(
            payload,
          );

        setEstimations((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingEstimation(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEstimation(
    estimation: Estimation,
  ): Promise<void> {
    const confirmed =
      await confirm(
        `Delete estimation #${estimation.id}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteEstimation(
        estimation.id,
      );

      setEstimations((current) =>
        current.filter(
          (record) =>
            record.id !==
            estimation.id,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    }
  }

  function findSolution(
    solutionId: number,
  ): Solution | undefined {
    return solutions.find(
      (solution) =>
        solution.id === solutionId,
    );
  }

  function openCreateForm(): void {
    setEditingEstimation(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    estimation: Estimation,
  ): void {
    setEditingEstimation(estimation);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="PRESALES">
      <DashboardLayout
        title="Estimations"
        description="Create commercial estimations and track approval status."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Estimations"
              value={estimations.length.toLocaleString(
                "en-US",
              )}
              description="Commercial estimations in the database"
              icon={Calculator}
              variant="blue"
            />

            <StatCard
              title="Approval Required"
              value={approvalRequiredCount.toLocaleString(
                "en-US",
              )}
              description="Low-margin estimations requiring approval"
              icon={Gauge}
              variant="indigo"
            />

            <StatCard
              title="Total Billing"
              value={formatCurrency(
                totalBilling,
              )}
              description="Combined proposed billing amount"
              icon={CircleDollarSign}
              variant="cyan"
            />

            <StatCard
              title="Approved"
              value={approvedCount.toLocaleString(
                "en-US",
              )}
              description="Margin-qualified or Executive-approved estimations"
              icon={TrendingUp}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Commercial Estimations
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {estimations.length} estimation
                    {estimations.length === 1
                      ? ""
                      : "s"}{" "}
                    loaded from the database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
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
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={openCreateForm}
                    disabled={
                      solutions.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Create Estimation
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
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
                solutions.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      Create a solution before adding
                      an estimation.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search solution or estimation model..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={approvalFilter}
                  onChange={(event) =>
                    setApprovalFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All approval statuses
                  </option>

                  <option value="APPROVAL_REQUIRED">
                    Approval Required
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>
                </select>

                <select
                  value={modelFilter}
                  onChange={(event) =>
                    setModelFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All estimation models
                  </option>

                  <option value="FIXED_PRICE">
                    Fixed Price
                  </option>

                  <option value="TIME_AND_MATERIAL">
                    Time & Material
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredEstimations.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Calculator className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No estimations found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an estimation or change
                    the filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1400px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Solution
                        </th>

                        <th className="px-4 py-3">
                          Model
                        </th>

                        <th className="px-4 py-3">
                          Delivery Cost
                        </th>

                        <th className="px-4 py-3">
                          Billing
                        </th>

                        <th className="px-4 py-3">
                          Profit
                        </th>

                        <th className="px-4 py-3">
                          Margin
                        </th>

                        <th className="px-4 py-3">
                          Approval
                        </th>

                        <th className="px-4 py-3">
                          Updated
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredEstimations.map(
                        (estimation) => {
                          const solution =
                            findSolution(
                              estimation.solution_id,
                            );

                          return (
                            <tr
                              key={estimation.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <Layers3 className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {solution?.solution_name ??
                                        "Linked solution unavailable"}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                {formatLabel(
                                  estimation.estimation_model,
                                )}
                              </td>

                              <td className="px-4 py-4 font-semibold text-slate-800">
                                {formatCurrency(
                                  estimation.total_delivery_cost,
                                  estimation.currency,
                                )}
                              </td>

                              <td className="px-4 py-4 font-semibold text-blue-700">
                                {formatCurrency(
                                  estimation.billing_amount,
                                  estimation.currency,
                                )}
                              </td>

                              <td className="px-4 py-4 font-semibold text-emerald-700">
                                {formatCurrency(
                                  estimation.expected_profit,
                                  estimation.currency,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <span className="font-bold text-indigo-700">
                                  {Number(
                                    estimation.expected_margin_percentage,
                                  ).toFixed(2)}
                                  %
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getApprovalClasses(
                                    estimation.approval_status,
                                  )}
                                >
                                  {formatLabel(
                                    getDisplayedApprovalStatus(
                                      estimation.approval_status,
                                    ),
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatDate(
                                  estimation.updated_at,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View estimation"
                                    onClick={() =>
                                      setViewingEstimation(
                                        estimation,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit estimation"
                                    onClick={() =>
                                      openEditForm(
                                        estimation,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete estimation"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteEstimation(
                                        estimation,
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
          <EstimationFormModal
            estimation={editingEstimation}
            solutions={solutions}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingEstimation(
                  null,
                );
              }
            }}
            onSubmit={
              handleSaveEstimation
            }
          />
        )}

        {viewingEstimation && (
          <EstimationDetailsModal
            estimation={viewingEstimation}
            solution={findSolution(
              viewingEstimation.solution_id,
            )}
            onClose={() =>
              setViewingEstimation(
                null,
              )
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
