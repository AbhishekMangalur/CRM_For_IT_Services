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
  CircleDollarSign,
  Edit3,
  Eye,
  Gauge,
  Layers3,
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
  createResourceRequirement,
  deleteResourceRequirement,
  getResourceRequirements,
  getSolutions,
  replaceResourceRequirement,
} from "@/lib/presales-api";

import type {
  AvailabilityStatus,
  CreateResourceRequirementRequest,
  ExperienceLevel,
  LocationType,
  ResourceRequirement,
  Solution,
} from "@/types/presales";

interface ResourceFormState {
  solution_id: string;
  role_name: string;
  skill_name: string;
  experience_level: ExperienceLevel;
  minimum_experience_years: string;
  quantity: string;
  location_type: LocationType;
  duration_months: string;
  allocation_percentage: string;
  cost_rate: string;
  billing_rate: string;
  availability_status: AvailabilityStatus;
}

const EMPTY_FORM: ResourceFormState = {
  solution_id: "",
  role_name: "",
  skill_name: "",
  experience_level: "MID_LEVEL",
  minimum_experience_years: "",
  quantity: "1",
  location_type: "OFFSHORE",
  duration_months: "",
  allocation_percentage: "100",
  cost_rate: "",
  billing_rate: "",
  availability_status: "PENDING",
};

function normalizeLocationType(value: string): LocationType {
  if (value === "ONSITE") {
    return "ONSHORE";
  }

  if (value === "HYBRID") {
    return "NEARSHORE";
  }

  return value as LocationType;
}

