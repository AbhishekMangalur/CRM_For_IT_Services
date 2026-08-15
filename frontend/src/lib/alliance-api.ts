import { api } from "@/lib/api";

import type {
  AlliancePartner,
  CreateAlliancePartnerRequest,
  CreatePartnerCertificationRequest,
  CreatePartnerDealRegistrationRequest,
  CreatePartnerInfluencedOpportunityRequest,
  PartnerCertification,
  PartnerDealRegistration,
  PartnerInfluencedOpportunity,
  PatchAlliancePartnerRequest,
  PatchPartnerCertificationRequest,
  PatchPartnerDealRegistrationRequest,
  PatchPartnerInfluencedOpportunityRequest,
  UpdateAlliancePartnerRequest,
  UpdatePartnerCertificationRequest,
  UpdatePartnerDealRegistrationRequest,
  UpdatePartnerInfluencedOpportunityRequest,
} from "@/types/alliance";

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

export const ALLIANCE_ENDPOINTS = {
  PARTNERS:
    "/api/alliance/partners",

  DEAL_REGISTRATIONS:
    "/api/alliance/deal-registrations",

  INFLUENCED_OPPORTUNITIES:
    "/api/alliance/influenced-opportunities",

  CERTIFICATIONS:
    "/api/alliance/certifications",
} as const;


/* ================================================= */
/* PARTNERS */
/* ================================================= */

