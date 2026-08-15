"use client";

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
  Building2,
  CalendarDays,
  Edit3,
  Eye,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
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
import { api } from "@/lib/api";
import {
  createSalesLead,
  deleteSalesLead,
  getSalesLeads,
  replaceSalesLead,
} from "@/lib/sales-api";
import type {
  CreateLeadRequest,
  LeadPriority,
  LeadStatus,
  SalesLead,
} from "@/types/sales";
import {
  CalendarClock,
  CircleDollarSign,
  UserRoundCheck,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/StatCard";

const CURRENT_TIMESTAMP = Date.now();

interface SalesUser {
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

async function getSalesUsers(): Promise<SalesUser[]> {
  const response = await api.get<SalesUser[]>(
    "/api/users",
  );

  return response.data.filter(
    (user) =>
      user.role.name === "SALES" && user.is_active,
  );
}

interface LeadFormState {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  designation: string;
  lead_source: string;
  lead_status: LeadStatus;
  priority: LeadPriority;
  estimated_value: string;
  assigned_sales_id: string;
  next_follow_up_date: string;
  notes: string;
}

const EMPTY_FORM: LeadFormState = {
  company_name: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  designation: "",
  lead_source: "",
  lead_status: "NEW",
  priority: "MEDIUM",
  estimated_value: "",
  assigned_sales_id: "",
  next_follow_up_date: "",
  notes: "",
};

function formatCurrency(value: string): string {
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

function formatDate(value: string | null): string {
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

function getStatusClasses(status: string): string {
  switch (status.toUpperCase()) {
    case "QUALIFIED":
      return "bg-emerald-100 text-emerald-700";
    case "CONVERTED":
      return "bg-indigo-100 text-indigo-700";
    case "UNQUALIFIED":
      return "bg-red-100 text-red-700";
    case "CONTACTED":
      return "bg-cyan-100 text-cyan-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getPriorityClasses(
  priority: string,
): string {
  switch (priority.toUpperCase()) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "LOW":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
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

function leadToForm(lead: SalesLead): LeadFormState {
  return {
    company_name: lead.company_name,
    contact_name: lead.contact_name,
    contact_email: lead.contact_email ?? "",
    contact_phone: lead.contact_phone ?? "",
    designation: lead.designation ?? "",
    lead_source: lead.lead_source ?? "",
    lead_status: lead.lead_status,
    priority: lead.priority,
    estimated_value: lead.estimated_value,
    assigned_sales_id:
      lead.assigned_sales_id?.toString() ?? "",
    next_follow_up_date:
      lead.next_follow_up_date ?? "",
    notes: lead.notes ?? "",
  };
}

function formToPayload(
  form: LeadFormState,
): CreateLeadRequest {
  return {
    company_name: form.company_name.trim(),
    contact_name: form.contact_name.trim(),
    contact_email:
      form.contact_email.trim() || null,
    contact_phone:
      form.contact_phone.trim() || null,
    designation: form.designation.trim() || null,
    lead_source: form.lead_source.trim() || null,
    lead_status: form.lead_status,
    priority: form.priority,
    estimated_value:
      Number(form.estimated_value) || 0,
    assigned_sales_id:
      form.assigned_sales_id.trim()
        ? Number(form.assigned_sales_id)
        : null,
    next_follow_up_date:
      form.next_follow_up_date || null,
    notes: form.notes.trim() || null,
  };
}

interface LeadFormModalProps {
  lead: SalesLead | null;
  salesUsers: SalesUser[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateLeadRequest,
  ) => Promise<void>;
}

function LeadFormModal({
  lead,
  salesUsers,
  isSaving,
  error,
  onClose,
  onSubmit,
}: LeadFormModalProps) {
  const [form, setForm] = useState<LeadFormState>(
    lead ? leadToForm(lead) : EMPTY_FORM,
  );
  const selectedSalesUser = salesUsers.find(
    (user) => user.id.toString() === form.assigned_sales_id,
  );
  const [salesSearch, setSalesSearch] = useState(
    selectedSalesUser?.full_name ?? "",
  );
  const [isSalesMenuOpen, setIsSalesMenuOpen] =
    useState(false);

  const filteredSalesUsers = useMemo(() => {
    const query = salesSearch.trim().toLowerCase();

    if (!query) {
      return salesUsers;
    }

    return salesUsers.filter(
      (user) =>
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query),
    );
  }, [salesSearch, salesUsers]);

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
      !form.company_name.trim() ||
      !form.contact_name.trim()
    ) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {lead ? "Edit Lead" : "Create Lead"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {lead
                ? "Update the selected lead details."
                : "Add a potential customer to the sales pipeline."}
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
              <Label htmlFor="company_name">
                Company name *
              </Label>

              <Input
                id="company_name"
                name="company_name"
                value={form.company_name}
                onChange={handleChange}
                placeholder="ABC Technologies"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">
                Contact name *
              </Label>

              <Input
                id="contact_name"
                name="contact_name"
                value={form.contact_name}
                onChange={handleChange}
                placeholder="Enter contact name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">
                Contact email
              </Label>

              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={form.contact_email}
                onChange={handleChange}
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone">
                Contact phone
              </Label>

              <Input
                id="contact_phone"
                name="contact_phone"
                value={form.contact_phone}
                onChange={handleChange}
                placeholder="9876543210"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">
                Designation
              </Label>

              <Input
                id="designation"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="IT Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_source">
                Lead source
              </Label>

              <Input
                id="lead_source"
                name="lead_source"
                value={form.lead_source}
                onChange={handleChange}
                placeholder="LinkedIn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead_status">
                Lead status
              </Label>

              <select
                id="lead_status"
                name="lead_status"
                value={form.lead_status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">
                  Contacted
                </option>
                <option value="QUALIFIED">
                  Qualified
                </option>
                <option value="UNQUALIFIED">
                  Unqualified
                </option>
                <option value="CONVERTED">
                  Converted
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                Priority
              </Label>

              <select
                id="priority"
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">
                  Medium
                </option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_value">
                Estimated value
              </Label>

              <Input
                id="estimated_value"
                name="estimated_value"
                type="number"
                min="0"
                value={form.estimated_value}
                onChange={handleChange}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_sales_search">
                Assigned Sales Employee
              </Label>

              <div className="relative">
                <Input
                  id="assigned_sales_search"
                  type="search"
                  autoComplete="off"
                  value={salesSearch}
                  onFocus={() => setIsSalesMenuOpen(true)}
                  onBlur={() => setIsSalesMenuOpen(false)}
                  onChange={(event) => {
                    setSalesSearch(event.target.value);
                    setForm((previous) => ({
                      ...previous,
                      assigned_sales_id: "",
                    }));
                    setIsSalesMenuOpen(true);
                  }}
                  placeholder="Search and select an employee..."
                  role="combobox"
                  aria-expanded={isSalesMenuOpen}
                  aria-controls="assigned-sales-options"
                />

                {isSalesMenuOpen && (
                  <div
                    id="assigned-sales-options"
                    className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
                    role="listbox"
                  >
                    {filteredSalesUsers.length > 0 ? (
                      filteredSalesUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setSalesSearch(user.full_name);
                            setForm((previous) => ({
                              ...previous,
                              assigned_sales_id:
                                user.id.toString(),
                            }));
                            setIsSalesMenuOpen(false);
                          }}
                          role="option"
                          aria-selected={
                            form.assigned_sales_id ===
                            user.id.toString()
                          }
                        >
                          <span className="block text-sm font-medium text-slate-700">
                            {user.full_name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {user.email}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-xs text-slate-500">
                        No active sales employees match your search.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="next_follow_up_date">
                Next follow-up date
              </Label>

              <Input
                id="next_follow_up_date"
                name="next_follow_up_date"
                type="date"
                value={form.next_follow_up_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>

              <Textarea
                id="notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Enter lead requirements or discussion notes..."
                rows={4}
              />
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
                isSaving ||
                !form.company_name.trim() ||
                !form.contact_name.trim()
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {lead ? "Save changes" : "Create lead"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface LeadDetailsModalProps {
  lead: SalesLead;
  ownerName: string;
  onClose: () => void;
}

function LeadDetailsModal({
  lead,
  ownerName,
  onClose,
}: LeadDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {lead.company_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Lead #{lead.id}
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
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs text-slate-500">
              Contact
            </p>

            <p className="mt-1 font-semibold">
              {lead.contact_name}
            </p>

            <p className="text-sm text-slate-500">
              {lead.designation || "No designation"}
            </p>
          </div>

          <div className="rounded-xl bg-indigo-50 p-4">
            <p className="text-xs text-slate-500">
              Estimated value
            </p>

            <p className="mt-1 text-xl font-bold text-indigo-700">
              {formatCurrency(
                lead.estimated_value,
              )}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              {lead.contact_email || "No email"}
            </p>

            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              {lead.contact_phone || "No phone"}
            </p>
          </div>

          <div className="space-y-2 text-sm">
            <p>
              Source:{" "}
              <strong>
                {lead.lead_source || "Not specified"}
              </strong>
            </p>

            <p>
              Sales owner: <strong>{ownerName}</strong>
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium">
              Notes
            </p>

            <div className="mt-2 rounded-xl border border-blue-100 bg-slate-50 p-4 text-sm text-slate-600">
              {lead.notes || "No notes added."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<SalesLead[]>(
    [],
  );
  const [salesUsers, setSalesUsers] = useState<
    SalesUser[]
  >([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
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

  const [editingLead, setEditingLead] =
    useState<SalesLead | null>(null);

  const [viewingLead, setViewingLead] =
    useState<SalesLead | null>(null);

  const loadLeads =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [records, users] = await Promise.all([
          getSalesLeads({ skip: 0, limit: 100 }),
          getSalesUsers(),
        ]);

        setLeads(records);
        setSalesUsers(users);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadLeads();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !normalizedSearch ||
        lead.company_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        lead.contact_name
          .toLowerCase()
          .includes(normalizedSearch) ||
        lead.contact_email
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        lead.lead_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  function getSalesOwnerName(
    assignedSalesId: number | null,
  ): string {
    if (assignedSalesId === null) {
      return "Unassigned";
    }

    return (
      salesUsers.find(
        (user) => user.id === assignedSalesId,
      )?.full_name ?? "Unassigned"
    );
  }

  async function handleSaveLead(
    payload: CreateLeadRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingLead) {
        const updated = await replaceSalesLead(
          editingLead.id,
          payload,
        );

        setLeads((current) =>
          current.map((lead) =>
            lead.id === updated.id
              ? updated
              : lead,
          ),
        );
      } else {
        const created =
          await createSalesLead(payload);

        setLeads((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingLead(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteLead(
    lead: SalesLead,
  ): Promise<void> {
    const confirmed = window.confirm(
      `Delete lead "${lead.company_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSalesLead(lead.id);

      setLeads((current) =>
        current.filter(
          (record) => record.id !== lead.id,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function openCreateForm(): void {
    setEditingLead(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(lead: SalesLead): void {
    setEditingLead(lead);
    setFormError("");
    setShowForm(true);
  }

  const qualifiedLeads = leads.filter(
    (lead) => lead.lead_status === "QUALIFIED",
  ).length;

  const totalEstimatedValue = leads.reduce(
    (total, lead) =>
        total + (Number(lead.estimated_value) || 0),
    0,
    );

  const upcomingFollowUps = leads.filter((lead) => {
    if (!lead.next_follow_up_date) {
      return false;
    }

    const followUpDate = new Date(
      lead.next_follow_up_date,
    ).getTime();

    return (
      Number.isFinite(followUpDate) &&
      followUpDate >= CURRENT_TIMESTAMP
    );
  }).length;

  return (
    <ProtectedRoute allowedRole="SALES">
      <DashboardLayout
        title="Leads"
        description="Create and manage potential customers."
      >
        <div className="space-y-6">
          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Sales Leads
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {leads.length} lead
                    {leads.length === 1 ? "" : "s"} loaded
                    from the database
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      void loadLeads()
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
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Lead
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Leads"
                  value={leads.length.toLocaleString("en-US")}
                  description="Potential customers in the database"
                  icon={Building2}
                  variant="blue"
                />

                <StatCard
                  title="Qualified Leads"
                  value={qualifiedLeads.toLocaleString("en-US")}
                  description="Leads ready for opportunity conversion"
                  icon={UserRoundCheck}
                  variant="indigo"
                />

                <StatCard
                  title="Estimated Lead Value"
                  value={formatCurrency(
                    String(totalEstimatedValue),
                  )}
                  description="Combined estimated value of all leads"
                  icon={CircleDollarSign}
                  variant="cyan"
                />

                <StatCard
                  title="Upcoming Follow-ups"
                  value={upcomingFollowUps.toLocaleString("en-US")}
                  description="Lead follow-ups scheduled from today"
                  icon={CalendarClock}
                  variant="emerald"
                />
              </section>

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

              <div className="mb-5 flex flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search by company, contact or email..."
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
                  <option value="NEW">New</option>
                  <option value="CONTACTED">
                    Contacted
                  </option>
                  <option value="QUALIFIED">
                    Qualified
                  </option>
                  <option value="UNQUALIFIED">
                    Unqualified
                  </option>
                  <option value="CONVERTED">
                    Converted
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <Building2 className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No leads found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create your first lead or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Company
                        </th>
                        <th className="px-4 py-3">
                          Contact
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3">
                          Priority
                        </th>
                        <th className="px-4 py-3">
                          Estimated value
                        </th>
                        <th className="px-4 py-3">
                          Follow-up
                        </th>
                        <th className="px-4 py-3">
                          Assigned Sales
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="bg-white transition hover:bg-blue-50/50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                <Building2 className="h-4 w-4" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {lead.company_name}
                                </p>

                                <p className="text-xs text-slate-500">
                                  {lead.lead_source ||
                                    "No source"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-700">
                              {lead.contact_name}
                            </p>

                            <p className="text-xs text-slate-500">
                              {lead.contact_email ||
                                "No email"}
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              className={getStatusClasses(
                                lead.lead_status,
                              )}
                            >
                              {formatLabel(
                                lead.lead_status,
                              )}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              className={getPriorityClasses(
                                lead.priority,
                              )}
                            >
                              {formatLabel(
                                lead.priority,
                              )}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-800">
                            {formatCurrency(
                              lead.estimated_value,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="flex items-center gap-2 text-sm text-slate-600">
                              <CalendarDays className="h-4 w-4 text-blue-600" />
                              {formatDate(
                                lead.next_follow_up_date,
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <span className="flex items-center gap-2 text-sm text-slate-600">
                              <UserRound className="h-4 w-4 text-indigo-600" />
                              {getSalesOwnerName(
                                lead.assigned_sales_id,
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="View lead"
                                onClick={() =>
                                  setViewingLead(lead)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Edit lead"
                                onClick={() =>
                                  openEditForm(lead)
                                }
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Delete lead"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  void handleDeleteLead(
                                    lead,
                                  )
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showForm && (
          <LeadFormModal
            lead={editingLead}
            salesUsers={salesUsers}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingLead(null);
              }
            }}
            onSubmit={handleSaveLead}
          />
        )}

        {viewingLead && (
          <LeadDetailsModal
            lead={viewingLead}
            ownerName={getSalesOwnerName(
              viewingLead.assigned_sales_id,
            )}
            onClose={() =>
              setViewingLead(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
