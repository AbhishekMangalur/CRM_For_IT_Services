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
  Activity,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  Loader2,
  Mail,
  MessageSquareText,
  PhoneCall,
  Plus,
  Presentation,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
  Video,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
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
  createSalesActivity,
  deleteSalesActivity,
  getSalesActivities,
  getSalesLeads,
  getSalesOpportunities,
  replaceSalesActivity,
} from "@/lib/sales-api";
import type {
  ActivityStatus,
  ActivityType,
  CreateActivityRequest,
  SalesActivity,
  SalesLead,
  SalesOpportunity,
} from "@/types/sales";
import { StatCard } from "@/components/dashboard/StatCard";

interface ActivityOwnerUser {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
}

async function getActivityOwners(): Promise<ActivityOwnerUser[]> {
  const response = await api.get<ActivityOwnerUser[]>(
    "/api/users",
  );

  return response.data;
}

interface ActivityFormState {
  lead_id: string;
  opportunity_id: string;
  activity_type: ActivityType;
  subject: string;
  activity_date: string;
  next_follow_up_date: string;
  notes: string;
  status: ActivityStatus;
}

interface ActivityLinkOption {
  value: string;
  label: string;
  description: string;
  searchText: string;
}

interface ActivityLinkComboboxProps {
  id: string;
  label: string;
  placeholder: string;
  emptyMessage: string;
  options: ActivityLinkOption[];
  value: string;
  onChange: (value: string) => void;
}

