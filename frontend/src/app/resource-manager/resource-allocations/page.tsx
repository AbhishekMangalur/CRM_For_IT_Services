"use client";

import {
  ChangeEvent,
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Eye,
  Layers3,
  Loader2,
  RefreshCcw,
  Search,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
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

import { api } from "@/lib/api";

import {
  createResourceAllocation,
  getEmployees,
  getResourceAllocations,
  getResourceRequests,
} from "@/lib/resource-manager-api";

import { getSalesOpportunities } from "@/lib/sales-api";
import { getSolutions } from "@/lib/presales-api";

import type {
  AllocationStatus,
  AllocationType,
  CreateResourceAllocationRequest,
  ResourceAllocation,
  ResourceEmployee,
  ResourceRequest,
} from "@/types/resource-manager";

import type { SalesOpportunity } from "@/types/sales";
import type { Solution } from "@/types/presales";

interface AllocationUser {
  id: number;
  full_name: string;
}

async function getAllocationUsers(): Promise<AllocationUser[]> {
  const response = await api.get<AllocationUser[]>("/api/users");
  return response.data;
}

/* ================================================= */
/* FORM */
/* ================================================= */

interface AllocationFormState {
  employee_id: string;
  opportunity_id: string;
  solution_id: string;
  resource_request_id: string;
  allocation_type: AllocationType;
  allocation_percentage: string;
  start_date: string;
  end_date: string;
  allocation_status: AllocationStatus;
  notes: string;
}

const EMPTY_FORM: AllocationFormState = {
  employee_id: "",
  opportunity_id: "",
  solution_id: "",
  resource_request_id: "",
  allocation_type: "SOFT_BOOKING",
  allocation_percentage: "100",
  start_date: "",
  end_date: "",
  allocation_status: "CONFIRMED",
  notes: "",
};

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

function formatDate(value: string | null): string {
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

function getAllocationTypeClasses(
  type: string,
): string {
  switch (type.toUpperCase()) {
    case "HARD_BOOKING":
      return "bg-indigo-100 text-indigo-700";

    default:
      return "bg-cyan-100 text-cyan-700";
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

    case "ALLOCATED":
      return "bg-indigo-100 text-indigo-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function allocationToForm(
  allocation: ResourceAllocation,
): AllocationFormState {
  return {
    employee_id: allocation.employee_id.toString(),

    opportunity_id:
      allocation.opportunity_id?.toString() ?? "",

    solution_id:
      allocation.solution_id?.toString() ?? "",

    resource_request_id:
      allocation.resource_request_id?.toString() ?? "",

    allocation_type:
      allocation.allocation_type,

    allocation_percentage:
      allocation.allocation_percentage.toString(),

    start_date:
      allocation.start_date,

    end_date:
      allocation.end_date ?? "",

    allocation_status:
      allocation.allocation_status,

    notes:
      allocation.notes ?? "",
  };
}

function formToPayload(
  form: AllocationFormState,
  allocatedBy: number,
): CreateResourceAllocationRequest {
  return {
    employee_id:
      Number(form.employee_id),

    opportunity_id:
      form.opportunity_id
        ? Number(form.opportunity_id)
        : null,

    solution_id:
      form.solution_id
        ? Number(form.solution_id)
        : null,

    resource_request_id:
      form.resource_request_id
        ? Number(form.resource_request_id)
        : null,

    allocation_type:
      form.allocation_type,

    allocation_percentage:
      Number(form.allocation_percentage),

    start_date:
      form.start_date,

    end_date:
      form.end_date || null,

    allocation_status:
      form.allocation_status,

    allocated_by:
      allocatedBy,

    notes:
      form.notes.trim() || null,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface AllocationFormModalProps {
  allocation: ResourceAllocation | null;
  employees: ResourceEmployee[];
  opportunities: SalesOpportunity[];
  solutions: Solution[];
  resourceRequests: ResourceRequest[];
  currentUserId: number;
  currentUserName: string;
  isSaving: boolean;
  error: string;
  prefill?: {
    employee_id?: string;
    resource_request_id?: string;
    opportunity_id?: string;
    solution_id?: string;
    start_date?: string;
    end_date?: string;
    allocation_percentage?: string;
  };
  onClose: () => void;
  onSubmit: (
    payload: CreateResourceAllocationRequest,
  ) => Promise<void>;
}

function AllocationFormModal({
  allocation,
  employees,
  opportunities,
  solutions,
  resourceRequests,
  currentUserId,
  currentUserName,
  isSaving,
  error,
  prefill,
  onClose,
  onSubmit,
}: AllocationFormModalProps) {
  const [form, setForm] =
    useState<AllocationFormState>(() => {
      if (allocation) {
        return allocationToForm(
          allocation,
        );
      }

      return {
        ...EMPTY_FORM,

        employee_id:
          prefill?.employee_id ?? "",

        resource_request_id:
          prefill?.resource_request_id ??
          "",

        opportunity_id:
          prefill?.opportunity_id ?? "",

        solution_id:
          prefill?.solution_id ?? "",

        start_date:
          prefill?.start_date ?? "",

        end_date:
          prefill?.end_date ?? "",

        allocation_percentage:
          prefill?.allocation_percentage ?? "",
      };
    });

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ): void {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const invalidDateRange =
    Boolean(form.start_date) &&
    Boolean(form.end_date) &&
    new Date(form.end_date).getTime() <
      new Date(form.start_date).getTime();

  const selectedEmployee = employees.find(
    (employee) =>
      employee.id.toString() === form.employee_id,
  );

  const startsBeforeEmployeeAvailability =
    Boolean(form.start_date) &&
    Boolean(selectedEmployee?.available_from) &&
    form.start_date < selectedEmployee!.available_from!;

  const isInvalid =
    !form.employee_id ||
    !form.start_date ||
    !form.allocation_percentage ||
    Number(form.allocation_percentage) <= 0 ||
    Number(form.allocation_percentage) > 100 ||
    invalidDateRange ||
    startsBeforeEmployeeAvailability;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(
      formToPayload(
        form,
        currentUserId,
      ),
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {allocation
                ? "Resource Allocation"
                : "Allocation Form"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assign an employee to an opportunity,
              solution, or resource request.
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

            {invalidDateRange && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  End date cannot be before start date.
                </AlertDescription>
              </Alert>
            )}

            {startsBeforeEmployeeAvailability && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  {selectedEmployee?.employee_code} is available from{" "}
                  {formatDate(
                    selectedEmployee?.available_from ?? null,
                  )}
                  . Choose that date or a later start date.
                </AlertDescription>
              </Alert>
            )}

            {/* Employee */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="employee_id">
                Employee *
              </Label>

              <select
                id="employee_id"
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select an employee
                </option>

                {employees
                  .filter(
                    (employee) =>
                      employee.is_active,
                  )
                  .map((employee) => (
                    <option
                      key={employee.id}
                      value={employee.id}
                    >
                      {employee.employee_code} -{" "}
                      {employee.full_name} -{" "}
                      {employee.designation} -{" "}
                      {formatLabel(
                        employee.availability_status,
                      )}
                      {employee.available_from
                        ? ` - Available ${formatDate(employee.available_from)}`
                        : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* Resource request */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="resource_request_id">
                Resource Request
              </Label>

              <select
                id="resource_request_id"
                name="resource_request_id"
                value={
                  form.resource_request_id
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  No resource request
                </option>

                {resourceRequests
                  .filter(
                    (request) =>
                      request.request_status !==
                      "CANCELLED",
                  )
                  .map((request) => (
                    <option
                      key={request.id}
                      value={request.id}
                    >
                      {request.requested_role} -{" "}
                      {request.required_skill}
                    </option>
                  ))}
              </select>
            </div>

            {/* Opportunity */}

            <div className="space-y-2">
              <Label htmlFor="opportunity_id">
                Sales Opportunity
              </Label>

              <select
                id="opportunity_id"
                name="opportunity_id"
                value={
                  form.opportunity_id
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  No opportunity
                </option>

                {opportunities.map(
                  (opportunity) => (
                    <option
                      key={opportunity.id}
                      value={opportunity.id}
                    >
                      {
                        opportunity.opportunity_name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Solution */}

            <div className="space-y-2">
              <Label htmlFor="solution_id">
                Presales Solution
              </Label>

              <select
                id="solution_id"
                name="solution_id"
                value={form.solution_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  No solution
                </option>

                {solutions.map(
                  (solution) => (
                    <option
                      key={solution.id}
                      value={solution.id}
                    >
                      {solution.solution_name}
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Allocation Type */}

            <div className="space-y-2">
              <Label htmlFor="allocation_type">
                Allocation type
              </Label>

              <select
                id="allocation_type"
                name="allocation_type"
                value={
                  form.allocation_type
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="SOFT_BOOKING">
                  Soft Booking
                </option>

                <option value="HARD_BOOKING">
                  Hard Booking
                </option>
              </select>
            </div>

            {/* Allocation Percentage */}

            <div className="space-y-2">
              <Label htmlFor="allocation_percentage">
                Allocation (%) *
              </Label>

              <Input
                id="allocation_percentage"
                name="allocation_percentage"
                type="number"
                min="1"
                max="100"
                value={
                  form.allocation_percentage
                }
                onChange={handleChange}
                required
              />

              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          form.allocation_percentage,
                        ) || 0,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Start Date */}

            <div className="space-y-2">
              <Label htmlFor="start_date">
                Start date *
              </Label>

              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                min={
                  selectedEmployee?.available_from ??
                  undefined
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* End Date */}

            <div className="space-y-2">
              <Label htmlFor="end_date">
                End date
              </Label>

              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>

            {/* Status */}

            <div className="space-y-2">
              <Label htmlFor="allocation_status">
                Allocation status
              </Label>

              <select
                id="allocation_status"
                name="allocation_status"
                value={
                  form.allocation_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="CONFIRMED">
                  Confirmed
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            {/* Allocated By */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm font-semibold text-slate-800">
                Allocated By
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {currentUserName}
              </p>
            </div>

            {/* Notes */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">
                Notes
              </Label>

              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Employee assigned to the cloud migration project..."
                rows={4}
              />
            </div>

            {!allocation && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 md:col-span-2">
                <AlertDescription>
                  After a successful allocation, the
                  backend will automatically update the
                  employee&apos;s utilization and availability,
                  and the linked resource request will be
                  marked as allocated.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white/95 px-6 py-4">
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

              {allocation
                ? "Save changes"
                : "Allocate employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================= */
/* DETAILS MODAL */
/* ================================================= */

interface AllocationDetailsModalProps {
  allocation: ResourceAllocation;
  employee?: ResourceEmployee;
  opportunity?: SalesOpportunity;
  solution?: Solution;
  resourceRequest?: ResourceRequest;
  allocatedByName: string;
  onClose: () => void;
}

function AllocationDetailsModal({
  allocation,
  employee,
  opportunity,
  solution,
  resourceRequest,
  allocatedByName,
  onClose,
}: AllocationDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {employee?.full_name ??
                `Employee #${allocation.employee_id}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resource Allocation #{allocation.id}
            </p>
          </div>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Allocation
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                allocation.allocation_percentage
              }
              %
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-3 ${getAllocationStatusClasses(
                allocation.allocation_status,
              )}`}
            >
              {formatLabel(
                allocation.allocation_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Employee
            </p>

            <p className="mt-1 font-semibold">
              {employee?.full_name ??
                `Employee #${allocation.employee_id}`}
            </p>

            {employee && (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  {employee.employee_code} ·{" "}
                  {employee.designation}
                </p>

                <Badge
                  className={`mt-2 ${getAvailabilityClasses(
                    employee.availability_status,
                  )}`}
                >
                  {formatLabel(
                    employee.availability_status,
                  )}
                </Badge>
              </>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Allocation Type
            </p>

            <Badge
              className={`mt-2 ${getAllocationTypeClasses(
                allocation.allocation_type,
              )}`}
            >
              {formatLabel(
                allocation.allocation_type,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Opportunity
            </p>

            <p className="mt-1 font-semibold">
              {opportunity?.opportunity_name ??
                (allocation.opportunity_id
                  ? `Opportunity #${allocation.opportunity_id}`
                  : "Not linked")}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Solution
            </p>

            <p className="mt-1 font-semibold">
              {solution?.solution_name ??
                (allocation.solution_id
                  ? `Solution #${allocation.solution_id}`
                  : "Not linked")}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Resource Request
            </p>

            <p className="mt-1 font-semibold">
              {resourceRequest
                ? `${resourceRequest.requested_role} · ${resourceRequest.required_skill}`
                : allocation.resource_request_id
                  ? `Request #${allocation.resource_request_id}`
                  : "Not linked"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Start Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                allocation.start_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              End Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                allocation.end_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Allocated By
            </p>

            <p className="mt-1 font-semibold">
              {allocatedByName}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {allocation.notes ||
                "No notes added."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

function ResourceManagerAllocationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSoftBookingFormOpen =
    searchParams.get("allocate") === "soft-booking";
  const [
    allocations,
    setAllocations,
  ] = useState<ResourceAllocation[]>([]);

  const [
    employees,
    setEmployees,
  ] = useState<ResourceEmployee[]>([]);

  const [
    resourceRequests,
    setResourceRequests,
  ] = useState<ResourceRequest[]>([]);

  const [
    opportunities,
    setOpportunities,
  ] = useState<SalesOpportunity[]>([]);

  const [
    solutions,
    setSolutions,
  ] = useState<Solution[]>([]);

  const [allocationUsers, setAllocationUsers] =
    useState<AllocationUser[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    opportunityFilter,
    setOpportunityFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState("");
  const [formError, setFormError] =
    useState("");
  const [isSaving, setIsSaving] =
    useState(false);

  const [
    viewingAllocation,
    setViewingAllocation,
  ] =
    useState<ResourceAllocation | null>(
      null,
    );

  /* ---------------- LOAD ---------------- */

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          allocationRecords,
          employeeRecords,
          requestRecords,
          opportunityRecords,
          solutionRecords,
          userRecords,
        ] = await Promise.all([
          getResourceAllocations({
            skip: 0,
            limit: 100,
          }),

          getEmployees({
            skip: 0,
            limit: 100,
          }),

          getResourceRequests({
            skip: 0,
            limit: 100,
          }),

          getSalesOpportunities({
            skip: 0,
            limit: 100,
          }),

          getSolutions({
            skip: 0,
            limit: 100,
          }),

          getAllocationUsers(),
        ]);

        setAllocations(
          allocationRecords,
        );

        setEmployees(
          employeeRecords,
        );

        setResourceRequests(
          requestRecords,
        );

        setOpportunities(
          opportunityRecords,
        );

        setSolutions(
          solutionRecords,
        );

        setAllocationUsers(userRecords);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
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

  /* ---------------- LOOKUPS ---------------- */

  function findEmployee(
    employeeId: number,
  ): ResourceEmployee | undefined {
    return employees.find(
      (employee) =>
        employee.id === employeeId,
    );
  }

  function findOpportunity(
    opportunityId:
      | number
      | null,
  ): SalesOpportunity | undefined {
    if (!opportunityId) {
      return undefined;
    }

    return opportunities.find(
      (opportunity) =>
        opportunity.id ===
        opportunityId,
    );
  }

  function findSolution(
    solutionId:
      | number
      | null,
  ): Solution | undefined {
    if (!solutionId) {
      return undefined;
    }

    return solutions.find(
      (solution) =>
        solution.id === solutionId,
    );
  }

  function findResourceRequest(
    requestId:
      | number
      | null,
  ): ResourceRequest | undefined {
    if (!requestId) {
      return undefined;
    }

    return resourceRequests.find(
      (request) =>
        request.id === requestId,
    );
  }

  /* ---------------- FILTER ---------------- */

  const filteredAllocations =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return allocations.filter(
        (allocation) => {
          const employee =
            employees.find(
              (item) =>
                item.id ===
                allocation.employee_id,
            );

          const opportunity =
            opportunities.find(
              (item) =>
                item.id ===
                allocation.opportunity_id,
            );

          const solution =
            solutions.find(
              (item) =>
                item.id ===
                allocation.solution_id,
            );

          const resourceRequest =
            resourceRequests.find(
              (item) =>
                item.id ===
                allocation.resource_request_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            employee?.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee?.employee_code
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            opportunity
              ?.opportunity_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            solution?.solution_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            resourceRequest?.requested_role
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            allocation.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "ALL" ||
            allocation.allocation_status ===
              statusFilter;

          const matchesType =
            typeFilter === "ALL" ||
            allocation.allocation_type ===
              typeFilter;

          const matchesOpportunity =
            opportunityFilter === "ALL" ||
            allocation.opportunity_id ===
              Number(
                opportunityFilter,
              );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType &&
            matchesOpportunity
          );
        },
      );
    }, [
      allocations,
      employees,
      opportunities,
      opportunityFilter,
      resourceRequests,
      search,
      solutions,
      statusFilter,
      typeFilter,
    ]);

  /* ---------------- KPI ---------------- */

  const confirmedAllocations =
    allocations.filter(
      (allocation) =>
        allocation.allocation_status ===
        "CONFIRMED",
    ).length;

  const softBookings =
    allocations.filter(
      (allocation) =>
        allocation.allocation_type ===
        "SOFT_BOOKING",
    ).length;

  const allocatedEmployeeCount =
    new Set(
      allocations
        .filter(
          (allocation) =>
            ![
              "COMPLETED",
              "CANCELLED",
            ].includes(
              allocation.allocation_status,
            ),
        )
        .map(
          (allocation) =>
            allocation.employee_id,
        ),
    ).size;

  function closeAllocationForm(): void {
    setFormError("");
    router.replace("/resource-manager/resource-allocations");
  }

  async function handleCreateAllocation(
    payload: CreateResourceAllocationRequest,
  ): Promise<void> {
    if (!user) {
      setFormError("Unable to identify the current user.");
      return;
    }

    setIsSaving(true);
    setFormError("");

    try {
      await createResourceAllocation({
        ...payload,
        allocation_type: "SOFT_BOOKING",
        allocated_by: user.id,
      });
      await loadData();
      closeAllocationForm();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ProtectedRoute allowedRole="RESOURCE_MANAGER">
      <DashboardLayout
        title="Resource Allocations"
        description="Review employee allocations across opportunities, solutions, and approved resource demand."
      >
        <div className="space-y-6">
          {/* KPI */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Allocations"
              value={allocations.length.toLocaleString(
                "en-US",
              )}
              description="All employee allocations in the database"
              icon={UserRoundCheck}
              variant="blue"
            />

            <StatCard
              title="Confirmed"
              value={confirmedAllocations.toLocaleString(
                "en-US",
              )}
              description="Confirmed employee assignments"
              icon={CheckCircle2}
              variant="indigo"
            />

            <StatCard
              title="Soft Bookings"
              value={softBookings.toLocaleString(
                "en-US",
              )}
              description="Employees provisionally reserved"
              icon={Layers3}
              variant="cyan"
            />

            <StatCard
              title="Allocated Employees"
              value={allocatedEmployeeCount.toLocaleString(
                "en-US",
              )}
              description="Unique employees with active allocations"
              icon={Users}
              variant="emerald"
            />
          </section>

          {/* Main Card */}

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Allocation Board
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {allocations.length} allocation
                    {allocations.length === 1
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
                employees.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      Add employees before creating resource
                      allocations.
                    </AlertDescription>
                  </Alert>
                )}

              {/* Filters */}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_200px_200px_250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search employee, opportunity, solution or request..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All statuses
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="CONFIRMED">
                    Confirmed
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(event) =>
                    setTypeFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All booking types
                  </option>

                  <option value="SOFT_BOOKING">
                    Soft Booking
                  </option>

                  <option value="HARD_BOOKING">
                    Hard Booking
                  </option>
                </select>

                <select
                  value={
                    opportunityFilter
                  }
                  onChange={(event) =>
                    setOpportunityFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All opportunities
                  </option>

                  {opportunities.map(
                    (opportunity) => (
                      <option
                        key={
                          opportunity.id
                        }
                        value={
                          opportunity.id
                        }
                      >
                        {
                          opportunity.opportunity_name
                        }
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* Table */}

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredAllocations.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <UserRoundCheck className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No resource allocations found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Allocate an employee or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1600px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Employee
                        </th>

                        <th className="px-4 py-3">
                          Opportunity
                        </th>

                        <th className="px-4 py-3">
                          Solution
                        </th>

                        <th className="px-4 py-3">
                          Resource Request
                        </th>

                        <th className="px-4 py-3">
                          Type
                        </th>

                        <th className="px-4 py-3">
                          Allocation
                        </th>

                        <th className="px-4 py-3">
                          Duration
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredAllocations.map(
                        (allocation) => {
                          const employee =
                            findEmployee(
                              allocation.employee_id,
                            );

                          const opportunity =
                            findOpportunity(
                              allocation.opportunity_id,
                            );

                          const solution =
                            findSolution(
                              allocation.solution_id,
                            );

                          const resourceRequest =
                            findResourceRequest(
                              allocation.resource_request_id,
                            );

                          return (
                            <tr
                              key={allocation.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <Users className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {employee?.full_name ??
                                        `Employee #${allocation.employee_id}`}
                                    </p>

                                    {employee && (
                                      <p className="text-xs text-slate-500">
                                        {
                                          employee.employee_code
                                        }{" "}
                                        ·{" "}
                                        {
                                          employee.designation
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <BriefcaseBusiness className="h-4 w-4 text-blue-600" />

                                  {opportunity?.opportunity_name ??
                                    (allocation.opportunity_id
                                      ? `Opportunity #${allocation.opportunity_id}`
                                      : "—")}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Layers3 className="h-4 w-4 text-indigo-600" />

                                  {solution?.solution_name ??
                                    (allocation.solution_id
                                      ? `Solution #${allocation.solution_id}`
                                      : "—")}
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-700">
                                {resourceRequest
                                  ? `${resourceRequest.requested_role} · ${resourceRequest.required_skill}`
                                  : allocation.resource_request_id
                                    ? `Request #${allocation.resource_request_id}`
                                    : "—"}
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getAllocationTypeClasses(
                                    allocation.allocation_type,
                                  )}
                                >
                                  {formatLabel(
                                    allocation.allocation_type,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="w-32">
                                  <div className="mb-1 text-xs font-semibold text-slate-600">
                                    {
                                      allocation.allocation_percentage
                                    }
                                    %
                                  </div>

                                  <div className="h-2 overflow-hidden rounded-full bg-blue-100">
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
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarDays className="h-4 w-4 text-indigo-600" />

                                  <div>
                                    <p>
                                      {formatDate(
                                        allocation.start_date,
                                      )}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                      to{" "}
                                      {formatDate(
                                        allocation.end_date,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getAllocationStatusClasses(
                                    allocation.allocation_status,
                                  )}
                                >
                                  {formatLabel(
                                    allocation.allocation_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View allocation"
                                    onClick={() =>
                                      setViewingAllocation(
                                        allocation,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
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

        {viewingAllocation && (
          <AllocationDetailsModal
            allocation={
              viewingAllocation
            }
            employee={findEmployee(
              viewingAllocation.employee_id,
            )}
            opportunity={findOpportunity(
              viewingAllocation.opportunity_id,
            )}
            solution={findSolution(
              viewingAllocation.solution_id,
            )}
            resourceRequest={findResourceRequest(
              viewingAllocation.resource_request_id,
            )}
            allocatedByName={
              allocationUsers.find(
                (record) =>
                  record.id ===
                  viewingAllocation.allocated_by,
              )?.full_name ?? "Unknown user"
            }
            onClose={() =>
              setViewingAllocation(
                null,
              )
            }
          />
        )}

        {isSoftBookingFormOpen && user && (
          <AllocationFormModal
            key={searchParams.toString()}
            allocation={null}
            employees={employees}
            opportunities={opportunities}
            solutions={solutions}
            resourceRequests={resourceRequests}
            currentUserId={user.id}
            currentUserName={user.full_name}
            isSaving={isSaving}
            error={formError}
            prefill={{
              employee_id: searchParams.get("employee_id") ?? "",
              resource_request_id:
                searchParams.get("resource_request_id") ?? "",
              opportunity_id:
                searchParams.get("opportunity_id") ?? "",
              solution_id: searchParams.get("solution_id") ?? "",
              start_date: searchParams.get("start_date") ?? "",
              end_date: searchParams.get("end_date") ?? "",
              allocation_percentage:
                searchParams.get("allocation_percentage") ?? "",
            }}
            onClose={closeAllocationForm}
            onSubmit={handleCreateAllocation}
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function ResourceManagerAllocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
            <p className="text-sm text-slate-500">
              Loading resource allocations...
            </p>
          </div>
        </div>
      }
    >
      <ResourceManagerAllocationsContent />
    </Suspense>
  );
}
