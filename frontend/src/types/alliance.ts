/* ================================================= */
/* PARTNERS */
/* ================================================= */

export type PartnerType =
  | "HYPERSCALER"
  | "ISV"
  | "CONSULTING"
  | "RESELLER"
  | string;

export type PartnerTier =
  | "REGISTERED"
  | "SELECT"
  | "ADVANCED"
  | "PREMIER"
  | string;

export interface AlliancePartner {
  id: number;

  name: string;
  partner_type: PartnerType;
  partner_program: string;
  partner_tier: PartnerTier;

  contact_name: string;
  contact_email: string;
  contact_phone: string;

  website: string;

  is_active: boolean;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreateAlliancePartnerRequest {
  name: string;
  partner_type: PartnerType;
  partner_program: string;
  partner_tier: PartnerTier;

  contact_name: string;
  contact_email: string;
  contact_phone: string;

  website: string;

  is_active: boolean;

  notes: string | null;
}

export type UpdateAlliancePartnerRequest =
  CreateAlliancePartnerRequest;

export type PatchAlliancePartnerRequest =
  Partial<CreateAlliancePartnerRequest>;


/* ================================================= */
/* DEAL REGISTRATIONS */
/* ================================================= */

export type DealRegistrationStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | string;

export interface PartnerDealRegistration {
  id: number;

  partner_id: number;
  opportunity_id: number;

  registration_reference: string;

  registration_status:
    DealRegistrationStatus;

  registered_on: string;
  expiry_date: string | null;

  expected_incentive: string;
  currency: string;

  registered_by: number;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreatePartnerDealRegistrationRequest {
  partner_id: number;
  opportunity_id: number;

  registration_reference: string;

  registration_status:
    DealRegistrationStatus;

  registered_on: string;
  expiry_date: string | null;

  expected_incentive: number;
  currency: string;

  registered_by: number;

  notes: string | null;
}

export type UpdatePartnerDealRegistrationRequest =
  CreatePartnerDealRegistrationRequest;

export type PatchPartnerDealRegistrationRequest =
  Partial<CreatePartnerDealRegistrationRequest>;


/* ================================================= */
/* INFLUENCED OPPORTUNITIES */
/* ================================================= */

export type InfluenceType =
  | "CO_SELL"
  | "REFERRAL"
  | "TECHNICAL_SUPPORT"
  | "MARKETING"
  | string;

export type InfluenceStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "COMPLETED"
  | string;

export interface PartnerInfluencedOpportunity {
  id: number;

  partner_id: number;
  opportunity_id: number;

  influence_type: InfluenceType;

  influenced_value: string;

  currency: string;

  referral_fee: string;

  tier_points: number;

  status: InfluenceStatus;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export interface CreatePartnerInfluencedOpportunityRequest {
  partner_id: number;
  opportunity_id: number;

  influence_type: InfluenceType;

  influenced_value?: number | null;

  currency: string;

  referral_fee: number;

  tier_points: number;

  status: InfluenceStatus;

  notes: string | null;
}

export type UpdatePartnerInfluencedOpportunityRequest =
  CreatePartnerInfluencedOpportunityRequest;

export type PatchPartnerInfluencedOpportunityRequest =
  Partial<CreatePartnerInfluencedOpportunityRequest>;


/* ================================================= */
/* PARTNER CERTIFICATIONS */
/* ================================================= */

export type CertificationLevel =
  | "FOUNDATIONAL"
  | "ASSOCIATE"
  | "PROFESSIONAL"
  | "SPECIALTY"
  | string;

export interface PartnerCertification {
  id: number;

  partner_id: number;
  employee_id: number;

  certification_name: string;
  certification_level:
    CertificationLevel;

  certification_number: string;

  issued_date: string;
  expiry_date: string | null;

  verification_url: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreatePartnerCertificationRequest {
  partner_id: number;
  employee_id: number;

  certification_name: string;
  certification_level:
    CertificationLevel;

  certification_number: string;

  issued_date: string;
  expiry_date: string | null;

  verification_url: string;

  is_active: boolean;
}

export type UpdatePartnerCertificationRequest =
  CreatePartnerCertificationRequest;

export type PatchPartnerCertificationRequest =
  Partial<CreatePartnerCertificationRequest>;


/* ================================================= */
/* DASHBOARD */
/* ================================================= */

export interface AllianceDashboardData {
  partners: AlliancePartner[];

  dealRegistrations:
    PartnerDealRegistration[];

  influencedOpportunities:
    PartnerInfluencedOpportunity[];

  certifications:
    PartnerCertification[];
}