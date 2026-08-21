// contains the api calls and frontend utilities
import { api } from "@/lib/api";

import type {
  AccountContract,
  AccountDirectorAccount,
  CreateAccountRequest,
  CreateContractRequest,
  CreateCustomerHealthRequest,
  CustomerHealthRecord,
  CustomerHealthImportResult,
  PatchAccountRequest,
  PatchContractRequest,
  PatchCustomerHealthRequest,
  UpdateAccountRequest,
  UpdateContractRequest,
  UpdateCustomerHealthRequest,
  AccountExpansionOpportunity,
  CreateAccountOpportunityRequest,
  PatchAccountOpportunityRequest,
  UpdateAccountOpportunityRequest,
} from "@/types/account-director";

const ACCOUNT_DIRECTOR_ENDPOINTS = {
  ACCOUNTS: "/api/account-director/accounts",
  CONTRACTS: "/api/account-director/contracts",
  HEALTH_RECORDS:
    "/api/account-director/customer-health-records",
  HEALTH_IMPORT:
    "/api/account-director/customer-health/import",
  OPPORTUNITIES:
    "/api/account-director/account-opportunities",
} as const;

interface ListQueryParams {
  skip?: number;
  limit?: number;
}

/* -------------------- Accounts -------------------- */

export async function getAccounts(
  params: ListQueryParams = {},
): Promise<AccountDirectorAccount[]> {
  const response = await api.get<
    AccountDirectorAccount[]
  >(ACCOUNT_DIRECTOR_ENDPOINTS.ACCOUNTS, {
    params: {
      skip: params.skip ?? 0,
      limit: params.limit ?? 100,
    },
  });

  return response.data;
}

export async function getAccountById(
  accountId: number,
): Promise<AccountDirectorAccount> {
  const response =
    await api.get<AccountDirectorAccount>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.ACCOUNTS}/${accountId}`,
    );

  return response.data;
}

export async function createAccount(
  payload: CreateAccountRequest,
): Promise<AccountDirectorAccount> {
  const response =
    await api.post<AccountDirectorAccount>(
      ACCOUNT_DIRECTOR_ENDPOINTS.ACCOUNTS,
      payload,
    );

  return response.data;
}

export async function replaceAccount(
  accountId: number,
  payload: UpdateAccountRequest,
): Promise<AccountDirectorAccount> {
  const response =
    await api.put<AccountDirectorAccount>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.ACCOUNTS}/${accountId}`,
      payload,
    );

  return response.data;
}

export async function patchAccount(
  accountId: number,
  payload: PatchAccountRequest,
): Promise<AccountDirectorAccount> {
  const response =
    await api.patch<AccountDirectorAccount>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.ACCOUNTS}/${accountId}`,
      payload,
    );

  return response.data;
}

export async function deleteAccount(
  accountId: number,
): Promise<void> {
  await api.delete(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.ACCOUNTS}/${accountId}`,
  );
}

/* -------------------- Contracts -------------------- */

export async function getContracts(
  params: ListQueryParams = {},
): Promise<AccountContract[]> {
  const response = await api.get<AccountContract[]>(
    ACCOUNT_DIRECTOR_ENDPOINTS.CONTRACTS,
    {
      params: {
        skip: params.skip ?? 0,
        limit: params.limit ?? 100,
      },
    },
  );

  return response.data;
}

export async function getContractById(
  contractId: number,
): Promise<AccountContract> {
  const response = await api.get<AccountContract>(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.CONTRACTS}/${contractId}`,
  );

  return response.data;
}

export async function createContract(
  payload: CreateContractRequest,
): Promise<AccountContract> {
  const response = await api.post<AccountContract>(
    ACCOUNT_DIRECTOR_ENDPOINTS.CONTRACTS,
    payload,
  );

  return response.data;
}

export async function replaceContract(
  contractId: number,
  payload: UpdateContractRequest,
): Promise<AccountContract> {
  const response = await api.put<AccountContract>(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.CONTRACTS}/${contractId}`,
    payload,
  );

  return response.data;
}

export async function patchContract(
  contractId: number,
  payload: PatchContractRequest,
): Promise<AccountContract> {
  const response = await api.patch<AccountContract>(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.CONTRACTS}/${contractId}`,
    payload,
  );

  return response.data;
}

export async function deleteContract(
  contractId: number,
): Promise<void> {
  await api.delete(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.CONTRACTS}/${contractId}`,
  );
}

/* --------------- Customer Health ---------------- */

