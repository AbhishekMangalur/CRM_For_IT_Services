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
  Building2,
  Edit3,
  Eye,
  Globe2,
  Handshake,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
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

import {
  createAlliancePartner,
  deleteAlliancePartner,
  getAlliancePartners,
  replaceAlliancePartner,
} from "@/lib/alliance-api";

import type {
  AlliancePartner,
  CreateAlliancePartnerRequest,
  PartnerTier,
  PartnerType,
} from "@/types/alliance";
import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

/* ================================================= */
/* FORM */
/* ================================================= */

interface PartnerFormState {
  name: string;
  partner_type: PartnerType;
  partner_program: string;
  partner_tier: PartnerTier;

  contact_name: string;
  contact_email: string;
  contact_phone: string;

  website: string;

  is_active: boolean;

  notes: string;
}

const EMPTY_FORM: PartnerFormState = {
  name: "",
  partner_type: "HYPERSCALER",
  partner_program: "",
  partner_tier: "SELECT",

  contact_name: "",
  contact_email: "",
  contact_phone: "",

  website: "",

  is_active: true,

  notes: "",
};

/* ================================================= */
/* HELPERS */
/* ================================================= */

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
    typeof detail.message === "string"
  ) {
    return detail.message;
  }

  return "The request could not be completed.";
}

