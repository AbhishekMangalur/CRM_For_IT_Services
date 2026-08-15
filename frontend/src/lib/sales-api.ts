import { api } from "@/lib/api";

import type {
  CreateActivityRequest,
  CreateLeadRequest,
  CreateOpportunityRequest,
  PatchActivityRequest,
  PatchLeadRequest,
  PatchOpportunityRequest,
  SalesActivity,
  SalesLead,
  SalesOpportunity,
  UpdateActivityRequest,
  UpdateLeadRequest,
  UpdateOpportunityRequest,
} from "@/types/sales";

const SALES_ENDPOINTS = {
  LEADS: "/api/sales/leads",
  OPPORTUNITIES: "/api/sales/opportunities",
  ACTIVITIES: "/api/sales/activities",
} as const;

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

/* -------------------- Leads -------------------- */

export async function getSalesLeads(
  params: ListQueryParams = {},
): Promise<SalesLead[]> {
  const response = await api.get<SalesLead[]>(
    SALES_ENDPOINTS.LEADS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getSalesLeadById(
  leadId: number,
): Promise<SalesLead> {
  const response = await api.get<SalesLead>(
    `${SALES_ENDPOINTS.LEADS}/${leadId}`,
  );

  return response.data;
}

export async function createSalesLead(
  payload: CreateLeadRequest,
): Promise<SalesLead> {
  const response = await api.post<SalesLead>(
    SALES_ENDPOINTS.LEADS,
    payload,
  );

  return response.data;
}

export async function replaceSalesLead(
  leadId: number,
  payload: UpdateLeadRequest,
): Promise<SalesLead> {
  const response = await api.put<SalesLead>(
    `${SALES_ENDPOINTS.LEADS}/${leadId}`,
    payload,
  );

  return response.data;
}

export async function patchSalesLead(
  leadId: number,
  payload: PatchLeadRequest,
): Promise<SalesLead> {
  const response = await api.patch<SalesLead>(
    `${SALES_ENDPOINTS.LEADS}/${leadId}`,
    payload,
  );

  return response.data;
}

export async function deleteSalesLead(
  leadId: number,
): Promise<void> {
  await api.delete(
    `${SALES_ENDPOINTS.LEADS}/${leadId}`,
  );
}

/* ---------------- Opportunities ---------------- */

export async function getSalesOpportunities(
  params: ListQueryParams = {},
): Promise<SalesOpportunity[]> {
  const response = await api.get<
    SalesOpportunity[]
  >(SALES_ENDPOINTS.OPPORTUNITIES, {
    params: {
      skip: params.skip ?? 0,
      limit: params.limit ?? 100,
    },
  });

  return response.data;
}

export async function getSalesOpportunityById(
  opportunityId: number,
): Promise<SalesOpportunity> {
  const response = await api.get<SalesOpportunity>(
    `${SALES_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
  );

  return response.data;
}

export async function createSalesOpportunity(
  payload: CreateOpportunityRequest,
): Promise<SalesOpportunity> {
  const response = await api.post<SalesOpportunity>(
    SALES_ENDPOINTS.OPPORTUNITIES,
    payload,
  );

  return response.data;
}

export async function replaceSalesOpportunity(
  opportunityId: number,
  payload: UpdateOpportunityRequest,
): Promise<SalesOpportunity> {
  const response = await api.put<SalesOpportunity>(
    `${SALES_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
    payload,
  );

  return response.data;
}

export async function patchSalesOpportunity(
  opportunityId: number,
  payload: PatchOpportunityRequest,
): Promise<SalesOpportunity> {
  const response = await api.patch<SalesOpportunity>(
    `${SALES_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
    payload,
  );

  return response.data;
}

export async function deleteSalesOpportunity(
  opportunityId: number,
): Promise<void> {
  await api.delete(
    `${SALES_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
  );
}

/* ----------------- Activities ------------------ */

export async function getSalesActivities(
  params: ListQueryParams = {},
): Promise<SalesActivity[]> {
  const response = await api.get<SalesActivity[]>(
    SALES_ENDPOINTS.ACTIVITIES,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getSalesActivityById(
  activityId: number,
): Promise<SalesActivity> {
  const response = await api.get<SalesActivity>(
    `${SALES_ENDPOINTS.ACTIVITIES}/${activityId}`,
  );

  return response.data;
}

export async function createSalesActivity(
  payload: CreateActivityRequest,
): Promise<SalesActivity> {
  const response = await api.post<SalesActivity>(
    SALES_ENDPOINTS.ACTIVITIES,
    payload,
  );

  return response.data;
}

export async function replaceSalesActivity(
  activityId: number,
  payload: UpdateActivityRequest,
): Promise<SalesActivity> {
  const response = await api.put<SalesActivity>(
    `${SALES_ENDPOINTS.ACTIVITIES}/${activityId}`,
    payload,
  );

  return response.data;
}

export async function patchSalesActivity(
  activityId: number,
  payload: PatchActivityRequest,
): Promise<SalesActivity> {
  const response = await api.patch<SalesActivity>(
    `${SALES_ENDPOINTS.ACTIVITIES}/${activityId}`,
    payload,
  );

  return response.data;
}

export async function deleteSalesActivity(
  activityId: number,
): Promise<void> {
  await api.delete(
    `${SALES_ENDPOINTS.ACTIVITIES}/${activityId}`,
  );
}

/* ------------------ Dashboard ------------------ */

export async function getSalesDashboardResources(): Promise<{
  leads: SalesLead[];
  opportunities: SalesOpportunity[];
  activities: SalesActivity[];
}> {
  const [leads, opportunities, activities] =
    await Promise.all([
      getSalesLeads(),
      getSalesOpportunities(),
      getSalesActivities(),
    ]);

  return {
    leads,
    opportunities,
    activities,
  };
}