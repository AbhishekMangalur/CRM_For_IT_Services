from fastapi import (
    APIRouter,
    Depends,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.schemas.account_director import (
    AccountCreate,
    AccountOpportunityCreate,
    AccountOpportunityPatch,
    AccountOpportunityPut,
    AccountOpportunityResponse,
    AccountPatch,
    AccountPut,
    AccountResponse,
    ContractCreate,
    ContractPatch,
    ContractPut,
    ContractResponse,
    CustomerHealthRecordCreate,
    CustomerHealthRecordPatch,
    CustomerHealthRecordPut,
    CustomerHealthRecordResponse,
)
from app.services.account_director_service import (
    create_account,
    create_account_opportunity,
    create_contract,
    create_customer_health_record,
    delete_account,
    delete_account_opportunity,
    delete_contract,
    delete_customer_health_record,
    get_account,
    get_account_opportunities,
    get_account_opportunity,
    get_accounts,
    get_contract,
    get_contracts,
    get_customer_health_record,
    get_customer_health_records,
    update_account,
    update_account_opportunity,
    update_contract,
    update_customer_health_record,
)

from app.schemas.contract_renewal import (
    ContractRenewalAlertResponse,
)

from app.services.contract_renewal_service import (
    get_upcoming_contract_renewals,
)


router = APIRouter(
    prefix="/api/account-director",
    tags=["Account Director"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# Account routes
# =========================================================


@router.post(
    "/accounts",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_account_api(
    payload: AccountCreate,
    db: Session = Depends(get_db),
):
    return create_account(
        db,
        payload.model_dump(),
    )


@router.get(
    "/accounts",
    response_model=list[AccountResponse],
)
def get_accounts_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_accounts(
        db,
        skip,
        limit,
    )


@router.get(
    "/accounts/{account_id}",
    response_model=AccountResponse,
)
def get_account_api(
    account_id: int,
    db: Session = Depends(get_db),
):
    return get_account(
        db,
        account_id,
    )


@router.put(
    "/accounts/{account_id}",
    response_model=AccountResponse,
)
def replace_account_api(
    account_id: int,
    payload: AccountPut,
    db: Session = Depends(get_db),
):
    return update_account(
        db,
        account_id,
        payload.model_dump(),
    )


@router.patch(
    "/accounts/{account_id}",
    response_model=AccountResponse,
)
def patch_account_api(
    account_id: int,
    payload: AccountPatch,
    db: Session = Depends(get_db),
):
    return update_account(
        db,
        account_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_account_api(
    account_id: int,
    db: Session = Depends(get_db),
):
    delete_account(
        db,
        account_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

# =========================================================
# Contract routes
# =========================================================


@router.post(
    "/contracts",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_contract_api(
    payload: ContractCreate,
    db: Session = Depends(get_db),
):
    return create_contract(
        db,
        payload.model_dump(),
    )


@router.get(
    "/contracts",
    response_model=list[ContractResponse],
)
def get_contracts_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_contracts(
        db,
        skip,
        limit,
    )


@router.get(
    "/contracts/{contract_id}",
    response_model=ContractResponse,
)
def get_contract_api(
    contract_id: int,
    db: Session = Depends(get_db),
):
    return get_contract(
        db,
        contract_id,
    )


@router.put(
    "/contracts/{contract_id}",
    response_model=ContractResponse,
)
def replace_contract_api(
    contract_id: int,
    payload: ContractPut,
    db: Session = Depends(get_db),
):
    return update_contract(
        db,
        contract_id,
        payload.model_dump(),
    )


@router.patch(
    "/contracts/{contract_id}",
    response_model=ContractResponse,
)
def patch_contract_api(
    contract_id: int,
    payload: ContractPatch,
    db: Session = Depends(get_db),
):
    return update_contract(
        db,
        contract_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/contracts/{contract_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_contract_api(
    contract_id: int,
    db: Session = Depends(get_db),
):
    delete_contract(
        db,
        contract_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

# =========================================================
# Customer Health Record routes
# =========================================================


@router.post(
    "/customer-health-records",
    response_model=CustomerHealthRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_health_record_api(
    payload: CustomerHealthRecordCreate,
    db: Session = Depends(get_db),
):
    return create_customer_health_record(
        db,
        payload.model_dump(),
    )


@router.get(
    "/customer-health-records",
    response_model=list[CustomerHealthRecordResponse],
)
def get_customer_health_records_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_customer_health_records(
        db,
        skip,
        limit,
    )


@router.get(
    "/customer-health-records/{health_record_id}",
    response_model=CustomerHealthRecordResponse,
)
def get_customer_health_record_api(
    health_record_id: int,
    db: Session = Depends(get_db),
):
    return get_customer_health_record(
        db,
        health_record_id,
    )


@router.put(
    "/customer-health-records/{health_record_id}",
    response_model=CustomerHealthRecordResponse,
)
def replace_customer_health_record_api(
    health_record_id: int,
    payload: CustomerHealthRecordPut,
    db: Session = Depends(get_db),
):
    return update_customer_health_record(
        db,
        health_record_id,
        payload.model_dump(),
    )


@router.patch(
    "/customer-health-records/{health_record_id}",
    response_model=CustomerHealthRecordResponse,
)
def patch_customer_health_record_api(
    health_record_id: int,
    payload: CustomerHealthRecordPatch,
    db: Session = Depends(get_db),
):
    return update_customer_health_record(
        db,
        health_record_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/customer-health-records/{health_record_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer_health_record_api(
    health_record_id: int,
    db: Session = Depends(get_db),
):
    delete_customer_health_record(
        db,
        health_record_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

# =========================================================
# Account Opportunity routes
# =========================================================


@router.post(
    "/account-opportunities",
    response_model=AccountOpportunityResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_account_opportunity_api(
    payload: AccountOpportunityCreate,
    db: Session = Depends(get_db),
):
    return create_account_opportunity(
        db,
        payload.model_dump(),
    )


@router.get(
    "/account-opportunities",
    response_model=list[AccountOpportunityResponse],
)
def get_account_opportunities_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_account_opportunities(
        db,
        skip,
        limit,
    )


@router.get(
    "/account-opportunities/{account_opportunity_id}",
    response_model=AccountOpportunityResponse,
)
def get_account_opportunity_api(
    account_opportunity_id: int,
    db: Session = Depends(get_db),
):
    return get_account_opportunity(
        db,
        account_opportunity_id,
    )


@router.put(
    "/account-opportunities/{account_opportunity_id}",
    response_model=AccountOpportunityResponse,
)
def replace_account_opportunity_api(
    account_opportunity_id: int,
    payload: AccountOpportunityPut,
    db: Session = Depends(get_db),
):
    return update_account_opportunity(
        db,
        account_opportunity_id,
        payload.model_dump(),
    )


@router.patch(
    "/account-opportunities/{account_opportunity_id}",
    response_model=AccountOpportunityResponse,
)
def patch_account_opportunity_api(
    account_opportunity_id: int,
    payload: AccountOpportunityPatch,
    db: Session = Depends(get_db),
):
    return update_account_opportunity(
        db,
        account_opportunity_id,
        payload.model_dump(exclude_unset=True),
    )


@router.delete(
    "/account-opportunities/{account_opportunity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_account_opportunity_api(
    account_opportunity_id: int,
    db: Session = Depends(get_db),
):
    delete_account_opportunity(
        db,
        account_opportunity_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )

@router.get("/contracts/{contract_id}")


@router.get(
    "/contracts/renewals/upcoming",
    response_model=list[ContractRenewalAlertResponse],
)
def get_upcoming_contract_renewals_api(
    db: Session = Depends(get_db),
):
    return get_upcoming_contract_renewals(
        db,
    )