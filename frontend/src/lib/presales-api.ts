import { api } from "@/lib/api";

import type {
  CreateEstimationRequest,
  CreateProposalRequest,
  CreateResourceRequirementRequest,
  CreateSolutionRequest,
  Estimation,
  PatchEstimationRequest,
  PatchProposalRequest,
  PatchResourceRequirementRequest,
  PatchSolutionRequest,
  PatchPresalesTemplateRequest,
  PresalesTemplate,
  CreatePresalesTemplateRequest,
  Proposal,
  ResourceRequirement,
  Solution,
  UpdateEstimationRequest,
  UpdateProposalRequest,
  UpdateResourceRequirementRequest,
  UpdateSolutionRequest,
} from "@/types/presales";

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

export const PRESALES_ENDPOINTS = {
  SOLUTIONS: "/api/presale/solutions",

  ESTIMATIONS: "/api/presale/estimations",

  RESOURCE_REQUIREMENTS:
    "/api/presale/resource-requirements",

  PROPOSALS: "/api/presale/proposals",

  TEMPLATES: "/api/presale/templates",
};

export async function getPresalesTemplates(
  params: ListQueryParams = {},
): Promise<PresalesTemplate[]> {
  const response = await api.get<PresalesTemplate[]>(
    PRESALES_ENDPOINTS.TEMPLATES,
    { params: { skip: params.skip ?? 0, limit: params.limit ?? 100 } },
  );
  return response.data;
}

export async function getPresalesTemplateById(
  templateId: number,
): Promise<PresalesTemplate> {
  const response = await api.get<PresalesTemplate>(
    `${PRESALES_ENDPOINTS.TEMPLATES}/${templateId}`,
  );
  return response.data;
}

export async function createPresalesTemplate(
  payload: CreatePresalesTemplateRequest,
): Promise<PresalesTemplate> {
  const response = await api.post<PresalesTemplate>(
    PRESALES_ENDPOINTS.TEMPLATES,
    payload,
  );
  return response.data;
}

export async function patchPresalesTemplate(
  templateId: number,
  payload: PatchPresalesTemplateRequest,
): Promise<PresalesTemplate> {
  const response = await api.patch<PresalesTemplate>(
    `${PRESALES_ENDPOINTS.TEMPLATES}/${templateId}`,
    payload,
  );
  return response.data;
}

export async function deletePresalesTemplate(
  templateId: number,
): Promise<void> {
  await api.delete(`${PRESALES_ENDPOINTS.TEMPLATES}/${templateId}`);
}

/* ================================================= */
/* SOLUTIONS */
/* ================================================= */

