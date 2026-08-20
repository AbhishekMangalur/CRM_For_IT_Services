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
  BriefcaseBusiness,
  CircleGauge,
  CircleDollarSign,
  Edit3,
  Eye,
  FileUp,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRoundCheck,
  Users,
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

import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  getResourceAllocations,
  importEmployeesCsv,
  replaceEmployee,
} from "@/lib/resource-manager-api";

import type {
  CreateEmployeeRequest,
  EmployeeAvailabilityStatus,
  EmployeeImportResult,
  EmploymentType,
  ResourceEmployee,
} from "@/types/resource-manager";

interface EmployeeFormState {
  employee_code: string;
  full_name: string;
  email: string;
  designation: string;
  department: string;
  total_experience_years: string;
  location: string;
  employment_type: EmploymentType;
  cost_rate: string;
  currency: string;
  availability_status: EmployeeAvailabilityStatus;
  available_from: string;
  current_utilization_percentage: string;
  is_active: boolean;
}

const EMPTY_FORM: EmployeeFormState = {
  employee_code: "",
  full_name: "",
  email: "",
  designation: "",
  department: "",
  total_experience_years: "",
  location: "",
  employment_type: "FULL_TIME",
  cost_rate: "",
  currency: "USD",
  availability_status: "AVAILABLE",
  available_from: "",
  current_utilization_percentage: "0",
  is_active: true,
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

function getAvailabilityClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-700";

    case "PARTIALLY_AVAILABLE":
      return "bg-amber-100 text-amber-700";

    case "SOFT_BOOKED":
      return "bg-cyan-100 text-cyan-700";

    case "ALLOCATED":
      return "bg-indigo-100 text-indigo-700";

    case "UNAVAILABLE":
      return "bg-red-100 text-red-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function employeeToForm(
  employee: ResourceEmployee,
): EmployeeFormState {
  return {
    employee_code: employee.employee_code,
    full_name: employee.full_name,
    email: employee.email,
    designation: employee.designation,
    department: employee.department,
    total_experience_years:
      employee.total_experience_years.toString(),
    location: employee.location,
    employment_type: employee.employment_type,
    cost_rate: employee.cost_rate,
    currency: employee.currency,
    availability_status:
      employee.availability_status,
    available_from:
      employee.available_from ?? "",
    current_utilization_percentage:
      employee.current_utilization_percentage.toString(),
    is_active: employee.is_active,
  };
}

function formToPayload(
  form: EmployeeFormState,
): CreateEmployeeRequest {
  return {
    employee_code: form.employee_code.trim(),
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    designation: form.designation.trim(),
    department: form.department.trim(),
    total_experience_years: Number(
      form.total_experience_years,
    ),
    location: form.location.trim(),
    employment_type: form.employment_type,
    cost_rate: Number(form.cost_rate),
    currency:
      form.currency.trim().toUpperCase() || "USD",
    availability_status:
      form.availability_status,
    available_from:
      form.available_from || null,
    current_utilization_percentage: Number(
      form.current_utilization_percentage,
    ),
    is_active: form.is_active,
  };
}

interface EmployeeFormModalProps {
  employee: ResourceEmployee | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateEmployeeRequest,
  ) => Promise<void>;
}

