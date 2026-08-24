import { api } from "@/lib/api";

import type {
  AccountExpansionKpi,
  ExecutiveKpiSnapshot,
  ExecutiveFinancialSummary,
  FinancialImportResult,
  GenerateExecutiveKpiSnapshotRequest,
  PartnerInfluencedPipelineKpi,
  PipelineValuesKpi,
  RfpTurnaroundKpi,
  RevenueByPartnerKpi,
} from "@/types/executive";

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

export const EXECUTIVE_ENDPOINTS = {
  KPI_SNAPSHOTS:
    "/api/executive/kpi-snapshots",

  LATEST:
    "/api/executive/kpi-snapshots/latest",

  GENERATE:
    "/api/executive/kpi-snapshots/generate",

  FINANCIALS: "/api/executive/financials",

  KPIS: "/api/executive/kpis",
} as const;

export async function getRfpTurnaroundKpi(): Promise<RfpTurnaroundKpi> {
  const response = await api.get<RfpTurnaroundKpi>(
    `${EXECUTIVE_ENDPOINTS.KPIS}/rfp-turnaround`,
  );

  return response.data;
}

export async function getRevenueByPartnerKpi(): Promise<
  RevenueByPartnerKpi[]
> {
  const response = await api.get<RevenueByPartnerKpi[]>(
    `${EXECUTIVE_ENDPOINTS.KPIS}/revenue-by-partner`,
  );

  return response.data;
}

export async function getPipelineValuesKpi(): Promise<PipelineValuesKpi> {
  const response = await api.get<PipelineValuesKpi>(
    `${EXECUTIVE_ENDPOINTS.KPIS}/pipeline-values`,
  );

  return response.data;
}

export async function getAccountExpansionKpi(
  year?: number,
): Promise<AccountExpansionKpi> {
  const response = await api.get<AccountExpansionKpi>(
    `${EXECUTIVE_ENDPOINTS.KPIS}/account-expansion`,
    {
      params: year === undefined ? undefined : { year },
    },
  );

  return response.data;
}

export async function getPartnerInfluencedPipelineKpi(): Promise<PartnerInfluencedPipelineKpi> {
  const response = await api.get<PartnerInfluencedPipelineKpi>(
    `${EXECUTIVE_ENDPOINTS.KPIS}/partner-influenced-pipeline`,
  );

  return response.data;
}

export async function getExecutiveFinancialSummary(): Promise<ExecutiveFinancialSummary> {
  const response = await api.get<ExecutiveFinancialSummary>(
    `${EXECUTIVE_ENDPOINTS.FINANCIALS}/summary`,
  );

  return response.data;
}

export async function importExecutiveFinancialsCsv(
  file: File,
): Promise<FinancialImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<FinancialImportResult>(
    `${EXECUTIVE_ENDPOINTS.FINANCIALS}/import`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

/* ================================================= */
/* LATEST SNAPSHOT */
/* ================================================= */

export async function getLatestExecutiveKpiSnapshot(): Promise<ExecutiveKpiSnapshot> {
  const response =
    await api.get<ExecutiveKpiSnapshot>(
      EXECUTIVE_ENDPOINTS.LATEST,
    );

  return response.data;
}

/* ================================================= */
/* HISTORY */
/* ================================================= */

export async function getExecutiveKpiSnapshots(
  params: ListQueryParams = {},
): Promise<ExecutiveKpiSnapshot[]> {
  const response =
    await api.get<ExecutiveKpiSnapshot[]>(
      EXECUTIVE_ENDPOINTS.KPI_SNAPSHOTS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

/* ================================================= */
/* GET BY ID */
/* ================================================= */

export async function getExecutiveKpiSnapshotById(
  snapshotId: number,
): Promise<ExecutiveKpiSnapshot> {
  const response =
    await api.get<ExecutiveKpiSnapshot>(
      `${EXECUTIVE_ENDPOINTS.KPI_SNAPSHOTS}/${snapshotId}`,
    );

  return response.data;
}

/* ================================================= */
/* GENERATE */
/* ================================================= */

export async function generateExecutiveKpiSnapshot(
  payload: GenerateExecutiveKpiSnapshotRequest,
): Promise<ExecutiveKpiSnapshot> {
  const response =
    await api.post<ExecutiveKpiSnapshot>(
      EXECUTIVE_ENDPOINTS.GENERATE,
      payload,
    );

  return response.data;
}

/* ================================================= */
/* REGENERATE */
/* ================================================= */

export async function regenerateExecutiveKpiSnapshot(
  snapshotId: number,
): Promise<ExecutiveKpiSnapshot> {
  const response =
    await api.put<ExecutiveKpiSnapshot>(
      `${EXECUTIVE_ENDPOINTS.KPI_SNAPSHOTS}/${snapshotId}/regenerate`,
    );

  return response.data;
}

/* ================================================= */
/* DELETE */
/* ================================================= */

export async function deleteExecutiveKpiSnapshot(
  snapshotId: number,
): Promise<void> {
  await api.delete(
    `${EXECUTIVE_ENDPOINTS.KPI_SNAPSHOTS}/${snapshotId}`,
  );
}