export async function getSolutions(
  params: ListQueryParams = {},
): Promise<Solution[]> {
  const response = await api.get<Solution[]>(
    PRESALES_ENDPOINTS.SOLUTIONS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getSolutionById(
  solutionId: number,
): Promise<Solution> {
  const response = await api.get<Solution>(
    `${PRESALES_ENDPOINTS.SOLUTIONS}/${solutionId}`,
  );

  return response.data;
}

export async function createSolution(
  payload: CreateSolutionRequest,
): Promise<Solution> {
  const response = await api.post<Solution>(
    PRESALES_ENDPOINTS.SOLUTIONS,
    payload,
  );

  return response.data;
}

export async function replaceSolution(
  solutionId: number,
  payload: UpdateSolutionRequest,
): Promise<Solution> {
  const response = await api.put<Solution>(
    `${PRESALES_ENDPOINTS.SOLUTIONS}/${solutionId}`,
    payload,
  );

  return response.data;
}

export async function patchSolution(
  solutionId: number,
  payload: PatchSolutionRequest,
): Promise<Solution> {
  const response = await api.patch<Solution>(
    `${PRESALES_ENDPOINTS.SOLUTIONS}/${solutionId}`,
    payload,
  );

  return response.data;
}

export async function deleteSolution(
  solutionId: number,
): Promise<void> {
  await api.delete(
    `${PRESALES_ENDPOINTS.SOLUTIONS}/${solutionId}`,
  );
}

/* ================================================= */
/* ESTIMATIONS */
/* ================================================= */

export async function getEstimations(
  params: ListQueryParams = {},
): Promise<Estimation[]> {
  const response = await api.get<Estimation[]>(
    PRESALES_ENDPOINTS.ESTIMATIONS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getEstimationById(
  estimationId: number,
): Promise<Estimation> {
  const response =
    await api.get<Estimation>(
      `${PRESALES_ENDPOINTS.ESTIMATIONS}/${estimationId}`,
    );

  return response.data;
}

export async function createEstimation(
  payload: CreateEstimationRequest,
): Promise<Estimation> {
  const response =
    await api.post<Estimation>(
      PRESALES_ENDPOINTS.ESTIMATIONS,
      payload,
    );

  return response.data;
}

export async function replaceEstimation(
  estimationId: number,
  payload: UpdateEstimationRequest,
): Promise<Estimation> {
  const response =
    await api.put<Estimation>(
      `${PRESALES_ENDPOINTS.ESTIMATIONS}/${estimationId}`,
      payload,
    );

  return response.data;
}

export async function patchEstimation(
  estimationId: number,
  payload: PatchEstimationRequest,
): Promise<Estimation> {
  const response =
    await api.patch<Estimation>(
      `${PRESALES_ENDPOINTS.ESTIMATIONS}/${estimationId}`,
      payload,
    );

  return response.data;
}

export async function deleteEstimation(
  estimationId: number,
): Promise<void> {
  await api.delete(
    `${PRESALES_ENDPOINTS.ESTIMATIONS}/${estimationId}`,
  );
}

/* ================================================= */
/* ESTIMATION APPROVAL */
/* ================================================= */

export async function approveEstimation(
  estimationId: number,
  approvedBy: number,
): Promise<Estimation> {
  const response = await api.post<Estimation>(
    `${PRESALES_ENDPOINTS.ESTIMATIONS}/${estimationId}/approve`,
    {
      approved_by: approvedBy,
    },
  );

  return response.data;
}

export async function rejectEstimation(
  estimationId: number,
  approvedBy: number,
  rejectionReason: string,
): Promise<Estimation> {
  const response = await api.post<Estimation>(
    `${PRESALES_ENDPOINTS.ESTIMATIONS}/${estimationId}/reject`,
    {
      estimation_id: estimationId,
      approved_by: approvedBy,
      rejection_reason: rejectionReason,
    },
  );

  return response.data;
}

/* ================================================= */
/* RESOURCE REQUIREMENTS */
/* ================================================= */

export async function getResourceRequirements(
  params: ListQueryParams = {},
): Promise<ResourceRequirement[]> {
  const response =
    await api.get<ResourceRequirement[]>(
      PRESALES_ENDPOINTS.RESOURCE_REQUIREMENTS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getResourceRequirementById(
  requirementId: number,
): Promise<ResourceRequirement> {
  const response =
    await api.get<ResourceRequirement>(
      `${PRESALES_ENDPOINTS.RESOURCE_REQUIREMENTS}/${requirementId}`,
    );

  return response.data;
}

export async function createResourceRequirement(
  payload: CreateResourceRequirementRequest,
): Promise<ResourceRequirement> {
  const response =
    await api.post<ResourceRequirement>(
      PRESALES_ENDPOINTS.RESOURCE_REQUIREMENTS,
      payload,
    );

  return response.data;
}

export async function replaceResourceRequirement(
  requirementId: number,
  payload: UpdateResourceRequirementRequest,
): Promise<ResourceRequirement> {
  const response =
    await api.put<ResourceRequirement>(
      `${PRESALES_ENDPOINTS.RESOURCE_REQUIREMENTS}/${requirementId}`,
      payload,
    );

  return response.data;
}

export async function patchResourceRequirement(
  requirementId: number,
  payload: PatchResourceRequirementRequest,
): Promise<ResourceRequirement> {
  const response =
    await api.patch<ResourceRequirement>(
      `${PRESALES_ENDPOINTS.RESOURCE_REQUIREMENTS}/${requirementId}`,
      payload,
    );

  return response.data;
}

export async function deleteResourceRequirement(
  requirementId: number,
): Promise<void> {
  await api.delete(
    `${PRESALES_ENDPOINTS.RESOURCE_REQUIREMENTS}/${requirementId}`,
  );
}

/* ================================================= */
/* PROPOSALS */
/* ================================================= */

export async function getProposals(
  params: ListQueryParams = {},
): Promise<Proposal[]> {
  const response = await api.get<Proposal[]>(
    PRESALES_ENDPOINTS.PROPOSALS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getProposalById(
  proposalId: number,
): Promise<Proposal> {
  const response = await api.get<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}`,
  );

  return response.data;
}

export async function createProposal(
  payload: CreateProposalRequest,
): Promise<Proposal> {
  const formData = new FormData();
  formData.append("solution_id", payload.solution_id.toString());
  formData.append("proposal_title", payload.proposal_title);
  formData.append("version", payload.version);
  formData.append("proposal_status", payload.proposal_status);
  formData.append("approval_status", payload.approval_status);
  if (payload.submission_date) {
    formData.append("submission_date", payload.submission_date);
  }
  if (payload.remarks) {
    formData.append("remarks", payload.remarks);
  }
  formData.append("sow_document", payload.sow_document);
  formData.append("proposal_document", payload.proposal_document);

  const response = await api.post<Proposal>(
    PRESALES_ENDPOINTS.PROPOSALS,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

  return response.data;
}

export async function openProposalPdf(
  proposalId: number,
  documentType: "sow" | "proposal",
): Promise<void> {
  const viewer = window.open("", "_blank");
  const endpoint = documentType === "sow" ? "sow-document" : "proposal-document";
  try {
    const response = await api.get<Blob>(
      `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}/${endpoint}`,
      { responseType: "blob" },
    );
    const objectUrl = URL.createObjectURL(response.data);
    if (viewer) {
      viewer.location.href = objectUrl;
    } else {
      window.location.href = objectUrl;
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    viewer?.close();
    throw error;
  }
}

export async function uploadProposalDocuments(
  proposalId: number,
  sowDocument: File,
  proposalDocument: File,
): Promise<Proposal> {
  const formData = new FormData();
  formData.append("sow_document", sowDocument);
  formData.append("proposal_document", proposalDocument);
  const response = await api.put<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function replaceProposal(
  proposalId: number,
  payload: UpdateProposalRequest,
): Promise<Proposal> {
  const response = await api.put<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}`,
    payload,
  );

  return response.data;
}

export async function patchProposal(
  proposalId: number,
  payload: PatchProposalRequest,
): Promise<Proposal> {
  const response = await api.patch<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}`,
    payload,
  );

  return response.data;
}

export async function deleteProposal(
  proposalId: number,
): Promise<void> {
  await api.delete(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}`,
  );
}

/* Submit */

export async function submitProposal(
  proposalId: number,
): Promise<Proposal> {
  const response = await api.patch<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}/submit`,
  );

  return response.data;
}

/* Approve */

export async function approveProposal(
  proposalId: number,
  approvedBy: number,
): Promise<Proposal> {
  const response = await api.patch<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}/approve`,
    {
      approved_by: approvedBy,
    },
  );

  return response.data;
}

/* Reject */

export async function rejectProposal(
  proposalId: number,
  approvedBy: number,
  rejectionReason: string,
): Promise<Proposal> {
  const response = await api.patch<Proposal>(
    `${PRESALES_ENDPOINTS.PROPOSALS}/${proposalId}/reject`,
    {
      approved_by: approvedBy,
      rejection_reason: rejectionReason,
    },
  );

  return response.data;
}

import type {
  BlendedRateResult,
  CalculateBlendedRateRequest,
} from "@/types/presales";

export async function calculateBlendedRate(
  payload: CalculateBlendedRateRequest,
): Promise<BlendedRateResult> {
  const response = await api.post<BlendedRateResult>(
    "/api/presale/blended-rate/calculate",
    payload,
  );

  return response.data;
}

export async function getBlendedRate(
  estimationId: number,
): Promise<BlendedRateResult> {
  const response = await api.get<BlendedRateResult>(
    `/api/presale/blended-rate/${estimationId}`,
  );

  return response.data;
}

export async function deleteBlendedRate(
  estimationId: number,
): Promise<void> {
  await api.delete(
    `/api/presale/blended-rate/${estimationId}`,
  );
}