function EmployeeFormModal({
  employee,
  isSaving,
  error,
  onClose,
  onSubmit,
}: EmployeeFormModalProps) {
  const [form, setForm] =
    useState<EmployeeFormState>(
      employee
        ? employeeToForm(employee)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.type === "checkbox"
    ) {
      setForm((previous) => ({
        ...previous,
        [target.name]: target.checked,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [target.name]: target.value,
    }));
  }

  const isInvalid =
    !form.employee_code.trim() ||
    !form.full_name.trim() ||
    !form.email.trim() ||
    !form.designation.trim() ||
    !form.department.trim() ||
    !form.total_experience_years ||
    Number(form.total_experience_years) < 0 ||
    !form.location.trim() ||
    !form.cost_rate ||
    Number(form.cost_rate) < 0 ||
    Number(
      form.current_utilization_percentage,
    ) < 0 ||
    Number(
      form.current_utilization_percentage,
    ) > 100;

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
              {employee
                ? "Edit Employee"
                : "Add Employee"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage employee profile, cost,
              availability and utilization.
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
              <Label htmlFor="employee_code">
                Employee code *
              </Label>

              <Input
                id="employee_code"
                name="employee_code"
                value={form.employee_code}
                onChange={handleChange}
                placeholder="EMP001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full name *
              </Label>

              <Input
                id="full_name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter employee name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email *
              </Label>

              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">
                Designation *
              </Label>

              <Input
                id="designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Cloud Engineer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department *
              </Label>

              <Input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Cloud Engineering"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_experience_years">
                Total experience (years) *
              </Label>

              <Input
                id="total_experience_years"
                name="total_experience_years"
                type="number"
                min="0"
                step="0.5"
                value={
                  form.total_experience_years
                }
                onChange={handleChange}
                placeholder="4"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Location *
              </Label>

              <Input
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Bengaluru"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employment_type">
                Employment type
              </Label>

              <select
                id="employment_type"
                name="employment_type"
                value={form.employment_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="FULL_TIME">
                  Full Time
                </option>

                <option value="CONTRACT">
                  Contract
                </option>

                <option value="PART_TIME">
                  Part Time
                </option>
              </select>
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="cost_rate">
                  Cost rate *
                </Label>

                <Input
                  id="cost_rate"
                  name="cost_rate"
                  type="number"
                  min="0"
                  value={form.cost_rate}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability_status">
                Availability
              </Label>

              <select
                id="availability_status"
                name="availability_status"
                value={
                  form.availability_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="AVAILABLE">
                  Available
                </option>

                <option value="PARTIALLY_AVAILABLE">
                  Partially Available
                </option>

                <option value="SOFT_BOOKED">
                  Soft Booked
                </option>

                <option value="ALLOCATED">
                  Allocated
                </option>

                <option value="UNAVAILABLE">
                  Unavailable
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="available_from">
                Available from
              </Label>

              <Input
                id="available_from"
                name="available_from"
                type="date"
                value={form.available_from}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_utilization_percentage">
                Current utilization (%)
              </Label>

              <Input
                id="current_utilization_percentage"
                name="current_utilization_percentage"
                type="number"
                min="0"
                max="100"
                value={
                  form.current_utilization_percentage
                }
                onChange={handleChange}
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
                          form.current_utilization_percentage,
                        ) || 0,
                      ),
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="h-4 w-4"
              />

              <Label
                htmlFor="is_active"
                className="cursor-pointer"
              >
                Employee is active
              </Label>
            </div>
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

              {employee
                ? "Save changes"
                : "Add employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EmployeeDetailsModalProps {
  employee: ResourceEmployee;
  onClose: () => void;
}

function EmployeeDetailsModal({
  employee,
  onClose,
}: EmployeeDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {employee.full_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {employee.employee_code}
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
              Utilization
            </p>

            <p className="mt-2 text-3xl font-bold">
              {
                employee.current_utilization_percentage
              }
              %
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Cost Rate
            </p>

            <p className="mt-2 text-2xl font-bold text-indigo-700">
              {formatCurrency(
                employee.cost_rate,
                employee.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Designation
            </p>

            <p className="mt-1 font-semibold">
              {employee.designation}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Department
            </p>

            <p className="mt-1 font-semibold">
              {employee.department}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Email
            </p>

            <p className="mt-1 break-all font-medium">
              {employee.email}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Location
            </p>

            <p className="mt-1 font-semibold">
              {employee.location}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Experience
            </p>

            <p className="mt-1 font-semibold">
              {
                employee.total_experience_years
              }{" "}
              years
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Employment Type
            </p>

            <p className="mt-1 font-semibold">
              {formatLabel(
                employee.employment_type,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Availability
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
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Available From
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                employee.available_from,
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResourceManagerEmployeesPage() {
  const confirm = useConfirm();
  const [employees, setEmployees] =
    useState<ResourceEmployee[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] = useState("ALL");

  const [
    employmentFilter,
    setEmploymentFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isImporting, setIsImporting] =
    useState(false);

  const [importError, setImportError] =
    useState("");

  const [importResult, setImportResult] =
    useState<EmployeeImportResult | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingEmployee,
    setEditingEmployee,
  ] =
    useState<ResourceEmployee | null>(
      null,
    );

  const [
    viewingEmployee,
    setViewingEmployee,
  ] =
    useState<ResourceEmployee | null>(
      null,
    );

  const loadEmployees =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [records, allocations] = await Promise.all([
          getEmployees({
            skip: 0,
            limit: 100,
          }),
          getResourceAllocations({
            skip: 0,
            limit: 500,
          }),
        ]);

        const softBookedEmployeeIds = new Set(
          allocations
            .filter(
              (allocation) =>
                allocation.allocation_type === "SOFT_BOOKING" &&
                ["PENDING", "CONFIRMED"].includes(
                  allocation.allocation_status,
                ),
            )
            .map((allocation) => allocation.employee_id),
        );

        const hardBookedEmployeeIds = new Set(
          allocations
            .filter(
              (allocation) =>
                allocation.allocation_type === "HARD_BOOKING" &&
                ["PENDING", "CONFIRMED"].includes(
                  allocation.allocation_status,
                ),
            )
            .map((allocation) => allocation.employee_id),
        );

        setEmployees(
          records.map((employee) =>
            softBookedEmployeeIds.has(employee.id) &&
            !hardBookedEmployeeIds.has(employee.id)
              ? {
                  ...employee,
                  availability_status: "SOFT_BOOKED",
                }
              : employee,
          ),
        );
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
      void loadEmployees();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadEmployees]);

  const filteredEmployees =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return employees.filter(
        (employee) => {
          const matchesSearch =
            !normalizedSearch ||
            employee.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.employee_code
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.email
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.designation
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.department
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            employee.location
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesAvailability =
            availabilityFilter ===
              "ALL" ||
            employee.availability_status ===
              availabilityFilter;

          const matchesEmployment =
            employmentFilter === "ALL" ||
            employee.employment_type ===
              employmentFilter;

          return (
            matchesSearch &&
            matchesAvailability &&
            matchesEmployment
          );
        },
      );
    }, [
      availabilityFilter,
      employees,
      employmentFilter,
      search,
    ]);

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.is_active,
    ).length;

  const availableEmployees =
    employees.filter(
      (employee) =>
        employee.is_active &&
        employee.availability_status ===
          "AVAILABLE",
    ).length;

  const averageUtilization =
    employees.length > 0
      ? employees.reduce(
          (total, employee) =>
            total +
            Number(
              employee.current_utilization_percentage,
            ),
          0,
        ) / employees.length
      : 0;

  const totalMonthlyCost =
    employees.reduce(
      (total, employee) =>
        total +
        (Number(employee.cost_rate) || 0),
      0,
    );

  async function handleSaveEmployee(
    payload: CreateEmployeeRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingEmployee) {
        const updated =
          await replaceEmployee(
            editingEmployee.id,
            payload,
          );

        setEmployees((current) =>
          current.map((employee) =>
            employee.id === updated.id
              ? updated
              : employee,
          ),
        );
      } else {
        const created =
          await createEmployee(payload);

        setEmployees((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingEmployee(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEmployee(
    employee: ResourceEmployee,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete employee "${employee.full_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteEmployee(
        employee.id,
      );

      setEmployees((current) =>
        current.filter(
          (item) =>
            item.id !== employee.id,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    }
  }

  async function handleImportEmployees(
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
      const result = await importEmployeesCsv(selectedFile);
      setImportResult(result);
      await loadEmployees();
    } catch (requestError) {
      setImportError(getErrorMessage(requestError));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <ProtectedRoute allowedRole="RESOURCE_MANAGER">
      <DashboardLayout
        title="Employees"
        description="Manage resource pool, availability and utilization."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active Employees"
              value={activeEmployees.toLocaleString(
                "en-US",
              )}
              description="Active employees in the resource pool"
              icon={Users}
              variant="blue"
            />

            <StatCard
              title="Available Employees"
              value={availableEmployees.toLocaleString(
                "en-US",
              )}
              description="Employees currently available"
              icon={UserRoundCheck}
              variant="indigo"
            />

            <StatCard
              title="Average Utilization"
              value={`${averageUtilization.toFixed(
                1,
              )}%`}
              description="Average utilization across employees"
              icon={CircleGauge}
              variant="cyan"
            />

            <StatCard
              title="Total Cost Rate"
              value={formatCurrency(
                totalMonthlyCost,
              )}
              description="Combined employee cost rate"
              icon={CircleDollarSign}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Resource Pool
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {employees.length} employee
                    {employees.length === 1
                      ? ""
                      : "s"}{" "}
                    loaded from the database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) =>
                      void handleImportEmployees(event)
                    }
                  />

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadEmployees()
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

                    {isImporting
                      ? "Importing..."
                      : "Import Employees CSV"}
                  </Button>

                  <Button
                    type="button"
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={() => {
                      setEditingEmployee(null);
                      setFormError("");
                      setShowForm(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Add Employee
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {importError && (
                <Alert
                  variant="destructive"
                  className="mb-5"
                >
                  <AlertDescription>
                    {importError}
                  </AlertDescription>
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

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search name, code, email, designation, department or location..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={
                    availabilityFilter
                  }
                  onChange={(event) =>
                    setAvailabilityFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All availability
                  </option>

                  <option value="AVAILABLE">
                    Available
                  </option>

                  <option value="PARTIALLY_AVAILABLE">
                    Partially Available
                  </option>

                  <option value="SOFT_BOOKED">
                    Soft Booked
                  </option>

                  <option value="ALLOCATED">
                    Allocated
                  </option>

                  <option value="UNAVAILABLE">
                    Unavailable
                  </option>
                </select>

                <select
                  value={employmentFilter}
                  onChange={(event) =>
                    setEmploymentFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All employment
                  </option>

                  <option value="FULL_TIME">
                    Full Time
                  </option>

                  <option value="CONTRACT">
                    Contract
                  </option>

                  <option value="PART_TIME">
                    Part Time
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredEmployees.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Users className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No employees found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Add an employee or change the filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1450px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Employee
                        </th>

                        <th className="px-4 py-3">
                          Department
                        </th>

                        <th className="px-4 py-3">
                          Experience
                        </th>

                        <th className="px-4 py-3">
                          Location
                        </th>

                        <th className="px-4 py-3">
                          Employment
                        </th>

                        <th className="px-4 py-3">
                          Cost Rate
                        </th>

                        <th className="px-4 py-3">
                          Availability
                        </th>

                        <th className="px-4 py-3">
                          Utilization
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredEmployees.map(
                        (employee) => (
                          <tr
                            key={employee.id}
                            className="bg-white transition hover:bg-blue-50/50"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                  <Users className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {employee.full_name}
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {
                                      employee.employee_code
                                    }{" "}
                                    ·{" "}
                                    {
                                      employee.designation
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />

                                <span className="text-sm font-medium text-slate-700">
                                  {
                                    employee.department
                                  }
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {
                                employee.total_experience_years
                              }{" "}
                              years
                            </td>

                            <td className="px-4 py-4">
                              <span className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-4 w-4 text-blue-600" />

                                {employee.location}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {formatLabel(
                                employee.employment_type,
                              )}
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {formatCurrency(
                                employee.cost_rate,
                                employee.currency,
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getAvailabilityClasses(
                                  employee.availability_status,
                                )}
                              >
                                {formatLabel(
                                  employee.availability_status,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              <div className="w-32">
                                <div className="mb-1 flex justify-between text-xs text-slate-500">
                                  <span>
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
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View employee"
                                  onClick={() =>
                                    setViewingEmployee(
                                      employee,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit employee"
                                  onClick={() => {
                                    setEditingEmployee(
                                      employee,
                                    );
                                    setFormError("");
                                    setShowForm(true);
                                  }}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete employee"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteEmployee(
                                      employee,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <EmployeeFormModal
            employee={editingEmployee}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingEmployee(null);
              }
            }}
            onSubmit={handleSaveEmployee}
          />
        )}

        {viewingEmployee && (
          <EmployeeDetailsModal
            employee={viewingEmployee}
            onClose={() =>
              setViewingEmployee(null)
            }
          />
        )}

        {importResult && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl rounded-2xl border border-emerald-100 bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="employee-import-title"
            >
              <div className="flex items-start justify-between border-b border-emerald-100 p-5">
                <div>
                  <h2
                    id="employee-import-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    Import completed
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Employee master data has been processed. Skills can be
                    mapped separately from Employee Skills.
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
                    <p className="text-xs text-slate-500">Employees created</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      {importResult.employees_created}
                    </p>
                  </div>
                  <div className="rounded-xl bg-cyan-50 p-4">
                    <p className="text-xs text-slate-500">Employees updated</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-700">
                      {importResult.employees_updated}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-4">
                    <p className="text-xs text-slate-500">Failed rows</p>
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
                      <table className="w-full min-w-[560px] text-left text-sm">
                        <thead className="sticky top-0 bg-red-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Row</th>
                            <th className="px-4 py-3">Employee Code</th>
                            <th className="px-4 py-3">Error Message</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-50">
                          {importResult.errors.map((item, index) => (
                            <tr key={`${item.row}-${item.employee_code}-${index}`}>
                              <td className="px-4 py-3 font-medium text-slate-700">
                                {item.row}
                              </td>
                              <td className="px-4 py-3 text-slate-700">
                                {item.employee_code || "-"}
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
