"use client";

import Link from "next/link";
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  CircleGauge,
  Clock3,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  ShieldCheck,
  UserRoundCheck,
  Users,
  Wrench,
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

import { useResourceManagerDashboard } from "@/hooks/useResourceManagerDashboard";

import type {
  EmployeeSkill,
  ResourceAllocation,
  ResourceEmployee,
  ResourceRequest,
} from "@/types/resource-manager";

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

function getAvailabilityClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-700";

    case "PARTIALLY_AVAILABLE":
      return "bg-amber-100 text-amber-700";

    case "ALLOCATED":
      return "bg-indigo-100 text-indigo-700";

    case "UNAVAILABLE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getRequestStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "ALLOCATED":
      return "bg-emerald-100 text-emerald-700";

    case "IN_PROGRESS":
      return "bg-indigo-100 text-indigo-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getAllocationStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "CONFIRMED":
      return "bg-emerald-100 text-emerald-700";

    case "COMPLETED":
      return "bg-blue-100 text-blue-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

/* ================================================= */
/* EMPLOYEE ROW */
/* ================================================= */

function EmployeeRow({
  employee,
}: {
  employee: ResourceEmployee;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:-translate-y-0.5 hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-800">
              {employee.full_name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {employee.designation}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {employee.employee_code} ·{" "}
              {employee.department}
            </p>
          </div>
        </div>

        <Badge
          className={getAvailabilityClasses(
            employee.availability_status,
          )}
        >
          {formatLabel(
            employee.availability_status,
          )}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Utilization</span>

          <span className="font-semibold">
            {
              employee.current_utilization_percentage
            }
            %
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  employee.current_utilization_percentage,
                ),
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Experience
          </p>

          <p className="mt-1 font-semibold text-blue-700">
            {employee.total_experience_years} yrs
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Location
          </p>

          <p className="mt-1 font-semibold text-indigo-700">
            {employee.location}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* REQUEST ROW */
/* ================================================= */

function ResourceRequestRow({
  request,
}: {
  request: ResourceRequest;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {request.requested_role}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {request.required_skill}
          </p>
        </div>

        <Badge
          className={getRequestStatusClasses(
            request.request_status,
          )}
        >
          {formatLabel(
            request.request_status,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Quantity
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {request.quantity}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Allocation
          </p>

          <p className="mt-1 font-bold text-indigo-700">
            {request.allocation_percentage}%
          </p>
        </div>

        <div className="rounded-lg bg-cyan-50 p-3">
          <p className="text-xs text-slate-500">
            Experience
          </p>

          <p className="mt-1 font-bold text-cyan-700">
            {formatLabel(
              request.experience_level,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 p-3">
          <p className="text-xs text-slate-500">
            Required From
          </p>

          <p className="mt-1 text-sm font-bold text-emerald-700">
            {formatDate(
              request.required_from,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* ALLOCATION ROW */
/* ================================================= */

function AllocationRow({
  allocation,
  employee,
}: {
  allocation: ResourceAllocation;
  employee?: ResourceEmployee;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {employee?.full_name ??
              `Employee #${allocation.employee_id}`}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {formatLabel(
              allocation.allocation_type,
            )}
          </p>
        </div>

        <Badge
          className={getAllocationStatusClasses(
            allocation.allocation_status,
          )}
        >
          {formatLabel(
            allocation.allocation_status,
          )}
        </Badge>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-slate-500">
          <span>Allocation</span>

          <span className="font-semibold">
            {allocation.allocation_percentage}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-indigo-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  allocation.allocation_percentage,
                ),
              )}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Start Date
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-700">
            {formatDate(
              allocation.start_date,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            End Date
          </p>

          <p className="mt-1 text-sm font-semibold text-indigo-700">
            {formatDate(
              allocation.end_date,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* EMPLOYEE SKILL ROW */
/* ================================================= */

function EmployeeSkillRow({
  employeeSkill,
  employee,
  skillName,
}: {
  employeeSkill: EmployeeSkill;
  employee?: ResourceEmployee;
  skillName: string;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 transition hover:bg-blue-50/50 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-800">
            {employee?.full_name ??
              `Employee #${employeeSkill.employee_id}`}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {skillName}
          </p>
        </div>

        <Badge className="bg-indigo-100 text-indigo-700">
          {formatLabel(
            employeeSkill.proficiency_level,
          )}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs text-slate-500">
            Skill Experience
          </p>

          <p className="mt-1 font-bold text-blue-700">
            {employeeSkill.experience_years} yrs
          </p>
        </div>

        <div className="rounded-lg bg-indigo-50 p-3">
          <p className="text-xs text-slate-500">
            Certification
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-indigo-700">
            {employeeSkill.certification_name ||
              "Not added"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* LOADER */
/* ================================================= */

function DashboardLoading() {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-2xl bg-blue-100 p-4">
          <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
        </div>

        <p className="text-sm text-slate-500">
          Loading Resource Manager dashboard...
        </p>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default function ResourceManagerDashboardPage() {
  const {
    data,
    metrics,
    isLoading,
    error,
    refresh,
  } = useResourceManagerDashboard();

  function findEmployee(
    employeeId: number,
  ): ResourceEmployee | undefined {
    return data?.employees.find(
      (employee) =>
        employee.id === employeeId,
    );
  }

  function findSkillName(
    skillId: number,
  ): string {
    return (
      data?.skills.find(
        (skill) =>
          skill.id === skillId,
      )?.name ??
      `Skill #${skillId}`
    );
  }

  return (
    <ProtectedRoute allowedRole="RESOURCE_MANAGER">
      <DashboardLayout
        title="Resource Manager Dashboard"
        description="Manage workforce availability, skills, resource demand and project allocation."
      >
        {isLoading && !data ? (
          <DashboardLoading />
        ) : (
          <div id="dashboard" className="space-y-6">

            {/* ================================================= */}
            {/* QUICK ACTIONS */}
            {/* ================================================= */}

            <section className="flex flex-col justify-between gap-4 rounded-2xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-100/30 backdrop-blur xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Resource Management Workspace
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Manage employees, maintain the skill
                  inventory, review project demand and
                  allocate available resources.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  render={
                    <Link href="/resource-manager/employees" />
                  }
                  nativeButton={false}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Plus className="mr-2 h-4 w-4" />

                  Add Employee
                </Button>

                <Button
                  render={
                    <Link href="/resource-manager/resource-requests" />
                  }
                  nativeButton={false}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  <BriefcaseBusiness className="mr-2 h-4 w-4" />

                  Resource Requests
                </Button>

                <Button
                  render={
                    <Link href="/resource-manager/resource-allocations" />
                  }
                  nativeButton={false}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <UserRoundCheck className="mr-2 h-4 w-4" />

                  Allocate Resource
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
                {/* MAIN KPI CARDS */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Active Employees"
                    value={metrics.activeEmployees.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.totalEmployees} total employees`}
                    icon={Users}
                    variant="blue"
                  />

                  <StatCard
                    title="Available Employees"
                    value={metrics.availableEmployees.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.partiallyAvailableEmployees} partially available`}
                    icon={UserRoundCheck}
                    variant="indigo"
                  />

                  <StatCard
                    title="Average Utilization"
                    value={`${metrics.averageUtilization.toFixed(
                      1,
                    )}%`}
                    description={`${metrics.allocatedEmployees} employees fully allocated`}
                    icon={CircleGauge}
                    variant="cyan"
                  />

                  <StatCard
                    title="Pending Requests"
                    value={metrics.pendingRequests.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.inProgressRequests} currently in progress`}
                    icon={Clock3}
                    variant="emerald"
                  />
                </section>

                {/* ================================================= */}
                {/* SECOND KPI ROW */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    title="Active Skills"
                    value={metrics.activeSkills.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.totalEmployeeSkills} employee-skill mappings`}
                    icon={Wrench}
                    variant="blue"
                  />

                  <StatCard
                    title="Active Allocations"
                    value={metrics.activeAllocations.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.confirmedAllocations} confirmed allocations`}
                    icon={Activity}
                    variant="indigo"
                  />

                  <StatCard
                    title="Soft Bookings"
                    value={metrics.softBookings.toLocaleString(
                      "en-US",
                    )}
                    description="Resources provisionally reserved"
                    icon={Layers3}
                    variant="cyan"
                  />

                  <StatCard
                    title="Allocated Requests"
                    value={metrics.allocatedRequests.toLocaleString(
                      "en-US",
                    )}
                    description={`${metrics.averageAllocationPercentage.toFixed(
                      1,
                    )}% average allocation`}
                    icon={CheckCircle2}
                    variant="emerald"
                  />
                </section>

                {/* ================================================= */}
                {/* EMPLOYEE + REQUEST */}
                {/* ================================================= */}

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/30">
                    <CardHeader className="border-b border-blue-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Employees
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Latest employees added to the
                            resource pool
                          </p>
                        </div>

                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentEmployees.length >
                      0 ? (
                        metrics.recentEmployees.map(
                          (employee) => (
                            <EmployeeRow
                              key={employee.id}
                              employee={employee}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <Users className="h-10 w-10 text-blue-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No employees found
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            Add employees to build the
                            resource pool.
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
                            Latest Resource Requests
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Current resource demand from
                            projects and solutions
                          </p>
                        </div>

                        <BriefcaseBusiness className="h-5 w-5 text-indigo-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentRequests.length >
                      0 ? (
                        metrics.recentRequests.map(
                          (request) => (
                            <ResourceRequestRow
                              key={request.id}
                              request={request}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <BriefcaseBusiness className="h-10 w-10 text-indigo-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No resource requests
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* ================================================= */}
                {/* ALLOCATIONS + SKILLS */}
                {/* ================================================= */}

                <section className="grid gap-6 xl:grid-cols-2">
                  <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-lg shadow-cyan-100/30">
                    <CardHeader className="border-b border-cyan-50">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg font-bold text-slate-800">
                            Recent Allocations
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Latest employee assignments and
                            bookings
                          </p>
                        </div>

                        <UserRoundCheck className="h-5 w-5 text-cyan-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentAllocations
                        .length > 0 ? (
                        metrics.recentAllocations.map(
                          (allocation) => (
                            <AllocationRow
                              key={allocation.id}
                              allocation={allocation}
                              employee={findEmployee(
                                allocation.employee_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <UserRoundCheck className="h-10 w-10 text-cyan-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No resource allocations
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
                            Employee Skills
                          </CardTitle>

                          <p className="mt-1 text-sm text-slate-500">
                            Recent skill and certification
                            assignments
                          </p>
                        </div>

                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 p-5">
                      {metrics.recentEmployeeSkills
                        .length > 0 ? (
                        metrics.recentEmployeeSkills.map(
                          (employeeSkill) => (
                            <EmployeeSkillRow
                              key={employeeSkill.id}
                              employeeSkill={
                                employeeSkill
                              }
                              employee={findEmployee(
                                employeeSkill.employee_id,
                              )}
                              skillName={findSkillName(
                                employeeSkill.skill_id,
                              )}
                            />
                          ),
                        )
                      ) : (
                        <div className="flex min-h-48 flex-col items-center justify-center text-center">
                          <BadgeCheck className="h-10 w-10 text-emerald-300" />

                          <p className="mt-3 font-semibold text-slate-700">
                            No employee skills found
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>

                {/* ================================================= */}
                {/* SMALL SUMMARY */}
                {/* ================================================= */}

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Total Skills
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.totalSkills}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-indigo-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
                        <UserRoundCheck className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          Hard Bookings
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.hardBookings}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-cyan-100 bg-white/90 shadow-md">
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="rounded-xl bg-cyan-100 p-3 text-cyan-700">
                        <Activity className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="text-sm text-slate-500">
                          In Progress Requests
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.inProgressRequests}
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
                          Confirmed Allocations
                        </p>

                        <p className="text-2xl font-bold text-slate-800">
                          {metrics.confirmedAllocations}
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
