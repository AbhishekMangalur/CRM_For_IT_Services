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
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  CircleDollarSign,
  Edit3,
  Eye,
  Handshake,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
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

import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

import {
  createDealRegistration,
  deleteDealRegistration,
  getAlliancePartners,
  getDealRegistrations,
  replaceDealRegistration,
} from "@/lib/alliance-api";

import { getSalesOpportunities } from "@/lib/sales-api";

import type {
  AlliancePartner,
  CreatePartnerDealRegistrationRequest,
  DealRegistrationStatus,
  PartnerDealRegistration,
} from "@/types/alliance";

import type {
  SalesOpportunity,
} from "@/types/sales";
import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

/* ================================================= */

interface RegistrationUser {
  id: number;
  full_name: string;
}

async function getRegistrationUsers(): Promise<RegistrationUser[]> {
  const response = await api.get<RegistrationUser[]>("/api/users");
  return response.data;
}

/* FORM */
/* ================================================= */

interface DealRegistrationFormState {
  partner_id: string;
  opportunity_id: string;

  registration_reference: string;

  registration_status:
    DealRegistrationStatus;

  registered_on: string;
  expiry_date: string;

  expected_incentive: string;
  currency: string;

  notes: string;
}

const EMPTY_FORM: DealRegistrationFormState = {
  partner_id: "",
  opportunity_id: "",

  registration_reference: "",

  registration_status: "PENDING",

  registered_on: "",
  expiry_date: "",

  expected_incentive: "0",
  currency: "USD",

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

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
    case "APPROVED":
      return "bg-emerald-100 text-emerald-700";

    case "REJECTED":
      return "bg-red-100 text-red-700";

    case "EXPIRED":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-amber-100 text-amber-700";
  }
}

function registrationToForm(
  registration: PartnerDealRegistration,
): DealRegistrationFormState {
  return {
    partner_id:
      registration.partner_id.toString(),

    opportunity_id:
      registration.opportunity_id.toString(),

    registration_reference:
      registration.registration_reference,

    registration_status:
      registration.registration_status,

    registered_on:
      registration.registered_on,

    expiry_date:
      registration.expiry_date ?? "",

    expected_incentive:
      registration.expected_incentive,

    currency:
      registration.currency,

    notes:
      registration.notes ?? "",
  };
}