function formatCurrency(
  value: string | number,
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getExperienceClasses(
  level: string,
): string {
  switch (level.toUpperCase()) {
    case "SENIOR":
      return "bg-violet-100 text-violet-700";

    case "MID_LEVEL":
      return "bg-indigo-100 text-indigo-700";

    default:
      return "bg-cyan-100 text-cyan-700";
  }
}

function resourceToForm(
  resource: ResourceRequirement,
): ResourceFormState {
  return {
    solution_id:
      resource.solution_id.toString(),

    role_name:
      resource.role_name,

    skill_name:
      resource.skill_name,

    experience_level:
      resource.experience_level,

    minimum_experience_years:
      resource.minimum_experience_years.toString(),

    quantity:
      resource.quantity.toString(),

    location_type: normalizeLocationType(
      resource.location_type,
    ),

    duration_months:
      resource.duration_months.toString(),

    allocation_percentage:
      resource.allocation_percentage.toString(),

    cost_rate:
      resource.cost_rate,

    billing_rate:
      resource.billing_rate,

    availability_status:
      resource.availability_status,
  };
}

function formToPayload(
  form: ResourceFormState,
): CreateResourceRequirementRequest {
  return {
    solution_id:
      Number(form.solution_id),

    role_name:
      form.role_name.trim(),

    skill_name:
      form.skill_name.trim(),

    experience_level:
      form.experience_level,

    minimum_experience_years:
      Number(
        form.minimum_experience_years,
      ),

    quantity:
      Number(form.quantity),

    location_type:
      form.location_type,

    duration_months:
      Number(form.duration_months),

    allocation_percentage:
      Number(
        form.allocation_percentage,
      ),

    cost_rate:
      Number(form.cost_rate),

    billing_rate:
      Number(form.billing_rate),

    availability_status:
      form.availability_status,
  };
}

interface ResourceFormModalProps {
  resource: ResourceRequirement | null;
  solutions: Solution[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateResourceRequirementRequest,
  ) => Promise<void>;
}

function ResourceFormModal({
  resource,
  solutions,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ResourceFormModalProps) {
  const [form, setForm] =
    useState<ResourceFormState>(
      resource
        ? resourceToForm(resource)
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

  const isInvalid =
    !form.solution_id ||
    !form.role_name.trim() ||
    !form.skill_name.trim() ||
    !form.minimum_experience_years ||
    Number(
      form.minimum_experience_years,
    ) < 0 ||
    !form.quantity ||
    Number(form.quantity) <= 0 ||
    !form.duration_months ||
    Number(form.duration_months) <= 0 ||
    Number(
      form.allocation_percentage,
    ) <= 0 ||
    Number(
      form.allocation_percentage,
    ) > 100 ||
    !form.cost_rate ||
    Number(form.cost_rate) < 0 ||
    !form.billing_rate ||
    Number(form.billing_rate) < 0;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(
      formToPayload(form),
    );
  }

  const monthlyCost =
    (Number(form.cost_rate) || 0) *
    (Number(form.quantity) || 0) *
    ((Number(
      form.allocation_percentage,
    ) || 0) /
      100);

  const monthlyBilling =
    (Number(form.billing_rate) || 0) *
    (Number(form.quantity) || 0) *
    ((Number(
      form.allocation_percentage,
    ) || 0) /
      100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {resource
                ? "Edit Resource Requirement"
                : "Create Resource Requirement"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define the skills and delivery capacity
              required for a solution.
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
              <Label htmlFor="solution_id">
                Solution *
              </Label>

              <select
                id="solution_id"
                name="solution_id"
                value={form.solution_id}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
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
              <Label htmlFor="role_name">
                Role name *
              </Label>

              <Input
                id="role_name"
                name="role_name"
                value={form.role_name}
                onChange={handleChange}
                placeholder="Backend Engineer"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill_name">
                Skill *
              </Label>

              <Input
                id="skill_name"
                name="skill_name"
                value={form.skill_name}
                onChange={handleChange}
                placeholder="Python / FastAPI"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_level">
                Experience level
              </Label>

              <select
                id="experience_level"
                name="experience_level"
                value={
                  form.experience_level
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="JUNIOR">
                  Junior
                </option>

                <option value="MID_LEVEL">
                  Mid Level
                </option>

                <option value="SENIOR">
                  Senior
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_experience_years">
                Minimum experience (years) *
              </Label>

              <Input
                id="minimum_experience_years"
                name="minimum_experience_years"
                type="number"
                min="0"
                step="0.5"
                value={
                  form.minimum_experience_years
                }
                onChange={handleChange}
                placeholder="3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity *
              </Label>

              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location_type">
                Location
              </Label>

              <select
                id="location_type"
                name="location_type"
                value={form.location_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ONSHORE">
                  Onshore
                </option>

                <option value="OFFSHORE">
                  Offshore
                </option>

                <option value="NEARSHORE">
                  Nearshore
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_months">
                Duration (months) *
              </Label>

              <Input
                id="duration_months"
                name="duration_months"
                type="number"
                min="1"
                value={form.duration_months}
                onChange={handleChange}
                placeholder="6"
                required
              />
            </div>

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
            </div>

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
              <Label htmlFor="billing_rate">
                Billing rate *
              </Label>

              <Input
                id="billing_rate"
                name="billing_rate"
                type="number"
                min="0"
                value={form.billing_rate}
                onChange={handleChange}
                placeholder="1000"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="availability_status">
                Availability status
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
                <option value="PENDING">
                  Pending
                </option>

                <option value="AVAILABLE">
                  Available
                </option>

                <option value="PARTIALLY_AVAILABLE">
                  Partially Available
                </option>
              </select>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 md:col-span-2">
              <h3 className="font-semibold text-slate-800">
                Resource Cost Preview
              </h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Monthly Cost
                  </p>

                  <p className="mt-2 font-bold text-blue-700">
                    {formatCurrency(
                      monthlyCost,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Monthly Billing
                  </p>

                  <p className="mt-2 font-bold text-indigo-700">
                    {formatCurrency(
                      monthlyBilling,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Monthly Spread
                  </p>

                  <p className="mt-2 font-bold text-emerald-700">
                    {formatCurrency(
                      monthlyBilling -
                        monthlyCost,
                    )}
                  </p>
                </div>
              </div>
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

              {resource
                ? "Save changes"
                : "Create requirement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ResourceDetailsModalProps {
  resource: ResourceRequirement;
  solution?: Solution;
  onClose: () => void;
}

function ResourceDetailsModal({
  resource,
  solution,
  onClose,
}: ResourceDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {resource.role_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resource Requirement #{resource.id}
            </p>
          </div>

          <Button
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
              Skill
            </p>

            <p className="mt-2 text-2xl font-bold">
              {resource.skill_name}
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Quantity
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {resource.quantity}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Solution
            </p>

            <p className="mt-1 font-semibold">
              {solution?.solution_name ??
                `Solution #${resource.solution_id}`}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Experience
            </p>

            <p className="mt-1 font-semibold">
              {formatLabel(
                resource.experience_level,
              )}{" "}
              ·{" "}
              {
                resource.minimum_experience_years
              }{" "}
              years
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Location
            </p>

            <p className="mt-1 font-semibold">
              {formatLabel(
                resource.location_type,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Duration
            </p>

            <p className="mt-1 font-semibold">
              {resource.duration_months} months
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Allocation
            </p>

            <p className="mt-1 font-semibold">
              {
                resource.allocation_percentage
              }
              %
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Availability
            </p>

            <Badge
              className={`mt-2 ${getAvailabilityClasses(
                resource.availability_status,
              )}`}
            >
              {formatLabel(
                resource.availability_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-slate-500">
              Cost Rate
            </p>

            <p className="mt-2 font-bold text-blue-700">
              {formatCurrency(
                resource.cost_rate,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-50 p-4">
            <p className="text-xs text-slate-500">
              Billing Rate
            </p>

            <p className="mt-2 font-bold text-emerald-700">
              {formatCurrency(
                resource.billing_rate,
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresalesResourceRequirementsPage() {
  const confirm = useConfirm();
  const [resources, setResources] =
    useState<ResourceRequirement[]>([]);

  const [solutions, setSolutions] =
    useState<Solution[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    availabilityFilter,
    setAvailabilityFilter,
  ] = useState("ALL");

  const [
    experienceFilter,
    setExperienceFilter,
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
    editingResource,
    setEditingResource,
  ] =
    useState<ResourceRequirement | null>(
      null,
    );

  const [
    viewingResource,
    setViewingResource,
  ] =
    useState<ResourceRequirement | null>(
      null,
    );

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          resourceRecords,
          solutionRecords,
        ] = await Promise.all([
          getResourceRequirements({
            skip: 0,
            limit: 100,
          }),

          getSolutions({
            skip: 0,
            limit: 100,
          }),
        ]);

        setResources(resourceRecords);
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

  const filteredResources =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return resources.filter(
        (resource) => {
          const solution =
            solutions.find(
              (item) =>
                item.id ===
                resource.solution_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            resource.role_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            resource.skill_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            solution?.solution_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesAvailability =
            availabilityFilter ===
              "ALL" ||
            resource.availability_status ===
              availabilityFilter;

          const matchesExperience =
            experienceFilter === "ALL" ||
            resource.experience_level ===
              experienceFilter;

          return (
            matchesSearch &&
            matchesAvailability &&
            matchesExperience
          );
        },
      );
    }, [
      availabilityFilter,
      experienceFilter,
      resources,
      search,
      solutions,
    ]);

  const totalRequired =
    resources.reduce(
      (total, resource) =>
        total + resource.quantity,
      0,
    );

  const availableCount =
    resources
      .filter(
        (resource) =>
          resource.availability_status ===
          "AVAILABLE",
      )
      .reduce(
        (total, resource) =>
          total + resource.quantity,
        0,
      );

  const totalMonthlyCost =
    resources.reduce(
      (total, resource) =>
        total +
        Number(resource.cost_rate) *
          resource.quantity *
          (resource.allocation_percentage /
            100),
      0,
    );

  const totalMonthlyBilling =
    resources.reduce(
      (total, resource) =>
        total +
        Number(resource.billing_rate) *
          resource.quantity *
          (resource.allocation_percentage /
            100),
      0,
    );

  async function handleSaveResource(
    payload: CreateResourceRequirementRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingResource) {
        const updated =
          await replaceResourceRequirement(
            editingResource.id,
            payload,
          );

        setResources((current) =>
          current.map((record) =>
            record.id === updated.id
              ? updated
              : record,
          ),
        );
      } else {
        const created =
          await createResourceRequirement(
            payload,
          );

        setResources((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingResource(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteResource(
    resource: ResourceRequirement,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete resource requirement "${resource.role_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteResourceRequirement(
        resource.id,
      );

      setResources((current) =>
        current.filter(
          (record) =>
            record.id !== resource.id,
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
  ) {
    return solutions.find(
      (solution) =>
        solution.id === solutionId,
    );
  }

  return (
    <ProtectedRoute allowedRole="PRESALES">
      <DashboardLayout
        title="Resource Requirements"
        description="Define delivery roles, skills, allocation, cost and availability."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Required Resources"
              value={totalRequired.toLocaleString(
                "en-US",
              )}
              description="Total people required across solutions"
              icon={Users}
              variant="blue"
            />

            <StatCard
              title="Available Resources"
              value={availableCount.toLocaleString(
                "en-US",
              )}
              description="Required resources marked available"
              icon={UserRoundCheck}
              variant="indigo"
            />

            <StatCard
              title="Monthly Cost"
              value={formatCurrency(
                totalMonthlyCost,
              )}
              description="Estimated resource delivery cost"
              icon={CircleDollarSign}
              variant="cyan"
            />

            <StatCard
              title="Monthly Billing"
              value={formatCurrency(
                totalMonthlyBilling,
              )}
              description="Estimated monthly resource billing"
              icon={Gauge}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Resource Plan
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {resources.length} requirement
                    {resources.length === 1
                      ? ""
                      : "s"}{" "}
                    loaded from the database
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      void loadData()
                    }
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>

                  <Button
                    className="bg-blue-700 hover:bg-blue-800"
                    onClick={() => {
                      setEditingResource(null);
                      setFormError("");
                      setShowForm(true);
                    }}
                    disabled={
                      solutions.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Requirement
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

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_220px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search role, skill or solution..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={
                    availabilityFilter
                  }
                  onChange={(e) =>
                    setAvailabilityFilter(
                      e.target.value,
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
                  <option value="PENDING">
                    Pending
                  </option>
                </select>

                <select
                  value={experienceFilter}
                  onChange={(e) =>
                    setExperienceFilter(
                      e.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All experience
                  </option>
                  <option value="JUNIOR">
                    Junior
                  </option>
                  <option value="MID_LEVEL">
                    Mid Level
                  </option>
                  <option value="SENIOR">
                    Senior
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30">
                  <Users className="h-10 w-10 text-blue-300" />
                  <p className="mt-3 font-semibold text-slate-700">
                    No resource requirements found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1400px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Role
                        </th>
                        <th className="px-4 py-3">
                          Solution
                        </th>
                        <th className="px-4 py-3">
                          Skill
                        </th>
                        <th className="px-4 py-3">
                          Experience
                        </th>
                        <th className="px-4 py-3">
                          Quantity
                        </th>
                        <th className="px-4 py-3">
                          Location
                        </th>
                        <th className="px-4 py-3">
                          Allocation
                        </th>
                        <th className="px-4 py-3">
                          Cost / Billing
                        </th>
                        <th className="px-4 py-3">
                          Availability
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredResources.map(
                        (resource) => {
                          const solution =
                            findSolution(
                              resource.solution_id,
                            );

                          return (
                            <tr
                              key={resource.id}
                              className="hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4 font-semibold">
                                {resource.role_name}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <Layers3 className="h-4 w-4 text-blue-600" />
                                  {solution?.solution_name ??
                                    `Solution #${resource.solution_id}`}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                {resource.skill_name}
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getExperienceClasses(
                                    resource.experience_level,
                                  )}
                                >
                                  {formatLabel(
                                    resource.experience_level,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                {resource.quantity}
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-indigo-600" />
                                  {formatLabel(
                                    resource.location_type,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                {
                                  resource.allocation_percentage
                                }
                                %
                              </td>

                              <td className="px-4 py-4 text-sm">
                                <p>
                                  Cost:{" "}
                                  <strong>
                                    {formatCurrency(
                                      resource.cost_rate,
                                    )}
                                  </strong>
                                </p>
                                <p>
                                  Billing:{" "}
                                  <strong className="text-emerald-700">
                                    {formatCurrency(
                                      resource.billing_rate,
                                    )}
                                  </strong>
                                </p>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getAvailabilityClasses(
                                    resource.availability_status,
                                  )}
                                >
                                  {formatLabel(
                                    resource.availability_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() =>
                                      setViewingResource(
                                        resource,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingResource(
                                        resource,
                                      );
                                      setFormError("");
                                      setShowForm(true);
                                    }}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="text-red-600"
                                    onClick={() =>
                                      void handleDeleteResource(
                                        resource,
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
          <ResourceFormModal
            resource={editingResource}
            solutions={solutions}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingResource(null);
              }
            }}
            onSubmit={handleSaveResource}
          />
        )}

        {viewingResource && (
          <ResourceDetailsModal
            resource={viewingResource}
            solution={findSolution(
              viewingResource.solution_id,
            )}
            onClose={() =>
              setViewingResource(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
