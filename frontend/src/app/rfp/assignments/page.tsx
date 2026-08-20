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
  CalendarClock,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Loader2,
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

import { api } from "@/lib/api";

import {
  createRfpAssignment,
  deleteRfpAssignment,
  getRfpAssignments,
  getRfps,
  replaceRfpAssignment,
} from "@/lib/rfp-api";

import type {
  CreateRfpAssignmentRequest,
  Rfp,
  RfpAssignment,
  RfpAssignmentRole,
  RfpAssignmentStatus,
} from "@/types/rfp";

/* ================================================= */
/* USER */
/* ================================================= */

interface AssignmentUserRole {
  id: number;
  name: string;
  display_name: string;
}

interface AssignmentUser {
  id: number;
  full_name: string;
  email: string;
  role: AssignmentUserRole;
  is_active?: boolean;
}

async function getUsers(): Promise<AssignmentUser[]> {
  const response =
    await api.get<AssignmentUser[]>(
      "/api/users",
    );

  return response.data;
}

interface SearchSelectOption {
  value: string;
  label: string;
  description: string;
  searchText: string;
}

interface SearchSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
}

function SearchSelect({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
}: SearchSelectProps) {
  const selectedOption = options.find(
    (option) => option.value === value,
  );
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter(
    (option) =>
      !normalizedQuery ||
      option.searchText.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} *</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id={id}
          type="search"
          autoComplete="off"
          required
          value={query}
          placeholder={placeholder}
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
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
            id={`${id}-options`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
          >
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value === option.value}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(option.label);
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-slate-700">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block text-xs text-slate-500">
                      {option.description}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                No matching records found.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================= */
/* FORM */
/* ================================================= */

interface AssignmentFormState {
  rfp_id: string;
  user_id: string;

  assignment_role:
    RfpAssignmentRole;

  assignment_status:
    RfpAssignmentStatus;

  due_date: string;

  notes: string;
}

const EMPTY_FORM: AssignmentFormState = {
  rfp_id: "",
  user_id: "",

  assignment_role:
    "SOLUTION_ARCHITECT",

  assignment_status:
    "ASSIGNED",

  due_date: "",

  notes: "",
};

/* ================================================= */
/* HELPERS */
/* ================================================= */

function formatLabel(
  value: string | number | null | undefined,
): string {
  return String(value ?? "")
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

function getAssignmentRoleClasses(
  role: string,
): string {
  switch (role.toUpperCase()) {
    case "BID_OWNER":
      return "bg-blue-100 text-blue-700";

    case "SOLUTION_ARCHITECT":
      return "bg-indigo-100 text-indigo-700";

    case "TECHNICAL_WRITER":
      return "bg-cyan-100 text-cyan-700";

    case "COMMERCIAL_REVIEWER":
      return "bg-violet-100 text-violet-700";

    case "RESOURCE_REVIEWER":
      return "bg-amber-100 text-amber-700";

    case "APPROVER":
      return "bg-emerald-100 text-emerald-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function assignmentToForm(
  assignment: RfpAssignment,
): AssignmentFormState {
  return {
    rfp_id:
      assignment.rfp_id.toString(),

    user_id:
      assignment.user_id.toString(),

    assignment_role:
      assignment.assignment_role,

    assignment_status:
      assignment.assignment_status,

    due_date:
      assignment.due_date ?? "",

    notes:
      assignment.notes ?? "",
  };
}

function formToPayload(
  form: AssignmentFormState,
): CreateRfpAssignmentRequest {
  return {
    rfp_id:
      Number(form.rfp_id),

    user_id:
      Number(form.user_id),

    assignment_role:
      form.assignment_role,

    assignment_status:
      form.assignment_status,

    due_date:
      form.due_date || null,

    notes:
      form.notes.trim() || null,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface AssignmentFormModalProps {
  assignment:
    | RfpAssignment
    | null;

  rfps: Rfp[];

  users: AssignmentUser[];

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreateRfpAssignmentRequest,
  ) => Promise<void>;
}

function AssignmentFormModal({
  assignment,
  rfps,
  users,
  isSaving,
  error,
  onClose,
  onSubmit,
}: AssignmentFormModalProps) {
  const [form, setForm] =
    useState<AssignmentFormState>(
      assignment
        ? assignmentToForm(
            assignment,
          )
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ): void {
    const { name, value } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  const selectedRfp =
    rfps.find(
      (rfp) =>
        rfp.id ===
        Number(form.rfp_id),
    );

  const dueDateAfterDeadline =
    Boolean(form.due_date) &&
    Boolean(
      selectedRfp?.submission_deadline,
    ) &&
    new Date(
      form.due_date,
    ).getTime() >
      new Date(
        selectedRfp!
          .submission_deadline,
      ).getTime();

  const isInvalid =
    !form.rfp_id ||
    !form.user_id ||
    dueDateAfterDeadline;

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {assignment
                ? "Edit RFP Assignment"
                : "Assign Team Member"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assign a cross-functional team
              member after the backend has
              approved the RFP for BID.
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

            {dueDateAfterDeadline && (
              <Alert
                variant="destructive"
                className="md:col-span-2"
              >
                <AlertDescription>
                  Assignment due date cannot
                  be later than the RFP
                  submission deadline.
                </AlertDescription>
              </Alert>
            )}

            {/* RFP */}

            <div className="md:col-span-2">
              <SearchSelect
                id="rfp_id"
                label="BID Approved RFP"
                placeholder="Search by RFP number, title, client, or service..."
                value={form.rfp_id}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    rfp_id: value,
                  }))
                }
                options={rfps
                  .filter(
                    (rfp) =>
                      rfp.bid_decision ===
                      "BID",
                  )
                  .map((rfp) => ({
                    value: rfp.id.toString(),
                    label: `${rfp.rfp_number} · ${rfp.title}`,
                    description: `${rfp.client_name} · ${rfp.service_type} · Due ${formatDate(rfp.submission_deadline)}`,
                    searchText: `${rfp.rfp_number} ${rfp.title} ${rfp.client_name} ${rfp.service_type}`,
                  }))}
              />

              <p className="text-xs text-slate-500">
                Only RFPs with
                bid_decision = BID are
                available.
              </p>
            </div>

            {/* USER */}

            <SearchSelect
                id="user_id"
                label="Team Member"
                placeholder="Search by team member name, email, or role..."
                value={form.user_id}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    user_id: value,
                  }))
                }
                options={users
                  .filter((user) => user.is_active !== false)
                  .map((user) => ({
                    value: user.id.toString(),
                    label: user.full_name,
                    description: `${user.role.display_name} · ${user.email}`,
                    searchText: `${user.full_name} ${user.email} ${user.role.name} ${user.role.display_name}`,
                  }))}
              />

            {/* ROLE */}

            <SearchSelect
                id="assignment_role"
                label="Assignment Role"
                placeholder="Search assignment role..."
                value={
                  form.assignment_role
                }
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    assignment_role: value as RfpAssignmentRole,
                  }))
                }
                options={[
                  "BID_OWNER",
                  "SOLUTION_ARCHITECT",
                  "TECHNICAL_WRITER",
                  "COMMERCIAL_REVIEWER",
                  "RESOURCE_REVIEWER",
                  "APPROVER",
                ].map((role) => ({
                  value: role,
                  label: formatLabel(role),
                  description: "",
                  searchText: `${role} ${formatLabel(role)}`,
                }))}
              />

            {/* STATUS */}

            <div className="space-y-2">
              <Label htmlFor="assignment_status">
                Assignment Status
              </Label>

              <select
                id="assignment_status"
                name="assignment_status"
                value={
                  form.assignment_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ASSIGNED">
                  Assigned
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="COMPLETED">
                  Completed
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            {/* DUE DATE */}

            <div className="space-y-2">
              <Label htmlFor="due_date">
                Due Date
              </Label>

              <Input
                id="due_date"
                name="due_date"
                type="date"
                value={form.due_date}
                max={
                  selectedRfp
                    ?.submission_deadline
                }
                onChange={handleChange}
              />

              {selectedRfp && (
                <p className="text-xs text-slate-500">
                  RFP deadline:{" "}
                  {formatDate(
                    selectedRfp
                      .submission_deadline,
                  )}
                </p>
              )}
            </div>

            {/* RFP INFO */}

            {selectedRfp && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:col-span-2">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Client
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {
                        selectedRfp.client_name
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Status
                    </p>

                    <Badge className="mt-1 bg-emerald-100 text-emerald-700">
                      BID
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Submission
                    </p>

                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(
                        selectedRfp
                          .submission_deadline,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* NOTES */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">
                Notes
              </Label>

              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={5}
                placeholder="Prepare architecture, technical solution and effort estimation..."
              />
            </div>

            {!assignment && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 md:col-span-2">
                <AlertDescription>
                  Creating the first
                  assignment automatically
                  moves the RFP to
                  IN_PROGRESS on the backend.
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
                isSaving ||
                isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {assignment
                ? "Save Changes"
                : "Assign Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================================================= */
/* DETAILS */
/* ================================================= */

interface AssignmentDetailsModalProps {
  assignment:
    RfpAssignment;

  rfp?: Rfp;

  user?: AssignmentUser;

  onClose: () => void;
}

function AssignmentDetailsModal({
  assignment,
  rfp,
  user,
  onClose,
}: AssignmentDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {rfp?.title ??
                `RFP #${assignment.rfp_id}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Assignment #
              {assignment.id}
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
              Assignment Role
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatLabel(
                assignment.assignment_role,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-3 ${getAssignmentStatusClasses(
                assignment.assignment_status,
              )}`}
            >
              {formatLabel(
                assignment.assignment_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Team Member
            </p>

            <p className="mt-1 font-semibold">
              {user?.full_name ??
                `User #${assignment.user_id}`}
            </p>

            {user && (
              <p className="mt-1 text-sm text-slate-500">
                {user.role.display_name}{" "}
                · {user.email}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              RFP
            </p>

            <p className="mt-1 font-semibold">
              {rfp?.rfp_number ??
                `RFP #${assignment.rfp_id}`}
            </p>

            {rfp && (
              <p className="mt-1 text-sm text-slate-500">
                {rfp.client_name}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Assignment Due
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                assignment.due_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              RFP Submission
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                rfp?.submission_deadline ??
                  null,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                assignment.created_at,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {assignment.notes ||
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

export default function RfpAssignmentsPage() {
  const confirm = useConfirm();
  const [
    assignments,
    setAssignments,
  ] = useState<RfpAssignment[]>(
    [],
  );

  const [rfps, setRfps] =
    useState<Rfp[]>([]);

  const [users, setUsers] =
    useState<AssignmentUser[]>(
      [],
    );

  const [search, setSearch] =
    useState("");

  const [
    rfpFilter,
    setRfpFilter,
  ] = useState("ALL");

  const [
    roleFilter,
    setRoleFilter,
  ] = useState("ALL");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingAssignment,
    setEditingAssignment,
  ] =
    useState<RfpAssignment | null>(
      null,
    );

  const [
    viewingAssignment,
    setViewingAssignment,
  ] =
    useState<RfpAssignment | null>(
      null,
    );

  /* ================================================= */
  /* LOAD */
  /* ================================================= */

  const loadData =
    useCallback(
      async (): Promise<void> => {
        setIsLoading(true);
        setError("");

        try {
          const [
            assignmentRecords,
            rfpRecords,
            userRecords,
          ] = await Promise.all([
            getRfpAssignments({
              skip: 0,
              limit: 100,
            }),

            getRfps({
              skip: 0,
              limit: 100,
            }),

            getUsers(),
          ]);

          setAssignments(
            assignmentRecords,
          );

          setRfps(rfpRecords);

          setUsers(
            userRecords.filter(
              (user) =>
                user.is_active !==
                false,
            ),
          );
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

  /* ================================================= */
  /* LOOKUPS */
  /* ================================================= */

  function findRfp(
    rfpId: number,
  ): Rfp | undefined {
    return rfps.find(
      (rfp) =>
        rfp.id === rfpId,
    );
  }

  function findUser(
    userId: number,
  ): AssignmentUser | undefined {
    return users.find(
      (user) =>
        user.id === userId,
    );
  }

  /* ================================================= */
  /* FILTER */
  /* ================================================= */

  const filteredAssignments =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return assignments.filter(
        (assignment) => {
          const rfp =
            rfps.find(
              (record) =>
                record.id ===
                assignment.rfp_id,
            );

          const user =
            users.find(
              (record) =>
                record.id ===
                assignment.user_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            rfp?.title
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            rfp?.rfp_number
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            user?.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            assignment.assignment_role
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            assignment.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesRfp =
            rfpFilter === "ALL" ||
            assignment.rfp_id ===
              Number(rfpFilter);

          const matchesRole =
            roleFilter === "ALL" ||
            assignment.assignment_role ===
              roleFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            assignment.assignment_status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesRfp &&
            matchesRole &&
            matchesStatus
          );
        },
      );
    }, [
      assignments,
      rfpFilter,
      rfps,
      roleFilter,
      search,
      statusFilter,
      users,
    ]);

  /* ================================================= */
  /* KPI */
  /* ================================================= */

  const activeAssignments =
    assignments.filter(
      (assignment) =>
        ![
          "COMPLETED",
          "CANCELLED",
        ].includes(
          assignment.assignment_status,
        ),
    ).length;

  const completedAssignments =
    assignments.filter(
      (assignment) =>
        assignment.assignment_status ===
        "COMPLETED",
    ).length;

  const assignedRfps =
    new Set(
      assignments.map(
        (assignment) =>
          assignment.rfp_id,
      ),
    ).size;

  const assignedUsers =
    new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.assignment_status !==
            "CANCELLED",
        )
        .map(
          (assignment) =>
            assignment.user_id,
        ),
    ).size;

  /* ================================================= */
  /* SAVE */
  /* ================================================= */

  async function handleSaveAssignment(
    payload:
      CreateRfpAssignmentRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingAssignment) {
        await replaceRfpAssignment(
          editingAssignment.id,
          payload,
        );
      } else {
        await createRfpAssignment(
          payload,
        );
      }

      setShowForm(false);
      setEditingAssignment(null);

      /*
       * Important:
       * the backend may have changed
       * RFP status to IN_PROGRESS.
       */
      await loadData();
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

  /* ================================================= */
  /* DELETE */
  /* ================================================= */

  async function handleDeleteAssignment(
    assignment: RfpAssignment,
  ): Promise<void> {
    const user =
      findUser(
        assignment.user_id,
      );

    const rfp =
      findRfp(
        assignment.rfp_id,
      );

    const confirmed =
      await confirm(
        `Delete assignment for "${
          user?.full_name ??
          `User #${assignment.user_id}`
        }" from "${
          rfp?.title ??
          `RFP #${assignment.rfp_id}`
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteRfpAssignment(
        assignment.id,
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
        ),
      );
    }
  }

  /* ================================================= */
  /* MODALS */
  /* ================================================= */

  function openCreateForm(): void {
    setEditingAssignment(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    assignment: RfpAssignment,
  ): void {
    setEditingAssignment(
      assignment,
    );

    setFormError("");
    setShowForm(true);
  }

  const bidApprovedRfps =
    rfps.filter(
      (rfp) =>
        rfp.bid_decision ===
        "BID",
    );

  return (
    <ProtectedRoute
      allowedRoles={[
        "SALES",
        "PRESALES",
        "ACCOUNT_DIRECTOR",
      ]}
    >
      <DashboardLayout
        title="RFP Assignments"
        description="Assign cross-functional team members to BID-approved RFPs and track their work."
      >
        <div className="space-y-6">

          {/* KPI */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Assignments"
              value={assignments.length.toLocaleString(
                "en-US",
              )}
              description="All RFP team assignments"
              icon={Users}
              variant="blue"
            />

            <StatCard
              title="Active Assignments"
              value={activeAssignments.toLocaleString(
                "en-US",
              )}
              description="Assigned or currently in progress"
              icon={UserRound}
              variant="indigo"
            />

            <StatCard
              title="Assigned RFPs"
              value={assignedRfps.toLocaleString(
                "en-US",
              )}
              description={`${completedAssignments} completed assignments`}
              icon={FileText}
              variant="cyan"
            />

            <StatCard
              title="Team Members"
              value={assignedUsers.toLocaleString(
                "en-US",
              )}
              description="Unique users participating in bids"
              icon={CheckCircle2}
              variant="emerald"
            />
          </section>

          {/* MAIN */}

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Bid Team Assignments
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {assignments.length} assignment
                    {assignments.length === 1
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
                      bidApprovedRfps.length ===
                        0 ||
                      users.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Assign Member
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
                bidApprovedRfps.length ===
                  0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      No BID-approved RFP is
                      currently available.
                      Complete a successful bid
                      evaluation first.
                    </AlertDescription>
                  </Alert>
                )}

              {/* FILTERS */}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_260px_230px_200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="Search RFP, team member, role or notes..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={rfpFilter}
                  onChange={(event) =>
                    setRfpFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All RFPs
                  </option>

                  {rfps.map((rfp) => (
                    <option
                      key={rfp.id}
                      value={rfp.id}
                    >
                      {rfp.rfp_number} -{" "}
                      {rfp.title}
                    </option>
                  ))}
                </select>

                <select
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All Assignment Roles
                  </option>

                  <option value="BID_OWNER">
                    Bid Owner
                  </option>

                  <option value="SOLUTION_ARCHITECT">
                    Solution Architect
                  </option>

                  <option value="TECHNICAL_WRITER">
                    Technical Writer
                  </option>

                  <option value="COMMERCIAL_REVIEWER">
                    Commercial Reviewer
                  </option>

                  <option value="RESOURCE_REVIEWER">
                    Resource Reviewer
                  </option>

                  <option value="APPROVER">
                    Approver
                  </option>
                </select>

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
                    All Statuses
                  </option>

                  <option value="ASSIGNED">
                    Assigned
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              </div>

              {/* TABLE */}

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredAssignments.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Users className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No RFP assignments found
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1450px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          RFP
                        </th>

                        <th className="px-4 py-3">
                          Team Member
                        </th>

                        <th className="px-4 py-3">
                          Assignment Role
                        </th>

                        <th className="px-4 py-3">
                          Due Date
                        </th>

                        <th className="px-4 py-3">
                          RFP Deadline
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                        <th className="px-4 py-3">
                          Created
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredAssignments.map(
                        (assignment) => {
                          const rfp =
                            findRfp(
                              assignment.rfp_id,
                            );

                          const user =
                            findUser(
                              assignment.user_id,
                            );

                          return (
                            <tr
                              key={assignment.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <FileText className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {rfp?.title ??
                                        `RFP #${assignment.rfp_id}`}
                                    </p>

                                    {rfp && (
                                      <p className="text-xs text-slate-500">
                                        {
                                          rfp.rfp_number
                                        }{" "}
                                        ·{" "}
                                        {
                                          rfp.client_name
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <UserRound className="h-4 w-4 text-indigo-600" />

                                  <div>
                                    <p className="font-medium text-slate-700">
                                      {user?.full_name ??
                                        `User #${assignment.user_id}`}
                                    </p>

                                    {user && (
                                      <p className="text-xs text-slate-500">
                                        {user.role.display_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getAssignmentRoleClasses(
                                    assignment.assignment_role,
                                  )}
                                >
                                  {formatLabel(
                                    assignment.assignment_role,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarClock className="h-4 w-4 text-blue-600" />

                                  {formatDate(
                                    assignment.due_date,
                                  )}
                                </div>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatDate(
                                  rfp?.submission_deadline ??
                                    null,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getAssignmentStatusClasses(
                                    assignment.assignment_status,
                                  )}
                                >
                                  {formatLabel(
                                    assignment.assignment_status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4 text-sm text-slate-600">
                                {formatDate(
                                  assignment.created_at,
                                )}
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View assignment"
                                    onClick={() =>
                                      setViewingAssignment(
                                        assignment,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit assignment"
                                    onClick={() =>
                                      openEditForm(
                                        assignment,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete assignment"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteAssignment(
                                        assignment,
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
          <AssignmentFormModal
            assignment={
              editingAssignment
            }
            rfps={rfps}
            users={users}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingAssignment(
                  null,
                );
              }
            }}
            onSubmit={
              handleSaveAssignment
            }
          />
        )}

        {viewingAssignment && (
          <AssignmentDetailsModal
            assignment={
              viewingAssignment
            }
            rfp={findRfp(
              viewingAssignment.rfp_id,
            )}
            user={findUser(
              viewingAssignment.user_id,
            )}
            onClose={() =>
              setViewingAssignment(
                null,
              )
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
