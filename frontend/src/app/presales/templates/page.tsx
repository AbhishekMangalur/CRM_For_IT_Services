"use client";

import { useConfirm } from "@/providers/ConfirmProvider";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpenText,
  CheckCircle2,
  Edit3,
  Eye,
  FileStack,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import {
  createPresalesTemplate,
  deletePresalesTemplate,
  getPresalesTemplateById,
  getPresalesTemplates,
  patchPresalesTemplate,
} from "@/lib/presales-api";
import type {
  CreatePresalesTemplateRequest,
  PresalesTemplate,
} from "@/types/presales";

interface TemplateUser {
  id: number;
  full_name: string;
}

interface TemplateFormState {
  template_name: string;
  service_type: string;
  description: string;
  scope_content: string;
  is_active: boolean;
}

const EMPTY_FORM: TemplateFormState = {
  template_name: "",
  service_type: "",
  description: "",
  scope_content: "",
  is_active: true,
};

function getErrorMessage(error: unknown): string {
  if (!axios.isAxiosError(error)) return "An unexpected error occurred.";
  if (!error.response) return "Unable to connect to the backend.";
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item?.msg).filter(Boolean).join(", ");
  }
  return "The request could not be completed.";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function TemplateFormModal({
  template,
  isSaving,
  error,
  onClose,
  onSubmit,
}: {
  template: PresalesTemplate | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: CreatePresalesTemplateRequest) => Promise<void>;
}) {
  const [form, setForm] = useState<TemplateFormState>(() =>
    template
      ? {
          template_name: template.template_name,
          service_type: template.service_type,
          description: template.description ?? "",
          scope_content: template.scope_content,
          is_active: template.is_active,
        }
      : EMPTY_FORM,
  );

  const isInvalid =
    form.template_name.trim().length < 2 ||
    form.service_type.trim().length < 2 ||
    form.scope_content.trim().length < 10;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isInvalid) return;
    await onSubmit({
      template_name: form.template_name.trim(),
      service_type: form.service_type.trim(),
      description: form.description.trim() || null,
      scope_content: form.scope_content.trim(),
      is_active: form.is_active,
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-blue-100 bg-white/95 p-6 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {template ? "Edit Template" : "Create Template"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Maintain reusable Presales scope content.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} disabled={isSaving}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <Input
                id="template_name"
                value={form.template_name}
                onChange={(event) => setForm((current) => ({ ...current, template_name: event.target.value }))}
                placeholder="Enter template name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_type">Service Type *</Label>
              <Input
                id="service_type"
                value={form.service_type}
                onChange={(event) => setForm((current) => ({ ...current, service_type: event.target.value }))}
                placeholder="Enter service type"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe when this template should be used..."
                rows={3}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="scope_content">Scope Content *</Label>
              <Textarea
                id="scope_content"
                value={form.scope_content}
                onChange={(event) => setForm((current) => ({ ...current, scope_content: event.target.value }))}
                placeholder="Enter reusable scope activities, deliverables, and boundaries..."
                rows={8}
                required
              />
              <p className="text-xs text-slate-500">Minimum 10 characters.</p>
            </div>
            <label className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4 md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-700"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">Active template</span>
                <span className="block text-xs text-slate-500">Inactive templates remain available in the library but are marked unavailable.</span>
              </span>
            </label>
            {error && (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-blue-100 bg-white/95 px-6 py-4 backdrop-blur">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" className="bg-blue-700 hover:bg-blue-800" disabled={isInvalid || isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {template ? "Save Changes" : "Create Template"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TemplateDetailsModal({
  template,
  creatorName,
  onClose,
}: {
  template: PresalesTemplate;
  creatorName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-blue-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-blue-100 p-6">
          <div>
            <Badge className={template.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>
              {template.is_active ? "ACTIVE" : "INACTIVE"}
            </Badge>
            <h2 className="mt-3 text-xl font-bold text-slate-900">{template.template_name}</h2>
            <p className="mt-1 text-sm text-blue-700">{template.service_type}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>
        <div className="space-y-5 p-6">
          <section>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{template.description || "No description provided."}</p>
          </section>
          <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Scope Content</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{template.scope_content}</p>
          </section>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4"><span className="text-slate-500">Created by</span><strong className="mt-1 block">{creatorName}</strong></div>
            <div className="rounded-xl bg-slate-50 p-4"><span className="text-slate-500">Created at</span><strong className="mt-1 block">{formatDate(template.created_at)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplateLibraryPage() {
  const confirm = useConfirm();
  const [templates, setTemplates] = useState<PresalesTemplate[]>([]);
  const [users, setUsers] = useState<TemplateUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PresalesTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<PresalesTemplate | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [templateRecords, userResponse] = await Promise.all([
        getPresalesTemplates({ skip: 0, limit: 100 }),
        api.get<TemplateUser[]>("/api/users"),
      ]);
      setTemplates(templateRecords);
      setUsers(userResponse.data);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  const creatorNames = useMemo(
    () => new Map(users.map((user) => [user.id, user.full_name])),
    [users],
  );

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templates.filter((template) => {
      const matchesSearch =
        !query ||
        template.template_name.toLowerCase().includes(query) ||
        template.service_type.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.scope_content.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? template.is_active : !template.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, templates]);

  async function handleSave(payload: CreatePresalesTemplateRequest) {
    setIsSaving(true);
    setFormError("");
    setSuccess("");
    try {
      if (editingTemplate) {
        await patchPresalesTemplate(editingTemplate.id, payload);
        setSuccess("Template updated successfully.");
      } else {
        await createPresalesTemplate(payload);
        setSuccess("Template created successfully.");
      }
      setShowForm(false);
      setEditingTemplate(null);
      await loadData();
    } catch (requestError) {
      setFormError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(template: PresalesTemplate) {
    if (!await confirm(`Delete template "${template.template_name}"?`)) return;
    setError("");
    setSuccess("");
    try {
      await deletePresalesTemplate(template.id);
      setSuccess("Template deleted successfully.");
      await loadData();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function handleView(templateId: number) {
    setError("");
    try {
      setViewingTemplate(
        await getPresalesTemplateById(templateId),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  const activeCount = templates.filter((template) => template.is_active).length;

  return (
    <ProtectedRoute allowedRole="PRESALES">
      <DashboardLayout title="Template Library" description="Create and maintain reusable Presales scope templates.">
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total Templates" value={templates.length.toLocaleString("en-US")} description="Reusable templates in the library" icon={FileStack} variant="blue" />
            <StatCard title="Active Templates" value={activeCount.toLocaleString("en-US")} description="Available for future reuse" icon={CheckCircle2} variant="emerald" />
            <StatCard title="Service Types" value={new Set(templates.map((template) => template.service_type)).size.toLocaleString("en-US")} description="Covered service categories" icon={BookOpenText} variant="indigo" />
          </section>

          <Card className="rounded-2xl border-blue-100 bg-white/90 shadow-lg shadow-blue-100/40">
            <CardHeader className="border-b border-blue-50">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <CardTitle>Template Library</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">{templates.length} template{templates.length === 1 ? "" : "s"} loaded</p>
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => void loadData()} disabled={isLoading}>
                    <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />Refresh
                  </Button>
                  <Button type="button" className="bg-blue-700 hover:bg-blue-800" onClick={() => { setEditingTemplate(null); setFormError(""); setShowForm(true); }}>
                    <Plus className="mr-2 h-4 w-4" />Create Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {success && <Alert className="mb-5 border-emerald-200 bg-emerald-50 text-emerald-800"><AlertDescription>{success}</AlertDescription></Alert>}
              {error && <Alert variant="destructive" className="mb-5"><AlertDescription>{error}</AlertDescription></Alert>}
              <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_180px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates, service types, or scope..." className="pl-10" />
                </div>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-input bg-white px-3 text-sm">
                  <option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {isLoading ? (
                <div className="flex min-h-52 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading templates...</div>
              ) : filteredTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/30 py-14 text-center">
                  <BookOpenText className="mx-auto h-9 w-9 text-blue-400" />
                  <p className="mt-3 font-semibold text-slate-700">No templates found</p>
                  <p className="mt-1 text-sm text-slate-500">Create a reusable scope template or adjust your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-blue-100">
                  <table className="w-full min-w-[1200px] text-left">
                    <thead className="bg-blue-50/80 text-xs uppercase tracking-wide text-slate-500"><tr>
                      <th className="px-4 py-3">Template Name</th><th className="px-4 py-3">Service Type</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Scope Content</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created By</th><th className="px-4 py-3">Created At</th><th className="px-4 py-3 text-right">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-blue-50">
                      {filteredTemplates.map((template) => (
                        <tr key={template.id} className="hover:bg-blue-50/30">
                          <td className="px-4 py-4 font-semibold text-slate-800">{template.template_name}</td>
                          <td className="px-4 py-4 text-sm text-blue-700">{template.service_type}</td>
                          <td className="max-w-56 px-4 py-4 text-sm text-slate-600"><p className="line-clamp-2">{template.description || "No description"}</p></td>
                          <td className="max-w-64 px-4 py-4 text-sm text-slate-600"><p className="line-clamp-2">{template.scope_content}</p></td>
                          <td className="px-4 py-4"><Badge className={template.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>{template.is_active ? "ACTIVE" : "INACTIVE"}</Badge></td>
                          <td className="px-4 py-4 text-sm text-slate-600">{template.created_by ? creatorNames.get(template.created_by) ?? "Unknown user" : "System"}</td>
                          <td className="px-4 py-4 text-sm text-slate-600">{formatDate(template.created_at)}</td>
                          <td className="px-4 py-4"><div className="flex justify-end gap-2">
                            <Button type="button" size="icon" variant="outline" title="View template" onClick={() => void handleView(template.id)}><Eye className="h-4 w-4" /></Button>
                            <Button type="button" size="icon" variant="outline" title="Edit template" onClick={() => { setEditingTemplate(template); setFormError(""); setShowForm(true); }}><Edit3 className="h-4 w-4" /></Button>
                            <Button type="button" size="icon" variant="outline" title="Delete template" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => void handleDelete(template)}><Trash2 className="h-4 w-4" /></Button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {showForm && <TemplateFormModal template={editingTemplate} isSaving={isSaving} error={formError} onClose={() => { if (!isSaving) { setShowForm(false); setEditingTemplate(null); } }} onSubmit={handleSave} />}
        {viewingTemplate && <TemplateDetailsModal template={viewingTemplate} creatorName={viewingTemplate.created_by ? creatorNames.get(viewingTemplate.created_by) ?? "Unknown user" : "System"} onClose={() => setViewingTemplate(null)} />}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
