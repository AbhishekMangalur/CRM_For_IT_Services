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
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Layers3,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
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
import { Textarea } from "@/components/ui/textarea";
import { ResourceMatches } from "@/components/resource-manager/ResourceMatches";

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

import {
  createResourceRequest,
  deleteResourceRequest,
  getResourceRequests,
  replaceResourceRequest,
} from "@/lib/resource-manager-api";

import { getSalesOpportunities } from "@/lib/sales-api";
import { getSolutions } from "@/lib/presales-api";

import type {
  CreateResourceRequestRequest,
  ResourceExperienceLevel,
  ResourceLocationType,
  ResourceRequest,
  ResourceRequestStatus,
} from "@/types/resource-manager";

import type {
  SalesOpportunity,
} from "@/types/sales";

import type {
  Solution,
} from "@/types/presales";

interface RequestUser {
  id: number;
  full_name: string;
}

async function getRequestUsers(): Promise<RequestUser[]> {
  const response = await api.get<RequestUser[]>("/api/users");
  return response.data;
}

/* ================================================= */
/* FORM */
/* ================================================= */

interface ResourceRequestFormState {
  opportunity_id: string;
  solution_id: string;

  requested_role: string;
  required_skill: string;

  experience_level:
    ResourceExperienceLevel;

  minimum_experience_years: string;

  quantity: string;

  required_from: string;
  required_until: string;

  allocation_percentage: string;

  location_type:
    ResourceLocationType;

  request_status:
    ResourceRequestStatus;

  notes: string;
}

const EMPTY_FORM: ResourceRequestFormState = {
  opportunity_id: "",
  solution_id: "",

  requested_role: "",
  required_skill: "",

  experience_level: "MID_LEVEL",

  minimum_experience_years: "",

  quantity: "1",

  required_from: "",
  required_until: "",

  allocation_percentage: "100",

  location_type: "OFFSHORE",

  request_status: "PENDING",

  notes: "",
};

/* ================================================= */
/* HELPERS */
/* ================================================= */

function formatLabel(
  value: string,
): string {
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
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function formatRequestNotes(
  notes: string | null,
): string {
  if (!notes) {
    return "No notes added.";
  }

  if (
    /^Automatically generated from Presales Resource Requirement #\d+$/i.test(
      notes.trim(),
    )
  ) {
    return "Automatically generated from the linked Presales Resource Requirement.";
  }

  return notes;
}

function getErrorMessage(
  error: unknown,
): string {
  if (!axios.isAxiosError(error)) {
    return "An unexpected error occurred.";
  }

  if (!error.response) {
    return "Unable to connect to the backend.";
  }

  const detail =
    error.response.data?.detail;

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
    typeof detail.message ===
      "string"
  ) {
    return detail.message;
  }

  return "The request could not be completed.";
}

