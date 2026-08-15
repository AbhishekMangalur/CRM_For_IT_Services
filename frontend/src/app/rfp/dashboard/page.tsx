"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Loader2,
  RefreshCcw,
  TrendingUp,
  Users,
  XCircle,
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

import { useRfpDashboard } from "@/hooks/useRfpDashboard";

import type {
  BidEvaluation,
  Rfp,
  RfpAssignment,
} from "@/types/rfp";

/* ================================================= */
/* HELPERS */
/* ================================================= */

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

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not set";
  }

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

function daysUntil(
  value: string,
): number {
  const today = new Date();
  const deadline = new Date(value);

  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const difference =
    deadline.getTime() -
    today.getTime();

  return Math.ceil(
    difference /
      (1000 * 60 * 60 * 24),
  );
}

function getRfpStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "RECEIVED":
      return "bg-blue-100 text-blue-700";

    case "EVALUATED":
      return "bg-indigo-100 text-indigo-700";

    case "IN_PROGRESS":
      return "bg-cyan-100 text-cyan-700";

    case "SUBMITTED":
      return "bg-violet-100 text-violet-700";

    case "WON":
      return "bg-emerald-100 text-emerald-700";

    case "LOST":
      return "bg-red-100 text-red-700";

    case "NO_BID":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getDecisionClasses(
  decision: string,
): string {
  switch (decision.toUpperCase()) {
    case "BID":
      return "bg-emerald-100 text-emerald-700";

    case "NO_BID":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getAssignmentStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";

    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

/* ================================================= */
/* RECENT RFP */
/* ================================================= */

function RecentRfpRow({
  rfp,
}: {
  rfp: Rfp;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:-translate-y-0.5 hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {rfp.title}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {rfp.rfp_number} ·{" "}
              {rfp.client_name}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {rfp.service_type}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            className={getRfpStatusClasses(
              rfp.rfp_status,
            )}
          >
            {formatLabel(
              rfp.rfp_status,
            )}
          </Badge>

          <Badge
            className={getDecisionClasses(
              rfp.bid_decision,
            )}
          >
            {formatLabel(
              rfp.bid_decision,
            )}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Estimated Value
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {formatCurrency(
              rfp.estimated_value,
              rfp.currency,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Submission
          </p>

          <p className="mt-1 text-sm font-semibold text-indigo-700">
            {formatDate(
              rfp.submission_deadline,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* EVALUATION ROW */
/* ================================================= */

function EvaluationRow({
  evaluation,
  rfp,
}: {
  evaluation: BidEvaluation;
  rfp?: Rfp;
}) {
  return (
    <div className="rounded-xl border border-indigo-100 bg-white p-4 transition hover:bg-indigo-50/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {rfp?.title ??
              `RFP #${evaluation.rfp_id}`}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Evaluation #{evaluation.id}
          </p>
        </div>

        <Badge
          className={getDecisionClasses(
            evaluation.recommendation,
          )}
        >
          {evaluation.recommendation}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Overall Score
          </p>

          <p className="mt-1 text-2xl font-bold text-indigo-700">
            {evaluation.overall_score.toFixed(
              1,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">
            Win Probability
          </p>

          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {evaluation.win_probability}%
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* ASSIGNMENT ROW */
/* ================================================= */

function AssignmentRow({
  assignment,
  rfp,
}: {
  assignment: RfpAssignment;
  rfp?: Rfp;
}) {
  return (
    <div className="rounded-xl border border-cyan-100 bg-white p-4 transition hover:bg-cyan-50/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {rfp?.title ??
              `RFP #${assignment.rfp_id}`}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatLabel(
              assignment.assignment_role,
            )}
          </p>
        </div>

        <Badge
          className={getAssignmentStatusClasses(
            assignment.assignment_status,
          )}
        >
          {formatLabel(
            assignment.assignment_status,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            User
          </p>

          <p className="mt-1 font-semibold text-blue-700">
            #{assignment.user_id}
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs text-slate-500">
            Due Date
          </p>

          <p className="mt-1 text-sm font-semibold text-cyan-700">
            {formatDate(
              assignment.due_date,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* DEADLINE ROW */
/* ================================================= */

function DeadlineRow({
  rfp,
}: {
  rfp: Rfp;
}) {
  const remaining =
    daysUntil(
      rfp.submission_deadline,
    );

  return (
    <div className="rounded-xl border border-amber-100 bg-white p-4 transition hover:bg-amber-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {rfp.title}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {rfp.client_name}
          </p>
        </div>

        <Badge
          className={
            remaining <= 2
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          }
        >
          {remaining === 0
            ? "Due Today"
            : `${remaining} day${
                remaining === 1
                  ? ""
                  : "s"
              }`}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <CalendarClock className="h-4 w-4 text-amber-600" />

        {formatDate(
          rfp.submission_deadline,
        )}
      </div>
    </div>
  );
}

/* ================================================= */
/* PIPELINE NODE */
/* ================================================= */

interface PipelineNodeProps {
  title: string;
  value: number;
  className: string;
}

function PipelineNode({
  title,
  value,
  className,
}: PipelineNodeProps) {
  return (
    <div
      className={`rounded-xl border p-4 text-center shadow-sm ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
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
          Loading RFP dashboard...
        </p>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default function RfpDashboardPage() {
  const {
    data,
    metrics,
    isLoading,
    error,
    refresh,
  } = useRfpDashboard();

  function findRfp(
    rfpId: number,
  ): Rfp | undefined {
    return data?.rfps.find(
      (rfp) =>
        rfp.id === rfpId,
    );
  }

  return (
    <ProtectedRoute
      allowedRoles={[
        "SALES",
        "PRESALES",
        "ACCOUNT_DIRECTOR",
      ]}
    >
      <DashboardLayout
        title="RFP / Bid Management"
        description="Manage RFP intake, bid/no-bid evaluation, cross-functional assignments and submission pipeline."
      >
        {isLoading && !data ? (
          <DashboardLoading />
        ) : (
          <div className="space-y-6">

            {/* ================================================= */}
            {/* WORKSPACE */}
            {/* ================================================= */}

            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  RFP Workspace
                </h2>

                <p className="mt-1 max-w-3xl text-sm text-slate-500">
                  Receive RFPs, evaluate bid
                  viability, assign the response
                  team and track submissions
                  through win or loss.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  render={
                    <Link href="/rfp/rfps" />
                  }
                  nativeButton={false}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <FileText className="mr-2 h-4 w-4" />

                  RFPs
                </Button>

                <Button
                  render={
                    <Link href="/rfp/evaluations" />
                  }
                  nativeButton={false}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  <BadgeCheck className="mr-2 h-4 w-4" />

                  Bid Evaluations
                </Button>

                <Button
                  render={
                    <Link href="/rfp/assignments" />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Users className="mr-2 h-4 w-4" />

                  Assignments
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void refresh()
                  }
                  disabled={isLoading}
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

            {data && metrics && (
              <>
                {/* ================================================= */}
                {/* PRIMARY KPI */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total RFPs"
                    value={metrics.totalRfps.toLocaleString(
                      "en-US",
                    )}
                    description="All RFPs in the pipeline"
                    icon={FileText}
                    variant="blue"
                  />

                  <StatCard
                    title="Pending Evaluation"
                    value={metrics.pendingEvaluation.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.receivedCount} currently received`}
                    icon={Clock3}
                    variant="indigo"
                  />

                  <StatCard
                    title="BID Decisions"
                    value={metrics.bidCount.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.noBidCount} NO_BID decisions`}
                    icon={CheckCircle2}
                    variant="cyan"
                  />

                  <StatCard
                    title="Pipeline Value"
                    value={formatCurrency(
                      metrics.totalPipelineValue,
                    )}
                    description="Current RFP opportunity value"
                    icon={TrendingUp}
                    variant="emerald"
                  />
                </section>

                {/* ================================================= */}
                {/* STATUS KPI */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="In Progress"
                    value={metrics.inProgressCount.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.activeAssignments} active team assignments`}
                    icon={BriefcaseBusiness}
                    variant="blue"
                  />

                  <StatCard
                    title="Submitted"
                    value={metrics.submittedCount.toLocaleString(
                      "en-US",
                    )}
                    description="RFP responses submitted"
                    icon={FileCheck2}
                    variant="indigo"
                  />

                  <StatCard
                    title="Won"
                    value={metrics.wonCount.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.lostCount} lost RFPs`}
                    icon={BadgeCheck}
                    variant="cyan"
                  />

                  <StatCard
                    title="Upcoming Deadlines"
                    value={metrics.upcomingDeadlines.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.overdueRfps} overdue RFPs`}
                    icon={CalendarClock}
                    variant="emerald"
                  />
                </section>

                {/* ================================================= */}
                {/* PIPELINE VISUAL */}
                {/* ================================================= */}

                <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                  <CardHeader className="border-b border-blue-50">
                    <CardTitle className="text-lg font-bold text-slate-800">
                      RFP Pipeline
                    </CardTitle>

                    <p className="mt-1 text-sm text-slate-500">
                      Current RFP movement through
                      the bid lifecycle
                    </p>
                  </CardHeader>

                  <CardContent className="p-5">
                    <div className="grid gap-3 lg:grid-cols-7 lg:items-center">

                      <PipelineNode
                        title="Received"
                        value={
                          metrics.receivedCount
                        }
                        className="border-blue-100 bg-blue-50 text-blue-700"
                      />

                      <div className="hidden text-center text-xl text-slate-300 lg:block">
                        →
                      </div>

                      <PipelineNode
                        title="Evaluated"
                        value={
                          metrics.evaluatedCount
                        }
                        className="border-indigo-100 bg-indigo-50 text-indigo-700"
                      />

                      <div className="hidden text-center text-xl text-slate-300 lg:block">
                        →
                      </div>

                      <div className="grid gap-2">
                        <PipelineNode
                          title="BID"
                          value={
                            metrics.bidCount
                          }
                          className="border-emerald-100 bg-emerald-50 text-emerald-700"
                        />

                        <PipelineNode
                          title="NO BID"
                          value={
                            metrics.noBidCount
                          }
                          className="border-red-100 bg-red-50 text-red-700"
                        />
                      </div>

                      <div className="hidden text-center text-xl text-slate-300 lg:block">
                        →
                      </div>

                      <PipelineNode
                        title="In Progress"
                        value={
                          metrics.inProgressCount
                        }
                        className="border-cyan-100 bg-cyan-50 text-cyan-700"
                      />
                    </div>

                    <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
                      <PipelineNode
                        title="Submitted"
                        value={
                          metrics.submittedCount
                        }
                        className="border-violet-100 bg-violet-50 text-violet-700"
                      />

                      <div className="hidden text-center text-xl text-slate-300 lg:block">
                        →
                      </div>

                      <PipelineNode
                        title="Won"
                        value={
                          metrics.wonCount
                        }
                        className="border-emerald-100 bg-emerald-50 text-emerald-700"
                      />

                      <div className="hidden text-center text-xl text-slate-300 lg:block">
                        /
                      </div>

                      <PipelineNode
                        title="Lost"
                        value={
                          metrics.lostCount
                        }
                        className="border-red-100 bg-red-50 text-red-700"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* ================================================= */}
                {/* RECENT RFP + DEADLINES */}
                {/* ================================================= */}

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                    <CardHeader className="border-b border-blue-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent RFPs
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Latest RFPs added to the
                            bid pipeline
                          </p>
                        </div>

                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentRfps.length >
                      0 ? (
                        metrics.recentRfps.map(
                          (rfp) => (
                            <RecentRfpRow
                              key={rfp.id}
                              rfp={rfp}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <FileText className="h-10 w-10 text-blue-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No RFPs found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-lg shadow-amber-100/30">
                    <CardHeader className="border-b border-amber-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Upcoming Deadlines
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            RFP submissions due within
                            the next seven days
                          </p>
                        </div>

                        <CalendarClock className="h-5 w-5 text-amber-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.upcomingRfps.length >
                      0 ? (
                        metrics.upcomingRfps.map(
                          (rfp) => (
                            <DeadlineRow
                              key={rfp.id}
                              rfp={rfp}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <CalendarClock className="h-10 w-10 text-amber-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No upcoming deadlines
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* ================================================= */}
                {/* EVALUATIONS + ASSIGNMENTS */}
                {/* ================================================= */}

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/30">
                    <CardHeader className="border-b border-indigo-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Bid Evaluations
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Backend-calculated BID /
                            NO_BID evaluations
                          </p>
                        </div>

                        <BadgeCheck className="h-5 w-5 text-indigo-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentEvaluations.length >
                      0 ? (
                        metrics.recentEvaluations.map(
                          (evaluation) => (
                            <EvaluationRow
                              key={
                                evaluation.id
                              }
                              evaluation={
                                evaluation
                              }
                              rfp={findRfp(
                                evaluation.rfp_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <BadgeCheck className="h-10 w-10 text-indigo-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No evaluations found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-lg shadow-cyan-100/30">
                    <CardHeader className="border-b border-cyan-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Assignments
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Cross-functional bid team
                            assignments
                          </p>
                        </div>

                        <Users className="h-5 w-5 text-cyan-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentAssignments.length >
                      0 ? (
                        metrics.recentAssignments.map(
                          (assignment) => (
                            <AssignmentRow
                              key={
                                assignment.id
                              }
                              assignment={
                                assignment
                              }
                              rfp={findRfp(
                                assignment.rfp_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Users className="h-10 w-10 text-cyan-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No assignments found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* ================================================= */}
                {/* BOTTOM SUMMARY */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-2xl border-indigo-100 bg-white shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                        <BadgeCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Avg. Evaluation Score
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.averageEvaluationScore.toFixed(
                            1,
                          )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-blue-100 bg-white shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                        <Users className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Assignments
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {
                            metrics.totalAssignments
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-red-100 bg-white shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-red-100 p-3 text-red-700">
                        <XCircle className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          NO BID
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {
                            metrics.noBidCount
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-amber-100 bg-white shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Overdue
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {
                            metrics.overdueRfps
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