export async function getAlliancePartners(
  params: ListQueryParams = {},
): Promise<AlliancePartner[]> {
  const response =
    await api.get<AlliancePartner[]>(
      ALLIANCE_ENDPOINTS.PARTNERS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getAlliancePartnerById(
  partnerId: number,
): Promise<AlliancePartner> {
  const response =
    await api.get<AlliancePartner>(
      `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}`,
    );

  return response.data;
}

export async function createAlliancePartner(
  payload: CreateAlliancePartnerRequest,
): Promise<AlliancePartner> {
  const response =
    await api.post<AlliancePartner>(
      ALLIANCE_ENDPOINTS.PARTNERS,
      payload,
    );

  return response.data;
}

export async function replaceAlliancePartner(
  partnerId: number,
  payload: UpdateAlliancePartnerRequest,
): Promise<AlliancePartner> {
  const response =
    await api.put<AlliancePartner>(
      `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}`,
      payload,
    );

  return response.data;
}

export async function patchAlliancePartner(
  partnerId: number,
  payload: PatchAlliancePartnerRequest,
): Promise<AlliancePartner> {
  const response =
    await api.patch<AlliancePartner>(
      `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}`,
      payload,
    );

  return response.data;
}

export async function deleteAlliancePartner(
  partnerId: number,
): Promise<void> {
  await api.delete(
    `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}`,
  );
}


/* ================================================= */
/* DEAL REGISTRATIONS */
/* ================================================= */

export async function getDealRegistrations(
  params: ListQueryParams = {},
): Promise<PartnerDealRegistration[]> {
  const response =
    await api.get<
      PartnerDealRegistration[]
    >(
      ALLIANCE_ENDPOINTS.DEAL_REGISTRATIONS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getDealRegistrationById(
  registrationId: number,
): Promise<PartnerDealRegistration> {
  const response =
    await api.get<PartnerDealRegistration>(
      `${ALLIANCE_ENDPOINTS.DEAL_REGISTRATIONS}/${registrationId}`,
    );

  return response.data;
}

export async function getPartnerDealRegistrations(
  partnerId: number,
): Promise<PartnerDealRegistration[]> {
  const response =
    await api.get<
      PartnerDealRegistration[]
    >(
      `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}/deal-registrations`,
    );

  return response.data;
}

export async function createDealRegistration(
  payload: CreatePartnerDealRegistrationRequest,
): Promise<PartnerDealRegistration> {
  const response =
    await api.post<PartnerDealRegistration>(
      ALLIANCE_ENDPOINTS.DEAL_REGISTRATIONS,
      payload,
    );

  return response.data;
}

export async function replaceDealRegistration(
  registrationId: number,
  payload: UpdatePartnerDealRegistrationRequest,
): Promise<PartnerDealRegistration> {
  const response =
    await api.put<PartnerDealRegistration>(
      `${ALLIANCE_ENDPOINTS.DEAL_REGISTRATIONS}/${registrationId}`,
      payload,
    );

  return response.data;
}

export async function patchDealRegistration(
  registrationId: number,
  payload: PatchPartnerDealRegistrationRequest,
): Promise<PartnerDealRegistration> {
  const response =
    await api.patch<PartnerDealRegistration>(
      `${ALLIANCE_ENDPOINTS.DEAL_REGISTRATIONS}/${registrationId}`,
      payload,
    );

  return response.data;
}

export async function deleteDealRegistration(
  registrationId: number,
): Promise<void> {
  await api.delete(
    `${ALLIANCE_ENDPOINTS.DEAL_REGISTRATIONS}/${registrationId}`,
  );
}


/* ================================================= */
/* INFLUENCED OPPORTUNITIES */
/* ================================================= */

export async function getInfluencedOpportunities(
  params: ListQueryParams = {},
): Promise<
  PartnerInfluencedOpportunity[]
> {
  const response =
    await api.get<
      PartnerInfluencedOpportunity[]
    >(
      ALLIANCE_ENDPOINTS.INFLUENCED_OPPORTUNITIES,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getInfluencedOpportunityById(
  influenceId: number,
): Promise<PartnerInfluencedOpportunity> {
  const response =
    await api.get<
      PartnerInfluencedOpportunity
    >(
      `${ALLIANCE_ENDPOINTS.INFLUENCED_OPPORTUNITIES}/${influenceId}`,
    );

  return response.data;
}

export async function getPartnerInfluencedOpportunities(
  partnerId: number,
): Promise<
  PartnerInfluencedOpportunity[]
> {
  const response =
    await api.get<
      PartnerInfluencedOpportunity[]
    >(
      `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}/influenced-opportunities`,
    );

  return response.data;
}

export async function createInfluencedOpportunity(
  payload: CreatePartnerInfluencedOpportunityRequest,
): Promise<PartnerInfluencedOpportunity> {
  const response =
    await api.post<
      PartnerInfluencedOpportunity
    >(
      ALLIANCE_ENDPOINTS.INFLUENCED_OPPORTUNITIES,
      payload,
    );

  return response.data;
}

export async function replaceInfluencedOpportunity(
  influenceId: number,
  payload: UpdatePartnerInfluencedOpportunityRequest,
): Promise<PartnerInfluencedOpportunity> {
  const response =
    await api.put<
      PartnerInfluencedOpportunity
    >(
      `${ALLIANCE_ENDPOINTS.INFLUENCED_OPPORTUNITIES}/${influenceId}`,
      payload,
    );

  return response.data;
}

export async function patchInfluencedOpportunity(
  influenceId: number,
  payload: PatchPartnerInfluencedOpportunityRequest,
): Promise<PartnerInfluencedOpportunity> {
  const response =
    await api.patch<
      PartnerInfluencedOpportunity
    >(
      `${ALLIANCE_ENDPOINTS.INFLUENCED_OPPORTUNITIES}/${influenceId}`,
      payload,
    );

  return response.data;
}

export async function deleteInfluencedOpportunity(
  influenceId: number,
): Promise<void> {
  await api.delete(
    `${ALLIANCE_ENDPOINTS.INFLUENCED_OPPORTUNITIES}/${influenceId}`,
  );
}


/* ================================================= */
/* CERTIFICATIONS */
/* ================================================= */

export async function getPartnerCertifications(
  params: ListQueryParams = {},
): Promise<PartnerCertification[]> {
  const response =
    await api.get<
      PartnerCertification[]
    >(
      ALLIANCE_ENDPOINTS.CERTIFICATIONS,
      {
        params: {
          skip: params.skip ?? 0,
          limit: params.limit ?? 100,
        },
      },
    );

  return response.data;
}

export async function getPartnerCertificationById(
  certificationId: number,
): Promise<PartnerCertification> {
  const response =
    await api.get<PartnerCertification>(
      `${ALLIANCE_ENDPOINTS.CERTIFICATIONS}/${certificationId}`,
    );

  return response.data;
}

export async function getCertificationsByPartner(
  partnerId: number,
): Promise<PartnerCertification[]> {
  const response =
    await api.get<
      PartnerCertification[]
    >(
      `${ALLIANCE_ENDPOINTS.PARTNERS}/${partnerId}/certifications`,
    );

  return response.data;
}

export async function getCertificationsByEmployee(
  employeeId: number,
): Promise<PartnerCertification[]> {
  const response =
    await api.get<
      PartnerCertification[]
    >(
      `/api/alliance/employees/${employeeId}/certifications`,
    );

  return response.data;
}

export async function createPartnerCertification(
  payload: CreatePartnerCertificationRequest,
): Promise<PartnerCertification> {
  const response =
    await api.post<PartnerCertification>(
      ALLIANCE_ENDPOINTS.CERTIFICATIONS,
      payload,
    );

  return response.data;
}

export async function replacePartnerCertification(
  certificationId: number,
  payload: UpdatePartnerCertificationRequest,
): Promise<PartnerCertification> {
  const response =
    await api.put<PartnerCertification>(
      `${ALLIANCE_ENDPOINTS.CERTIFICATIONS}/${certificationId}`,
      payload,
    );

  return response.data;
}

export async function patchPartnerCertification(
  certificationId: number,
  payload: PatchPartnerCertificationRequest,
): Promise<PartnerCertification> {
  const response =
    await api.patch<PartnerCertification>(
      `${ALLIANCE_ENDPOINTS.CERTIFICATIONS}/${certificationId}`,
      payload,
    );

  return response.data;
}

export async function deletePartnerCertification(
  certificationId: number,
): Promise<void> {
  await api.delete(
    `${ALLIANCE_ENDPOINTS.CERTIFICATIONS}/${certificationId}`,
  );
}


/* ================================================= */
/* DASHBOARD */
/* ================================================= */

export async function getAllianceDashboardResources(): Promise<{
  partners: AlliancePartner[];
  dealRegistrations:
    PartnerDealRegistration[];
  influencedOpportunities:
    PartnerInfluencedOpportunity[];
  certifications:
    PartnerCertification[];
}> {
  const [
    partners,
    dealRegistrations,
    influencedOpportunities,
    certifications,
  ] = await Promise.all([
    getAlliancePartners({
      skip: 0,
      limit: 100,
    }),

    getDealRegistrations({
      skip: 0,
      limit: 100,
    }),

    getInfluencedOpportunities({
      skip: 0,
      limit: 100,
    }),

    getPartnerCertifications({
      skip: 0,
      limit: 100,
    }),
  ]);

  return {
    partners,
    dealRegistrations,
    influencedOpportunities,
    certifications,
  };
}