function getStatusClasses(
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

function requestToForm(
  request: ResourceRequest,
): ResourceRequestFormState {
  return {
    opportunity_id:
      request.opportunity_id?.toString() ??
      "",

    solution_id:
      request.solution_id?.toString() ??
      "",

    requested_role:
      request.requested_role,

    required_skill:
      request.required_skill,

    experience_level:
      request.experience_level,

    minimum_experience_years:
      request.minimum_experience_years.toString(),

    quantity:
      request.quantity.toString(),

    required_from:
      request.required_from,

    required_until:
      request.required_until ?? "",

    allocation_percentage:
      request.allocation_percentage.toString(),

    location_type:
      request.location_type,

    request_status:
      request.request_status,

    notes:
      request.notes ?? "",
  };
}

function formToPayload(
  form: ResourceRequestFormState,
  requestedBy: number,
): CreateResourceRequestRequest {
  return {
    opportunity_id:
      form.opportunity_id
        ? Number(form.opportunity_id)
        : null,

    solution_id:
      form.solution_id
        ? Number(form.solution_id)
        : null,

    requested_role:
      form.requested_role.trim(),

    required_skill:
      form.required_skill.trim(),

    experience_level:
      form.experience_level,

    minimum_experience_years:
      Number(
        form.minimum_experience_years,
      ),

    quantity:
      Number(form.quantity),

    required_from:
      form.required_from,

    required_until:
      form.required_until || null,

    allocation_percentage:
      Number(
        form.allocation_percentage,
      ),

    location_type:
      form.location_type,

    request_status:
      form.request_status,

    requested_by:
      requestedBy,

    notes:
      form.notes.trim() || null,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface ResourceRequestFormModalProps {
  request: ResourceRequest | null;

  opportunities:
    SalesOpportunity[];

  solutions:
    Solution[];

  currentUserId: number;
  currentUserName: string;

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreateResourceRequestRequest,
  ) => Promise<void>;
}

function ResourceRequestFormModal({
  request,
  opportunities,
  solutions,
  currentUserId,
  currentUserName,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ResourceRequestFormModalProps) {
  const [form, setForm] =
    useState<ResourceRequestFormState>(
      request
        ? requestToForm(request)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<
          HTMLSelectElement
        >
      | ChangeEvent<
          HTMLTextAreaElement
        >,
  ): void {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const invalidDateRange =
    Boolean(form.required_from) &&
    Boolean(form.required_until) &&
    new Date(
      form.required_until,
    ).getTime() <
      new Date(
        form.required_from,
      ).getTime();

  const isInvalid =
    !form.requested_role.trim() ||
    !form.required_skill.trim() ||
    !form.minimum_experience_years ||
    Number(
      form.minimum_experience_years,
    ) < 0 ||
    !form.quantity ||
    Number(form.quantity) <= 0 ||
    !form.required_from ||
    !form.allocation_percentage ||
    Number(
      form.allocation_percentage,
    ) <= 0 ||
    Number(
      form.allocation_percentage,
    ) > 100 ||
    invalidDateRange;

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
              {request
                ? "Edit Resource Request"
                : "Create Resource Request"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define the resource demand
              for an opportunity or
              Presales solution.
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

        <form
          onSubmit={handleSubmit}
        >
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
                  Required until date
                  cannot be before
                  required from date.
                </AlertDescription>
              </Alert>
            )}

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
                      key={
                        opportunity.id
                      }
                      value={
                        opportunity.id
                      }
                    >
                      #
                      {
                        opportunity.id
                      }{" "}
                      -{" "}
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
                value={
                  form.solution_id
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  No solution
                </option>

                {solutions.map(
                  (solution) => (
                    <option
                      key={
                        solution.id
                      }
                      value={
                        solution.id
                      }
                    >
                      #
                      {
                        solution.id
                      }{" "}
                      -{" "}
                      {
                        solution.solution_name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            {/* Role */}

            <div className="space-y-2">
              <Label htmlFor="requested_role">
                Requested role *
              </Label>

              <Input
                id="requested_role"
                name="requested_role"
                value={
                  form.requested_role
                }
                onChange={handleChange}
                placeholder="Cloud Engineer"
                required
              />
            </div>

            {/* Skill */}

            <div className="space-y-2">
              <Label htmlFor="required_skill">
                Required skill *
              </Label>

              <Input
                id="required_skill"
                name="required_skill"
                value={
                  form.required_skill
                }
                onChange={handleChange}
                placeholder="AWS"
                required
              />
            </div>

            {/* Experience Level */}

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

            {/* Minimum Experience */}

            <div className="space-y-2">
              <Label htmlFor="minimum_experience_years">
                Minimum experience
                (years) *
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

            {/* Quantity */}

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity *
              </Label>

              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={
                  form.quantity
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* Allocation */}

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

            {/* Required From */}

            <div className="space-y-2">
              <Label htmlFor="required_from">
                Required from *
              </Label>

              <Input
                id="required_from"
                name="required_from"
                type="date"
                value={
                  form.required_from
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* Required Until */}

            <div className="space-y-2">
              <Label htmlFor="required_until">
                Required until
              </Label>

              <Input
                id="required_until"
                name="required_until"
                type="date"
                value={
                  form.required_until
                }
                onChange={handleChange}
              />
            </div>

            {/* Location */}

            <div className="space-y-2">
              <Label htmlFor="location_type">
                Location type
              </Label>

              <select
                id="location_type"
                name="location_type"
                value={
                  form.location_type
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
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

            {/* Status */}

            <div className="space-y-2">
              <Label htmlFor="request_status">
                Request status
              </Label>

              <select
                id="request_status"
                name="request_status"
                value={
                  form.request_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="ALLOCATED">
                  Allocated
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            {/* Requested By */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <UserRound className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Requested by
                  </p>

                  <p className="text-sm text-slate-500">
                    {currentUserName}
                  </p>
                </div>
              </div>
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
                placeholder="Required for the cloud migration solution..."
                rows={4}
              />
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
                isSaving ||
                isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {request
                ? "Save changes"
                : "Create request"}
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

interface ResourceRequestDetailsProps {
  request: ResourceRequest;

  opportunity?:
    SalesOpportunity;

  solution?: Solution;

  requestedByName: string;

  onClose: () => void;
}

function ResourceRequestDetailsModal({
  request,
  opportunity,
  solution,
  requestedByName,
  onClose,
}: ResourceRequestDetailsProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {request.requested_role}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Resource Request
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
              Required Skill
            </p>

            <p className="mt-2 text-2xl font-bold">
              {request.required_skill}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Quantity
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {request.quantity}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Opportunity
            </p>

            <p className="mt-1 font-semibold">
              {opportunity
                ?.opportunity_name ??
                (request.opportunity_id
                  ? `Opportunity #${request.opportunity_id}`
                  : "Not linked")}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Solution
            </p>

            <p className="mt-1 font-semibold">
              {solution
                ?.solution_name ??
                (request.solution_id
                  ? `Solution #${request.solution_id}`
                  : "Not linked")}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Experience
            </p>

            <Badge
              className={`mt-2 ${getExperienceClasses(
                request.experience_level,
              )}`}
            >
              {formatLabel(
                request.experience_level,
              )}
            </Badge>

            <p className="mt-2 text-sm text-slate-500">
              Minimum{" "}
              {
                request.minimum_experience_years
              }{" "}
              years
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-2 ${getStatusClasses(
                request.request_status,
              )}`}
            >
              {formatLabel(
                request.request_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Location
            </p>

            <p className="mt-1 font-semibold">
              {formatLabel(
                request.location_type,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Allocation
            </p>

            <p className="mt-1 font-semibold">
              {
                request.allocation_percentage
              }
              %
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Required From
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                request.required_from,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Required Until
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                request.required_until,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Requested By
            </p>

            <p className="mt-1 font-semibold">
              {requestedByName}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {formatRequestNotes(
                request.notes,
              )}
            </p>
          </div>

          {request && (
            <div className="sm:col-span-2">
              <ResourceMatches
                request={request}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* PAGE */
/* ================================================= */

export default function ResourceManagerResourceRequestsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [
    requests,
    setRequests,
  ] = useState<ResourceRequest[]>(
    [],
  );

  const [
    opportunities,
    setOpportunities,
  ] = useState<
    SalesOpportunity[]
  >([]);

  const [
    solutions,
    setSolutions,
  ] = useState<Solution[]>([]);

  const [requestUsers, setRequestUsers] =
    useState<RequestUser[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    experienceFilter,
    setExperienceFilter,
  ] = useState("ALL");

  const [
    locationFilter,
    setLocationFilter,
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
    editingRequest,
    setEditingRequest,
  ] = useState<
    ResourceRequest | null
  >(null);

  const [
    viewingRequest,
    setViewingRequest,
  ] = useState<
    ResourceRequest | null
  >(null);

  /* ---------------- LOAD ---------------- */

  const loadData =
    useCallback(
      async (): Promise<void> => {
        setIsLoading(true);
        setError("");

        try {
          const [
            requestRecords,
            opportunityRecords,
            solutionRecords,
            userRecords,
          ] = await Promise.all([
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

            getRequestUsers(),
          ]);

          setRequests(
            requestRecords,
          );

          setOpportunities(
            opportunityRecords,
          );

          setSolutions(
            solutionRecords,
          );

          setRequestUsers(userRecords);
        } catch (requestError) {
          setError(
            getErrorMessage(
              requestError,
            ),
          );
        } finally {
          setIsLoading(false);
        }
      },
      [],
    );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  /* ---------------- LOOKUPS ---------------- */

  function findOpportunity(
    opportunityId:
      | number
      | null,
  ):
    | SalesOpportunity
    | undefined {
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
        solution.id ===
        solutionId,
    );
  }

  /* ---------------- FILTER ---------------- */

  const filteredRequests =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const opportunity =
            opportunities.find(
              (record) =>
                record.id ===
                request.opportunity_id,
            );

          const solution =
            solutions.find(
              (record) =>
                record.id ===
                request.solution_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            request.requested_role
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            request.required_skill
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            request.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            opportunity
              ?.opportunity_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            solution
              ?.solution_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            request.request_status ===
              statusFilter;

          const matchesExperience =
            experienceFilter ===
              "ALL" ||
            request.experience_level ===
              experienceFilter;

          const matchesLocation =
            locationFilter ===
              "ALL" ||
            request.location_type ===
              locationFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesExperience &&
            matchesLocation
          );
        },
      );
    }, [
      experienceFilter,
      locationFilter,
      opportunities,
      requests,
      search,
      solutions,
      statusFilter,
    ]);

  /* ---------------- KPI ---------------- */

  const pendingRequests =
    requests.filter(
      (request) =>
        request.request_status ===
        "PENDING",
    ).length;

  const inProgressRequests =
    requests.filter(
      (request) =>
        request.request_status ===
        "IN_PROGRESS",
    ).length;

  const allocatedRequests =
    requests.filter(
      (request) =>
        request.request_status ===
        "ALLOCATED",
    ).length;

  const totalPeopleRequired =
    requests
      .filter(
        (request) =>
          request.request_status !==
          "CANCELLED",
      )
      .reduce(
        (total, request) =>
          total +
          Number(request.quantity),
        0,
      );

  /* ---------------- SAVE ---------------- */

  async function handleSaveRequest(
    payload: CreateResourceRequestRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingRequest) {
        const updated =
          await replaceResourceRequest(
            editingRequest.id,
            payload,
          );

        setRequests(
          (current) =>
            current.map(
              (request) =>
                request.id ===
                updated.id
                  ? updated
                  : request,
            ),
        );
      } else {
        const created =
          await createResourceRequest(
            payload,
          );

        setRequests(
          (current) => [
            created,
            ...current,
          ],
        );
      }

      setShowForm(false);
      setEditingRequest(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(
          requestError,
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  /* ---------------- DELETE ---------------- */

  async function handleDeleteRequest(
    request: ResourceRequest,
  ): Promise<void> {
    const confirmed =
      await confirm(
        `Delete resource request "${request.requested_role}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteResourceRequest(
        request.id,
      );

      setRequests(
        (current) =>
          current.filter(
            (record) =>
              record.id !==
              request.id,
          ),
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    }
  }

  return (
    <ProtectedRoute allowedRole="RESOURCE_MANAGER">
      <DashboardLayout
        title="Resource Requests"
        description="Review and manage workforce demand from Sales and Presales."
      >
        <div className="space-y-6">
          {/* KPI */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Pending Requests"
              value={pendingRequests.toLocaleString(
                "en-US",
              )}
              description="Requests waiting for resource planning"
              icon={Clock3}
              variant="blue"
            />

            <StatCard
              title="In Progress"
              value={inProgressRequests.toLocaleString(
                "en-US",
              )}
              description="Requests currently being worked on"
              icon={BriefcaseBusiness}
              variant="indigo"
            />

            <StatCard
              title="Resources Required"
              value={totalPeopleRequired.toLocaleString(
                "en-US",
              )}
              description="Total people required across active requests"
              icon={Users}
              variant="cyan"
            />

            <StatCard
              title="Allocated Requests"
              value={allocatedRequests.toLocaleString(
                "en-US",
              )}
              description="Requests fulfilled through resource allocation"
              icon={CheckCircle2}
              variant="emerald"
            />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Resource Demand
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {requests.length} request
                    {requests.length ===
                    1
                      ? ""
                      : "s"}{" "}
                    loaded from the
                    database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadData()
                    }
                    disabled={
                      isLoading
                    }
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
                    disabled={!user}
                    onClick={() => {
                      setEditingRequest(
                        null,
                      );

                      setFormError(
                        "",
                      );

                      setShowForm(
                        true,
                      );
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Create Request
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

              {/* Filters */}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_200px_200px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(
                      event,
                    ) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search role, skill, opportunity, solution or notes..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={
                    statusFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setStatusFilter(
                      event.target
                        .value,
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

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="ALLOCATED">
                    Allocated
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>

                <select
                  value={
                    experienceFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setExperienceFilter(
                      event.target
                        .value,
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

                <select
                  value={
                    locationFilter
                  }
                  onChange={(
                    event,
                  ) =>
                    setLocationFilter(
                      event.target
                        .value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All locations
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

              {/* Table */}

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredRequests.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <BriefcaseBusiness className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No resource
                    requests found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1500px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Requirement
                        </th>

                        <th className="px-4 py-3">
                          Opportunity
                        </th>

                        <th className="px-4 py-3">
                          Solution
                        </th>

                        <th className="px-4 py-3">
                          Experience
                        </th>

                        <th className="px-4 py-3">
                          Quantity
                        </th>

                        <th className="px-4 py-3">
                          Period
                        </th>

                        <th className="px-4 py-3">
                          Location
                        </th>

                        <th className="px-4 py-3">
                          Allocation
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
                      {filteredRequests.map(
                        (
                          request,
                        ) => {
                          const opportunity =
                            findOpportunity(
                              request.opportunity_id,
                            );

                          const solution =
                            findSolution(
                              request.solution_id,
                            );

                          return (
                            <tr
                              key={
                                request.id
                              }
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <BriefcaseBusiness className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {
                                        request.requested_role
                                      }
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      {
                                        request.required_skill
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm">
                                {opportunity?.opportunity_name ??
                                  (request.opportunity_id
                                    ? `Opportunity #${request.opportunity_id}`
                                    : "—")}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <Layers3 className="h-4 w-4 text-indigo-600" />

                                  {solution?.solution_name ??
                                    (request.solution_id
                                      ? `Solution #${request.solution_id}`
                                      : "—")}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getExperienceClasses(
                                    request.experience_level,
                                  )}
                                >
                                  {formatLabel(
                                    request.experience_level,
                                  )}
                                </Badge>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    request.minimum_experience_years
                                  }{" "}
                                  yrs
                                </p>
                              </td>

                              <td className="px-4 py-4 font-semibold">
                                {
                                  request.quantity
                                }
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                  <CalendarDays className="h-4 w-4 text-blue-600" />

                                  <div>
                                    <p>
                                      {formatDate(
                                        request.required_from,
                                      )}
                                    </p>

                                    <p className="text-xs text-slate-400">
                                      to{" "}
                                      {formatDate(
                                        request.required_until,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm">
                                  <MapPin className="h-4 w-4 text-indigo-600" />

                                  {formatLabel(
                                    request.location_type,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4 font-medium">
                                {
                                  request.allocation_percentage
                                }
                                %
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getStatusClasses(
                                    request.request_status,
                                  )}
                                >
                                  {formatLabel(
                                    request.request_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View request"
                                    onClick={() =>
                                      setViewingRequest(
                                        request,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit request"
                                    onClick={() => {
                                      setEditingRequest(
                                        request,
                                      );

                                      setFormError(
                                        "",
                                      );

                                      setShowForm(
                                        true,
                                      );
                                    }}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete request"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteRequest(
                                        request,
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
          <ResourceRequestFormModal
            request={
              editingRequest
            }
            opportunities={
              opportunities
            }
            solutions={
              solutions
            }
            currentUserId={
              user.id
            }
            currentUserName={
              user.full_name
            }
            isSaving={
              isSaving
            }
            error={formError}
            onClose={() => {
              if (
                !isSaving
              ) {
                setShowForm(
                  false,
                );

                setEditingRequest(
                  null,
                );
              }
            }}
            onSubmit={
              handleSaveRequest
            }
          />
        )}

        {viewingRequest && (
          <ResourceRequestDetailsModal
            request={
              viewingRequest
            }
            opportunity={findOpportunity(
              viewingRequest.opportunity_id,
            )}
            solution={findSolution(
              viewingRequest.solution_id,
            )}
            requestedByName={
              requestUsers.find(
                (record) =>
                  record.id ===
                  viewingRequest.requested_by,
              )?.full_name ?? "Unknown user"
            }
            onClose={() =>
              setViewingRequest(
                null,
              )
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
