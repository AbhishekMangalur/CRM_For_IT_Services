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
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Code2,
  Edit3,
  Eye,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  ServerCog,
  Trash2,
  UserRound,
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
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

import {
  createSolution,
  deleteSolution,
  getSolutions,
  replaceSolution,
} from "@/lib/presales-api";

import { getSalesOpportunities } from "@/lib/sales-api";

import type {
  CreateSolutionRequest,
  DeliveryModel,
  Solution,
  SolutionStatus,
} from "@/types/presales";

import type {
  SalesOpportunity,
} from "@/types/sales";

interface PresalesOwnerUser {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
}

async function getPresalesOwners(): Promise<PresalesOwnerUser[]> {
  const response = await api.get<PresalesOwnerUser[]>(
    "/api/users",
  );

  return response.data.filter(
    (owner) =>
      owner.is_active && owner.role.name === "PRESALES",
  );
}

interface OpportunityComboboxProps {
  opportunities: SalesOpportunity[];
  value: string;
  onChange: (value: string) => void;
}

function OpportunityCombobox({
  opportunities,
  value,
  onChange,
}: OpportunityComboboxProps) {
  const selectedOpportunity = opportunities.find(
    (opportunity) => opportunity.id.toString() === value,
  );
  const [query, setQuery] = useState(
    selectedOpportunity
      ? `${selectedOpportunity.opportunity_name} (${selectedOpportunity.client_name})`
      : "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOpportunities = opportunities.filter(
    (opportunity) =>
      !normalizedQuery ||
      opportunity.opportunity_name.toLowerCase().includes(normalizedQuery) ||
      opportunity.client_name.toLowerCase().includes(normalizedQuery) ||
      opportunity.service_type.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="space-y-2 md:col-span-2">
      <Label htmlFor="opportunity_search">
        Sales Opportunity *
      </Label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id="opportunity_search"
          type="search"
          autoComplete="off"
          value={query}
          required
          placeholder="Search by opportunity, client, or service..."
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="opportunity_search-options"
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
            setIsOpen(true);
          }}
        />

        {isOpen && (
          <div
            id="opportunity_search-options"
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
          >
            {filteredOpportunities.length > 0 ? (
              filteredOpportunities.map((opportunity) => (
                <button
                  key={opportunity.id}
                  type="button"
                  role="option"
                  aria-selected={value === opportunity.id.toString()}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(
                      `${opportunity.opportunity_name} (${opportunity.client_name})`,
                    );
                    onChange(opportunity.id.toString());
                    setIsOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-slate-700">
                    {opportunity.opportunity_name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {opportunity.client_name} · {opportunity.service_type}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                No opportunities match your search.
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Opportunities are loaded directly from the Sales API.
      </p>
    </div>
  );
}

interface SolutionFormState {
  opportunity_id: string;
  solution_name: string;
  solution_summary: string;
  technology_stack: string;
  architecture_notes: string;
  delivery_model: DeliveryModel;
  estimated_duration_months: string;
  presales_owner_id: string;
  solution_status: SolutionStatus;
}

function createEmptyForm(
  userId?: number,
): SolutionFormState {
  return {
    opportunity_id: "",
    solution_name: "",
    solution_summary: "",
    technology_stack: "",
    architecture_notes: "",
    delivery_model: "OFFSHORE",
    estimated_duration_months: "",
    presales_owner_id:
      userId?.toString() ?? "",
    solution_status: "DRAFT",
  };
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

  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg)
      .filter(Boolean)
      .join(", ");
  }

  return "The request could not be completed.";
}

function getSolutionStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getDeliveryModelClasses(
  model: string,
): string {
  switch (model.toUpperCase()) {
    case "ONSITE":
      return "bg-violet-100 text-violet-700";

    case "HYBRID":
      return "bg-indigo-100 text-indigo-700";

    default:
      return "bg-cyan-100 text-cyan-700";
  }
}

function solutionToForm(
  solution: Solution,
): SolutionFormState {
  return {
    opportunity_id:
      solution.opportunity_id.toString(),

    solution_name:
      solution.solution_name,

    solution_summary:
      solution.solution_summary,

    technology_stack:
      solution.technology_stack,

    architecture_notes:
      solution.architecture_notes,

    delivery_model:
      solution.delivery_model,

    estimated_duration_months:
      solution.estimated_duration_months.toString(),

    presales_owner_id:
      solution.presales_owner_id.toString(),

    solution_status:
      solution.solution_status === "IN_REVIEW"
        ? "DRAFT"
        : solution.solution_status,
  };
}

function formToPayload(
  form: SolutionFormState,
): CreateSolutionRequest {
  return {
    opportunity_id:
      Number(form.opportunity_id),

    solution_name:
      form.solution_name.trim(),

    solution_summary:
      form.solution_summary.trim(),

    technology_stack:
      form.technology_stack.trim(),

    architecture_notes:
      form.architecture_notes.trim(),

    delivery_model:
      form.delivery_model,

    estimated_duration_months:
      Number(
        form.estimated_duration_months,
      ),

    presales_owner_id:
      Number(form.presales_owner_id),

    solution_status:
      form.solution_status,
  };
}

interface SolutionFormModalProps {
  solution: Solution | null;
  opportunities: SalesOpportunity[];
  currentUserId: number;
  currentUserName: string;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateSolutionRequest,
  ) => Promise<void>;
}

function SolutionFormModal({
  solution,
  opportunities,
  currentUserId,
  currentUserName,
  isSaving,
  error,
  onClose,
  onSubmit,
}: SolutionFormModalProps) {
  const [form, setForm] =
    useState<SolutionFormState>(
      solution
        ? solutionToForm(solution)
        : createEmptyForm(currentUserId),
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLTextAreaElement>
      | ChangeEvent<HTMLSelectElement>,
  ): void {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const isInvalid =
    !form.opportunity_id ||
    !form.solution_name.trim() ||
    !form.solution_summary.trim() ||
    !form.technology_stack.trim() ||
    !form.architecture_notes.trim() ||
    !form.estimated_duration_months ||
    Number(
      form.estimated_duration_months,
    ) <= 0 ||
    !form.presales_owner_id;

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
              {solution
                ? "Edit Solution"
                : "Create Solution"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Design the technical solution for a
              Sales opportunity.
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

            <OpportunityCombobox
              opportunities={opportunities}
              value={form.opportunity_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  opportunity_id: value,
                }))
              }
            />

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="solution_name">
                Solution name *
              </Label>

              <Input
                id="solution_name"
                name="solution_name"
                value={form.solution_name}
                onChange={handleChange}
                placeholder="Cloud Migration Solution"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="solution_summary">
                Solution summary *
              </Label>

              <Textarea
                id="solution_summary"
                name="solution_summary"
                value={form.solution_summary}
                onChange={handleChange}
                placeholder="Describe the proposed technical solution..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="technology_stack">
                Technology stack *
              </Label>

              <Textarea
                id="technology_stack"
                name="technology_stack"
                value={form.technology_stack}
                onChange={handleChange}
                placeholder="AWS, Docker, Kubernetes, PostgreSQL, FastAPI"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="architecture_notes">
                Architecture notes *
              </Label>

              <Textarea
                id="architecture_notes"
                name="architecture_notes"
                value={form.architecture_notes}
                onChange={handleChange}
                placeholder="Containerized services deployed on Kubernetes..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_model">
                Delivery model
              </Label>

              <select
                id="delivery_model"
                name="delivery_model"
                value={form.delivery_model}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="ONSITE">
                  Onsite
                </option>

                <option value="OFFSHORE">
                  Offshore
                </option>

                <option value="HYBRID">
                  Hybrid
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration_months">
                Estimated duration (months) *
              </Label>

              <Input
                id="estimated_duration_months"
                name="estimated_duration_months"
                type="number"
                min="1"
                value={
                  form.estimated_duration_months
                }
                onChange={handleChange}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution_status">
                Solution status
              </Label>

              <select
                id="solution_status"
                name="solution_status"
                value={form.solution_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="DRAFT">
                  Draft
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="presales_owner_id">
                Presales Owner
              </Label>

              <Input
                id="presales_owner_id"
                value={currentUserName}
                readOnly
                className="bg-slate-50"
              />

              <p className="text-xs text-slate-500">
                Automatically assigned to the
                logged-in Presales user.
              </p>
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

              {solution
                ? "Save changes"
                : "Create solution"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SolutionDetailsModalProps {
  solution: Solution;
  opportunity?: SalesOpportunity;
  ownerName: string;
  onClose: () => void;
}

function SolutionDetailsModal({
  solution,
  opportunity,
  ownerName,
  onClose,
}: SolutionDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {solution.solution_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Solution #{solution.id}
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
              Delivery Model
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatLabel(
                solution.delivery_model,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Estimated Duration
            </p>

            <p className="mt-2 text-2xl font-bold text-indigo-700">
              {
                solution.estimated_duration_months
              }{" "}
              months
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Sales Opportunity
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {opportunity
                ? opportunity.opportunity_name
                : `Opportunity #${solution.opportunity_id}`}
            </p>

            {opportunity && (
              <p className="mt-1 text-sm text-slate-500">
                {opportunity.client_name}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-2 ${getSolutionStatusClasses(
                solution.solution_status,
              )}`}
            >
              {formatLabel(
                solution.solution_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Presales Owner
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {ownerName}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {formatDate(
                solution.created_at,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50/50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Solution Summary
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {solution.solution_summary}
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50/50 p-4 sm:col-span-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-indigo-700" />

              <p className="font-semibold text-slate-800">
                Technology Stack
              </p>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {solution.technology_stack}
            </p>
          </div>

          <div className="rounded-xl bg-cyan-50/50 p-4 sm:col-span-2">
            <div className="flex items-center gap-2">
              <ServerCog className="h-4 w-4 text-cyan-700" />

              <p className="font-semibold text-slate-800">
                Architecture Notes
              </p>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {solution.architecture_notes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresalesSolutionsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [solutions, setSolutions] =
    useState<Solution[]>([]);

  const [
    opportunities,
    setOpportunities,
  ] = useState<SalesOpportunity[]>([]);
  const [owners, setOwners] = useState<
    PresalesOwnerUser[]
  >([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    deliveryFilter,
    setDeliveryFilter,
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
    editingSolution,
    setEditingSolution,
  ] = useState<Solution | null>(null);

  const [
    viewingSolution,
    setViewingSolution,
  ] = useState<Solution | null>(null);

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          solutionRecords,
          opportunityRecords,
          ownerRecords,
        ] = await Promise.all([
          getSolutions({
            skip: 0,
            limit: 100,
          }),

          getSalesOpportunities({
            skip: 0,
            limit: 100,
          }),
          getPresalesOwners(),
        ]);

        setSolutions(solutionRecords);
        setOpportunities(
          opportunityRecords,
        );
        setOwners(ownerRecords);
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

  const filteredSolutions =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return solutions.filter(
        (solution) => {
          const opportunity =
            opportunities.find(
              (item) =>
                item.id ===
                solution.opportunity_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            solution.solution_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            solution.technology_stack
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            opportunity?.opportunity_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            opportunity?.client_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "ALL" ||
            solution.solution_status ===
              statusFilter;

          const matchesDelivery =
            deliveryFilter === "ALL" ||
            solution.delivery_model ===
              deliveryFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesDelivery
          );
        },
      );
    }, [
      deliveryFilter,
      opportunities,
      search,
      solutions,
      statusFilter,
    ]);

  const draftSolutions =
    solutions.filter(
      (solution) =>
        solution.solution_status ===
        "DRAFT",
    ).length;

  const rejectedSolutions =
    solutions.filter(
      (solution) =>
        solution.solution_status ===
        "REJECTED",
    ).length;

  const approvedSolutions =
    solutions.filter(
      (solution) =>
        solution.solution_status ===
        "APPROVED",
    ).length;

  async function handleSaveSolution(
    payload: CreateSolutionRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingSolution) {
        const updated =
          await replaceSolution(
            editingSolution.id,
            payload,
          );

        setSolutions((current) =>
          current.map((solution) =>
            solution.id === updated.id
              ? updated
              : solution,
          ),
        );
      } else {
        const created =
          await createSolution(payload);

        setSolutions((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingSolution(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSolution(
    solution: Solution,
  ): Promise<void> {
    const confirmed =
      await confirm(
        `Delete solution "${solution.solution_name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSolution(solution.id);

      setSolutions((current) =>
        current.filter(
          (record) =>
            record.id !== solution.id,
        ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(requestError),
      );
    }
  }

  function findOpportunity(
    opportunityId: number,
  ): SalesOpportunity | undefined {
    return opportunities.find(
      (opportunity) =>
        opportunity.id ===
        opportunityId,
    );
  }

  function findOwnerName(ownerId: number): string {
    return (
      owners.find((owner) => owner.id === ownerId)
        ?.full_name ?? "Unknown owner"
    );
  }

  function openCreateForm(): void {
    setEditingSolution(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    solution: Solution,
  ): void {
    setEditingSolution(solution);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="PRESALES">
      <DashboardLayout
        title="Solutions"
        description="Design technical solutions for qualified Sales opportunities."
      >
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Solutions"
              value={solutions.length.toLocaleString(
                "en-US",
              )}
              description="All Presales solutions in the database"
              icon={Layers3}
              variant="blue"
            />

            <StatCard
              title="Draft Solutions"
              value={draftSolutions.toLocaleString(
                "en-US",
              )}
              description="Solution designs still being prepared"
              icon={Edit3}
              variant="indigo"
            />

            <StatCard
              title="Rejected Solutions"
              value={rejectedSolutions.toLocaleString(
                "en-US",
              )}
              description="Solutions that require revision"
              icon={X}
              variant="cyan"
            />

            <StatCard
              title="Approved Solutions"
              value={approvedSolutions.toLocaleString(
                "en-US",
              )}
              description="Solutions approved for the next stage"
              icon={CheckCircle2}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Solution Designs
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {solutions.length} solution
                    {solutions.length === 1
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
                      !user ||
                      opportunities.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Create Solution
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
                opportunities.length ===
                  0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      No Sales opportunities are
                      available. Create an opportunity
                      from the Sales module before
                      creating a solution.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_200px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search solution, technology, opportunity, or client..."
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

                  <option value="DRAFT">
                    Draft
                  </option>

                  <option value="APPROVED">
                    Approved
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>
                </select>

                <select
                  value={deliveryFilter}
                  onChange={(event) =>
                    setDeliveryFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All delivery models
                  </option>

                  <option value="ONSITE">
                    Onsite
                  </option>

                  <option value="OFFSHORE">
                    Offshore
                  </option>

                  <option value="HYBRID">
                    Hybrid
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredSolutions.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Layers3 className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No solutions found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create a solution or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1350px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Solution
                        </th>

                        <th className="px-4 py-3">
                          Opportunity
                        </th>

                        <th className="px-4 py-3">
                          Delivery
                        </th>

                        <th className="px-4 py-3">
                          Duration
                        </th>

                        <th className="px-4 py-3">
                          Technology
                        </th>

                        <th className="px-4 py-3">
                          Owner
                        </th>

                        <th className="px-4 py-3">
                          Status
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
                      {filteredSolutions.map(
                        (solution) => {
                          const opportunity =
                            findOpportunity(
                              solution.opportunity_id,
                            );

                          return (
                            <tr
                              key={solution.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <Layers3 className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {
                                        solution.solution_name
                                      }
                                    </p>

                                    <p className="max-w-64 truncate text-xs text-slate-500">
                                      {
                                        solution.solution_summary
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />

                                  <div>
                                    <p className="font-medium text-slate-700">
                                      {opportunity?.opportunity_name ??
                                        `Opportunity #${solution.opportunity_id}`}
                                    </p>

                                    {opportunity && (
                                      <p className="text-xs text-slate-500">
                                        {
                                          opportunity.client_name
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getDeliveryModelClasses(
                                    solution.delivery_model,
                                  )}
                                >
                                  {formatLabel(
                                    solution.delivery_model,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarClock className="h-4 w-4 text-blue-600" />

                                  {
                                    solution.estimated_duration_months
                                  }{" "}
                                  months
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <p className="max-w-56 truncate text-sm text-slate-600">
                                  {
                                    solution.technology_stack
                                  }
                                </p>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <UserRound className="h-4 w-4 text-indigo-600" />

                                  {findOwnerName(
                                    solution.presales_owner_id,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getSolutionStatusClasses(
                                    solution.solution_status,
                                  )}
                                >
                                  {formatLabel(
                                    solution.solution_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatDate(
                                  solution.updated_at,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View solution"
                                    onClick={() =>
                                      setViewingSolution(
                                        solution,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit solution"
                                    onClick={() =>
                                      openEditForm(
                                        solution,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete solution"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteSolution(
                                        solution,
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

        {showForm && user && (
          <SolutionFormModal
            solution={editingSolution}
            opportunities={opportunities}
            currentUserId={user.id}
            currentUserName={user.full_name}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingSolution(
                  null,
                );
              }
            }}
            onSubmit={handleSaveSolution}
          />
        )}

        {viewingSolution && (
          <SolutionDetailsModal
            solution={viewingSolution}
            opportunity={findOpportunity(
              viewingSolution.opportunity_id,
            )}
            ownerName={findOwnerName(
              viewingSolution.presales_owner_id,
            )}
            onClose={() =>
              setViewingSolution(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
