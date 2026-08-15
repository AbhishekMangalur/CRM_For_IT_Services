"use client";

import {
  Activity,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  Target,
  UserRoundCheck,
  Users,
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
import { useSalesDashboard } from "@/hooks/useSalesDashboard";
import type {
  PipelineStageData,
  SalesActivity,
  SalesOpportunity,
} from "@/types/sales";
import Link from "next/link";
import { Plus } from "lucide-react";

function formatCurrency(
  value: number,
  currency = "USD",
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${value.toLocaleString("en-US")}`;
  }
}

function formatDate(
  value: string | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(
  value: string | null,
): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function getOpportunityStatusClasses(
  status: string,
): string {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus === "WON" ||
    normalizedStatus === "CLOSED_WON"
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    normalizedStatus === "LOST" ||
    normalizedStatus === "CLOSED_LOST"
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}

function getActivityStatusClasses(
  status: string,
): string {
  const normalizedStatus = status.toUpperCase();

  if (normalizedStatus === "COMPLETED") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (normalizedStatus === "CANCELLED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
}

function OpportunityRow({
  opportunity,
}: {
  opportunity: SalesOpportunity;
}) {
  const dealValue = Number(
    opportunity.deal_value,
  );

  return (
    <div className="group flex flex-col justify-between gap-4 rounded-xl border border-blue-100 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
          <BriefcaseBusiness className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-800">
            {opportunity.opportunity_name}
          </p>

          <p className="mt-1 truncate text-sm text-slate-500">
            {opportunity.client_name}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Badge
              className={getOpportunityStatusClasses(
                opportunity.status,
              )}
            >
              {formatLabel(opportunity.status)}
            </Badge>

            <Badge
              variant="outline"
              className="border-indigo-200 text-indigo-700"
            >
              {formatLabel(
                opportunity.pipeline_stage,
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-6 sm:text-right">
        <div>
          <p className="text-xs text-slate-500">
            Probability
          </p>

          <p className="font-semibold text-blue-700">
            {opportunity.win_probability}%
          </p>
        </div>

        <div>
          <p className="text-xs text-slate-500">
            Deal value
          </p>

          <p className="font-bold text-slate-800">
            {formatCurrency(
              Number.isFinite(dealValue)
                ? dealValue
                : 0,
              opportunity.currency,
            )}
          </p>
        </div>

        <div className="hidden md:block">
          <p className="text-xs text-slate-500">
            Close date
          </p>

          <p className="text-sm font-medium text-slate-700">
            {formatDate(
              opportunity.expected_close_date,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
}: {
  activity: SalesActivity;
}) {
  return (
    <div className="flex gap-4 rounded-xl border border-blue-100 bg-white p-4 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-md">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
        <Activity className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">
              {activity.subject}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {formatLabel(activity.activity_type)}
            </p>
          </div>

          <Badge
            className={getActivityStatusClasses(
              activity.status,
            )}
          >
            {formatLabel(activity.status)}
          </Badge>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDateTime(activity.activity_date)}
          </span>

          {activity.next_follow_up_date && (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              Follow-up:{" "}
              {formatDateTime(
                activity.next_follow_up_date,
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SalesDashboardLoading() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-blue-100 p-4">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>

        <p className="text-sm text-slate-500">
          Loading Sales dashboard data...
        </p>
      </div>
    </div>
  );
}

export default function SalesDashboardPage() {
  const {
    data,
    isLoading,
    error,
    refresh,
  } = useSalesDashboard();

  return (
    <ProtectedRoute allowedRole="SALES">
      <DashboardLayout
        title="Sales Dashboard"
        description="Live pipeline, leads and sales activity from your CRM database."
      >
        {isLoading && !data ? (
          <SalesDashboardLoading />
        ) : (
          <div id="dashboard" className="space-y-6">
            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Quick Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add and manage your Sales records.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  render={<Link href="/sales/leads" />}
                  nativeButton={false}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Lead
                </Button>

                <Button
                  render={<Link href="/sales/opportunities" />}
                  nativeButton={false}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  <BriefcaseBusiness className="mr-2 h-4 w-4" />
                  Create Opportunity
                </Button>

                <Button
                  render={<Link href="/sales/activities" />}
                  nativeButton={false}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            </section>

            {error && (
              <Alert
                variant="destructive"
                className="rounded-xl"
              >
                <AlertDescription className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <span>{error}</span>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void refresh()}
                  >
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {data && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Total Pipeline Value"
                    value={formatCurrency(
                      data.totalPipelineValue,
                    )}
                    description="Combined value of open opportunities"
                    icon={CircleDollarSign}
                    variant="blue"
                  />

                  <StatCard
                    title="Open Opportunities"
                    value={data.openOpportunities.toLocaleString(
                      "en-US",
                    )}
                    description="Opportunities currently in progress"
                    icon={BriefcaseBusiness}
                    variant="indigo"
                  />

                  <StatCard
                    title="Average Win Probability"
                    value={`${Math.round(
                      data.averageWinProbability,
                    )}%`}
                    description="Average across open opportunities"
                    icon={Target}
                    variant="cyan"
                  />

                  <StatCard
                    title="Pending Follow-ups"
                    value={data.pendingFollowUps.toLocaleString(
                      "en-US",
                    )}
                    description="Upcoming non-cancelled follow-ups"
                    icon={CalendarClock}
                    variant="emerald"
                  />
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-md shadow-blue-100/30">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                        <Users className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Total Leads
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {data.totalLeads}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-md shadow-indigo-100/30">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                        <UserRoundCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Qualified Leads
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {data.qualifiedLeads}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-amber-100 bg-white/90 shadow-md shadow-amber-100/30">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                        <Target className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          High-Priority Leads
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {data.highPriorityLeads}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-emerald-100 bg-white/90 shadow-md shadow-emerald-100/30">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Completed Activities
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {data.completedActivities}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                  <Card
                    id="opportunities"
                    className="rounded-2xl border-blue-100/80 bg-white/90 shadow-lg shadow-blue-100/40 backdrop-blur"
                  >
                    <CardHeader className="border-b border-blue-50">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Opportunities
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Latest opportunities loaded from
                            the database
                          </p>
                        </div>

                        <Badge className="w-fit bg-blue-100 text-blue-700 hover:bg-blue-100">
                          {data.opportunities.length} loaded
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.recentOpportunities.length >
                      0 ? (
                        data.recentOpportunities.map(
                          (opportunity: SalesOpportunity) => (
                            <OpportunityRow
                              key={opportunity.id}
                              opportunity={opportunity}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/40 text-center">
                          <BriefcaseBusiness className="h-9 w-9 text-blue-300" />

                          <p className="mt-3 font-medium text-slate-700">
                            No opportunities found
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Create an opportunity to display it
                            here.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100/80 bg-white/90 shadow-lg shadow-indigo-100/40 backdrop-blur">
                    <CardHeader className="border-b border-indigo-50">
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Pipeline Stages
                      </CardTitle>

                      <p className="text-sm text-slate-500">
                        Opportunity distribution by stage
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4 p-5">
                      {data.pipelineStages.length > 0 ? (
                        data.pipelineStages.map(
                          (
                            stage: PipelineStageData,
                            index: number,
                          ) => {
                            const percentage =
                              data.opportunities.length > 0
                                ? Math.round(
                                    (stage.count /
                                      data.opportunities
                                        .length) *
                                      100,
                                  )
                                : 0;

                            return (
                              <div key={stage.stage}>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700">
                                      {formatLabel(
                                        stage.stage,
                                      )}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      {stage.count} opportunity
                                      {stage.count === 1
                                        ? ""
                                        : "ies"}
                                    </p>
                                  </div>

                                  <p className="text-sm font-bold text-indigo-700">
                                    {formatCurrency(
                                      stage.value,
                                    )}
                                  </p>
                                </div>

                                <div className="h-2 overflow-hidden rounded-full bg-indigo-100">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
                                    style={{
                                      width: `${Math.max(
                                        percentage,
                                        index ===
                                          data
                                            .pipelineStages
                                            .length -
                                            1
                                          ? 4
                                          : 0,
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          },
                        )
                      ) : (
                        <div className="flex min-h-52 flex-col items-center justify-center text-center">
                          <Target className="h-9 w-9 text-indigo-300" />

                          <p className="mt-3 font-medium text-slate-700">
                            No pipeline data
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-blue-100/80 bg-white/90 shadow-lg shadow-blue-100/40 backdrop-blur">
                    <CardHeader className="border-b border-blue-50">
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Recent Sales Activities
                      </CardTitle>

                      <p className="text-sm text-slate-500">
                        Latest calls, meetings and follow-ups
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.recentActivities.length > 0 ? (
                        data.recentActivities.map(
                          (activity: SalesActivity) => (
                            <ActivityRow
                              key={activity.id}
                              activity={activity}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Activity className="h-9 w-9 text-blue-300" />

                          <p className="mt-3 font-medium text-slate-700">
                            No sales activities found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-emerald-100/80 bg-white/90 shadow-lg shadow-emerald-100/40 backdrop-blur">
                    <CardHeader className="border-b border-emerald-50">
                      <CardTitle className="text-lg font-bold text-slate-800">
                        Upcoming Follow-ups
                      </CardTitle>

                      <p className="text-sm text-slate-500">
                        Next scheduled client interactions
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {data.upcomingFollowUps.length >
                      0 ? (
                        data.upcomingFollowUps.map(
                          (activity: SalesActivity) => (
                            <div
                              key={activity.id}
                              className="flex items-start gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 transition hover:bg-emerald-50"
                            >
                              <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700">
                                <CalendarClock className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-800">
                                  {activity.subject}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {formatLabel(
                                    activity.activity_type,
                                  )}
                                </p>

                                <p className="mt-2 text-xs font-medium text-emerald-700">
                                  {formatDateTime(
                                    activity.next_follow_up_date,
                                  )}
                                </p>
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <CalendarClock className="h-9 w-9 text-emerald-300" />

                          <p className="mt-3 font-medium text-slate-700">
                            No upcoming follow-ups
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Scheduled follow-ups will appear
                            here.
                          </p>
                        </div>
                      )}
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