export async function getCustomerHealthRecords(
  params: ListQueryParams = {},
): Promise<CustomerHealthRecord[]> {
  const response = await api.get<
    CustomerHealthRecord[]
  >(ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_RECORDS, {
    params: {
      skip: params.skip ?? 0,
      limit: params.limit ?? 100,
    },
  });

  return response.data;
}

export async function importCustomerHealthCsv(
  file: File,
): Promise<CustomerHealthImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<CustomerHealthImportResult>(
    ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_IMPORT,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function getCustomerHealthRecordById(
  recordId: number,
): Promise<CustomerHealthRecord> {
  const response =
    await api.get<CustomerHealthRecord>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_RECORDS}/${recordId}`,
    );

  return response.data;
}

export async function createCustomerHealthRecord(
  payload: CreateCustomerHealthRequest,
): Promise<CustomerHealthRecord> {
  const response =
    await api.post<CustomerHealthRecord>(
      ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_RECORDS,
      payload,
    );

  return response.data;
}

export async function replaceCustomerHealthRecord(
  recordId: number,
  payload: UpdateCustomerHealthRequest,
): Promise<CustomerHealthRecord> {
  const response =
    await api.put<CustomerHealthRecord>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_RECORDS}/${recordId}`,
      payload,
    );

  return response.data;
}

export async function patchCustomerHealthRecord(
  recordId: number,
  payload: PatchCustomerHealthRequest,
): Promise<CustomerHealthRecord> {
  const response =
    await api.patch<CustomerHealthRecord>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_RECORDS}/${recordId}`,
      payload,
    );

  return response.data;
}

export async function deleteCustomerHealthRecord(
  recordId: number,
): Promise<void> {
  await api.delete(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.HEALTH_RECORDS}/${recordId}`,
  );
}

/* ------------ Account Opportunities ------------ */

export async function getAccountOpportunities(
  params: ListQueryParams = {},
): Promise<AccountExpansionOpportunity[]> {
  const response = await api.get<
    AccountExpansionOpportunity[]
  >(ACCOUNT_DIRECTOR_ENDPOINTS.OPPORTUNITIES, {
    params: {
      skip: params.skip ?? 0,
      limit: params.limit ?? 100,
    },
  });

  return response.data;
}

export async function getAccountOpportunityById(
  opportunityId: number,
): Promise<AccountExpansionOpportunity> {
  const response =
    await api.get<AccountExpansionOpportunity>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
    );

  return response.data;
}

export async function createAccountOpportunity(
  payload: CreateAccountOpportunityRequest,
): Promise<AccountExpansionOpportunity> {
  const response =
    await api.post<AccountExpansionOpportunity>(
      ACCOUNT_DIRECTOR_ENDPOINTS.OPPORTUNITIES,
      payload,
    );

  return response.data;
}

export async function replaceAccountOpportunity(
  opportunityId: number,
  payload: UpdateAccountOpportunityRequest,
): Promise<AccountExpansionOpportunity> {
  const response =
    await api.put<AccountExpansionOpportunity>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
      payload,
    );

  return response.data;
}

export async function patchAccountOpportunity(
  opportunityId: number,
  payload: PatchAccountOpportunityRequest,
): Promise<AccountExpansionOpportunity> {
  const response =
    await api.patch<AccountExpansionOpportunity>(
      `${ACCOUNT_DIRECTOR_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
      payload,
    );

  return response.data;
}

export async function deleteAccountOpportunity(
  opportunityId: number,
): Promise<void> {
  await api.delete(
    `${ACCOUNT_DIRECTOR_ENDPOINTS.OPPORTUNITIES}/${opportunityId}`,
  );
}

export async function getAccountDirectorDashboardResources(): Promise<{
  accounts: AccountDirectorAccount[];
  contracts: AccountContract[];
  healthRecords: CustomerHealthRecord[];
  opportunities: AccountExpansionOpportunity[];
}> {
  const [
    accounts,
    contracts,
    healthRecords,
    opportunities,
  ] = await Promise.all([
    getAccounts({
      skip: 0,
      limit: 100,
    }),
    getContracts({
      skip: 0,
      limit: 100,
    }),
    getCustomerHealthRecords({
      skip: 0,
      limit: 100,
    }),
    getAccountOpportunities({
      skip: 0,
      limit: 100,
    }),
  ]);

  return {
    accounts,
    contracts,
    healthRecords,
    opportunities,
  };
}

import type {
  ContractRenewalAlert,
} from "@/types/account-director";

export async function getUpcomingContractRenewals(): Promise<
  ContractRenewalAlert[]
> {
  const response =
    await api.get<
      ContractRenewalAlert[]
    >(
      "/api/account-director/contracts/renewals/upcoming",
    );

  return response.data;
}