function getPartnerTypeClasses(
  type: string,
): string {
  switch (type.toUpperCase()) {
    case "HYPERSCALER":
      return "bg-blue-100 text-blue-700";

    case "ISV":
      return "bg-indigo-100 text-indigo-700";

    case "CONSULTING":
      return "bg-cyan-100 text-cyan-700";

    case "RESELLER":
      return "bg-violet-100 text-violet-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPartnerTierClasses(
  tier: string,
): string {
  switch (tier.toUpperCase()) {
    case "PREMIER":
      return "bg-violet-100 text-violet-700";

    case "ADVANCED":
      return "bg-indigo-100 text-indigo-700";

    case "SELECT":
      return "bg-blue-100 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function partnerToForm(
  partner: AlliancePartner,
): PartnerFormState {
  return {
    name: partner.name,

    partner_type:
      partner.partner_type,

    partner_program:
      partner.partner_program,

    partner_tier:
      partner.partner_tier,

    contact_name:
      partner.contact_name,

    contact_email:
      partner.contact_email,

    contact_phone:
      partner.contact_phone,

    website:
      partner.website,

    is_active:
      partner.is_active,

    notes:
      partner.notes ?? "",
  };
}

function formToPayload(
  form: PartnerFormState,
): CreateAlliancePartnerRequest {
  return {
    name:
      form.name.trim(),

    partner_type:
      form.partner_type,

    partner_program:
      form.partner_program.trim(),

    partner_tier:
      form.partner_tier,

    contact_name:
      form.contact_name.trim(),

    contact_email:
      form.contact_email.trim(),

    contact_phone:
      form.contact_phone.trim(),

    website:
      form.website.trim(),

    is_active:
      form.is_active,

    notes:
      form.notes.trim() || null,
  };
}

/* ================================================= */
/* FORM MODAL */
/* ================================================= */

interface PartnerFormModalProps {
  partner: AlliancePartner | null;

  isSaving: boolean;

  error: string;

  onClose: () => void;

  onSubmit: (
    payload: CreateAlliancePartnerRequest,
  ) => Promise<void>;
}

function PartnerFormModal({
  partner,
  isSaving,
  error,
  onClose,
  onSubmit,
}: PartnerFormModalProps) {
  const [form, setForm] =
    useState<PartnerFormState>(
      partner
        ? partnerToForm(partner)
        : EMPTY_FORM,
    );

  function handleChange(
    event:
      | ChangeEvent<HTMLInputElement>
      | ChangeEvent<HTMLSelectElement>
      | ChangeEvent<HTMLTextAreaElement>,
  ): void {
    const target = event.target;

    if (
      target instanceof HTMLInputElement &&
      target.type === "checkbox"
    ) {
      setForm((previous) => ({
        ...previous,
        [target.name]: target.checked,
      }));

      return;
    }

    setForm((previous) => ({
      ...previous,
      [target.name]: target.value,
    }));
  }

  const isInvalid =
    !form.name.trim() ||
    !form.partner_program.trim() ||
    !form.contact_name.trim() ||
    !form.contact_email.trim();

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
              {partner
                ? "Edit Partner"
                : "Create Partner"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Maintain partner organization,
              program, tier and contact information.
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

            {/* Partner Name */}

            <div className="space-y-2">
              <Label htmlFor="name">
                Partner name *
              </Label>

              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="AWS"
                required
              />
            </div>

            {/* Partner Type */}

            <div className="space-y-2">
              <Label htmlFor="partner_type">
                Partner type
              </Label>

              <select
                id="partner_type"
                name="partner_type"
                value={form.partner_type}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="HYPERSCALER">
                  Hyperscaler
                </option>

                <option value="ISV">
                  ISV
                </option>

                <option value="CONSULTING">
                  Consulting
                </option>

                <option value="RESELLER">
                  Reseller
                </option>
              </select>
            </div>

            {/* Partner Program */}

            <div className="space-y-2">
              <Label htmlFor="partner_program">
                Partner program *
              </Label>

              <Input
                id="partner_program"
                name="partner_program"
                value={
                  form.partner_program
                }
                onChange={handleChange}
                placeholder="AWS Partner Network"
                required
              />
            </div>

            {/* Tier */}

            <div className="space-y-2">
              <Label htmlFor="partner_tier">
                Partner tier
              </Label>

              <select
                id="partner_tier"
                name="partner_tier"
                value={
                  form.partner_tier
                }
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="REGISTERED">
                  Registered
                </option>

                <option value="SELECT">
                  Select
                </option>

                <option value="ADVANCED">
                  Advanced
                </option>

                <option value="PREMIER">
                  Premier
                </option>
              </select>
            </div>

            {/* Contact Name */}

            <div className="space-y-2">
              <Label htmlFor="contact_name">
                Contact name *
              </Label>

              <Input
                id="contact_name"
                name="contact_name"
                value={
                  form.contact_name
                }
                onChange={handleChange}
                placeholder="Enter contact name"
                required
              />
            </div>

            {/* Email */}

            <div className="space-y-2">
              <Label htmlFor="contact_email">
                Contact email *
              </Label>

              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={
                  form.contact_email
                }
                onChange={handleChange}
                placeholder="name@example.com"
                required
              />
            </div>

            {/* Phone */}

            <div className="space-y-2">
              <Label htmlFor="contact_phone">
                Contact phone
              </Label>

              <Input
                id="contact_phone"
                name="contact_phone"
                value={
                  form.contact_phone
                }
                onChange={handleChange}
                placeholder="9876543210"
              />
            </div>

            {/* Website */}

            <div className="space-y-2">
              <Label htmlFor="website">
                Website
              </Label>

              <Input
                id="website"
                name="website"
                type="url"
                value={form.website}
                onChange={handleChange}
                placeholder="https://aws.amazon.com"
              />
            </div>

            {/* Active */}

            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 md:col-span-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleChange}
                className="h-4 w-4"
              />

              <Label
                htmlFor="is_active"
                className="cursor-pointer"
              >
                Partner is active
              </Label>
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
                placeholder="Strategic cloud partner..."
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
                isSaving || isInvalid
              }
            >
              {isSaving && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}

              {partner
                ? "Save changes"
                : "Create partner"}
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

interface PartnerDetailsModalProps {
  partner: AlliancePartner;
  onClose: () => void;
}

function PartnerDetailsModal({
  partner,
  onClose,
}: PartnerDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {partner.name}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Alliance Partner #{partner.id}
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
              Partner Type
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatLabel(
                partner.partner_type,
              )}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-sm text-slate-500">
              Partner Tier
            </p>

            <Badge
              className={`mt-3 ${getPartnerTierClasses(
                partner.partner_tier,
              )}`}
            >
              {formatLabel(
                partner.partner_tier,
              )}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4 sm:col-span-2">
            <p className="text-xs text-slate-500">
              Partner Program
            </p>

            <p className="mt-1 font-semibold text-slate-800">
              {partner.partner_program}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-blue-600" />

              <p className="text-xs text-slate-500">
                Contact
              </p>
            </div>

            <p className="mt-2 font-semibold">
              {partner.contact_name}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-indigo-600" />

              <p className="text-xs text-slate-500">
                Email
              </p>
            </div>

            <p className="mt-2 break-all font-semibold">
              {partner.contact_email}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-cyan-600" />

              <p className="text-xs text-slate-500">
                Phone
              </p>
            </div>

            <p className="mt-2 font-semibold">
              {partner.contact_phone ||
                "Not added"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-600" />

              <p className="text-xs text-slate-500">
                Website
              </p>
            </div>

            {partner.website ? (
              <a
                href={partner.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all font-semibold text-blue-700 hover:underline"
              >
                {partner.website}
              </a>
            ) : (
              <p className="mt-2 font-semibold">
                Not added
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Status
            </p>

            <Badge
              className={
                partner.is_active
                  ? "mt-2 bg-emerald-100 text-emerald-700"
                  : "mt-2 bg-slate-100 text-slate-700"
              }
            >
              {partner.is_active
                ? "Active"
                : "Inactive"}
            </Badge>
          </div>

          <div className="rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-slate-500">
              Last Updated
            </p>

            <p className="mt-1 font-semibold">
              {formatDate(
                partner.updated_at,
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
            <p className="font-semibold text-slate-800">
              Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {partner.notes ||
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

export default function AlliancePartnersPage() {
  const confirm = useConfirm();
  const [partners, setPartners] =
    useState<AlliancePartner[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState("ALL");

  const [
    tierFilter,
    setTierFilter,
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

  const [formError, setFormError] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [
    editingPartner,
    setEditingPartner,
  ] = useState<AlliancePartner | null>(
    null,
  );

  const [
    viewingPartner,
    setViewingPartner,
  ] = useState<AlliancePartner | null>(
    null,
  );

  /* ---------------- LOAD ---------------- */

  const loadPartners =
    useCallback(async (): Promise<void> => {
      setIsLoading(true);
      setError("");

      try {
        const records =
          await getAlliancePartners({
            skip: 0,
            limit: 100,
          });

        setPartners(records);
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
    void loadPartners();
  }, [loadPartners]);

  /* ---------------- FILTER ---------------- */

  const filteredPartners =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return partners.filter(
        (partner) => {
          const matchesSearch =
            !normalizedSearch ||
            partner.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            partner.partner_program
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            partner.contact_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            partner.contact_email
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            partner.notes
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesType =
            typeFilter === "ALL" ||
            partner.partner_type ===
              typeFilter;

          const matchesTier =
            tierFilter === "ALL" ||
            partner.partner_tier ===
              tierFilter;

          const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter ===
              "ACTIVE" &&
              partner.is_active) ||
            (statusFilter ===
              "INACTIVE" &&
              !partner.is_active);

          return (
            matchesSearch &&
            matchesType &&
            matchesTier &&
            matchesStatus
          );
        },
      );
    }, [
      partners,
      search,
      statusFilter,
      tierFilter,
      typeFilter,
    ]);

  /* ---------------- KPI ---------------- */

  const activePartners =
    partners.filter(
      (partner) =>
        partner.is_active,
    ).length;

  const hyperscalers =
    partners.filter(
      (partner) =>
        partner.partner_type ===
        "HYPERSCALER",
    ).length;

  const advancedPartners =
    partners.filter(
      (partner) =>
        ["ADVANCED", "PREMIER"].includes(
          partner.partner_tier,
        ),
    ).length;

  /* ---------------- SAVE ---------------- */

  async function handleSavePartner(
    payload: CreateAlliancePartnerRequest,
  ): Promise<void> {
    setIsSaving(true);
    setFormError("");

    try {
      if (editingPartner) {
        const updated =
          await replaceAlliancePartner(
            editingPartner.id,
            payload,
          );

        setPartners((current) =>
          current.map((partner) =>
            partner.id === updated.id
              ? updated
              : partner,
          ),
        );
      } else {
        const created =
          await createAlliancePartner(
            payload,
          );

        setPartners((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);
      setEditingPartner(null);
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

  async function handleDeletePartner(
    partner: AlliancePartner,
  ): Promise<void> {
    const confirmed =
      await confirm(
        `Delete partner "${partner.name}"?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAlliancePartner(
        partner.id,
      );

      setPartners((current) =>
        current.filter(
          (record) =>
            record.id !== partner.id,
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
    setEditingPartner(null);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(
    partner: AlliancePartner,
  ): void {
    setEditingPartner(partner);
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
      title="Alliance Partners"
      description="Manage strategic partner organizations, programs, tiers and contacts."
    >
      <div className="space-y-6">

        {/* ================================================= */}
        {/* KPI CARDS */}
        {/* ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Partners"
            value={partners.length.toLocaleString(
              "en-US",
            )}
            description="All alliance partners"
            icon={Handshake}
            variant="blue"
          />

          <StatCard
            title="Active Partners"
            value={activePartners.toLocaleString(
              "en-US",
            )}
            description="Partners currently active"
            icon={ShieldCheck}
            variant="indigo"
          />

          <StatCard
            title="Hyperscalers"
            value={hyperscalers.toLocaleString(
              "en-US",
            )}
            description="Cloud hyperscaler partners"
            icon={Building2}
            variant="cyan"
          />

          <StatCard
            title="Advanced / Premier"
            value={advancedPartners.toLocaleString(
              "en-US",
            )}
            description="Higher-tier strategic partnerships"
            icon={Handshake}
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
                  Partner Directory
                </CardTitle>

                <p className="mt-1 text-sm text-slate-500">
                  {partners.length} partner
                  {partners.length === 1
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
                    void loadPartners()
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

                  Add Partner
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

            {/* FILTERS */}

            <div className="mb-5 grid gap-3 xl:grid-cols-[1fr_210px_210px_180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Search partner, program, contact, email or notes..."
                  className="pl-10"
                />
              </div>

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
                  All partner types
                </option>

                <option value="HYPERSCALER">
                  Hyperscaler
                </option>

                <option value="ISV">
                  ISV
                </option>

                <option value="CONSULTING">
                  Consulting
                </option>

                <option value="RESELLER">
                  Reseller
                </option>
              </select>

              <select
                value={tierFilter}
                onChange={(event) =>
                  setTierFilter(
                    event.target.value,
                  )
                }
                className="h-10 rounded-md border border-input bg-white px-3 text-sm"
              >
                <option value="ALL">
                  All partner tiers
                </option>

                <option value="REGISTERED">
                  Registered
                </option>

                <option value="SELECT">
                  Select
                </option>

                <option value="ADVANCED">
                  Advanced
                </option>

                <option value="PREMIER">
                  Premier
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
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>
            </div>

            {/* TABLE */}

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-700" />
              </div>
            ) : filteredPartners.length ===
              0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/30 text-center">
                <Handshake className="h-10 w-10 text-blue-300" />

                <p className="mt-3 font-semibold text-slate-700">
                  No partners found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add a partner or change the
                  current filters.
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
                        Type
                      </th>

                      <th className="px-4 py-3">
                        Program
                      </th>

                      <th className="px-4 py-3">
                        Tier
                      </th>

                      <th className="px-4 py-3">
                        Contact
                      </th>

                      <th className="px-4 py-3">
                        Phone
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
                    {filteredPartners.map(
                      (partner) => (
                        <tr
                          key={partner.id}
                          className="bg-white transition hover:bg-blue-50/50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-700">
                                <Handshake className="h-4 w-4" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {partner.name}
                                </p>

                                {partner.website && (
                                  <a
                                    href={
                                      partner.website
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 block max-w-48 truncate text-xs text-blue-600 hover:underline"
                                  >
                                    {
                                      partner.website
                                    }
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              className={getPartnerTypeClasses(
                                partner.partner_type,
                              )}
                            >
                              {formatLabel(
                                partner.partner_type,
                              )}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            <p className="max-w-64 truncate text-sm font-medium text-slate-700">
                              {
                                partner.partner_program
                              }
                            </p>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              className={getPartnerTierClasses(
                                partner.partner_tier,
                              )}
                            >
                              {formatLabel(
                                partner.partner_tier,
                              )}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {
                                  partner.contact_name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  partner.contact_email
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {partner.contact_phone ||
                              "—"}
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              className={
                                partner.is_active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-700"
                              }
                            >
                              {partner.is_active
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {formatDate(
                              partner.updated_at,
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="View partner"
                                onClick={() =>
                                  setViewingPartner(
                                    partner,
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Edit partner"
                                onClick={() =>
                                  openEditForm(
                                    partner,
                                  )
                                }
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>

                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                title="Delete partner"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() =>
                                  void handleDeletePartner(
                                    partner,
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
        <PartnerFormModal
          partner={editingPartner}
          isSaving={isSaving}
          error={formError}
          onClose={() => {
            if (!isSaving) {
              setShowForm(false);
              setEditingPartner(null);
            }
          }}
          onSubmit={handleSavePartner}
        />
      )}

      {viewingPartner && (
        <PartnerDetailsModal
          partner={viewingPartner}
          onClose={() =>
            setViewingPartner(null)
          }
        />
      )}
    </DashboardLayout>
    </ProtectedRoute>
  );
}
