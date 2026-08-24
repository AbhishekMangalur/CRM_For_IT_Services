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
  Award,
  BadgeIndianRupee,
  BriefcaseBusiness,
  CircleDollarSign,
  Edit3,
  Eye,
  Handshake,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";

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

import {
  createInfluencedOpportunity,
  deleteInfluencedOpportunity,
  getAlliancePartners,
  getInfluencedOpportunities,
  replaceInfluencedOpportunity,
} from "@/lib/alliance-api";

import { getSalesOpportunities } from "@/lib/sales-api";
import { formatNumberInputValue } from "@/lib/utils";

import type {
  AlliancePartner,
  CreatePartnerInfluencedOpportunityRequest,
  InfluenceStatus,
  InfluenceType,
  PartnerInfluencedOpportunity,
} from "@/types/alliance";

import type {
  SalesOpportunity,
} from "@/types/sales";
import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

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
        <Search
          className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <Input
          id={id}
          type="search"
          autoComplete="off"
          value={query}
          required
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

interface InfluenceFormState {
  partner_id: string;
  opportunity_id: string;

  influence_type: InfluenceType;

  influenced_value: string;

  currency: string;

  referral_fee: string;

  tier_points: string;

  status: InfluenceStatus;

  notes: string;
}

const EMPTY_FORM: InfluenceFormState = {
  partner_id: "",
  opportunity_id: "",

  influence_type: "CO_SELL",

  influenced_value: "",

  currency: "USD",

  referral_fee: "",

  tier_points: "",

  status: "ACTIVE",

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
  value: string,
): string {
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

function getInfluenceTypeClasses(
  type: string,
): string {
  switch (type.toUpperCase()) {
    case "CO_SELL":
      return "bg-blue-100 text-blue-700";

    case "REFERRAL":
      return "bg-emerald-100 text-emerald-700";

    case "TECHNICAL_SUPPORT":
      return "bg-indigo-100 text-indigo-700";

    case "MARKETING":
      return "bg-amber-100 text-amber-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusClasses(
  status: string,
): string {
  switch (status.toUpperCase()) {
    case "ACTIVE":
      return "bg-emerald-100 text-emerald-700";

    case "COMPLETED":
      return "bg-blue-100 text-blue-700";

    case "INACTIVE":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function influenceToForm(
  influence: PartnerInfluencedOpportunity,
): InfluenceFormState {
  return {
    partner_id:
      influence.partner_id.toString(),

    opportunity_id:
      influence.opportunity_id.toString(),

    influence_type:
      influence.influence_type,

    influenced_value:
      formatNumberInputValue(influence.influenced_value),

    currency:
      influence.currency,

    referral_fee:
      formatNumberInputValue(influence.referral_fee),

    tier_points:
      influence.tier_points.toString(),

    status:
      influence.status,

    notes:
      influence.notes ?? "",
  };
}

function formToPayload(
  form: InfluenceFormState,
): CreatePartnerInfluencedOpportunityRequest {
  return {
    partner_id:
      Number(form.partner_id),

    opportunity_id:
      Number(form.opportunity_id),

    influence_type:
      form.influence_type,

    /*
     * Backend supports omitted influenced_value.
     * When omitted, it uses opportunity.deal_value.
     */
    influenced_value:
      form.influenced_value.trim()
        ? Number(form.influenced_value)
        : null,

    currency:
      form.currency
        .trim()
        .toUpperCase() || "USD",

    referral_fee:
      Number(form.referral_fee) || 0,

    tier_points:
      Number(form.tier_points) || 0,

    status:
      form.status,

    notes:
      form.notes.trim() || null,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface InfluenceFormModalProps {
  influence:
    | PartnerInfluencedOpportunity
    | null;

  partners:
    AlliancePartner[];

  opportunities:
    SalesOpportunity[];

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreatePartnerInfluencedOpportunityRequest,
  ) => Promise<void>;
}

function InfluenceFormModal({
  influence,
  partners,
  opportunities,
  isSaving,
  error,
  onClose,
  onSubmit,
}: InfluenceFormModalProps) {
  const [form, setForm] =
    useState<InfluenceFormState>(
      influence
        ? influenceToForm(influence)
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

  const selectedOpportunity =
    opportunities.find(
      (opportunity) =>
        opportunity.id ===
        Number(form.opportunity_id),
    );

  const isInvalid =
    !form.partner_id ||
    !form.opportunity_id ||
    Number(form.referral_fee) < 0 ||
    Number(form.tier_points) < 0 ||
    Boolean(
      form.influenced_value &&
        Number(
          form.influenced_value,
        ) < 0,
    );

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

        {/* HEADER */}

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {influence
                ? "Edit Partner Influence"
                : "Add Partner Influence"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track how an Alliance partner
              influenced a Sales opportunity.
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

            <SearchSelect
              id="influence_partner_search"
              label="Partner"
              placeholder="Search by partner, type, program, or tier..."
              options={partners
                .filter((partner) => partner.is_active)
                .map((partner) => ({
                  value: partner.id.toString(),
                  label: partner.name,
                  description: `${formatLabel(partner.partner_type)} · ${formatLabel(partner.partner_tier)}`,
                  searchText: [
                    partner.name,
                    partner.partner_type,
                    partner.partner_program,
                    partner.partner_tier,
                  ].join(" "),
                }))}
              value={form.partner_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  partner_id: value,
                }))
              }
            />

            <SearchSelect
              id="influence_opportunity_search"
              label="Sales Opportunity"
              placeholder="Search by opportunity, client, or service..."
              options={opportunities.map((opportunity) => ({
                value: opportunity.id.toString(),
                label: opportunity.opportunity_name,
                description: `${opportunity.client_name} · ${opportunity.service_type}`,
                searchText: [
                  opportunity.opportunity_name,
                  opportunity.client_name,
                  opportunity.service_type,
                ].join(" "),
              }))}
              value={form.opportunity_id}
              onChange={(value) =>
                setForm((previous) => ({
                  ...previous,
                  opportunity_id: value,
                }))
              }
            />

            {/* INFLUENCE TYPE */}

            <div className="space-y-2">
              <Label htmlFor="influence_type">
                Influence Type
              </Label>

              <select
                id="influence_type"
                name="influence_type"
                value={
                  form.influence_type
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="CO_SELL">
                  Co-Sell
                </option>

                <option value="REFERRAL">
                  Referral
                </option>

                <option value="TECHNICAL_SUPPORT">
                  Technical Support
                </option>

                <option value="MARKETING">
                  Marketing
                </option>
              </select>
            </div>

            {/* STATUS */}

            <div className="space-y-2">
              <Label htmlFor="status">
                Status
              </Label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>
            </div>

            {/* INFLUENCED VALUE */}

            <div className="space-y-2">
              <Label htmlFor="influenced_value">
                Influenced Value
              </Label>

              <Input
                id="influenced_value"
                name="influenced_value"
                type="number"
                min="0"
                value={
                  form.influenced_value
                }
                onChange={handleChange}
                placeholder="0"
              />

              <p className="text-xs text-slate-500">
                Leave blank to let the
                backend use the linked
                opportunity&apos;s deal value.
              </p>

              {selectedOpportunity && (
                <p className="text-xs font-medium text-blue-600">
                  Selected:{" "}
                  {
                    selectedOpportunity.opportunity_name
                  }
                </p>
              )}
            </div>

            {/* CURRENCY */}

            <div className="space-y-2">
              <Label htmlFor="currency">
                Currency
              </Label>

              <Input
                id="currency"
                name="currency"
                maxLength={3}
                value={form.currency}
                onChange={handleChange}
                placeholder="USD"
              />
            </div>

            {/* REFERRAL FEE */}

            <div className="space-y-2">
              <Label htmlFor="referral_fee">
                Referral Fee
              </Label>

              <Input
                id="referral_fee"
                name="referral_fee"
                type="number"
                min="0"
                value={
                  form.referral_fee
                }
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            {/* TIER POINTS */}

            <div className="space-y-2">
              <Label htmlFor="tier_points">
                Tier Points
              </Label>

              <Input
                id="tier_points"
                name="tier_points"
                type="number"
                min="0"
                value={
                  form.tier_points
                }
                onChange={handleChange}
                placeholder="0"
              />
            </div>

            {/* PREVIEW */}

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 md:col-span-2">
              <p className="font-semibold text-slate-800">
                Commercial Preview
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Influenced Pipeline
                  </p>

                  <p className="mt-2 text-lg font-bold text-blue-700">
                    {form.influenced_value
                      ? formatCurrency(
                          form.influenced_value,
                          form.currency,
                        )
                      : "Opportunity value"}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Referral Fee
                  </p>

                  <p className="mt-2 text-lg font-bold text-indigo-700">
                    {formatCurrency(
                      form.referral_fee || 0,
                      form.currency,
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-xs text-slate-500">
                    Tier Points
                  </p>

                  <p className="mt-2 text-lg font-bold text-emerald-700">
                    {Number(
                      form.tier_points,
                    ) || 0}
                  </p>
                </div>
              </div>
            </div>

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
                placeholder="AWS helped with co-selling and technical support..."
                rows={5}
              />
            </div>
          </div>

          {/* FOOTER */}

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

              {influence
                ? "Save Changes"
                : "Add Influence"}
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

interface InfluenceDetailsModalProps {
  influence:
    PartnerInfluencedOpportunity;

  partner?: AlliancePartner;

  opportunity?:
    SalesOpportunity;

  onClose: () => void;
}

function InfluenceDetailsModal({
  influence,
  partner,
  opportunity,
  onClose,
}: InfluenceDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {partner?.name ??
                `Partner #${influence.partner_id}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Partner Influence #
              {influence.id}
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
              Influenced Pipeline
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                influence.influenced_value,
                influence.currency,
              )}
            </p>
          </div>

          {/* STATUS */}

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-3 ${getStatusClasses(
                influence.status,
              )}`}
            >
              {formatLabel(
                influence.status,
              )}
            </Badge>
          </div>

          {/* PARTNER */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Partner
            </p>

            <p className="mt-1 font-semibold">
              {partner?.name ??
                `Partner #${influence.partner_id}`}
            </p>

            {partner && (
              <p className="mt-1 text-sm text-slate-500">
                {formatLabel(
                  partner.partner_type,
                )}{" "}
                ·{" "}
                {formatLabel(
                  partner.partner_tier,
                )}
              </p>
            )}
          </div>

          {/* OPPORTUNITY */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Opportunity
            </p>

            <p className="mt-1 font-semibold">
              {opportunity?.opportunity_name ??
                `Opportunity #${influence.opportunity_id}`}
            </p>
          </div>

          {/* TYPE */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Influence Type
            </p>

            <Badge
              className={`mt-2 ${getInfluenceTypeClasses(
                influence.influence_type,
              )}`}
            >
              {formatLabel(
                influence.influence_type,
              )}
            </Badge>
          </div>

          {/* REFERRAL FEE */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Referral Fee
            </p>

            <p className="mt-1 font-semibold text-indigo-700">
              {formatCurrency(
                influence.referral_fee,
                influence.currency,
              )}
            </p>
          </div>

          {/* TIER POINTS */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Tier Points
            </p>

            <p className="mt-1 text-xl font-bold text-emerald-700">
              {influence.tier_points}
            </p>
          </div>

          {/* CURRENCY */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Currency
            </p>

            <p className="mt-1 font-semibold">
              {influence.currency}
            </p>
          </div>

          {/* CREATED */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Created
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                influence.created_at,
              )}
            </p>
          </div>

          {/* UPDATED */}

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Last Updated
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                influence.updated_at,
              )}
            </p>
          </div>

          {/* NOTES */}

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {influence.notes ||
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

export default function AllianceInfluencedOpportunitiesPage() {
  const confirm = useConfirm();
  const [
    influences,
    setInfluences,
  ] =
    useState<
      PartnerInfluencedOpportunity[]
    >([]);

  const [
    partners,
    setPartners,
  ] = useState<AlliancePartner[]>([]);

  const [
    opportunities,
    setOpportunities,
  ] =
    useState<SalesOpportunity[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    partnerFilter,
    setPartnerFilter,
  ] = useState("ALL");

  const [
    typeFilter,
    setTypeFilter,
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
    editingInfluence,
    setEditingInfluence,
  ] =
    useState<PartnerInfluencedOpportunity | null>(
      null,
    );

  const [
    viewingInfluence,
    setViewingInfluence,
  ] =
    useState<PartnerInfluencedOpportunity | null>(
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
            influenceRecords,
            partnerRecords,
            opportunityRecords,
          ] = await Promise.all([
            getInfluencedOpportunities({
              skip: 0,
              limit: 100,
            }),

            getAlliancePartners({
              skip: 0,
              limit: 100,
            }),

            getSalesOpportunities({
              skip: 0,
              limit: 100,
            }),
          ]);

          setInfluences(
            influenceRecords,
          );

          setPartners(
            partnerRecords,
          );

          setOpportunities(
            opportunityRecords,
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
    void loadData();
  }, [loadData]);

  /* ================================================= */
  /* LOOKUPS */
  /* ================================================= */

  function findPartner(
    partnerId: number,
  ): AlliancePartner | undefined {
    return partners.find(
      (partner) =>
        partner.id === partnerId,
    );
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

  /* ================================================= */
  /* FILTERING */
  /* ================================================= */

  const filteredInfluences =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return influences.filter(
        (influence) => {
          const partner =
            partners.find(
              (record) =>
                record.id ===
                influence.partner_id,
            );

          const opportunity =
            opportunities.find(
              (record) =>
                record.id ===
                influence.opportunity_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            partner?.name
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
            influence.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            influence.influence_type
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesPartner =
            partnerFilter === "ALL" ||
            influence.partner_id ===
              Number(partnerFilter);

          const matchesType =
            typeFilter === "ALL" ||
            influence.influence_type ===
              typeFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            influence.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesPartner &&
            matchesType &&
            matchesStatus
          );
        },
      );
    }, [
      influences,
      opportunities,
      partnerFilter,
      partners,
      search,
      statusFilter,
      typeFilter,
    ]);

  /* ================================================= */
  /* KPI */
  /* ================================================= */

  const totalInfluencedPipeline =
    influences.reduce(
      (total, influence) =>
        total +
        (Number(
          influence.influenced_value,
        ) || 0),
      0,
    );

  const totalReferralFees =
    influences.reduce(
      (total, influence) =>
        total +
        (Number(
          influence.referral_fee,
        ) || 0),
      0,
    );

  const totalTierPoints =
    influences.reduce(
      (total, influence) =>
        total +
        Number(
          influence.tier_points,
        ),
      0,
    );

  /* ================================================= */
  /* SAVE */
  /* ================================================= */

  async function handleSaveInfluence(
    payload:
      CreatePartnerInfluencedOpportunityRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingInfluence) {
        const updated =
          await replaceInfluencedOpportunity(
            editingInfluence.id,
            payload,
          );

        setInfluences((current) =>
          current.map(
            (influence) =>
              influence.id ===
              updated.id
                ? updated
                : influence,
          ),
        );
      } else {
        const created =
          await createInfluencedOpportunity(
            payload,
          );

        setInfluences((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingInfluence(null);
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

  async function handleDeleteInfluence(
    influence:
      PartnerInfluencedOpportunity,
  ): Promise<void> {
    const partner =
      findPartner(
        influence.partner_id,
      );

    const opportunity =
      findOpportunity(
        influence.opportunity_id,
      );

    const confirmed =
      await confirm(
        `Delete ${formatLabel(
          influence.influence_type,
        )} influence for "${
          opportunity?.opportunity_name ??
          "this opportunity"
        }" by "${
          partner?.name ??
          "this partner"
        }"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteInfluencedOpportunity(
        influence.id,
      );

      setInfluences((current) =>
        current.filter(
          (record) =>
            record.id !==
            influence.id,
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
  /* MODAL HELPERS */
  /* ================================================= */

  function openCreateForm(): void {
    setEditingInfluence(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    influence:
      PartnerInfluencedOpportunity,
  ): void {
    setEditingInfluence(
      influence,
    );

    setFormError("");
    setShowForm(true);
  }

  return (
    <ProtectedRoute
        allowedRoles={[
        "SALES",
        "ACCOUNT_DIRECTOR",
        ]}
    >
    <DashboardLayout
      title="Partner Influenced Opportunities"
      description="Track partner co-sell, referrals and contribution to the sales pipeline."
    >
      <div className="space-y-6">

        {/* ================================================= */}
        {/* KPI CARDS */}
        {/* ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Influenced Opportunities"
            value={influences.length.toLocaleString(
              "en-US",
            )}
            description="Sales opportunities influenced by partners"
            icon={TrendingUp}
            variant="blue"
          />

          <StatCard
            title="Influenced Pipeline"
            value={formatCurrency(
              totalInfluencedPipeline,
            )}
            description="Total partner influenced opportunity value"
            icon={CircleDollarSign}
            variant="indigo"
          />

          <StatCard
            title="Referral Fees"
            value={formatCurrency(
              totalReferralFees,
            )}
            description="Total referral fees across opportunities"
            icon={BadgeIndianRupee}
            variant="cyan"
          />

          <StatCard
            title="Tier Points"
            value={totalTierPoints.toLocaleString(
              "en-US",
            )}
            description="Partner program tier contribution"
            icon={Award}
            variant="emerald"
          />
        </section>

        {/* ================================================= */}
        {/* MAIN CARD */}
        {/* ================================================= */}

        <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
          <CardHeader className="border-b border-blue-50">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="text-xl text-slate-900">
                  Partner Influenced Pipeline
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  {influences.length} influence
                  {influences.length === 1
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
                    partners.length === 0 ||
                    opportunities.length === 0
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />

                  Add Influence
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
              (partners.length === 0 ||
                opportunities.length ===
                  0) && (
                <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription>
                    At least one active partner
                    and one Sales opportunity
                    are required before adding
                    partner influence.
                  </AlertDescription>
                </Alert>
              )}

            {/* FILTERS */}

            <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_220px_220px_190px]">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute bottom-0 left-3 top-0 z-10 my-auto h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search partner, opportunity, influence or notes..."
                  className="pl-10"
                />
              </div>

              <select
                value={partnerFilter}
                onChange={(event) =>
                  setPartnerFilter(
                    event.target.value,
                  )
                }
                className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ALL">
                  All Partners
                </option>

                {partners.map(
                  (partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.name}
                    </option>
                  ),
                )}
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
                  All Influence Types
                </option>

                <option value="CO_SELL">
                  Co-Sell
                </option>

                <option value="REFERRAL">
                  Referral
                </option>

                <option value="TECHNICAL_SUPPORT">
                  Technical Support
                </option>

                <option value="MARKETING">
                  Marketing
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

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>

                <option value="COMPLETED">
                  Completed
                </option>
              </select>
            </div>

            {/* TABLE */}

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
              </div>
            ) : filteredInfluences.length ===
              0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                <TrendingUp className="h-10 w-10 text-blue-300" />

                <p className="mt-3 font-semibold text-slate-700">
                  No partner influenced
                  opportunities found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-blue-100">
                <table className="w-full min-w-[1450px] text-left">

                  <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">
                        Partner
                      </th>

                      <th className="px-4 py-3">
                        Opportunity
                      </th>

                      <th className="px-4 py-3">
                        Influence Type
                      </th>

                      <th className="px-4 py-3">
                        Pipeline Value
                      </th>

                      <th className="px-4 py-3">
                        Referral Fee
                      </th>

                      <th className="px-4 py-3">
                        Tier Points
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
                    {filteredInfluences.map(
                      (influence) => {
                        const partner =
                          findPartner(
                            influence.partner_id,
                          );

                        const opportunity =
                          findOpportunity(
                            influence.opportunity_id,
                          );

                        return (
                          <tr
                            key={influence.id}
                            className="bg-white transition hover:bg-blue-50/50"
                          >

                            {/* PARTNER */}

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                  <Handshake className="h-4 w-4" />
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-800">
                                    {partner?.name ??
                                      `Partner #${influence.partner_id}`}
                                  </p>

                                  {partner && (
                                    <p className="text-xs text-slate-500">
                                      {formatLabel(
                                        partner.partner_tier,
                                      )}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* OPPORTUNITY */}

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <BriefcaseBusiness className="h-4 w-4 text-indigo-600" />

                                <span className="font-medium text-slate-700">
                                  {opportunity
                                    ?.opportunity_name ??
                                    `Opportunity #${influence.opportunity_id}`}
                                </span>
                              </div>
                            </td>

                            {/* TYPE */}

                            <td className="px-4 py-4">
                              <Badge
                                className={getInfluenceTypeClasses(
                                  influence.influence_type,
                                )}
                              >
                                {formatLabel(
                                  influence.influence_type,
                                )}
                              </Badge>
                            </td>

                            {/* PIPELINE */}

                            <td className="px-4 py-4">
                              <p className="font-bold text-blue-700">
                                {formatCurrency(
                                  influence.influenced_value,
                                  influence.currency,
                                )}
                              </p>
                            </td>

                            {/* REFERRAL */}

                            <td className="px-4 py-4">
                              <p className="font-semibold text-indigo-700">
                                {formatCurrency(
                                  influence.referral_fee,
                                  influence.currency,
                                )}
                              </p>
                            </td>

                            {/* TIER */}

                            <td className="px-4 py-4">
                              <Badge className="bg-violet-100 text-violet-700">
                                {influence.tier_points}
                              </Badge>
                            </td>

                            {/* STATUS */}

                            <td className="px-4 py-4">
                              <Badge
                                className={getStatusClasses(
                                  influence.status,
                                )}
                              >
                                {formatLabel(
                                  influence.status,
                                )}
                              </Badge>
                            </td>

                            {/* ACTIONS */}

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View influence"
                                  onClick={() =>
                                    setViewingInfluence(
                                      influence,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit influence"
                                  onClick={() =>
                                    openEditForm(
                                      influence,
                                    )
                                  }
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete influence"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteInfluence(
                                      influence,
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
        <InfluenceFormModal
          influence={
            editingInfluence
          }
          partners={partners}
          opportunities={
            opportunities
          }
          isSaving={isSaving}
          error={formError}
          onClose={() => {
            if (!isSaving) {
              setShowForm(false);

              setEditingInfluence(
                null,
              );
            }
          }}
          onSubmit={
            handleSaveInfluence
          }
        />
      )}

      {/* DETAILS */}

      {viewingInfluence && (
        <InfluenceDetailsModal
          influence={
            viewingInfluence
          }
          partner={findPartner(
            viewingInfluence.partner_id,
          )}
          opportunity={findOpportunity(
            viewingInfluence.opportunity_id,
          )}
          onClose={() =>
            setViewingInfluence(
              null,
            )
          }
        />
      )}
    </DashboardLayout>
    </ProtectedRoute>
  );
}
