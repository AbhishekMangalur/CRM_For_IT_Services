"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileUp,
  Gauge,
  HeartPulse,
  Loader2,
  RefreshCcw,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
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

import { useExecutiveDashboard } from "@/hooks/useExecutiveDashboard";
import {
  generateExecutiveKpiSnapshot,
  getExecutiveFinancialSummary,
  importExecutiveFinancialsCsv,
  regenerateExecutiveKpiSnapshot,
} from "@/lib/executive-api";

import type {
  ExecutiveFinancialSummary,
  ExecutiveKpiSnapshot,
  FinancialImportResult,
} from "@/types/executive";

import {
  ExecutiveCharts,
} from "@/components/executive/ExecutiveCharts";
import {
  PendingEstimationApprovals,
} from "@/components/executive/PendingEstimationApprovals";
import {
  PendingProposalApprovals,
} from "@/components/executive/PendingProposalApprovals";
import {
  ExecutiveSuccessKpis,
} from "@/components/executive/ExecutiveSuccessKpis";

/* ================================================= */
/* HELPERS */
/* ================================================= */

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

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatFullDate(value: string): string {
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

function percentageWidth(
  value: number,
): string {
  return `${Math.min(
    100,
    Math.max(0, value),
  )}%`;
}

function getSnapshotErrorMessage(
  requestError: unknown,
  fallback: string,
): string {
  if (!axios.isAxiosError(requestError)) {
    return fallback;
  }

  const detail = requestError.response?.data?.detail;

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

  return fallback;
}

function formatFinancialImportError(message: string): string {
  const approvalStatusMatch = message.match(
    /^Estimation (\d+) cannot be imported because its approval status is ([A-Z_]+)\./,
  );

  if (!approvalStatusMatch) {
    return message;
  }

  const [, estimationId, approvalStatus] = approvalStatusMatch;
  return `Estimation ${estimationId} is ${approvalStatus}`;
}

/* ================================================= */
/* HISTORY CARD */
/* ================================================= */

function HistorySnapshotCard({
  snapshot,
}: {
  snapshot: ExecutiveKpiSnapshot;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:bg-blue-50/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {formatDate(
              snapshot.snapshot_month,
            )}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Updated{" "}
            {formatFullDate(
              snapshot.updated_at,
            )}
          </p>
        </div>

        <Badge className="bg-blue-100 text-blue-700">
          Snapshot #{snapshot.id}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Pipeline
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {formatCurrency(
              snapshot.total_pipeline_value,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Forecast
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {formatCurrency(
              snapshot.forecast_revenue,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs text-slate-500">
            Margin
          </p>

          <p className="mt-1 font-bold text-cyan-700">
            {snapshot.gross_margin_percentage.toFixed(
              1,
            )}
            %
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">
            Win Rate
          </p>

          <p className="mt-1 font-bold text-emerald-700">
            {snapshot.win_rate.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* LOADING */
/* ================================================= */

function DashboardLoading() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-blue-100 p-4">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>

        <p className="text-sm text-slate-500">
          Loading Executive analytics...
        </p>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default function ExecutiveDashboardPage() {
  const {
    data,
    isLoading,
    error,
    refresh,
  } = useExecutiveDashboard();

  const [isUpdatingSnapshot, setIsUpdatingSnapshot] =
    useState(false);
  const [snapshotError, setSnapshotError] = useState("");
  const [snapshotSuccess, setSnapshotSuccess] = useState("");

  const [financialSummary, setFinancialSummary] =
    useState<ExecutiveFinancialSummary | null>(null);
  const [isLoadingFinancials, setIsLoadingFinancials] =
    useState(true);
  const [isImportingFinancials, setIsImportingFinancials] =
    useState(false);
  const [financialError, setFinancialError] = useState("");
  const [financialImportResult, setFinancialImportResult] =
    useState<FinancialImportResult | null>(null);
  const financialInputRef = useRef<HTMLInputElement>(null);

  const latest = data?.latest ?? null;

  const history =
    data?.history ?? [];

  const sortedHistory =
    [...history].sort(
      (first, second) =>
        new Date(
          second.snapshot_month,
        ).getTime() -
        new Date(
          first.snapshot_month,
        ).getTime(),
    );

  const loadFinancialSummary = useCallback(async (): Promise<void> => {
    setIsLoadingFinancials(true);
    setFinancialError("");

    try {
      setFinancialSummary(await getExecutiveFinancialSummary());
    } catch (requestError) {
      setFinancialError(
        getSnapshotErrorMessage(
          requestError,
          "Unable to load financial actuals.",
        ),
      );
    } finally {
      setIsLoadingFinancials(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFinancialSummary();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFinancialSummary]);

  async function handleFinancialImport(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const selectedFile = event.target.files?.[0];
    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setFinancialError("Please select a CSV file.");
      return;
    }

    setIsImportingFinancials(true);
    setFinancialError("");
    setFinancialImportResult(null);

    try {
      const result = await importExecutiveFinancialsCsv(selectedFile);
      setFinancialImportResult(result);
      await loadFinancialSummary();
    } catch (requestError) {
      setFinancialError(
        getSnapshotErrorMessage(
          requestError,
          "Unable to import financial actuals.",
        ),
      );
    } finally {
      setIsImportingFinancials(false);
    }
  }

  async function handleGenerateSnapshot(): Promise<void> {
    setIsUpdatingSnapshot(true);
    setSnapshotError("");
    setSnapshotSuccess("");

    try {
      const today = new Date();
      const snapshotMonth = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
      ).padStart(2, "0")}-01`;

      await generateExecutiveKpiSnapshot({
        snapshot_month: snapshotMonth,
      });
      await refresh();
      setSnapshotSuccess("KPI snapshot generated successfully.");
    } catch (requestError) {
      setSnapshotError(
        getSnapshotErrorMessage(
          requestError,
          "Unable to generate KPI snapshot.",
        ),
      );
    } finally {
      setIsUpdatingSnapshot(false);
    }
  }

  async function handleRegenerateLatest(): Promise<void> {
    if (!latest) {
      return;
    }

    setIsUpdatingSnapshot(true);
    setSnapshotError("");
    setSnapshotSuccess("");

    try {
      await regenerateExecutiveKpiSnapshot(latest.id);
      await refresh();
      setSnapshotSuccess(
        "Latest KPI snapshot recalculated successfully.",
      );
    } catch (requestError) {
      setSnapshotError(
        getSnapshotErrorMessage(
          requestError,
          "Unable to recalculate KPI snapshot.",
        ),
      );
    } finally {
      setIsUpdatingSnapshot(false);
    }
  }

  return (
    <ProtectedRoute allowedRole="EXECUTIVE">
      <DashboardLayout
        title="Executive Dashboard"
        description="Company-wide pipeline, revenue, margin, resource and customer health analytics."
      >
        {isLoading && !latest ? (
          <DashboardLoading />
        ) : (
          <div className="space-y-6">
            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Executive Performance Overview
                </h2>

                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Consolidated analytics across Sales,
                  Presales, Account Management and
                  Resource Management.
                </p>

                {latest && (
                  <p className="mt-2 text-xs text-slate-400">
                    Latest snapshot:{" "}
                    {formatDate(
                      latest.snapshot_month,
                    )}{" "}
                    · Updated{" "}
                    {formatFullDate(
                      latest.updated_at,
                    )}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!latest && (
                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={() => void handleGenerateSnapshot()}
                    disabled={isUpdatingSnapshot}
                  >
                    {isUpdatingSnapshot && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate This Month
                  </Button>
                )}

                {latest && (
                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={() => void handleRegenerateLatest()}
                    disabled={isUpdatingSnapshot}
                  >
                    {isUpdatingSnapshot ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Recalculate Latest
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refresh()}
                  disabled={isLoading || isUpdatingSnapshot}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </section>

            {snapshotError && (
              <Alert variant="destructive">
                <AlertDescription>{snapshotError}</AlertDescription>
              </Alert>
            )}

            {snapshotSuccess && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700">
                <AlertDescription>{snapshotSuccess}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <span>{error}</span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void refresh()
                    }
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/30">
              <CardHeader className="border-b border-emerald-50">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
                      <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                      Financial Actuals
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Compare imported delivery actuals with projected margins.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={financialInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(event) =>
                        void handleFinancialImport(event)
                      }
                    />
                    <Button
                      type="button"
                      className="bg-emerald-700 hover:bg-emerald-800"
                      onClick={() => financialInputRef.current?.click()}
                      disabled={isImportingFinancials}
                    >
                      {isImportingFinancials ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileUp className="mr-2 h-4 w-4" />
                      )}
                      {isImportingFinancials
                        ? "Importing..."
                        : "Import Financial CSV"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void loadFinancialSummary()}
                      disabled={
                        isLoadingFinancials || isImportingFinancials
                      }
                    >
                      <RefreshCcw
                        className={`mr-2 h-4 w-4 ${
                          isLoadingFinancials ? "animate-spin" : ""
                        }`}
                      />
                      Refresh Actuals
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {financialError && (
                  <Alert variant="destructive" className="mb-5">
                    <AlertDescription>{financialError}</AlertDescription>
                  </Alert>
                )}

                {isLoadingFinancials && !financialSummary ? (
                  <div className="flex min-h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
                  </div>
                ) : financialSummary ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs text-slate-500">Projected Margin</p>
                      <p className="mt-2 text-2xl font-bold text-blue-700">
                        {financialSummary.projected_margin_percentage === null
                          ? "Not available"
                          : `${Number(
                              financialSummary.projected_margin_percentage,
                            ).toFixed(2)}%`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="text-xs text-slate-500">Actual Margin</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-700">
                        {Number(
                          financialSummary.actual_margin_percentage,
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <p className="text-xs text-slate-500">Margin Variance</p>
                      <p className="mt-2 text-2xl font-bold text-amber-700">
                        {financialSummary.margin_variance === null
                          ? "Not available"
                          : `${Number(
                              financialSummary.margin_variance,
                            ).toFixed(2)}%`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-100 bg-cyan-50 p-4">
                      <p className="text-xs text-slate-500">
                        Timesheet Utilization
                      </p>
                      <p className="mt-2 text-2xl font-bold text-cyan-700">
                        {financialSummary.timesheet_utilization_percentage ===
                        null
                          ? "Not available"
                          : `${Number(
                              financialSummary.timesheet_utilization_percentage,
                            ).toFixed(2)}%`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Actual Revenue</p>
                      <p className="mt-2 text-xl font-bold text-slate-800">
                        {formatCurrency(
                          financialSummary.actual_revenue,
                          financialSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Actual Cost</p>
                      <p className="mt-2 text-xl font-bold text-slate-800">
                        {formatCurrency(
                          financialSummary.actual_cost,
                          financialSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Actual Profit</p>
                      <p className="mt-2 text-xl font-bold text-emerald-700">
                        {formatCurrency(
                          financialSummary.actual_profit,
                          financialSummary.currency,
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Imported Records</p>
                      <p className="mt-2 text-xl font-bold text-slate-800">
                        {financialSummary.total_records.toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <ExecutiveSuccessKpis />

            {!latest && !isLoading ? (
              <Card className="rounded-2xl border-amber-100 bg-amber-50/70">
                <CardContent className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                  <Activity className="h-10 w-10 text-amber-500" />

                  <p className="mt-3 text-lg font-semibold text-slate-800">
                    No KPI snapshot available
                  </p>

                  <p className="mt-1 max-w-lg text-sm text-slate-500">
                    Generate the first Executive KPI
                    snapshot from the backend before
                    opening the analytics dashboard.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {latest && (
              <>
                {/* ================================================= */}
                {/* PRIMARY KPI CARDS */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Pipeline Value"
                    value={formatCurrency(
                      latest.total_pipeline_value,
                    )}
                    description="Total active sales pipeline"
                    icon={CircleDollarSign}
                    variant="blue"
                  />

                  <StatCard
                    title="Forecast Revenue"
                    value={formatCurrency(
                      latest.forecast_revenue,
                    )}
                    description="Revenue expected from current pipeline"
                    icon={TrendingUp}
                    variant="indigo"
                  />

                  <StatCard
                    title="Gross Margin"
                    value={`${latest.gross_margin_percentage.toFixed(
                      1,
                    )}%`}
                    description="Expected overall gross margin"
                    icon={Gauge}
                    variant="cyan"
                  />

                  <StatCard
                    title="Win Rate"
                    value={`${latest.win_rate.toFixed(
                      1,
                    )}%`}
                    description="Won versus closed opportunities"
                    icon={CheckCircle2}
                    variant="emerald"
                  />
                </section>

                {/* ================================================= */}
                {/* RESOURCE KPI CARDS */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Resource Utilization"
                    value={`${latest.resource_utilization_percentage.toFixed(
                      1,
                    )}%`}
                    description="Overall employee utilization"
                    icon={UserRoundCheck}
                    variant="blue"
                  />

                  <StatCard
                    title="Bench"
                    value={`${latest.bench_percentage.toFixed(
                      1,
                    )}%`}
                    description="Employees currently on bench"
                    icon={Users}
                    variant="indigo"
                  />

                  <StatCard
                    title="Active Opportunities"
                    value={latest.active_opportunities.toLocaleString(
                      "en-US",
                    )}
                    description={`${latest.won_opportunities} won · ${latest.lost_opportunities} lost`}
                    icon={BriefcaseBusiness}
                    variant="cyan"
                  />

                  <StatCard
                    title="Active Contracts"
                    value={latest.active_contracts.toLocaleString(
                      "en-US",
                    )}
                    description={`${latest.contracts_due_for_renewal} due for renewal`}
                    icon={WalletCards}
                    variant="emerald"
                  />
                </section>

                <PendingEstimationApprovals />

                <PendingProposalApprovals />

                <ExecutiveCharts
                  latest={latest}
                  history={history}
                />

                {/* ================================================= */}
                {/* CUSTOMER + EMPLOYEE SUMMARY */}
                {/* ================================================= */}

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                    <CardHeader className="border-b border-blue-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Customer Health
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Account portfolio health summary
                          </p>
                        </div>

                        <HeartPulse className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                          <p className="text-sm text-slate-500">
                            Healthy Accounts
                          </p>

                          <p className="mt-2 text-3xl font-bold text-emerald-700">
                            {
                              latest.healthy_accounts
                            }
                          </p>
                        </div>

                        <div className="rounded-xl border border-red-100 bg-red-50 p-5">
                          <p className="text-sm text-slate-500">
                            At-Risk Accounts
                          </p>

                          <p className="mt-2 text-3xl font-bold text-red-700">
                            {
                              latest.at_risk_accounts
                            }
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Healthy account ratio
                          </span>

                          <span className="font-semibold text-slate-700">
                            {latest.healthy_accounts +
                              latest.at_risk_accounts >
                            0
                              ? (
                                  (latest.healthy_accounts /
                                    (latest.healthy_accounts +
                                      latest.at_risk_accounts)) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                            %
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-red-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                            style={{
                              width:
                                latest.healthy_accounts +
                                  latest.at_risk_accounts >
                                0
                                  ? percentageWidth(
                                      (latest.healthy_accounts /
                                        (latest.healthy_accounts +
                                          latest.at_risk_accounts)) *
                                        100,
                                    )
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-blue-100 p-4">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-blue-600" />

                            <div>
                              <p className="text-xs text-slate-500">
                                Active Contracts
                              </p>

                              <p className="text-xl font-bold text-slate-800">
                                {
                                  latest.active_contracts
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-amber-100 p-4">
                          <div className="flex items-center gap-3">
                            <CalendarClock className="h-5 w-5 text-amber-600" />

                            <div>
                              <p className="text-xs text-slate-500">
                                Renewals Due
                              </p>

                              <p className="text-xl font-bold text-slate-800">
                                {
                                  latest.contracts_due_for_renewal
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/30">
                    <CardHeader className="border-b border-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Workforce Overview
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Current workforce allocation summary
                          </p>
                        </div>

                        <Users className="h-5 w-5 text-indigo-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5 p-5">
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="rounded-xl bg-blue-50 p-4 text-center">
                          <p className="text-xs text-slate-500">
                            Total
                          </p>

                          <p className="mt-2 text-2xl font-bold text-blue-700">
                            {
                              latest.total_employees
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-indigo-50 p-4 text-center">
                          <p className="text-xs text-slate-500">
                            Allocated
                          </p>

                          <p className="mt-2 text-2xl font-bold text-indigo-700">
                            {
                              latest.allocated_employees
                            }
                          </p>
                        </div>

                        <div className="rounded-xl bg-cyan-50 p-4 text-center">
                          <p className="text-xs text-slate-500">
                            Available
                          </p>

                          <p className="mt-2 text-2xl font-bold text-cyan-700">
                            {
                              latest.available_employees
                            }
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Utilization
                          </span>

                          <span className="font-semibold text-indigo-700">
                            {
                              latest.resource_utilization_percentage
                            }
                            %
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-indigo-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
                            style={{
                              width:
                                percentageWidth(
                                  latest.resource_utilization_percentage,
                                ),
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-slate-500">
                            Bench
                          </span>

                          <span className="font-semibold text-cyan-700">
                            {
                              latest.bench_percentage
                            }
                            %
                          </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-cyan-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                            style={{
                              width:
                                percentageWidth(
                                  latest.bench_percentage,
                                ),
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                {/* ================================================= */}
                {/* REVENUE / PIPELINE */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-lg">
                    <CardContent className="p-5">
                      <p className="text-sm text-blue-100">
                        Account Expansion Revenue
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {formatCurrency(
                          latest.account_expansion_revenue,
                        )}
                      </p>

                      <TrendingUp className="mt-4 h-6 w-6 text-blue-100" />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-gradient-to-br from-indigo-600 to-violet-800 text-white shadow-lg">
                    <CardContent className="p-5">
                      <p className="text-sm text-indigo-100">
                        Won Opportunities
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {
                          latest.won_opportunities
                        }
                      </p>

                      <CheckCircle2 className="mt-4 h-6 w-6 text-indigo-100" />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-cyan-100 bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg">
                    <CardContent className="p-5">
                      <p className="text-sm text-cyan-100">
                        Pending Resource Requests
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {
                          latest.pending_resource_requests
                        }
                      </p>

                      <Users className="mt-4 h-6 w-6 text-cyan-100" />
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-emerald-100 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
                    <CardContent className="p-5">
                      <p className="text-sm text-emerald-100">
                        Pending Presales Approvals
                      </p>

                      <p className="mt-2 text-3xl font-bold">
                        {
                          latest.pending_presales_approvals
                        }
                      </p>

                      <AlertTriangle className="mt-4 h-6 w-6 text-emerald-100" />
                    </CardContent>
                  </Card>
                </section>

                {/* ================================================= */}
                {/* HISTORICAL TREND */}
                {/* ================================================= */}

                <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                  <CardHeader className="border-b border-blue-50">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">
                          KPI History
                        </CardTitle>

                        <p className="mt-1 text-sm text-slate-500">
                          Month-wise Executive KPI snapshots
                        </p>
                      </div>

                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                  </CardHeader>

                  <CardContent className="p-5">
                    {sortedHistory.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {sortedHistory
                          .slice(0, 6)
                          .map(
                            (snapshot) => (
                              <HistorySnapshotCard
                                key={
                                  snapshot.id
                                }
                                snapshot={
                                  snapshot
                                }
                              />
                            ),
                          )}
                      </div>
                    ) : (
                      <div className="flex min-h-48 flex-col items-center justify-center text-center">
                        <Activity className="h-10 w-10 text-blue-300" />

                        <p className="mt-3 font-semibold text-slate-700">
                          No historical snapshots
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ================================================= */}
                {/* SECONDARY / SOURCE NOT ENABLED */}
                {/* ================================================= */}

                <Card className="rounded-2xl border-slate-200 bg-slate-50/70">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-800">
                      Additional Revenue Metrics
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <WalletCards className="h-5 w-5 text-slate-500" />

                          <div>
                            <p className="text-xs text-slate-500">
                              Actual Revenue
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-800">
                              {formatCurrency(
                                financialSummary?.actual_revenue ?? 0,
                                financialSummary?.currency ?? "USD",
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Revenue imported from ERP financial actuals.
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-5 w-5 text-slate-500" />

                          <div>
                            <p className="text-xs text-slate-500">
                              Partner Influenced Pipeline
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-800">
                              {formatCurrency(
                                latest.partner_influenced_pipeline,
                              )}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-400">
                          Total value of active partner-influenced
                          opportunities.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}

        {financialImportResult && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl rounded-2xl border border-emerald-100 bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="financial-import-title"
            >
              <div className="flex items-start justify-between border-b border-emerald-100 p-5">
                <div>
                  <h2
                    id="financial-import-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Financial Import Completed
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Financial actuals and backend-calculated margins are now
                    available on the dashboard.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Close financial import results"
                  onClick={() => setFinancialImportResult(null)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs text-slate-500">Rows processed</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      {financialImportResult.rows_processed}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs text-slate-500">Imported</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {financialImportResult.records_created}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs text-slate-500">Failed</p>
                    <p className="mt-1 text-2xl font-bold text-red-700">
                      {financialImportResult.failed_rows}
                    </p>
                  </div>
                </div>

                {financialImportResult.errors.length > 0 && (
                  <div>
                    <h3 className="mb-2 font-semibold text-slate-800">
                      Import errors
                    </h3>
                    <div className="max-h-64 overflow-auto rounded-xl border border-red-100">
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="sticky top-0 bg-red-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Opportunity ID</th>
                            <th className="px-4 py-3">Error Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-50">
                          {financialImportResult.errors.map((item, index) => (
                            <tr
                              key={`${item.row}-${item.opportunity_id}-${index}`}
                            >
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {item.row}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {item.opportunity_id || "-"}
                              </td>
                              <td className="px-4 py-3 text-red-700">
                                {formatFinancialImportError(item.message)}
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
                  onClick={() => setFinancialImportResult(null)}
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
