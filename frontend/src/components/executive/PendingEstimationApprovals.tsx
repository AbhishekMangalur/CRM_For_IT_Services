"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCcw,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  approveEstimation,
  getEstimations,
  getSolutions,
  rejectEstimation,
} from "@/lib/presales-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { Estimation, Solution } from "@/types/presales";

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-US")} ${currency}`;
  }
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

  return "Unable to complete the approval request.";
}

export function PendingEstimationApprovals() {
  const { user } = useAuth();
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [solutionsById, setSolutionsById] = useState<Record<number, Solution>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectingEstimation, setRejectingEstimation] =
    useState<Estimation | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const loadApprovals = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const [records, solutions] = await Promise.all([
        getEstimations({ skip: 0, limit: 100 }),
        getSolutions({ skip: 0, limit: 100 }),
      ]);

      setSolutionsById(
        Object.fromEntries(
          solutions.map((solution) => [solution.id, solution]),
        ),
      );
      setEstimations(
        records.filter(
          (estimation) =>
            estimation.approval_status === "APPROVAL_REQUIRED",
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadApprovals();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadApprovals]);

  async function handleApprove(estimation: Estimation): Promise<void> {
    if (!user) {
      setError("Unable to identify the logged-in Executive user.");
      return;
    }

    if (!window.confirm(`Approve Estimation #${estimation.id}?`)) {
      return;
    }

    setProcessingId(estimation.id);
    setError("");
    setSuccessMessage("");

    try {
      await approveEstimation(estimation.id, user.id);
      setSuccessMessage(
        `Estimation #${estimation.id} approved successfully.`,
      );
      await loadApprovals();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  }

  function openReject(estimation: Estimation): void {
    setError("");
    setSuccessMessage("");
    setRejectionReason("");
    setRejectingEstimation(estimation);
  }

  async function handleReject(): Promise<void> {
    if (!rejectingEstimation) {
      return;
    }

    const reason = rejectionReason.trim();
    if (!reason) {
      setError("Rejection reason is required.");
      return;
    }

    if (!user) {
      setError("Unable to identify the logged-in Executive user.");
      return;
    }

    setProcessingId(rejectingEstimation.id);
    setError("");
    setSuccessMessage("");

    try {
      await rejectEstimation(rejectingEstimation.id, user.id, reason);
      setSuccessMessage(`Estimation #${rejectingEstimation.id} rejected.`);
      setRejectingEstimation(null);
      setRejectionReason("");
      await loadApprovals();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <>
      <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-lg shadow-amber-100/30">
        <CardHeader className="border-b border-amber-50">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Pending Estimation Approvals
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Review low-margin Presales estimations before proposals move
                forward.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadApprovals()}
              disabled={isLoading}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-700" />
            </div>
          ) : estimations.length === 0 ? (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              <p className="mt-3 font-semibold text-slate-700">
                No pending approvals
              </p>
              <p className="mt-1 text-sm text-slate-500">
                All Presales estimations requiring approval have been reviewed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full min-w-[1050px] text-left">
                <thead className="bg-amber-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Estimation</th>
                    <th className="px-4 py-3">Delivery Cost</th>
                    <th className="px-4 py-3">Billing</th>
                    <th className="px-4 py-3">Profit</th>
                    <th className="px-4 py-3">Margin</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {estimations.map((estimation) => (
                    <tr
                      key={estimation.id}
                      className="bg-white transition hover:bg-amber-50/30"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          {solutionsById[estimation.solution_id]
                            ?.solution_name ?? `Solution #${estimation.solution_id}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Estimation #{estimation.id} ·{" "}
                          {formatLabel(estimation.estimation_model)}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">
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
                        <span className="font-bold text-amber-700">
                          {Number(
                            estimation.expected_margin_percentage,
                          ).toFixed(2)}
                          %
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Badge className="bg-amber-100 text-amber-700">
                          Approval Required
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            disabled={processingId === estimation.id}
                            onClick={() => void handleApprove(estimation)}
                          >
                            {processingId === estimation.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={processingId === estimation.id}
                            onClick={() => openReject(estimation)}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {rejectingEstimation && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-2xl border border-red-100 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-estimation-title"
          >
            <div className="flex items-start justify-between border-b border-red-100 p-5">
              <div>
                <h2
                  id="reject-estimation-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Reject Estimation
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Estimation #{rejectingEstimation.id}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close rejection dialog"
                onClick={() => setRejectingEstimation(null)}
                disabled={processingId !== null}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-sm text-slate-500">Current Margin</p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {Number(
                    rejectingEstimation.expected_margin_percentage,
                  ).toFixed(2)}
                  %
                </p>
              </div>
              <div>
                <label
                  htmlFor="rejection_reason"
                  className="text-sm font-medium text-slate-700"
                >
                  Rejection Reason *
                </label>
                <Textarea
                  id="rejection_reason"
                  className="mt-2"
                  rows={5}
                  placeholder="Projected margin is below the acceptable threshold."
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  disabled={processingId !== null}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-red-100 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectingEstimation(null)}
                disabled={processingId !== null}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-red-600 hover:bg-red-700"
                disabled={processingId !== null || !rejectionReason.trim()}
                onClick={() => void handleReject()}
              >
                {processingId !== null && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reject Estimation
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
