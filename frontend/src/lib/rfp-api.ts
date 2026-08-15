import { api } from "@/lib/api";

import type {
  BidDecision,
  BidEvaluation,
  CreateBidEvaluationRequest,
  CreateRfpAssignmentRequest,
  CreateRfpRequest,
  PatchBidEvaluationRequest,
  PatchRfpAssignmentRequest,
  PatchRfpRequest,
  Rfp,
  RfpAssignment,
  RfpStatus,
  UpdateBidEvaluationRequest,
  UpdateRfpAssignmentRequest,
  UpdateRfpRequest,
} from "@/types/rfp";

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

export const RFP_ENDPOINTS = {
  RFPS:
    "/api/rfp/rfps",

  EVALUATIONS:
    "/api/rfp/bid-evaluations",

  ASSIGNMENTS:
    "/api/rfp/assignments",
} as const;


/* ================================================= */
/* RFP */
/* ================================================= */

export async function getRfps(
  params: ListQueryParams = {},
): Promise<Rfp[]> {
  const response =
    await api.get<Rfp[]>(
      RFP_ENDPOINTS.RFPS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getRfpById(
  rfpId: number,
): Promise<Rfp> {
  const response =
    await api.get<Rfp>(
      `${RFP_ENDPOINTS.RFPS}/${rfpId}`,
    );

  return response.data;
}

export async function createRfp(
  payload: CreateRfpRequest,
): Promise<Rfp> {
  const response =
    await api.post<Rfp>(
      RFP_ENDPOINTS.RFPS,
      payload,
    );

  return response.data;
}

export async function replaceRfp(
  rfpId: number,
  payload: UpdateRfpRequest,
): Promise<Rfp> {
  const response =
    await api.put<Rfp>(
      `${RFP_ENDPOINTS.RFPS}/${rfpId}`,
      payload,
    );

  return response.data;
}

export async function patchRfp(
  rfpId: number,
  payload: PatchRfpRequest,
): Promise<Rfp> {
  const response =
    await api.patch<Rfp>(
      `${RFP_ENDPOINTS.RFPS}/${rfpId}`,
      payload,
    );

  return response.data;
}

export async function deleteRfp(
  rfpId: number,
): Promise<void> {
  await api.delete(
    `${RFP_ENDPOINTS.RFPS}/${rfpId}`,
  );
}

export async function getRfpsByStatus(
  status: RfpStatus,
): Promise<Rfp[]> {
  const response =
    await api.get<Rfp[]>(
      `${RFP_ENDPOINTS.RFPS}/status/${status}`,
    );

  return response.data;
}

export async function getRfpsByBidDecision(
  decision: BidDecision,
): Promise<Rfp[]> {
  const response =
    await api.get<Rfp[]>(
      `${RFP_ENDPOINTS.RFPS}/bid-decision/${decision}`,
    );

  return response.data;
}


/* ================================================= */
/* BID EVALUATIONS */
/* ================================================= */

export async function getBidEvaluations(
  params: ListQueryParams = {},
): Promise<BidEvaluation[]> {
  const response =
    await api.get<BidEvaluation[]>(
      RFP_ENDPOINTS.EVALUATIONS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getBidEvaluationById(
  evaluationId: number,
): Promise<BidEvaluation> {
  const response =
    await api.get<BidEvaluation>(
      `${RFP_ENDPOINTS.EVALUATIONS}/${evaluationId}`,
    );

  return response.data;
}

export async function getRfpEvaluations(
  rfpId: number,
): Promise<BidEvaluation[]> {
  const response =
    await api.get<BidEvaluation[]>(
      `${RFP_ENDPOINTS.RFPS}/${rfpId}/evaluations`,
    );

  return response.data;
}

export async function getLatestRfpEvaluation(
  rfpId: number,
): Promise<BidEvaluation> {
  const response =
    await api.get<BidEvaluation>(
      `${RFP_ENDPOINTS.RFPS}/${rfpId}/evaluations/latest`,
    );

  return response.data;
}

export async function createBidEvaluation(
  payload: CreateBidEvaluationRequest,
): Promise<BidEvaluation> {
  /*
   * IMPORTANT:
   *
   * Frontend must NOT send:
   * overall_score
   * recommendation
   *
   * Backend calculates both.
   */
  const response =
    await api.post<BidEvaluation>(
      RFP_ENDPOINTS.EVALUATIONS,
      payload,
    );

  return response.data;
}

export async function replaceBidEvaluation(
  evaluationId: number,
  payload: UpdateBidEvaluationRequest,
): Promise<BidEvaluation> {
  const response =
    await api.put<BidEvaluation>(
      `${RFP_ENDPOINTS.EVALUATIONS}/${evaluationId}`,
      payload,
    );

  return response.data;
}

export async function patchBidEvaluation(
  evaluationId: number,
  payload: PatchBidEvaluationRequest,
): Promise<BidEvaluation> {
  const response =
    await api.patch<BidEvaluation>(
      `${RFP_ENDPOINTS.EVALUATIONS}/${evaluationId}`,
      payload,
    );

  return response.data;
}

export async function deleteBidEvaluation(
  evaluationId: number,
): Promise<void> {
  await api.delete(
    `${RFP_ENDPOINTS.EVALUATIONS}/${evaluationId}`,
  );
}


/* ================================================= */
/* ASSIGNMENTS */
/* ================================================= */

export async function getRfpAssignments(
  params: ListQueryParams = {},
): Promise<RfpAssignment[]> {
  const response =
    await api.get<RfpAssignment[]>(
      RFP_ENDPOINTS.ASSIGNMENTS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getRfpAssignmentById(
  assignmentId: number,
): Promise<RfpAssignment> {
  const response =
    await api.get<RfpAssignment>(
      `${RFP_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`,
    );

  return response.data;
}

export async function getAssignmentsByRfp(
  rfpId: number,
): Promise<RfpAssignment[]> {
  const response =
    await api.get<RfpAssignment[]>(
      `${RFP_ENDPOINTS.RFPS}/${rfpId}/assignments`,
    );

  return response.data;
}

export async function getAssignmentsByUser(
  userId: number,
): Promise<RfpAssignment[]> {
  const response =
    await api.get<RfpAssignment[]>(
      `/api/rfp/users/${userId}/assignments`,
    );

  return response.data;
}

export async function createRfpAssignment(
  payload: CreateRfpAssignmentRequest,
): Promise<RfpAssignment> {
  const response =
    await api.post<RfpAssignment>(
      RFP_ENDPOINTS.ASSIGNMENTS,
      payload,
    );

  return response.data;
}

export async function replaceRfpAssignment(
  assignmentId: number,
  payload: UpdateRfpAssignmentRequest,
): Promise<RfpAssignment> {
  const response =
    await api.put<RfpAssignment>(
      `${RFP_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`,
      payload,
    );

  return response.data;
}

export async function patchRfpAssignment(
  assignmentId: number,
  payload: PatchRfpAssignmentRequest,
): Promise<RfpAssignment> {
  const response =
    await api.patch<RfpAssignment>(
      `${RFP_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`,
      payload,
    );

  return response.data;
}

export async function deleteRfpAssignment(
  assignmentId: number,
): Promise<void> {
  await api.delete(
    `${RFP_ENDPOINTS.ASSIGNMENTS}/${assignmentId}`,
  );
}


/* ================================================= */
/* DASHBOARD */
/* ================================================= */

export async function getRfpDashboardResources(): Promise<{
  rfps: Rfp[];
  evaluations: BidEvaluation[];
  assignments: RfpAssignment[];
}> {
  const [
    rfps,
    evaluations,
    assignments,
  ] = await Promise.all([
    getRfps({
      skip: 0,
      limit: 100,
    }),

    getBidEvaluations({
      skip: 0,
      limit: 100,
    }),

    getRfpAssignments({
      skip: 0,
      limit: 100,
    }),
  ]);

  return {
    rfps,
    evaluations,
    assignments,
  };
}