function formToPayload(
  form: DealRegistrationFormState,
  registeredBy: number,
): CreatePartnerDealRegistrationRequest {
  return {
    partner_id:
      Number(form.partner_id),

    opportunity_id:
      Number(form.opportunity_id),

    registration_reference:
      form.registration_reference.trim(),

    registration_status:
      form.registration_status,

    registered_on:
      form.registered_on,

    expiry_date:
      form.expiry_date || null,

    expected_incentive:
      Number(form.expected_incentive),

    currency:
      form.currency
        .trim()
        .toUpperCase() || "USD",

    registered_by:
      registeredBy,

    notes:
      form.notes.trim() || null,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface DealRegistrationFormModalProps {
  registration:
    | PartnerDealRegistration
    | null;

  partners:
    AlliancePartner[];

  opportunities:
    SalesOpportunity[];

  currentUserId: number;
  currentUserName: string;

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreatePartnerDealRegistrationRequest,
  ) => Promise<void>;
}

function DealRegistrationFormModal({
  registration,
  partners,
  opportunities,
  currentUserId,
  currentUserName,
  isSaving,
  error,
  onClose,
  onSubmit,
}: DealRegistrationFormModalProps) {
  const [form, setForm] =
    useState<DealRegistrationFormState>(
      registration
        ? registrationToForm(
            registration,
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

  const invalidDateRange =
    Boolean(form.registered_on) &&
    Boolean(form.expiry_date) &&
    new Date(
      form.expiry_date,
    ).getTime() <
      new Date(
        form.registered_on,
      ).getTime();

  const isInvalid =
    !form.partner_id ||
    !form.opportunity_id ||
    !form.registration_reference.trim() ||
    !form.registered_on ||
    Number(
      form.expected_incentive,
    ) < 0 ||
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
              {registration
                ? "Edit Deal Registration"
                : "Register Partner Deal"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Register a Sales opportunity
              with an Alliance partner.
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
                  Expiry date cannot be
                  earlier than registration
                  date.
                </AlertDescription>
              </Alert>
            )}

            {/* Partner */}

            <div className="space-y-2">
              <Label htmlFor="partner_id">
                Partner *
              </Label>

              <select
                id="partner_id"
                name="partner_id"
                value={form.partner_id}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select partner
                </option>

                {partners
                  .filter(
                    (partner) =>
                      partner.is_active,
                  )
                  .map((partner) => (
                    <option
                      key={partner.id}
                      value={partner.id}
                    >
                      {partner.name} -{" "}
                      {formatLabel(
                        partner.partner_tier,
                      )}
                    </option>
                  ))}
              </select>
            </div>

            {/* Opportunity */}

            <div className="space-y-2">
              <Label htmlFor="opportunity_id">
                Sales Opportunity *
              </Label>

              <select
                id="opportunity_id"
                name="opportunity_id"
                value={
                  form.opportunity_id
                }
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="">
                  Select opportunity
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

            {/* Reference */}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="registration_reference">
                Registration Reference *
              </Label>

              <Input
                id="registration_reference"
                name="registration_reference"
                value={
                  form.registration_reference
                }
                onChange={handleChange}
                placeholder="AWS-ACE-2026-001"
                required
              />
            </div>

            {/* Status */}

            <div className="space-y-2">
              <Label htmlFor="registration_status">
                Registration Status
              </Label>

              <select
                id="registration_status"
                name="registration_status"
                value={
                  form.registration_status
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="EXPIRED">
                  Expired
                </option>
              </select>
            </div>

            {/* Registered On */}

            <div className="space-y-2">
              <Label htmlFor="registered_on">
                Registered On *
              </Label>

              <Input
                id="registered_on"
                name="registered_on"
                type="date"
                value={
                  form.registered_on
                }
                onChange={handleChange}
                required
              />
            </div>

            {/* Expiry */}

            <div className="space-y-2">
              <Label htmlFor="expiry_date">
                Expiry Date
              </Label>

              <Input
                id="expiry_date"
                name="expiry_date"
                type="date"
                value={
                  form.expiry_date
                }
                onChange={handleChange}
              />
            </div>

            {/* Incentive */}

            <div className="grid grid-cols-[1fr_100px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="expected_incentive">
                  Expected Incentive
                </Label>

                <Input
                  id="expected_incentive"
                  name="expected_incentive"
                  type="number"
                  min="0"
                  value={
                    form.expected_incentive
                  }
                  onChange={handleChange}
                  placeholder="1000"
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
                  value={form.currency}
                  onChange={handleChange}
                  placeholder="USD"
                />
              </div>
            </div>

            {/* Registered By */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <UserRound className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Registered By
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
                placeholder="Cloud migration opportunity registered with AWS..."
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

              {registration
                ? "Save Changes"
                : "Register Deal"}
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

interface DealRegistrationDetailsModalProps {
  registration:
    PartnerDealRegistration;

  partner?: AlliancePartner;

  opportunity?:
    SalesOpportunity;

  registeredByName: string;

  onClose: () => void;
}

function DealRegistrationDetailsModal({
  registration,
  partner,
  opportunity,
  registeredByName,
  onClose,
}: DealRegistrationDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {
                registration.registration_reference
              }
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Deal Registration #
              {registration.id}
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
              Expected Incentive
            </p>

            <p className="mt-2 text-3xl font-bold">
              {formatCurrency(
                registration.expected_incentive,
                registration.currency,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Status
            </p>

            <Badge
              className={`mt-3 ${getStatusClasses(
                registration.registration_status,
              )}`}
            >
              {formatLabel(
                registration.registration_status,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Partner
            </p>

            <p className="mt-1 font-semibold">
              {partner?.name ??
                `Partner #${registration.partner_id}`}
            </p>

            {partner && (
              <p className="mt-1 text-sm text-slate-500">
                {partner.partner_program}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Opportunity
            </p>

            <p className="mt-1 font-semibold">
              {opportunity
                ?.opportunity_name ??
                `Opportunity #${registration.opportunity_id}`}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Registered On
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                registration.registered_on,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Expiry Date
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                registration.expiry_date,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Registered By
            </p>

            <p className="mt-1 font-semibold">
              {registeredByName}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {registration.notes ||
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

export default function AllianceDealRegistrationsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();

  const [
    registrations,
    setRegistrations,
  ] = useState<
    PartnerDealRegistration[]
  >([]);

  const [
    partners,
    setPartners,
  ] = useState<AlliancePartner[]>([]);

  const [
    opportunities,
    setOpportunities,
  ] = useState<
    SalesOpportunity[]
  >([]);

  const [registrationUsers, setRegistrationUsers] =
    useState<RegistrationUser[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");

  const [
    partnerFilter,
    setPartnerFilter,
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
    editingRegistration,
    setEditingRegistration,
  ] =
    useState<PartnerDealRegistration | null>(
      null,
    );

  const [
    viewingRegistration,
    setViewingRegistration,
  ] =
    useState<PartnerDealRegistration | null>(
      null,
    );

  /* ---------------- LOAD ---------------- */

  const loadData =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const [
          registrationRecords,
          partnerRecords,
          opportunityRecords,
          userRecords,
        ] = await Promise.all([
          getDealRegistrations({
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

          getRegistrationUsers(),
        ]);

        setRegistrations(
          registrationRecords,
        );

        setPartners(
          partnerRecords,
        );

        setOpportunities(
          opportunityRecords,
        );

        setRegistrationUsers(userRecords);
      } catch (requestError) {
        setError(
          getErrorMessage(
            requestError,
          ),
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

  /* ---------------- LOOKUPS ---------------- */

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

  /* ---------------- FILTER ---------------- */

  const filteredRegistrations =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return registrations.filter(
        (registration) => {
          const partner =
            partners.find(
              (record) =>
                record.id ===
                registration.partner_id,
            );

          const opportunity =
            opportunities.find(
              (record) =>
                record.id ===
                registration.opportunity_id,
            );

          const matchesSearch =
            !normalizedSearch ||
            registration.registration_reference
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
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
            registration.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === "ALL" ||
            registration.registration_status ===
              statusFilter;

          const matchesPartner =
            partnerFilter === "ALL" ||
            registration.partner_id ===
              Number(partnerFilter);

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPartner
          );
        },
      );
    }, [
      opportunities,
      partnerFilter,
      partners,
      registrations,
      search,
      statusFilter,
    ]);

  /* ---------------- KPI ---------------- */

  const approvedCount =
    registrations.filter(
      (registration) =>
        registration.registration_status ===
        "APPROVED",
    ).length;

  const pendingCount =
    registrations.filter(
      (registration) =>
        registration.registration_status ===
        "PENDING",
    ).length;

  const totalExpectedIncentive =
    registrations.reduce(
      (total, registration) =>
        total +
        (Number(
          registration.expected_incentive,
        ) || 0),
      0,
    );

  /* ---------------- SAVE ---------------- */

  async function handleSaveRegistration(
    payload:
      CreatePartnerDealRegistrationRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingRegistration) {
        const updated =
          await replaceDealRegistration(
            editingRegistration.id,
            payload,
          );

        setRegistrations(
          (current) =>
            current.map(
              (registration) =>
                registration.id ===
                updated.id
                  ? updated
                  : registration,
            ),
        );
      } else {
        const created =
          await createDealRegistration(
            payload,
          );

        setRegistrations(
          (current) => [
            created,
            ...current,
          ],
        );
      }

      setShowForm(false);
      setEditingRegistration(
        null,
      );
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

  async function handleDeleteRegistration(
    registration:
      PartnerDealRegistration,
  ): Promise<void> {
    const confirmed =
      await confirm(
        `Delete deal registration "${registration.registration_reference}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDealRegistration(
        registration.id,
      );

      setRegistrations(
        (current) =>
          current.filter(
            (record) =>
              record.id !==
              registration.id,
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

  function openCreateForm(): void {
    setEditingRegistration(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    registration:
      PartnerDealRegistration,
  ): void {
    setEditingRegistration(
      registration,
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
      title="Deal Registrations"
      description="Register Sales opportunities with strategic partners and track registration incentives."
    >
      <div className="space-y-6">
        {/* ================================================= */}
        {/* KPI CARDS */}
        {/* ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Registrations"
            value={registrations.length.toLocaleString(
              "en-US",
            )}
            description="All partner deal registrations"
            icon={BriefcaseBusiness}
            variant="blue"
          />

          <StatCard
            title="Approved"
            value={approvedCount.toLocaleString(
              "en-US",
            )}
            description="Partner registrations approved"
            icon={BadgeCheck}
            variant="indigo"
          />

          <StatCard
            title="Pending"
            value={pendingCount.toLocaleString(
              "en-US",
            )}
            description="Registrations awaiting partner decision"
            icon={CalendarDays}
            variant="cyan"
          />

          <StatCard
            title="Expected Incentives"
            value={formatCurrency(
              totalExpectedIncentive,
            )}
            description="Combined expected partner incentives"
            icon={CircleDollarSign}
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
                  Registered Partner Deals
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  {registrations.length} registration
                  {registrations.length === 1
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
                    partners.length === 0 ||
                    opportunities.length === 0
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />

                  Register Deal
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
                opportunities.length === 0) && (
                <Alert className="mb-5 border-amber-200 bg-amber-50 text-amber-800">
                  <AlertDescription>
                    At least one active partner
                    and one Sales opportunity
                    are required before
                    registering a partner deal.
                  </AlertDescription>
                </Alert>
              )}

            {/* FILTERS */}

            <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_230px_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search reference, partner, opportunity or notes..."
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
                  All partners
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

                <option value="PENDING">
                  Pending
                </option>

                <option value="APPROVED">
                  Approved
                </option>

                <option value="REJECTED">
                  Rejected
                </option>

                <option value="EXPIRED">
                  Expired
                </option>
              </select>
            </div>

            {/* TABLE */}

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
              </div>
            ) : filteredRegistrations.length ===
              0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                <BriefcaseBusiness className="h-10 w-10 text-blue-300" />

                <p className="mt-3 font-semibold text-slate-700">
                  No deal registrations found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-blue-100">
                <table className="w-full min-w-[1450px] text-left">
                  <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">
                        Registration
                      </th>

                      <th className="px-4 py-3">
                        Partner
                      </th>

                      <th className="px-4 py-3">
                        Opportunity
                      </th>

                      <th className="px-4 py-3">
                        Registered
                      </th>

                      <th className="px-4 py-3">
                        Expiry
                      </th>

                      <th className="px-4 py-3">
                        Incentive
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
                    {filteredRegistrations.map(
                      (registration) => {
                        const partner =
                          findPartner(
                            registration.partner_id,
                          );

                        const opportunity =
                          findOpportunity(
                            registration.opportunity_id,
                          );

                        return (
                          <tr
                            key={registration.id}
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
                                      registration.registration_reference
                                    }
                                  </p>

                                  <p className="text-xs text-slate-500">
                                    Registration #
                                    {registration.id}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Handshake className="h-4 w-4 text-blue-600" />

                                <span className="font-medium text-slate-700">
                                  {partner?.name ??
                                    `Partner #${registration.partner_id}`}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm font-medium text-slate-700">
                              {opportunity
                                ?.opportunity_name ??
                                `Opportunity #${registration.opportunity_id}`}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-600">
                              {formatDate(
                                registration.registered_on,
                              )}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-600">
                              {formatDate(
                                registration.expiry_date,
                              )}
                            </td>

                            <td className="px-4 py-4 font-semibold text-emerald-700">
                              {formatCurrency(
                                registration.expected_incentive,
                                registration.currency,
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <Badge
                                className={getStatusClasses(
                                  registration.registration_status,
                                )}
                              >
                                {formatLabel(
                                  registration.registration_status,
                                )}
                              </Badge>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="View registration"
                                  onClick={() =>
                                    setViewingRegistration(
                                      registration,
                                    )
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Edit registration"
                                  onClick={() =>
                                    openEditForm(
                                      registration,
                                    )
                                  }
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  title="Delete registration"
                                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                  onClick={() =>
                                    void handleDeleteRegistration(
                                      registration,
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
        <DealRegistrationFormModal
          registration={
            editingRegistration
          }
          partners={partners}
          opportunities={
            opportunities
          }
          currentUserId={user.id}
          currentUserName={user.full_name}
          isSaving={isSaving}
          error={formError}
          onClose={() => {
            if (!isSaving) {
              setShowForm(false);

              setEditingRegistration(
                null,
              );
            }
          }}
          onSubmit={
            handleSaveRegistration
          }
        />
      )}

      {viewingRegistration && (
        <DealRegistrationDetailsModal
          registration={
            viewingRegistration
          }
          partner={findPartner(
            viewingRegistration.partner_id,
          )}
          opportunity={findOpportunity(
            viewingRegistration.opportunity_id,
          )}
          registeredByName={
            registrationUsers.find(
              (record) =>
                record.id ===
                viewingRegistration.registered_by,
            )?.full_name ?? "Unknown user"
          }
          onClose={() =>
            setViewingRegistration(
              null,
            )
          }
        />
      )}
    </DashboardLayout>
    </ProtectedRoute>
  );
}
