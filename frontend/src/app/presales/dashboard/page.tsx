"use client";

import Link from "next/link";
import {
  Boxes,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Send,
  ServerCog,
  Users,
  Workflow,
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
import { usePresalesDashboard } from "@/hooks/usePresalesDashboard";

import type {
  Estimation,
  Proposal,
  ResourceRequirement,
  Solution,
} from "@/types/presales";

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
    return `$${amount.toLocaleString("en-US")}`;
  }
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not available";
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

function getSolutionStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "IN_REVIEW":
      return "bg-amber-100 text-amber-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
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

function getAvailabilityClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-700";

    case "PARTIALLY_AVAILABLE":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getProposalStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "SUBMITTED":
      return "bg-indigo-100 text-indigo-700";

    case "IN_REVIEW":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function SolutionRow({
  solution,
}: {
  solution: Solution;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50/60 hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <Layers3 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">
              {solution.solution_name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Opportunity #{solution.opportunity_id}
            </p>

            <p className="mt-2 line-clamp-2 text-sm text-slate-500">
              {solution.solution_summary}
            </p>
          </div>
        </div>

        <Badge
          className={getSolutionStatusClasses(
            solution.solution_status,
          )}
        >
          {formatLabel(solution.solution_status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Delivery
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatLabel(solution.delivery_model)}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Duration
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {solution.estimated_duration_months} months
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs text-slate-500">
            Owner ID
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {solution.presales_owner_id}
          </p>
        </div>
      </div>
    </div>
  );
}

function EstimationRow({
  estimation,
}: {
  estimation: Estimation;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            Solution #{estimation.solution_id}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatLabel(estimation.estimation_model)}
          </p>
        </div>

        <Badge
          className={getApprovalClasses(
            estimation.approval_status,
          )}
        >
          {formatLabel(estimation.approval_status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Billing
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {formatCurrency(
              estimation.billing_amount,
              estimation.currency,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Delivery Cost
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {formatCurrency(
              estimation.total_delivery_cost,
              estimation.currency,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">
            Expected Profit
          </p>

          <p className="mt-1 font-bold text-emerald-700">
            {formatCurrency(
              estimation.expected_profit,
              estimation.currency,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs text-slate-500">
            Margin
          </p>

          <p className="mt-1 font-bold text-cyan-700">
            {estimation.expected_margin_percentage.toFixed(
              2,
            )}
            %
          </p>
        </div>
      </div>
    </div>
  );
}

function ResourceRow({
  resource,
}: {
  resource: ResourceRequirement;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {resource.role_name}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {resource.skill_name}
          </p>
        </div>

        <Badge
          className={getAvailabilityClasses(
            resource.availability_status,
          )}
        >
          {formatLabel(
            resource.availability_status,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Quantity
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {resource.quantity}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Experience
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {formatLabel(resource.experience_level)}
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs text-slate-500">
            Duration
          </p>

          <p className="mt-1 font-bold text-cyan-700">
            {resource.duration_months} months
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">
            Allocation
          </p>

          <p className="mt-1 font-bold text-emerald-700">
            {resource.allocation_percentage}%
          </p>
        </div>
      </div>
    </div>
  );
}

function ProposalRow({
  proposal,
}: {
  proposal: Proposal;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {proposal.proposal_title}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Version {proposal.version}
          </p>
        </div>

        <Badge
          className={getProposalStatusClasses(
            proposal.proposal_status,
          )}
        >
          {formatLabel(proposal.proposal_status)}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Approval
          </p>

          <Badge
            className={`mt-1 ${getApprovalClasses(
              proposal.approval_status,
            )}`}
          >
            {formatLabel(proposal.approval_status)}
          </Badge>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Submission
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            {formatDate(proposal.submission_date)}
          </p>
        </div>
      </div>

      {proposal.remarks && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-500">
          {proposal.remarks}
        </p>
      )}
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-blue-100 p-4">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>

        <p className="text-sm text-slate-500">
          Loading Presales dashboard...
        </p>
      </div>
    </div>
  );
}

export default function PresalesDashboardPage() {
  const {
    data,
    metrics,
    isLoading,
    error,
    refresh,
  } = usePresalesDashboard();

  return (
    <ProtectedRoute allowedRole="PRESALES">
      <DashboardLayout
        title="Presales Dashboard"
        description="Manage solution design, commercial estimation, resource planning and proposals."
      >
        {isLoading && !data ? (
          <DashboardLoading />
        ) : (
          <div id="dashboard" className="space-y-6">
            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Presales Workspace
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Move qualified opportunities from solution
                  design through estimation, resource planning
                  and proposal submission.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  render={
                    <Link href="/presales/solutions" />
                  }
                  nativeButton={false}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Solution
                </Button>

                <Button
                  render={
                    <Link href="/presales/estimations" />
                  }
                  nativeButton={false}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Add Estimation
                </Button>

                <Button
                  render={
                    <Link href="/presales/resource-requirements" />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Plan Resources
                </Button>

                <Button
                  render={
                    <Link href="/presales/proposals" />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Create Proposal
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refresh()}
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
                    variant="outline"
                    size="sm"
                    onClick={() => void refresh()}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {metrics && data && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total Solutions"
                    value={metrics.totalSolutions.toLocaleString(
                      "en-US",
                    )}
                    description="Solution designs created by Presales"
                    icon={Layers3}
                    variant="blue"
                  />

                  <StatCard
                    title="Approved Solutions"
                    value={metrics.approvedSolutions.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.reviewSolutions} currently in review`}
                    icon={CheckCircle2}
                    variant="indigo"
                  />

                  <StatCard
                    title="Pending Estimations"
                    value={metrics.pendingEstimations.toLocaleString(
                      "en-US",
                    )}
                    description="Commercial estimations awaiting approval"
                    icon={Calculator}
                    variant="cyan"
                  />

                  <StatCard
                    title="Submitted Proposals"
                    value={metrics.submittedProposals.toLocaleString(
                      "en-US",
                    )}
                    description="Proposals submitted for customer review"
                    icon={Send}
                    variant="emerald"
                  />
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Estimated Revenue"
                    value={formatCurrency(
                      metrics.totalEstimatedRevenue,
                    )}
                    description="Total billing amount across estimations"
                    icon={CircleDollarSign}
                    variant="blue"
                  />

                  <StatCard
                    title="Delivery Cost"
                    value={formatCurrency(
                      metrics.totalDeliveryCost,
                    )}
                    description="Total backend-calculated delivery cost"
                    icon={ServerCog}
                    variant="indigo"
                  />

                  <StatCard
                    title="Expected Profit"
                    value={formatCurrency(
                      metrics.expectedProfit,
                    )}
                    description="Expected profit across estimations"
                    icon={BriefcaseBusiness}
                    variant="cyan"
                  />

                  <StatCard
                    title="Average Margin"
                    value={`${metrics.averageMargin.toFixed(
                      1,
                    )}%`}
                    description="Average expected margin percentage"
                    icon={Gauge}
                    variant="emerald"
                  />
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                    <CardHeader className="border-b border-blue-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Solutions
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Latest solution designs linked to
                            sales opportunities
                          </p>
                        </div>

                        <Layers3 className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentSolutions.length >
                      0 ? (
                        metrics.recentSolutions.map(
                          (solution) => (
                            <SolutionRow
                              key={solution.id}
                              solution={solution}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Layers3 className="h-10 w-10 text-blue-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No solutions found
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Create a solution to begin the
                            Presales workflow.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-lg shadow-indigo-100/30">
                    <CardHeader className="border-b border-indigo-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Latest Estimations
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Commercial cost, revenue and margin
                            calculations
                          </p>
                        </div>

                        <Calculator className="h-5 w-5 text-indigo-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentEstimations.length >
                      0 ? (
                        metrics.recentEstimations.map(
                          (estimation) => (
                            <EstimationRow
                              key={estimation.id}
                              estimation={estimation}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Calculator className="h-10 w-10 text-indigo-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No estimations found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-lg shadow-cyan-100/30">
                    <CardHeader className="border-b border-cyan-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Resource Requirements
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Skills and people required for
                            delivery
                          </p>
                        </div>

                        <Users className="h-5 w-5 text-cyan-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentResources.length >
                      0 ? (
                        metrics.recentResources.map(
                          (resource) => (
                            <ResourceRow
                              key={resource.id}
                              resource={resource}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Users className="h-10 w-10 text-cyan-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No resource requirements found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/30">
                    <CardHeader className="border-b border-emerald-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Proposals
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Proposal preparation and approval
                            status
                          </p>
                        </div>

                        <FileText className="h-5 w-5 text-emerald-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentProposals.length >
                      0 ? (
                        metrics.recentProposals.map(
                          (proposal) => (
                            <ProposalRow
                              key={proposal.id}
                              proposal={proposal}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <FileText className="h-10 w-10 text-emerald-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No proposals found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                        <Workflow className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Draft Solutions
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.draftSolutions}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Approved Estimations
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.approvedEstimations}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700">
                        <Boxes className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Resource Requirements
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {
                            data.resourceRequirements
                              .length
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Approved Proposals
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.approvedProposals}
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
