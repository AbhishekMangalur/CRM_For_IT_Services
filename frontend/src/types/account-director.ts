// contains the types and interfaces for the account director section of the application, including accounts, contracts, customer health records, and account opportunities
export type CustomerHealthStatus =
  | "GREEN"
  | "YELLOW"
  | "RED";

export type AccountRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH";

export type AccountStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "CHURNED";

export type SlaStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "BREACHED";

export interface AccountDirectorAccount {
  id: number;
  account_name: string;
  industry: string;
  website: string | null;
  primary_contact_name: string;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  account_director_id: number;
  annual_revenue: string;
  currency: string;
  customer_health_status: CustomerHealthStatus;
  nps_score: number | null;
  sla_status: SlaStatus;
  risk_level: AccountRiskLevel;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountRequest {
  account_name: string;
  industry: string;
  website: string | null;
  primary_contact_name: string;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  account_director_id: number;
  annual_revenue: number;
  currency: string;
  customer_health_status: CustomerHealthStatus;
  nps_score: number | null;
  sla_status: SlaStatus;
  risk_level: AccountRiskLevel;
  account_status: AccountStatus;
}

export type UpdateAccountRequest =
  CreateAccountRequest;

export type PatchAccountRequest =
  Partial<CreateAccountRequest>;

export type RenewalStatus =
  | "NOT_DUE"
  | "UPCOMING"
  | "DUE"
  | "RENEWED"
  | string;

export type ContractStatus =
  | "ACTIVE"
  | "EXPIRING"
  | "EXPIRED"
  | "TERMINATED"
  | string;

export interface AccountContract {
  id: number;
  account_id: number;
  contract_number: string;
  contract_type: string;
  contract_value: string;
  currency: string;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  renewal_status: RenewalStatus;
  contract_status: ContractStatus;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContractRequest {
  account_id: number;
  contract_number: string;
  contract_type: string;
  contract_value: number;
  currency: string;
  start_date: string;
  end_date: string;
  renewal_date: string | null;
  renewal_status: RenewalStatus;
  contract_status: ContractStatus;
  document_url: string | null;
}

export type UpdateContractRequest =
  CreateContractRequest;

export type PatchContractRequest =
  Partial<CreateContractRequest>;

export interface AccountExpansionOpportunity {
  id: number;
  account_id: number;
  opportunity_name: string;
  service_type: string;
  estimated_value: string;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  status: AccountOpportunityStatus;
  created_by: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type AccountOpportunityStatus =
  | "OPEN"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | string;

export interface CreateAccountOpportunityRequest {
  account_id: number;
  opportunity_name: string;
  service_type: string;
  estimated_value: number;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  status: AccountOpportunityStatus;
  created_by: number;
  notes: string | null;
}

export type UpdateAccountOpportunityRequest =
  CreateAccountOpportunityRequest;

export type PatchAccountOpportunityRequest =
  Partial<CreateAccountOpportunityRequest>;

export interface CustomerHealthRecord {
  id: number;
  account_id: number;
  delivery_score: number;
  financial_score: number;
  customer_satisfaction_score: number;
  sla_score: number;
  overall_health_score: number;
  health_status: CustomerHealthStatus;
  risk_reason: string | null;
  recorded_at: string;
}

export interface CreateCustomerHealthRequest {
  account_id: number;
  delivery_score: number;
  financial_score: number;
  customer_satisfaction_score: number;
  sla_score: number;
  risk_reason: string | null;
}

export type UpdateCustomerHealthRequest =
  CreateCustomerHealthRequest;

export type PatchCustomerHealthRequest =
  Partial<CreateCustomerHealthRequest>;

export interface CustomerHealthImportError {
  row: number;
  account_id: string;
  message: string;
}

export interface CustomerHealthImportResult {
  message: string;
  rows_processed: number;
  records_updated: number;
  records_created: number;
  failed_rows: number;
  errors: CustomerHealthImportError[];
}

export interface AccountDirectorDashboardData {
  accounts: AccountDirectorAccount[];
  contracts: AccountContract[];
  healthRecords: CustomerHealthRecord[];
  opportunities: AccountExpansionOpportunity[];

  activeAccounts: number;
  healthyAccounts: number;
  atRiskAccounts: number;
  activeContracts: number;
  contractsDueForRenewal: number;
  expansionPipelineValue: number;
  averageNps: number;

  accountsRequiringAttention: AccountDirectorAccount[];
  contractsExpiringSoon: AccountContract[];
  recentHealthRecords: CustomerHealthRecord[];
  recentOpportunities: AccountExpansionOpportunity[];
}

export type ContractRenewalAlertLevel =
  | "30_DAYS"
  | "60_DAYS"
  | "90_DAYS"
  | "EXPIRED";

export interface ContractRenewalAlert {
  contract_id: number;
  account_id: number;

  contract_number: string;
  contract_value: string;
  currency: string;

  end_date: string;
  renewal_date: string;

  days_until_renewal: number;

  alert_level:
    ContractRenewalAlertLevel;

  renewal_status: string;
}