function ActivityLinkCombobox({
  id,
  label,
  placeholder,
  emptyMessage,
  options,
  value,
  onChange,
}: ActivityLinkComboboxProps) {
  const selectedOption = options.find(
    (option) => option.value === value,
  );
  const [query, setQuery] = useState(
    selectedOption?.label ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter(
    (option) =>
      !normalizedQuery ||
      option.searchText.includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="search"
          autoComplete="off"
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
            {value && (
              <button
                type="button"
                className="block w-full rounded px-3 py-2 text-left text-sm text-slate-500 hover:bg-blue-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setQuery("");
                  onChange("");
                  setIsOpen(false);
                }}
              >
                Clear selection
              </button>
            )}

            {filteredOptions.length > 0 ? (
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
                  <span className="block text-xs text-slate-500">
                    {option.description}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                {emptyMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_FORM: ActivityFormState = {
  lead_id: "",
  opportunity_id: "",
  activity_type: "CALL",
  subject: "",
  activity_date: "",
  next_follow_up_date: "",
  notes: "",
  status: "PENDING",
};

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(
    date.getTime() - offset * 60 * 1000,
  );

  return localDate.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string): string {
  return new Date(value).toISOString();
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
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

  return "The request could not be completed.";
}

function getStatusClasses(status: string): string {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";

    case "CANCELLED":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getActivityIcon(type: string) {
  switch (type.toUpperCase()) {
    case "CALL":
      return PhoneCall;

    case "EMAIL":
      return Mail;

    case "MEETING":
    case "FOLLOW_UP_MEETING":
      return Video;

    case "PROPOSAL_DISCUSSION":
      return MessageSquareText;

    case "CLIENT_PRESENTATION":
      return Presentation;

    default:
      return Activity;
  }
}

function activityToForm(
  activity: SalesActivity,
): ActivityFormState {
  return {
    lead_id: activity.lead_id?.toString() ?? "",
    opportunity_id:
      activity.opportunity_id?.toString() ?? "",
    activity_type: activity.activity_type,
    subject: activity.subject,
    activity_date: toDateTimeLocal(
      activity.activity_date,
    ),
    next_follow_up_date: toDateTimeLocal(
      activity.next_follow_up_date,
    ),
    notes: activity.notes ?? "",
    status: activity.status,
  };
}

function formToPayload(
  form: ActivityFormState,
  userId: number,
): CreateActivityRequest {
  return {
    lead_id: form.lead_id
      ? Number(form.lead_id)
      : null,
    opportunity_id: form.opportunity_id
      ? Number(form.opportunity_id)
      : null,
    user_id: userId,
    activity_type: form.activity_type,
    subject: form.subject.trim(),
    activity_date: toIsoDateTime(
      form.activity_date,
    ),
    next_follow_up_date:
      form.next_follow_up_date
        ? toIsoDateTime(
            form.next_follow_up_date,
          )
        : null,
    notes: form.notes.trim() || null,
    status: form.status,
  };
}

interface ActivityFormModalProps {
  activity: SalesActivity | null;
  leads: SalesLead[];
  opportunities: SalesOpportunity[];
  userId: number;
  userName: string;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateActivityRequest,
  ) => Promise<void>;
}

function ActivityFormModal({
  activity,
  leads,
  opportunities,
  userId,
  userName,
  isSaving,
  error,
  onClose,
  onSubmit,
}: ActivityFormModalProps) {
  const [form, setForm] =
    useState<ActivityFormState>(
      activity
        ? activityToForm(activity)
        : EMPTY_FORM,
    );

  const leadOptions = leads.map((lead) => ({
    value: lead.id.toString(),
    label: lead.company_name,
    description: [lead.contact_name, lead.contact_email]
      .filter(Boolean)
      .join(" · "),
    searchText: [
      lead.company_name,
      lead.contact_name,
      lead.contact_email ?? "",
    ]
      .join(" ")
      .toLowerCase(),
  }));
  const opportunityOptions = opportunities.map(
    (opportunity) => ({
      value: opportunity.id.toString(),
      label: opportunity.opportunity_name,
      description: [
        opportunity.client_name,
        opportunity.service_type,
      ].join(" · "),
      searchText: [
        opportunity.opportunity_name,
        opportunity.client_name,
        opportunity.service_type,
      ]
        .join(" ")
        .toLowerCase(),
    }),
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      (!form.lead_id &&
        !form.opportunity_id) ||
      !form.subject.trim() ||
      !form.activity_date
    ) {
      return;
    }

    await onSubmit(
      formToPayload(form, userId),
    );
  }

  const isInvalid =
    (!form.lead_id &&
      !form.opportunity_id) ||
    !form.subject.trim() ||
    !form.activity_date;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {activity
                ? "Edit Activity"
                : "Create Activity"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record a Sales interaction for a lead
              or opportunity.
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

            <ActivityLinkCombobox
              id="lead_search"
              label="Linked lead"
              placeholder="Search by company, contact, or email..."
              emptyMessage="No leads match your search."
              options={leadOptions}
              value={form.lead_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  lead_id: value,
                }))
              }
            />

            <ActivityLinkCombobox
              id="opportunity_search"
              label="Linked opportunity"
              placeholder="Search by opportunity, client, or service..."
              emptyMessage="No opportunities match your search."
              options={opportunityOptions}
              value={form.opportunity_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  opportunity_id: value,
                }))
              }
            />

            {!form.lead_id &&
              !form.opportunity_id && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-800 md:col-span-2">
                  <AlertDescription>
                    Select at least one lead or
                    opportunity.
                  </AlertDescription>
                </Alert>
              )}

            <div className="space-y-2">
              <Label htmlFor="activity_type">
                Activity type
              </Label>

              <select
                id="activity_type"
                name="activity_type"
                value={form.activity_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">
                  Meeting
                </option>
                <option value="FOLLOW_UP">
                  Follow-up
                </option>
                <option value="FOLLOW_UP_MEETING">
                  Follow-up meeting
                </option>
                <option value="PROPOSAL_DISCUSSION">
                  Proposal discussion
                </option>
                <option value="CLIENT_PRESENTATION">
                  Client presentation
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Activity status
              </Label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="PENDING">
                  Pending
                </option>
                <option value="COMPLETED">
                  Completed
                </option>
                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="subject">
                Subject *
              </Label>

              <Input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Cloud Migration Requirement Discussion"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_date">
                Activity date and time *
              </Label>

              <Input
                id="activity_date"
                name="activity_date"
                type="datetime-local"
                value={form.activity_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_follow_up_date">
                Next follow-up date and time
              </Label>

              <Input
                id="next_follow_up_date"
                name="next_follow_up_date"
                type="datetime-local"
                value={form.next_follow_up_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">
                Notes
              </Label>

              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Add discussion notes, client feedback, or next steps..."
                rows={5}
              />
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Activity owner
                  </p>

                  <p className="text-sm text-slate-500">
                    {userName}
                  </p>
                </div>
              </div>
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
              disabled={isSaving || isInvalid}
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {activity
                ? "Save changes"
                : "Create activity"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ActivityDetailsModalProps {
  activity: SalesActivity;
  lead?: SalesLead;
  opportunity?: SalesOpportunity;
  ownerName: string;
  onClose: () => void;
}

function ActivityDetailsModal({
  activity,
  lead,
  opportunity,
  ownerName,
  onClose,
}: ActivityDetailsModalProps) {
  const Icon = getActivityIcon(
    activity.activity_type,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3 text-white">
              <Icon className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {activity.subject}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Activity #{activity.id}
              </p>
            </div>
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
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-xs text-slate-500">
              Activity type
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {formatLabel(
                activity.activity_type,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-indigo-50/50 p-4">
            <p className="text-xs text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-2 ${getStatusClasses(
                activity.status,
              )}`}
            >
              {formatLabel(activity.status)}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Activity date
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {formatDateTime(
                activity.activity_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Next follow-up
            </p>

            <p className="mt-1 font-medium text-slate-800">
              {formatDateTime(
                activity.next_follow_up_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Linked lead
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {lead
                ? lead.company_name
                : activity.lead_id
                  ? `Lead #${activity.lead_id}`
                  : "Not linked"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Linked opportunity
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {opportunity
                ? opportunity.opportunity_name
                : activity.opportunity_id
                  ? `Opportunity #${activity.opportunity_id}`
                  : "Not linked"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="text-sm font-medium text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {activity.notes ||
                "No notes were added."}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Activity owner
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {ownerName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesActivitiesPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [activities, setActivities] =
    useState<SalesActivity[]>([]);

  const [leads, setLeads] =
    useState<SalesLead[]>([]);

  const [opportunities, setOpportunities] =
    useState<SalesOpportunity[]>([]);
  const [owners, setOwners] = useState<
    ActivityOwnerUser[]
  >([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [typeFilter, setTypeFilter] =
    useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingActivity, setEditingActivity] =
    useState<SalesActivity | null>(null);

  const [viewingActivity, setViewingActivity] =
    useState<SalesActivity | null>(null);

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          activityRecords,
          leadRecords,
          opportunityRecords,
          ownerRecords,
        ] = await Promise.all([
          getSalesActivities({
            skip: 0,
            limit: 100,
          }),
          getSalesLeads({
            skip: 0,
            limit: 100,
          }),
          getSalesOpportunities({
            skip: 0,
            limit: 100,
          }),
          getActivityOwners(),
        ]);

        setActivities(activityRecords);
        setLeads(leadRecords);
        setOpportunities(opportunityRecords);
        setOwners(ownerRecords);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
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

  const ownerNames = useMemo(
    () =>
      new Map(
        owners.map((owner) => [owner.id, owner.full_name]),
      ),
    [owners],
  );

  function findOwnerName(ownerId: number): string {
    return ownerNames.get(ownerId) ?? "Unknown owner";
  }

  const filteredActivities = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return activities.filter((activity) => {
      const matchesSearch =
        !normalizedSearch ||
        activity.subject
          .toLowerCase()
          .includes(normalizedSearch) ||
        (ownerNames.get(activity.user_id) ?? "Unknown owner")
          .toLowerCase()
          .includes(normalizedSearch) ||
        activity.notes
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        activity.activity_type
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        activity.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        activity.activity_type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    activities,
    ownerNames,
    search,
    statusFilter,
    typeFilter,
  ]);

  const pendingCount = activities.filter(
    (activity) =>
      activity.status.toUpperCase() ===
      "PENDING",
  ).length;

  const completedCount = activities.filter(
    (activity) =>
      activity.status.toUpperCase() ===
      "COMPLETED",
  ).length;

  const upcomingFollowUps = activities.filter(
    (activity) => {
      if (!activity.next_follow_up_date) {
        return false;
      }

      if (
        activity.status.toUpperCase() ===
        "CANCELLED"
      ) {
        return false;
      }

      return (
        new Date(
          activity.next_follow_up_date,
        ).getTime() >= Date.now()
      );
    },
  ).length;

  async function handleSaveActivity(
    payload: CreateActivityRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingActivity) {
        const updated =
          await replaceSalesActivity(
            editingActivity.id,
            payload,
          );

        setActivities((current) =>
          current.map((record) =>
            record.id === updated.id
              ? updated
              : record,
          ),
        );
      } else {
        const created =
          await createSalesActivity(payload);

        setActivities((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingActivity(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteActivity(
    activity: SalesActivity,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete activity "${activity.subject}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSalesActivity(activity.id);

      setActivities((current) =>
        current.filter(
          (record) =>
            record.id !== activity.id,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function findLead(
    leadId: number | null,
  ): SalesLead | undefined {
    return leads.find(
      (lead) => lead.id === leadId,
    );
  }

  function findOpportunity(
    opportunityId: number | null,
  ): SalesOpportunity | undefined {
    return opportunities.find(
      (opportunity) =>
        opportunity.id === opportunityId,
    );
  }

  function openCreateForm(): void {
    setEditingActivity(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    activity: SalesActivity,
  ): void {
    setEditingActivity(activity);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute allowedRole="SALES">
      <DashboardLayout
        title="Activities"
        description="Track calls, meetings, emails, and client follow-ups."
      >
        <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                title="Total Activities"
                value={activities.length.toLocaleString("en-US")}
                description="All recorded sales interactions"
                icon={Activity}
                variant="blue"
            />

            <StatCard
                title="Pending Activities"
                value={pendingCount.toLocaleString("en-US")}
                description="Activities waiting for completion"
                icon={Clock3}
                variant="indigo"
            />

            <StatCard
                title="Completed Activities"
                value={completedCount.toLocaleString("en-US")}
                description="Successfully completed sales interactions"
                icon={CheckCircle2}
                variant="cyan"
            />

            <StatCard
                title="Upcoming Follow-ups"
                value={upcomingFollowUps.toLocaleString("en-US")}
                description="Scheduled future client follow-ups"
                icon={CalendarClock}
                variant="emerald"
            />
            </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Sales Activities
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {activities.length} activit
                    {activities.length === 1
                      ? "y"
                      : "ies"}{" "}
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
                      (leads.length === 0 &&
                        opportunities.length === 0)
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Activity
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
                leads.length === 0 &&
                opportunities.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      Create a lead or opportunity before
                      adding a Sales activity.
                    </AlertDescription>
                  </Alert>
                )}

              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_200px_220px]">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute bottom-0 left-3 top-0 z-10 my-auto h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search subject, notes, or activity type..."
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
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="ALL">
                    All statuses
                  </option>
                  <option value="PENDING">
                    Pending
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
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="ALL">
                    All activity types
                  </option>
                  <option value="CALL">Call</option>
                  <option value="EMAIL">
                    Email
                  </option>
                  <option value="MEETING">
                    Meeting
                  </option>
                  <option value="FOLLOW_UP">
                    Follow-up
                  </option>
                  <option value="FOLLOW_UP_MEETING">
                    Follow-up meeting
                  </option>
                  <option value="PROPOSAL_DISCUSSION">
                    Proposal discussion
                  </option>
                  <option value="CLIENT_PRESENTATION">
                    Client presentation
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredActivities.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Activity className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No activities found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an activity or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1200px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Activity
                        </th>
                        <th className="px-4 py-3">
                          Linked To
                        </th>
                        <th className="px-4 py-3">
                          Activity Date
                        </th>
                        <th className="px-4 py-3">
                          Follow-up
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3">
                          Owner
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredActivities.map(
                        (activity) => {
                          const Icon =
                            getActivityIcon(
                              activity.activity_type,
                            );

                          const lead = findLead(
                            activity.lead_id,
                          );

                          const opportunity =
                            findOpportunity(
                              activity.opportunity_id,
                            );

                          return (
                            <tr
                              key={activity.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <Icon className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {activity.subject}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                      {formatLabel(
                                        activity.activity_type,
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <div className="space-y-1 text-sm">
                                  {lead && (
                                    <p className="flex items-center gap-2 text-slate-700">
                                      <UserRound className="h-4 w-4 text-blue-600" />
                                      {
                                        lead.company_name
                                      }
                                    </p>
                                  )}

                                  {opportunity && (
                                    <p className="flex items-center gap-2 text-slate-700">
                                      <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />
                                      {
                                        opportunity.opportunity_name
                                      }
                                    </p>
                                  )}

                                  {!lead &&
                                    !opportunity && (
                                      <span className="text-slate-400">
                                        No linked record
                                      </span>
                                    )}
                                </div>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarDays className="h-4 w-4 text-blue-600" />
                                  {formatDateTime(
                                    activity.activity_date,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <CalendarClock className="h-4 w-4 text-indigo-600" />
                                  {formatDateTime(
                                    activity.next_follow_up_date,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <Badge
                                  className={getStatusClasses(
                                    activity.status,
                                  )}
                                >
                                  {formatLabel(
                                    activity.status,
                                  )}
                                </Badge>
                              </td>

                              <td className="px-4 py-4">
                                <span className="flex items-center gap-2 text-sm text-slate-600">
                                  <UserRound className="h-4 w-4 text-blue-600" />
                                  {findOwnerName(
                                    activity.user_id,
                                  )}
                                </span>
                              </td>

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View activity"
                                    onClick={() =>
                                      setViewingActivity(
                                        activity,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit activity"
                                    onClick={() =>
                                      openEditForm(
                                        activity,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete activity"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteActivity(
                                        activity,
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
          <ActivityFormModal
            activity={editingActivity}
            leads={leads}
            opportunities={opportunities}
            userId={user.id}
            userName={user.full_name}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingActivity(null);
              }
            }}
            onSubmit={handleSaveActivity}
          />
        )}

        {viewingActivity && (
          <ActivityDetailsModal
            activity={viewingActivity}
            lead={findLead(
              viewingActivity.lead_id,
            )}
            opportunity={findOpportunity(
              viewingActivity.opportunity_id,
            )}
            ownerName={findOwnerName(
              viewingActivity.user_id,
            )}
            onClose={() =>
              setViewingActivity(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
