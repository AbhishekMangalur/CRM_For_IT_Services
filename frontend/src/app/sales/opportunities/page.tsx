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
  Building2,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Eye,
  Gauge,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Target,
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
import { formatNumberInputValue } from "@/lib/utils";
import {
  createSalesOpportunity,
  deleteSalesOpportunity,
  getSalesLeads,
  getSalesOpportunities,
  replaceSalesOpportunity,
} from "@/lib/sales-api";
import type {
  CreateOpportunityRequest,
  OpportunityStatus,
  PipelineStage,
  SalesLead,
  SalesOpportunity,
} from "@/types/sales";
import { StatCard } from "@/components/dashboard/StatCard";

interface OpportunityOwnerUser {
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

async function getOpportunityOwners(): Promise<
  OpportunityOwnerUser[]
> {
  const response = await api.get<OpportunityOwnerUser[]>(
    "/api/users",
  );

  return response.data.filter(
    (user) =>
      user.is_active &&
      ["SALES", "PRESALES"].includes(user.role.name),
  );
}

interface LeadComboboxProps {
  leads: SalesLead[];
  value: string;
  onChange: (value: string) => void;
}

function LeadCombobox({
  leads,
  value,
  onChange,
}: LeadComboboxProps) {
  const selectedLead = leads.find(
    (lead) => lead.id.toString() === value,
  );
  const [query, setQuery] = useState(
    selectedLead
      ? `${selectedLead.company_name} (${selectedLead.contact_name})`
      : "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredLeads = leads.filter(
    (lead) =>
      !normalizedQuery ||
      lead.company_name.toLowerCase().includes(normalizedQuery) ||
      lead.contact_name.toLowerCase().includes(normalizedQuery) ||
      lead.contact_email?.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="lead_search">
        Linked lead *
      </Label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id="lead_search"
          type="search"
          autoComplete="off"
          value={query}
          required
          placeholder="Search by company, contact, or email..."
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="lead_search-options"
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
            id="lead_search-options"
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-blue-100 bg-white p-1 shadow-lg"
          >
            {filteredLeads.length > 0 ? (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  type="button"
                  role="option"
                  aria-selected={value === lead.id.toString()}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(
                      `${lead.company_name} (${lead.contact_name})`,
                    );
                    onChange(lead.id.toString());
                    setIsOpen(false);
                  }}
                >
                  <span className="block text-sm font-medium text-slate-700">
                    {lead.company_name}
                  </span>
                  <span className="block text-xs text-slate-500">
                    {lead.contact_name}
                    {lead.contact_email ? ` · ${lead.contact_email}` : ""}
                  </span>
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">
                No leads match your search.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface OwnerComboboxProps {
  id: string;
  label: string;
  users: OpportunityOwnerUser[];
  value: string;
  required?: boolean;
  showSearchIcon?: boolean;
  onChange: (value: string) => void;
}

function OwnerCombobox({
  id,
  label,
  users,
  value,
  required = false,
  showSearchIcon = false,
  onChange,
}: OwnerComboboxProps) {
  const selectedUser = users.find(
    (user) => user.id.toString() === value,
  );
  const [query, setQuery] = useState(
    selectedUser?.full_name ?? "",
  );
  const [isOpen, setIsOpen] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredUsers = users.filter(
    (user) =>
      !normalizedQuery ||
      user.full_name.toLowerCase().includes(normalizedQuery) ||
      user.email.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}{required ? " *" : ""}
      </Label>
      <div className="relative">
        {showSearchIcon && (
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <Input
          id={id}
          type="search"
          className={showSearchIcon ? "pl-10" : undefined}
          autoComplete="off"
          value={query}
          required={required}
          placeholder="Search and select an employee..."
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={value === user.id.toString()}
                  className="block w-full rounded px-3 py-2 text-left hover:bg-blue-50"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setQuery(user.full_name);
                    onChange(user.id.toString());
                    setIsOpen(false);
                  }}
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
                No employees match your search.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface OpportunityFormState {
  lead_id: string;
  opportunity_name: string;
  client_name: string;
  service_type: string;
  industry: string;
  deal_value: string;
  currency: string;
  pipeline_stage: PipelineStage;
  win_probability: string;
  expected_close_date: string;
  expected_start_date: string;
  sales_owner_id: string;
  presales_owner_id: string;
  status: OpportunityStatus;
  description: string;
}

const EMPTY_FORM: OpportunityFormState = {
  lead_id: "",
  opportunity_name: "",
  client_name: "",
  service_type: "",
  industry: "",
  deal_value: "",
  currency: "USD",
  pipeline_stage: "QUALIFICATION",
  win_probability: "",
  expected_close_date: "",
  expected_start_date: "",
  sales_owner_id: "",
  presales_owner_id: "",
  status: "OPEN",
  description: "",
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
    return `$${amount.toLocaleString("en-US")}`;
  }
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
    case "WON":
    case "CLOSED_WON":
      return "bg-emerald-100 text-emerald-700";

    case "LOST":
    case "CLOSED_LOST":
      return "bg-red-100 text-red-700";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getStageClasses(stage: string): string {
  switch (stage.toUpperCase()) {
    case "PROPOSAL":
      return "bg-violet-100 text-violet-700";

    case "NEGOTIATION":
      return "bg-amber-100 text-amber-700";

    case "SOLUTION_DESIGN":
      return "bg-indigo-100 text-indigo-700";

    case "CLOSED_WON":
      return "bg-emerald-100 text-emerald-700";

    case "CLOSED_LOST":
      return "bg-red-100 text-red-700";

    default:
      return "bg-cyan-100 text-cyan-700";
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

function opportunityToForm(
  opportunity: SalesOpportunity,
): OpportunityFormState {
  return {
    lead_id:
      opportunity.lead_id?.toString() ?? "",
    opportunity_name:
      opportunity.opportunity_name,
    client_name: opportunity.client_name,
    service_type: opportunity.service_type,
    industry: opportunity.industry,
    deal_value: formatNumberInputValue(opportunity.deal_value),
    currency: opportunity.currency,
    pipeline_stage: opportunity.pipeline_stage,
    win_probability:
      opportunity.win_probability.toString(),
    expected_close_date:
      opportunity.expected_close_date ?? "",
    expected_start_date:
      opportunity.expected_start_date ?? "",
    sales_owner_id:
      opportunity.sales_owner_id.toString(),
    presales_owner_id:
      opportunity.presales_owner_id?.toString() ??
      "",
    status: opportunity.status,
    description: opportunity.description ?? "",
  };
}

function formToPayload(
  form: OpportunityFormState,
): CreateOpportunityRequest {
  return {
    lead_id: Number(form.lead_id),
    opportunity_name:
      form.opportunity_name.trim(),
    client_name: form.client_name.trim(),
    service_type: form.service_type.trim(),
    industry: form.industry.trim(),
    deal_value: form.deal_value.trim()
      ? Number(form.deal_value)
      : 0,
    currency: form.currency.trim().toUpperCase(),
    pipeline_stage: form.pipeline_stage,
    win_probability: Number(
      form.win_probability,
    ),
    expected_close_date:
      form.expected_close_date || null,
    expected_start_date:
      form.expected_start_date || null,
    sales_owner_id: Number(
      form.sales_owner_id,
    ),
    presales_owner_id:
      form.presales_owner_id.trim()
        ? Number(form.presales_owner_id)
        : null,
    status: form.status,
    description:
      form.description.trim() || null,
  };
}

interface OpportunityFormModalProps {
  opportunity: SalesOpportunity | null;
  leads: SalesLead[];
  owners: OpportunityOwnerUser[];
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (
    payload: CreateOpportunityRequest,
  ) => Promise<void>;
}

function OpportunityFormModal({
  opportunity,
  leads,
  owners,
  isSaving,
  error,
  onClose,
  onSubmit,
}: OpportunityFormModalProps) {
  const [form, setForm] =
    useState<OpportunityFormState>(
      opportunity
        ? opportunityToForm(opportunity)
        : EMPTY_FORM,
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

  function handleLeadChange(leadId: string): void {
    const selectedLead = leads.find(
      (lead) => lead.id === Number(leadId),
    );

    setForm((previous) => ({
      ...previous,
      lead_id: leadId,
      client_name:
        selectedLead?.company_name ??
        previous.client_name,
      sales_owner_id:
        selectedLead?.assigned_sales_id?.toString() ??
        previous.sales_owner_id,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (
      !form.lead_id ||
      !form.opportunity_name.trim() ||
      !form.client_name.trim() ||
      !form.service_type.trim() ||
      !form.industry.trim() ||
      !form.sales_owner_id
    ) {
      return;
    }

    await onSubmit(formToPayload(form));
  }

  const isInvalid =
    !form.lead_id ||
    !form.opportunity_name.trim() ||
    !form.client_name.trim() ||
    !form.service_type.trim() ||
    !form.industry.trim() ||
    Number(form.deal_value) < 0 ||
    !form.sales_owner_id ||
    Number(form.win_probability) < 0 ||
    Number(form.win_probability) > 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {opportunity
                ? "Edit Opportunity"
                : "Create Opportunity"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Link a qualified lead and enter deal
              information.
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

            <LeadCombobox
              leads={leads}
              value={form.lead_id}
              onChange={handleLeadChange}
            />

            <div className="space-y-2">
              <Label htmlFor="opportunity_name">
                Opportunity name *
              </Label>

              <Input
                id="opportunity_name"
                name="opportunity_name"
                value={form.opportunity_name}
                onChange={handleChange}
                placeholder="Cloud Migration Opportunity"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_name">
                Client name *
              </Label>

              <Input
                id="client_name"
                name="client_name"
                value={form.client_name}
                onChange={handleChange}
                placeholder="Enter client name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service_type">
                Service type *
              </Label>

              <Input
                id="service_type"
                name="service_type"
                value={form.service_type}
                onChange={handleChange}
                placeholder="Cloud Migration"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">
                Industry *
              </Label>

              <Input
                id="industry"
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="Information Technology"
                required
              />
            </div>

            <div className="grid grid-cols-[1fr_110px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="deal_value">
                  Deal value
                </Label>

                <Input
                  id="deal_value"
                  name="deal_value"
                  type="number"
                  min="0"
                  value={form.deal_value}
                  onChange={handleChange}
                  placeholder="0"
                />
                <p className="text-xs text-slate-500">
                  Optional until estimation is completed. Blank values are saved as $0.
                </p>
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
              <Label htmlFor="pipeline_stage">
                Pipeline stage
              </Label>

              <select
                id="pipeline_stage"
                name="pipeline_stage"
                value={form.pipeline_stage}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="QUALIFICATION">
                  Qualification
                </option>
                <option value="SOLUTION_DESIGN">
                  Solution Design
                </option>
                <option value="PROPOSAL">
                  Proposal
                </option>
                <option value="NEGOTIATION">
                  Negotiation
                </option>
                <option value="CLOSED_WON">
                  Closed Won
                </option>
                <option value="CLOSED_LOST">
                  Closed Lost
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="win_probability">
                Win probability (%)
              </Label>

              <Input
                id="win_probability"
                name="win_probability"
                type="number"
                min="0"
                max="100"
                placeholder="Enter 0 to 100"
                value={form.win_probability}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Opportunity status
              </Label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
              >
                <option value="OPEN">Open</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <OwnerCombobox
              key={`sales-${form.lead_id}-${opportunity?.id ?? "new"}`}
              id="sales_owner_search"
              label="Sales Owner"
              users={owners.filter(
                (user) => user.role.name === "SALES",
              )}
              value={form.sales_owner_id}
              required
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  sales_owner_id: value,
                }))
              }
            />

            <OwnerCombobox
              key={`presales-${opportunity?.id ?? "new"}`}
              id="presales_owner_search"
              label="Presales Owner"
              users={owners.filter(
                (user) => user.role.name === "PRESALES",
              )}
              value={form.presales_owner_id}
              showSearchIcon
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  presales_owner_id: value,
                }))
              }
            />

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">
                Expected close date
              </Label>

              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                value={form.expected_close_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_start_date">
                Expected start date
              </Label>

              <Input
                id="expected_start_date"
                name="expected_start_date"
                type="date"
                value={form.expected_start_date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">
                Description
              </Label>

              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the client requirements and opportunity scope..."
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
              disabled={isSaving || isInvalid}
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {opportunity
                ? "Save changes"
                : "Create opportunity"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface OpportunityDetailsModalProps {
  opportunity: SalesOpportunity;
  lead?: SalesLead;
  salesOwnerName: string;
  presalesOwnerName: string;
  onClose: () => void;
}

function OpportunityDetailsModal({
  opportunity,
  lead,
  salesOwnerName,
  presalesOwnerName,
  onClose,
}: OpportunityDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {opportunity.opportunity_name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Opportunity #{opportunity.id}
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
              Deal value
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                opportunity.deal_value,
                opportunity.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Win probability
            </p>

            <p className="mt-2 text-3xl font-bold text-indigo-700">
              {opportunity.win_probability}%
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-indigo-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-700"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      opportunity.win_probability,
                    ),
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Client
            </p>

            <p className="mt-1 font-semibold">
              {opportunity.client_name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {opportunity.industry}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Linked lead
            </p>

            <p className="mt-1 font-semibold">
              {lead?.company_name ??
                "Linked lead unavailable"}
            </p>

            {lead && (
              <p className="mt-1 text-sm text-slate-500">
                {lead.contact_name}
              </p>
            )}
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p>
              Service:{" "}
              <strong>
                {opportunity.service_type}
              </strong>
            </p>

            <p>
              Stage:{" "}
              <strong>
                {formatLabel(
                  opportunity.pipeline_stage,
                )}
              </strong>
            </p>

            <p>
              Status:{" "}
              <strong>
                {formatLabel(opportunity.status)}
              </strong>
            </p>
          </div>

          <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
            <p>
              Sales owner: <strong>{salesOwnerName}</strong>
            </p>

            <p>
              Presales owner:{" "}
              <strong>{presalesOwnerName}</strong>
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Expected close
            </p>

            <p className="mt-1 font-medium">
              {formatDate(
                opportunity.expected_close_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Expected start
            </p>

            <p className="mt-1 font-medium">
              {formatDate(
                opportunity.expected_start_date,
              )}
            </p>
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium">
              Description
            </p>

            <div className="mt-2 rounded-xl border border-blue-100 bg-slate-50 p-4 text-sm text-slate-600">
              {opportunity.description ||
                "No description added."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesOpportunitiesPage() {
  const confirm = useConfirm();
  const [opportunities, setOpportunities] =
    useState<SalesOpportunity[]>([]);

  const [leads, setLeads] =
    useState<SalesLead[]>([]);
  const [owners, setOwners] = useState<
    OpportunityOwnerUser[]
  >([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [stageFilter, setStageFilter] =
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

  const [editingOpportunity, setEditingOpportunity] =
    useState<SalesOpportunity | null>(null);

  const [viewingOpportunity, setViewingOpportunity] =
    useState<SalesOpportunity | null>(null);

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          opportunityRecords,
          leadRecords,
          ownerRecords,
        ] = await Promise.all([
          getSalesOpportunities({
            skip: 0,
            limit: 100,
          }),
          getSalesLeads({
            skip: 0,
            limit: 100,
          }),
          getOpportunityOwners(),
        ]);

        setOpportunities(opportunityRecords);
        setLeads(leadRecords);
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

  const filteredOpportunities = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return opportunities.filter(
      (opportunity) => {
        const matchesSearch =
          !normalizedSearch ||
          opportunity.opportunity_name
            .toLowerCase()
            .includes(normalizedSearch) ||
          opportunity.client_name
            .toLowerCase()
            .includes(normalizedSearch) ||
          opportunity.service_type
            .toLowerCase()
            .includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "ALL" ||
          opportunity.status === statusFilter;

        const matchesStage =
          stageFilter === "ALL" ||
          opportunity.pipeline_stage ===
            stageFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesStage
        );
      },
    );
  }, [
    opportunities,
    search,
    stageFilter,
    statusFilter,
  ]);

  const totalPipelineValue = useMemo(
    () =>
      opportunities
        .filter(
          (opportunity) =>
            opportunity.status.toUpperCase() ===
            "OPEN",
        )
        .reduce(
          (total, opportunity) =>
            total +
            (Number(
              opportunity.deal_value,
            ) || 0),
          0,
        ),
    [opportunities],
  );

  async function handleSaveOpportunity(
    payload: CreateOpportunityRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingOpportunity) {
        const updated =
          await replaceSalesOpportunity(
            editingOpportunity.id,
            payload,
          );

        setOpportunities((current) =>
          current.map((record) =>
            record.id === updated.id
              ? updated
              : record,
          ),
        );
      } else {
        const created =
          await createSalesOpportunity(payload);

        setOpportunities((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingOpportunity(null);
    } catch (requestError) {
      setFormError(
        getErrorMessage(requestError),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteOpportunity(
    opportunity: SalesOpportunity,
  ): Promise<void> {
    const confirmed = await confirm(
      `Delete opportunity "${opportunity.opportunity_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteSalesOpportunity(
        opportunity.id,
      );

      setOpportunities((current) =>
        current.filter(
          (record) =>
            record.id !== opportunity.id,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function openCreateForm(): void {
    setEditingOpportunity(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    opportunity: SalesOpportunity,
  ): void {
    setEditingOpportunity(opportunity);
    setFormError("");
    setShowForm(true);
  }

  function findLead(
    leadId: number | null,
  ): SalesLead | undefined {
    return leads.find(
      (lead) => lead.id === leadId,
    );
  }

  function findOwnerName(
    ownerId: number | null,
  ): string {
    if (ownerId === null) {
      return "Unassigned";
    }

    return (
      owners.find((owner) => owner.id === ownerId)
        ?.full_name ?? "Unassigned"
    );
  }

  return (
    <ProtectedRoute allowedRole="SALES">
      <DashboardLayout
        title="Opportunities"
        description="Manage qualified leads and potential deals."
      >
        <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
                title="Total Opportunities"
                value={opportunities.length.toLocaleString(
                "en-US",
                )}
                description="All opportunities loaded from the database"
                icon={BriefcaseBusiness}
                variant="blue"
            />

            <StatCard
                title="Open Opportunities"
                value={opportunities
                .filter(
                    (opportunity) =>
                    opportunity.status.toUpperCase() === "OPEN",
                )
                .length.toLocaleString("en-US")}
                description="Deals currently active in the pipeline"
                icon={Target}
                variant="indigo"
            />

            <StatCard
                title="Pipeline Value"
                value={formatCurrency(totalPipelineValue)}
                description="Combined value of open opportunities"
                icon={CircleDollarSign}
                variant="cyan"
            />

            <StatCard
                title="Won Opportunities"
                value={opportunities
                .filter(
                    (opportunity) =>
                    opportunity.status.toUpperCase() === "WON",
                )
                .length.toLocaleString("en-US")}
                description="Opportunities successfully converted"
                icon={Gauge}
                variant="emerald"
            />
            </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    Sales Opportunities
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {opportunities.length} opportunity
                    {opportunities.length === 1
                      ? ""
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
                    disabled={leads.length === 0}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Opportunity
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

              {leads.length === 0 && !isLoading && (
                <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription>
                    Create a lead before creating an
                    opportunity.
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
                    placeholder="Search opportunity, client or service..."
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
                  <option value="OPEN">Open</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>

                <select
                  value={stageFilter}
                  onChange={(event) =>
                    setStageFilter(
                      event.target.value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600/20"
                >
                  <option value="ALL">
                    All pipeline stages
                  </option>
                  <option value="PROSPECTING">
                    Prospecting
                  </option>
                  <option value="QUALIFICATION">
                    Qualification
                  </option>
                  <option value="SOLUTION_DESIGN">
                    Solution Design
                  </option>
                  <option value="PROPOSAL">
                    Proposal
                  </option>
                  <option value="NEGOTIATION">
                    Negotiation
                  </option>
                  <option value="CLOSED_WON">
                    Closed Won
                  </option>
                  <option value="CLOSED_LOST">
                    Closed Lost
                  </option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredOpportunities.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <BriefcaseBusiness className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No opportunities found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an opportunity or change the
                    current filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1250px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          Opportunity
                        </th>
                        <th className="px-4 py-3">
                          Client
                        </th>
                        <th className="px-4 py-3">
                          Stage
                        </th>
                        <th className="px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3">
                          Deal value
                        </th>
                        <th className="px-4 py-3">
                          Probability
                        </th>
                        <th className="px-4 py-3">
                          Expected close
                        </th>
                        <th className="px-4 py-3">
                          Owners
                        </th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredOpportunities.map(
                        (opportunity) => (
                          <tr
                            key={opportunity.id}
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
                                      opportunity.opportunity_name
                                    }
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {
                                      opportunity.service_type
                                    }
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-indigo-600" />

                                <div>
                                  <p className="font-medium text-slate-700">
                                    {
                                      opportunity.client_name
                                    }
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    {findLead(opportunity.lead_id)
                                      ?.contact_name ??
                                      "Lead contact unavailable"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getStageClasses(
                                  opportunity.pipeline_stage,
                                )}
                              >
                                {formatLabel(
                                  opportunity.pipeline_stage,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getStatusClasses(
                                  opportunity.status,
                                )}
                              >
                                {formatLabel(
                                  opportunity.status,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-800">
                              {formatCurrency(
                                opportunity.deal_value,
                                opportunity.currency,
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <div className="w-28">
                                <div className="mb-1 flex justify-between text-xs">
                                  <span>
                                    {
                                      opportunity.win_probability
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
                                          opportunity.win_probability,
                                        ),
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <span className="flex items-center gap-2 text-sm text-slate-600">
                                <CalendarDays className="h-4 w-4 text-blue-600" />

                                {formatDate(
                                  opportunity.expected_close_date,
                                )}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <div className="space-y-1 text-xs text-slate-600">
                                <p className="flex items-center gap-1.5">
                                  <UserRound className="h-3.5 w-3.5 text-blue-600" />
                                  Sales:{" "}
                                  {findOwnerName(
                                    opportunity.sales_owner_id,
                                  )}
                                </p>

                                <p className="flex items-center gap-1.5">
                                  <UserRound className="h-3.5 w-3.5 text-indigo-600" />
                                  Presales:{" "}
                                  {findOwnerName(
                                    opportunity.presales_owner_id,
                                  )}
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View opportunity"
                                  onClick={() =>
                                    setViewingOpportunity(
                                      opportunity,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit opportunity"
                                  onClick={() =>
                                    openEditForm(
                                      opportunity,
                                    )
                                  }
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete opportunity"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteOpportunity(
                                      opportunity,
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
          <OpportunityFormModal
            opportunity={editingOpportunity}
            leads={leads}
            owners={owners}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingOpportunity(null);
              }
            }}
            onSubmit={handleSaveOpportunity}
          />
        )}

        {viewingOpportunity && (
          <OpportunityDetailsModal
            opportunity={viewingOpportunity}
            lead={findLead(
              viewingOpportunity.lead_id,
            )}
            salesOwnerName={findOwnerName(
              viewingOpportunity.sales_owner_id,
            )}
            presalesOwnerName={findOwnerName(
              viewingOpportunity.presales_owner_id,
            )}
            onClose={() =>
              setViewingOpportunity(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
