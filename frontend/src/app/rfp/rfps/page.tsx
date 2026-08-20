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
  CircleDollarSign,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Send,
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

import { api } from "@/lib/api";
import { getSalesOpportunities } from "@/lib/sales-api";
import type { SalesOpportunity } from "@/types/sales";

import {
  createRfp,
  deleteRfp,
  getRfps,
  replaceRfp,
} from "@/lib/rfp-api";

import type {
  BidDecision,
  CreateRfpRequest,
  Rfp,
  RfpStatus,
} from "@/types/rfp";

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
  const [query, setQuery] = useState("");
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
          value={isOpen ? query : selectedOption?.label ?? query}
          placeholder={placeholder}
          className="pl-10"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          onFocus={() => {
            setQuery("");
            setIsOpen(true);
          }}
          onBlur={() => setIsOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange("");
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
                  <span className="block text-xs text-slate-500">
                    {option.description}
                  </span>
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
/* USER */
/* ================================================= */

interface RfpOwnerUser {
  id: number;
  full_name: string;
  email: string;
  role: {
    id: number;
    name: string;
    display_name: string;
  };
  is_active?: boolean;
}

async function getUsers(): Promise<RfpOwnerUser[]> {
  const response =
    await api.get<RfpOwnerUser[]>(
      "/api/users",
    );

  return response.data;
}

/* ================================================= */
/* FORM */
/* ================================================= */

interface RfpFormState {
  rfp_number: string;
  title: string;

  client_name: string;
  industry: string;
  service_type: string;

  estimated_value: string;
  currency: string;

  received_date: string;
  submission_deadline: string;

  rfp_status: RfpStatus;
  bid_decision: BidDecision;

  source: string;

  description: string;

  owner_id: string;
}

const EMPTY_FORM: RfpFormState = {
  rfp_number: "",
  title: "",

  client_name: "",
  industry: "",
  service_type: "",

  estimated_value: "",
  currency: "USD",

  received_date: "",
  submission_deadline: "",

  rfp_status: "RECEIVED",
  bid_decision: "PENDING",

  source: "",

  description: "",

  owner_id: "",
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

function formatCurrency(
  value: string | number,
  currency = "USD",
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "$0";
  }

  try {
    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    ).format(amount);
  } catch {
    return `${amount.toLocaleString(
      "en-US",
    )} ${currency}`;
  }
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

function daysUntil(
  value: string,
): number {
  const today = new Date();
  const deadline = new Date(value);

  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  return Math.ceil(
    (deadline.getTime() -
      today.getTime()) /
      (1000 * 60 * 60 * 24),
  );
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

function getRfpStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "RECEIVED":
      return "bg-blue-100 text-blue-700";

    case "EVALUATED":
      return "bg-indigo-100 text-indigo-700";

    case "IN_PROGRESS":
      return "bg-cyan-100 text-cyan-700";

    case "SUBMITTED":
      return "bg-violet-100 text-violet-700";

    case "WON":
      return "bg-emerald-100 text-emerald-700";

    case "LOST":
      return "bg-red-100 text-red-700";

    case "NO_BID":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getDecisionClasses(
  decision: string,
): string {
  switch (decision.toUpperCase()) {
    case "BID":
      return "bg-emerald-100 text-emerald-700";

    case "NO_BID":
      return "bg-red-100 text-red-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function rfpToForm(
  rfp: Rfp,
): RfpFormState {
  return {
    rfp_number:
      rfp.rfp_number,

    title:
      rfp.title,

    client_name:
      rfp.client_name,

    industry:
      rfp.industry,

    service_type:
      rfp.service_type,

    estimated_value:
      rfp.estimated_value,

    currency:
      rfp.currency,

    received_date:
      rfp.received_date,

    submission_deadline:
      rfp.submission_deadline,

    rfp_status:
      rfp.rfp_status,

    bid_decision:
      rfp.bid_decision,

    source:
      rfp.source,

    description:
      rfp.description ?? "",

    owner_id:
      rfp.owner_id.toString(),
  };
}

function formToPayload(
  form: RfpFormState,
  opportunityId: string,
): CreateRfpRequest {
  return {
    opportunity_id:
      Number(opportunityId),

    rfp_number:
      form.rfp_number.trim(),

    title:
      form.title.trim(),

    client_name:
      form.client_name.trim(),

    industry:
      form.industry.trim(),

    service_type:
      form.service_type.trim(),

    estimated_value:
      Number(
        form.estimated_value,
      ),

    currency:
      form.currency
        .trim()
        .toUpperCase() || "USD",

    received_date:
      form.received_date,

    submission_deadline:
      form.submission_deadline,

    rfp_status:
      form.rfp_status,

    bid_decision:
      form.bid_decision,

    source:
      form.source.trim(),

    description:
      form.description.trim() ||
      null,

    owner_id:
      Number(form.owner_id),
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface RfpFormModalProps {
  rfp: Rfp | null;

  owners: RfpOwnerUser[];
  opportunities: SalesOpportunity[];

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreateRfpRequest,
  ) => Promise<void>;
}

function RfpFormModal({
  rfp,
  owners,
  opportunities,
  isSaving,
  error,
  onClose,
  onSubmit,
}: RfpFormModalProps) {
  const [form, setForm] =
    useState<RfpFormState>(
      rfp
        ? rfpToForm(rfp)
        : EMPTY_FORM,
    );
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(() => {
    if (!rfp) return "";
    return rfp.opportunity_id?.toString() ?? "";
  });

  function handleOpportunityChange(
    opportunityId: string,
  ): void {
    setSelectedOpportunityId(opportunityId);
    const opportunity = opportunities.find(
      (record) => record.id === Number(opportunityId),
    );

    if (!opportunity) return;

    setForm((previous) => ({
      ...previous,
      title: opportunity.opportunity_name,
      client_name: opportunity.client_name,
      industry: opportunity.industry ?? "",
      service_type: opportunity.service_type,
      estimated_value: opportunity.deal_value,
      currency: opportunity.currency || "USD",
      description: opportunity.description ?? "",
      owner_id: opportunity.sales_owner_id.toString(),
    }));
  }

  function handleClientChange(
    clientName: string,
  ): void {
    if (!clientName) {
      setSelectedOpportunityId("");
      setForm((previous) => ({
        ...previous,
        client_name: "",
      }));
      return;
    }

    const currentOpportunity = opportunities.find(
      (opportunity) =>
        opportunity.id === Number(selectedOpportunityId) &&
        opportunity.client_name === clientName,
    );
    const clientOpportunity =
      currentOpportunity ??
      opportunities.find(
        (opportunity) => opportunity.client_name === clientName,
      );

    if (clientOpportunity) {
      handleOpportunityChange(clientOpportunity.id.toString());
    }
  }

  const clientOptions = Array.from(
    new Map(
      opportunities.map((opportunity) => [
        opportunity.client_name,
        {
          value: opportunity.client_name,
          label: opportunity.client_name,
          description: `${opportunity.industry ?? "Industry not specified"} · ${opportunity.service_type}`,
          searchText: `${opportunity.client_name} ${opportunity.industry ?? ""} ${opportunity.service_type}`,
        },
      ]),
    ).values(),
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

  const invalidDateRange =
    Boolean(form.received_date) &&
    Boolean(
      form.submission_deadline,
    ) &&
    new Date(
      form.submission_deadline,
    ).getTime() <
      new Date(
        form.received_date,
      ).getTime();

  const isInvalid =
    !form.rfp_number.trim() ||
    !selectedOpportunityId ||
    !form.title.trim() ||
    !form.client_name.trim() ||
    !form.industry.trim() ||
    !form.service_type.trim() ||
    !form.estimated_value ||
    Number(
      form.estimated_value,
    ) < 0 ||
    !form.received_date ||
    !form.submission_deadline ||
    !form.source.trim() ||
    !form.owner_id ||
    invalidDateRange;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (isInvalid) {
      return;
    }

    await onSubmit(
      formToPayload(form, selectedOpportunityId),
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {rfp
                ? "Edit RFP"
                : "Create RFP"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Capture the RFP,
              client, commercial
              value, deadline and
              ownership details.
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
                  Submission deadline
                  cannot be earlier than
                  the received date.
                </AlertDescription>
              </Alert>
            )}

            {/* RFP NUMBER */}

            <div className="space-y-2">
              <Label htmlFor="rfp_number">
                RFP Number *
              </Label>

              <Input
                id="rfp_number"
                name="rfp_number"
                value={
                  form.rfp_number
                }
                onChange={handleChange}
                placeholder="RFP-2026-001"
                required
              />
            </div>

            {/* OWNER */}

            <SearchSelect
                id="owner_id"
                label="RFP Owner"
                placeholder="Search by owner name, email, or role..."
                value={form.owner_id}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    owner_id: value,
                  }))
                }
                options={owners.map((owner) => ({
                  value: owner.id.toString(),
                  label: owner.full_name,
                  description: `${owner.role.display_name} · ${owner.email}`,
                  searchText: `${owner.full_name} ${owner.email} ${owner.role.name} ${owner.role.display_name}`,
                }))}
              />

            {/* OPPORTUNITY */}

            <div className="md:col-span-2">
              <SearchSelect
                id="opportunity_id"
                label="Sales Opportunity"
                placeholder="Search by opportunity, client, or service..."
                value={selectedOpportunityId}
                onChange={handleOpportunityChange}
                options={opportunities.map((opportunity) => ({
                  value: opportunity.id.toString(),
                  label: `${opportunity.opportunity_name} — ${opportunity.client_name}`,
                  description: `${opportunity.client_name} · ${opportunity.service_type}`,
                  searchText: `${opportunity.opportunity_name} ${opportunity.client_name} ${opportunity.service_type}`,
                }))}
              />
              <p className="text-xs text-slate-500">
                Selecting an opportunity fills the client, industry, service,
                value, currency, description, and owner fields.
              </p>
            </div>

            {/* TITLE */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">
                RFP Title *
              </Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter any RFP title"
                required
              />
            </div>

            {/* CLIENT */}

            <SearchSelect
              id="client_name"
              label="Client Name"
              placeholder="Search by client, industry, or service..."
              value={form.client_name}
              onChange={handleClientChange}
              options={clientOptions}
            />

            {/* INDUSTRY */}

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

            {/* SERVICE */}

            <div className="space-y-2">
              <Label htmlFor="service_type">
                Service Type *
              </Label>

              <Input
                id="service_type"
                name="service_type"
                value={
                  form.service_type
                }
                onChange={handleChange}
                placeholder="Cloud Migration"
                required
              />
            </div>

            {/* SOURCE */}

            <div className="space-y-2">
              <Label htmlFor="source">
                Source *
              </Label>

              <Input
                id="source"
                name="source"
                value={form.source}
                onChange={handleChange}
                placeholder="client@example.com"
                required
              />
            </div>

            {/* VALUE */}

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">
                  Estimated Value *
                </Label>

                <Input
                  id="estimated_value"
                  name="estimated_value"
                  type="number"
                  min="0"
                  value={
                    form.estimated_value
                  }
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
                  maxLength={3}
                  value={
                    form.currency
                  }
                  onChange={handleChange}
                  placeholder="USD"
                />
              </div>
            </div>

            {/* RECEIVED */}

            <div className="space-y-2">
              <Label htmlFor="received_date">
                Received Date *
              </Label>

              <Input
                id="received_date"
                name="received_date"
                type="date"
                value={
                  form.received_date
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* DEADLINE */}

            <div className="space-y-2">
              <Label htmlFor="submission_deadline">
                Submission Deadline *
              </Label>

              <Input
                id="submission_deadline"
                name="submission_deadline"
                type="date"
                value={
                  form.submission_deadline
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* STATUS */}

            <div className="space-y-2">
              <Label htmlFor="rfp_status">
                RFP Status
              </Label>

              <select
                id="rfp_status"
                name="rfp_status"
                value={
                  form.rfp_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="RECEIVED">
                  Received
                </option>

                <option value="EVALUATED">
                  Evaluated
                </option>

                <option value="IN_PROGRESS">
                  In Progress
                </option>

                <option value="SUBMITTED">
                  Submitted
                </option>

                <option value="NO_BID">
                  No Bid
                </option>

                <option value="WON">
                  Won
                </option>

                <option value="LOST">
                  Lost
                </option>
              </select>
            </div>

            {/* BID DECISION */}

            <div className="space-y-2">
              <Label htmlFor="bid_decision">
                Bid Decision
              </Label>

              <select
                id="bid_decision"
                name="bid_decision"
                value={
                  form.bid_decision
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="BID">
                  Bid
                </option>

                <option value="NO_BID">
                  No Bid
                </option>
              </select>

              <p className="text-xs text-slate-500">
                Normally this will be
                updated automatically after
                Bid Evaluation.
              </p>
            </div>

            {/* DESCRIPTION */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">
                Description
              </Label>

              <Textarea
                id="description"
                name="description"
                value={
                  form.description
                }
                onChange={handleChange}
                placeholder="RFP for migration of existing workloads to AWS and managed support..."
                rows={5}
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

              {rfp
                ? "Save Changes"
                : "Create RFP"}
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

interface RfpDetailsModalProps {
  rfp: Rfp;

  owner?: RfpOwnerUser;

  onClose: () => void;
}

function RfpDetailsModal({
  rfp,
  owner,
  onClose,
}: RfpDetailsModalProps) {
  const remaining =
    daysUntil(
      rfp.submission_deadline,
    );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {rfp.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {rfp.rfp_number} · RFP #
              {rfp.id}
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
          {/* VALUE */}

          <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
            <p className="text-sm text-blue-100">
              Estimated Value
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                rfp.estimated_value,
                rfp.currency,
              )}
            </p>
          </div>

          {/* DEADLINE */}

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Submission Deadline
            </p>

            <p className="mt-2 text-xl font-bold text-indigo-700">
              {formatDate(
                rfp.submission_deadline,
              )}
            </p>

            <p
              className={`mt-2 text-xs font-semibold ${
                remaining < 0
                  ? "text-red-600"
                  : remaining <= 3
                    ? "text-amber-600"
                    : "text-slate-500"
              }`}
            >
              {remaining < 0
                ? `${Math.abs(
                    remaining,
                  )} days overdue`
                : remaining === 0
                  ? "Due today"
                  : `${remaining} days remaining`}
            </p>
          </div>

          {/* STATUS */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              RFP Status
            </p>

            <Badge
              className={`mt-2 ${getRfpStatusClasses(
                rfp.rfp_status,
              )}`}
            >
              {formatLabel(
                rfp.rfp_status,
              )}
            </Badge>
          </div>

          {/* DECISION */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Bid Decision
            </p>

            <Badge
              className={`mt-2 ${getDecisionClasses(
                rfp.bid_decision,
              )}`}
            >
              {formatLabel(
                rfp.bid_decision,
              )}
            </Badge>
          </div>

          {/* CLIENT */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Client
            </p>

            <p className="mt-1 font-semibold">
              {rfp.client_name}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {rfp.industry}
            </p>
          </div>

          {/* SERVICE */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Service Type
            </p>

            <p className="mt-1 font-semibold">
              {rfp.service_type}
            </p>
          </div>

          {/* OWNER */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Owner
            </p>

            <p className="mt-1 font-semibold">
              {owner?.full_name ??
                `User #${rfp.owner_id}`}
            </p>

            {owner && (
              <p className="mt-1 text-sm text-slate-500">
                {formatLabel(
                  owner.role.display_name,
                )}{" "}
                · {owner.email}
              </p>
            )}
          </div>

          {/* SOURCE */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Source
            </p>

            <p className="mt-1 font-semibold">
              {rfp.source}
            </p>
          </div>

          {/* RECEIVED */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Received Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                rfp.received_date,
              )}
            </p>
          </div>

          {/* CURRENCY */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Currency
            </p>

            <p className="mt-1 font-semibold">
              {rfp.currency}
            </p>
          </div>

          {/* DESCRIPTION */}

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Description
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {rfp.description ||
                "No description added."}
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

export default function RfpsPage() {
  const confirm = useConfirm();
  const [rfps, setRfps] =
    useState<Rfp[]>([]);

  const [owners, setOwners] =
    useState<RfpOwnerUser[]>([]);
  const [opportunities, setOpportunities] =
    useState<SalesOpportunity[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    decisionFilter,
    setDecisionFilter,
  ] = useState("ALL");

  const [
    ownerFilter,
    setOwnerFilter,
  ] = useState("ALL");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [submittingRfpId, setSubmittingRfpId] =
    useState<number | null>(null);

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
    editingRfp,
    setEditingRfp,
  ] = useState<Rfp | null>(
    null,
  );

  const [
    viewingRfp,
    setViewingRfp,
  ] = useState<Rfp | null>(
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
            rfpRecords,
            userRecords,
            opportunityRecords,
          ] = await Promise.all([
            getRfps({
              skip: 0,
              limit: 100,
            }),

            getUsers(),
            getSalesOpportunities({ skip: 0, limit: 500 }),
          ]);

          setRfps(rfpRecords);
          setOpportunities(opportunityRecords);

          /*
           * Backend rule:
           * RFP owner must be active SALES,
           * PRESALES or ACCOUNT_DIRECTOR.
           */
          const allowedOwners =
            userRecords.filter(
              (user) =>
                [
                  "SALES",
                  "PRESALES",
                  "ACCOUNT_DIRECTOR",
                ].includes(
                  user.role.name,
                ) &&
                user.is_active !==
                  false,
            );

          setOwners(
            allowedOwners,
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

  function findOwner(
    ownerId: number,
  ): RfpOwnerUser | undefined {
    return owners.find(
      (owner) =>
        owner.id === ownerId,
    );
  }

  /* ================================================= */
  /* FILTER */
  /* ================================================= */

  const filteredRfps =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return rfps.filter(
        (rfp) => {
          const owner =
            owners.find(
              (record) =>
                record.id ===
                rfp.owner_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            rfp.rfp_number
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            rfp.title
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            rfp.client_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            rfp.industry
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            rfp.service_type
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            owner?.full_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            rfp.rfp_status ===
              statusFilter;

          const matchesDecision =
            decisionFilter ===
              "ALL" ||
            rfp.bid_decision ===
              decisionFilter;

          const matchesOwner =
            ownerFilter ===
              "ALL" ||
            rfp.owner_id ===
              Number(ownerFilter);

          return (
            matchesSearch &&
            matchesStatus &&
            matchesDecision &&
            matchesOwner
          );
        },
      );
    }, [
      decisionFilter,
      ownerFilter,
      owners,
      rfps,
      search,
      statusFilter,
    ]);

  /* ================================================= */
  /* KPI */
  /* ================================================= */

  const pendingEvaluation =
    rfps.filter(
      (rfp) =>
        rfp.bid_decision ===
        "PENDING",
    ).length;

  const bidCount =
    rfps.filter(
      (rfp) =>
        rfp.bid_decision ===
        "BID",
    ).length;

  const inProgressCount =
    rfps.filter(
      (rfp) =>
        rfp.rfp_status ===
        "IN_PROGRESS",
    ).length;

  const totalEstimatedValue =
    rfps
      .filter(
        (rfp) =>
          rfp.bid_decision !==
            "NO_BID" &&
          rfp.rfp_status !==
            "LOST",
      )
      .reduce(
        (total, rfp) =>
          total +
          (Number(
            rfp.estimated_value,
          ) || 0),
        0,
      );

  /* ================================================= */
  /* SAVE */
  /* ================================================= */

  async function handleSaveRfp(
    payload: CreateRfpRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingRfp) {
        const updated =
          await replaceRfp(
            editingRfp.id,
            payload,
          );

        setRfps((current) =>
          current.map((rfp) =>
            rfp.id === updated.id
              ? updated
              : rfp,
          ),
        );
      } else {
        const created =
          await createRfp(
            payload,
          );

        setRfps((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingRfp(null);
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

  async function handleSubmitRfp(rfp: Rfp): Promise<void> {
    const confirmed = await confirm(
      `Submit RFP "${rfp.rfp_number} - ${rfp.title}" to the client?`,
    );

    if (!confirmed) return;

    setSubmittingRfpId(rfp.id);
    setError("");

    try {
      const updated = await replaceRfp(
        rfp.id,
        formToPayload({
          ...rfpToForm(rfp),
          rfp_status: "SUBMITTED",
        }, rfp.opportunity_id?.toString() ?? ""),
      );

      setRfps((current) =>
        current.map((record) =>
          record.id === updated.id ? updated : record,
        ),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmittingRfpId(null);
    }
  }

  /* ================================================= */
  /* DELETE */
  /* ================================================= */

  async function handleDeleteRfp(
    rfp: Rfp,
  ): Promise<void> {
    const confirmed =
      await confirm(
        `Delete RFP "${rfp.rfp_number} - ${rfp.title}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteRfp(
        rfp.id,
      );

      setRfps((current) =>
        current.filter(
          (record) =>
            record.id !== rfp.id,
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

  /* ================================================= */
  /* MODALS */
  /* ================================================= */

  function openCreateForm(): void {
    setEditingRfp(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    rfp: Rfp,
  ): void {
    setEditingRfp(rfp);
    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute
      allowedRoles={[
        "SALES",
        "PRESALES",
        "ACCOUNT_DIRECTOR",
      ]}
    >
      <DashboardLayout
        title="RFPs"
        description="Manage incoming RFPs, commercial value, ownership, deadlines and bid lifecycle."
      >
        <div className="space-y-6">
          {/* ================================================= */}
          {/* KPI */}
          {/* ================================================= */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total RFPs"
              value={rfps.length.toLocaleString(
                "en-US",
              )}
              description="All RFPs in the bid pipeline"
              icon={FileText}
              variant="blue"
            />

            <StatCard
              title="Pending Evaluation"
              value={pendingEvaluation.toLocaleString(
                "en-US",
              )}
              description="Awaiting BID / NO_BID evaluation"
              icon={CalendarClock}
              variant="indigo"
            />

            <StatCard
              title="BID"
              value={bidCount.toLocaleString(
                "en-US",
              )}
              description={`${inProgressCount} currently in progress`}
              icon={BriefcaseBusiness}
              variant="cyan"
            />

            <StatCard
              title="Pipeline Value"
              value={formatCurrency(
                totalEstimatedValue,
              )}
              description="Active estimated RFP value"
              icon={CircleDollarSign}
              variant="emerald"
            />
          </section>

          {/* ================================================= */}
          {/* MAIN */}
          {/* ================================================= */}

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle className="text-xl text-slate-900">
                    RFP Pipeline
                  </CardTitle>

                  <p className="mt-1 text-sm text-slate-500">
                    {rfps.length} RFP
                    {rfps.length === 1
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
                    onClick={
                      openCreateForm
                    }
                    disabled={
                      owners.length === 0
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />

                    Create RFP
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
                owners.length === 0 && (
                  <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                    <AlertDescription>
                      No active SALES,
                      PRESALES or
                      ACCOUNT_DIRECTOR
                      users are available
                      for RFP ownership.
                    </AlertDescription>
                  </Alert>
                )}

              {/* FILTERS */}

              <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_210px_200px_230px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Search RFP, client, industry, service or owner..."
                    className="pl-10"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All Statuses
                  </option>

                  <option value="RECEIVED">
                    Received
                  </option>

                  <option value="EVALUATED">
                    Evaluated
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="SUBMITTED">
                    Submitted
                  </option>

                  <option value="NO_BID">
                    No Bid
                  </option>

                  <option value="WON">
                    Won
                  </option>

                  <option value="LOST">
                    Lost
                  </option>
                </select>

                <select
                  value={
                    decisionFilter
                  }
                  onChange={(event) =>
                    setDecisionFilter(
                      event.target
                        .value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All Decisions
                  </option>

                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="BID">
                    Bid
                  </option>

                  <option value="NO_BID">
                    No Bid
                  </option>
                </select>

                <select
                  value={ownerFilter}
                  onChange={(event) =>
                    setOwnerFilter(
                      event.target
                        .value,
                    )
                  }
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm"
                >
                  <option value="ALL">
                    All Owners
                  </option>

                  {owners.map(
                    (owner) => (
                      <option
                        key={owner.id}
                        value={owner.id}
                      >
                        {owner.full_name}
                      </option>
                    ),
                  )}
                </select>
              </div>

              {/* TABLE */}

              {isLoading ? (
                <div className="flex min-h-64 items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
                </div>
              ) : filteredRfps.length ===
                0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                  <FileText className="h-10 w-10 text-blue-300" />

                  <p className="mt-3 font-semibold text-slate-700">
                    No RFPs found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Create an RFP or
                    change the current
                    filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1650px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">
                          RFP
                        </th>

                        <th className="px-4 py-3">
                          Client
                        </th>

                        <th className="px-4 py-3">
                          Service
                        </th>

                        <th className="px-4 py-3">
                          Value
                        </th>

                        <th className="px-4 py-3">
                          Owner
                        </th>

                        <th className="px-4 py-3">
                          Deadline
                        </th>

                        <th className="px-4 py-3">
                          Status
                        </th>

                        <th className="px-4 py-3">
                          Decision
                        </th>

                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-blue-50">
                      {filteredRfps.map(
                        (rfp) => {
                          const owner =
                            findOwner(
                              rfp.owner_id,
                            );

                          const remaining =
                            daysUntil(
                              rfp.submission_deadline,
                            );

                          return (
                            <tr
                              key={rfp.id}
                              className="bg-white transition hover:bg-blue-50/50"
                            >
                              {/* RFP */}

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                    <FileText className="h-4 w-4" />
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-800">
                                      {rfp.title}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {
                                        rfp.rfp_number
                                      }
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {/* CLIENT */}

                              <td className="px-4 py-4">
                                <p className="font-medium text-slate-700">
                                  {
                                    rfp.client_name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {rfp.industry}
                                </p>
                              </td>

                              {/* SERVICE */}

                              <td className="px-4 py-4 text-sm font-medium text-slate-700">
                                {
                                  rfp.service_type
                                }
                              </td>

                              {/* VALUE */}

                              <td className="px-4 py-4 font-bold text-blue-700">
                                {formatCurrency(
                                  rfp.estimated_value,
                                  rfp.currency,
                                )}
                              </td>

                              {/* OWNER */}

                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <UserRound className="h-4 w-4 text-indigo-600" />

                                  <div>
                                    <p className="text-sm font-medium text-slate-700">
                                      {owner?.full_name ??
                                        `User #${rfp.owner_id}`}
                                    </p>

                                    {owner && (
                                      <p className="text-xs text-slate-500">
                                        {formatLabel(
                                          owner.role.display_name,
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* DEADLINE */}

                              <td className="px-4 py-4">
                                <div>
                                  <p className="text-sm font-medium text-slate-700">
                                    {formatDate(
                                      rfp.submission_deadline,
                                    )}
                                  </p>

                                  <p
                                    className={`mt-1 text-xs font-medium ${
                                      remaining < 0
                                        ? "text-red-600"
                                        : remaining <=
                                            3
                                          ? "text-amber-600"
                                          : "text-slate-400"
                                    }`}
                                  >
                                    {remaining <
                                    0
                                      ? `${Math.abs(
                                          remaining,
                                        )}d overdue`
                                      : remaining ===
                                          0
                                        ? "Due today"
                                        : `${remaining}d left`}
                                  </p>
                                </div>
                              </td>

                              {/* STATUS */}

                              <td className="px-4 py-4">
                                <Badge
                                  className={getRfpStatusClasses(
                                    rfp.rfp_status,
                                  )}
                                >
                                  {formatLabel(
                                    rfp.rfp_status,
                                  )}
                                </Badge>
                              </td>

                              {/* DECISION */}

                              <td className="px-4 py-4">
                                <Badge
                                  className={getDecisionClasses(
                                    rfp.bid_decision,
                                  )}
                                >
                                  {formatLabel(
                                    rfp.bid_decision,
                                  )}
                                </Badge>
                              </td>

                              {/* ACTIONS */}

                              <td className="px-4 py-4">
                                <div className="flex justify-end gap-2">
                                  {rfp.bid_decision === "BID" &&
                                    ["EVALUATED", "IN_PROGRESS"].includes(
                                      rfp.rfp_status,
                                    ) && (
                                      <Button
                                        type="button"
                                        size="icon"
                                        title="Submit RFP to client"
                                        aria-label="Submit RFP to client"
                                        disabled={submittingRfpId === rfp.id}
                                        onClick={() =>
                                          void handleSubmitRfp(rfp)
                                        }
                                      >
                                        {submittingRfpId === rfp.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Send className="h-4 w-4" />
                                        )}
                                      </Button>
                                    )}

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="View RFP"
                                    onClick={() =>
                                      setViewingRfp(
                                        rfp,
                                      )
                                    }
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Edit RFP"
                                    onClick={() =>
                                      openEditForm(
                                        rfp,
                                      )
                                    }
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    title="Delete RFP"
                                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() =>
                                      void handleDeleteRfp(
                                        rfp,
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

        {/* FORM */}

        {showForm && (
          <RfpFormModal
            rfp={editingRfp}
            owners={owners}
            opportunities={opportunities}
            isSaving={isSaving}
            error={formError}
            onClose={() => {
              if (!isSaving) {
                setShowForm(false);
                setEditingRfp(null);
              }
            }}
            onSubmit={handleSaveRfp}
          />
        )}

        {/* DETAILS */}

        {viewingRfp && (
          <RfpDetailsModal
            rfp={viewingRfp}
            owner={findOwner(
              viewingRfp.owner_id,
            )}
            onClose={() =>
              setViewingRfp(null)
            }
          />
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
