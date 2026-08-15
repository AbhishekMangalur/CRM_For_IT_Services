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
from app.schemas.executive import (
    ExecutiveKPISnapshotGenerate,
    ExecutiveKPISnapshotResponse,
)
from app.services.executive_service import (
    delete_kpi_snapshot,
    generate_kpi_snapshot,
    get_kpi_snapshot,
    get_kpi_snapshots,
    get_latest_kpi_snapshot,
    regenerate_kpi_snapshot,
)

router = APIRouter(
    prefix="/api/executive",
    tags=["Executive"],
    dependencies=[Depends(get_current_user)],
)


# =========================================================
# Generate KPI Snapshot
# =========================================================


@router.post(
    "/kpi-snapshots/generate",
    response_model=ExecutiveKPISnapshotResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_snapshot_api(
    payload: ExecutiveKPISnapshotGenerate,
    db: Session = Depends(get_db),
):
    return generate_kpi_snapshot(
        db,
        payload.snapshot_month,
    )


# =========================================================
# Get all snapshots
# =========================================================


@router.get(
    "/kpi-snapshots",
    response_model=list[ExecutiveKPISnapshotResponse],
)
def get_snapshots_api(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    return get_kpi_snapshots(
        db,
        skip,
        limit,
    )


# =========================================================
# Get latest snapshot
# =========================================================


@router.get(
    "/kpi-snapshots/latest",
    response_model=ExecutiveKPISnapshotResponse,
)
def get_latest_snapshot_api(
    db: Session = Depends(get_db),
):
    return get_latest_kpi_snapshot(
        db,
    )


# =========================================================
# Get snapshot by id
# =========================================================


@router.get(
    "/kpi-snapshots/{snapshot_id}",
    response_model=ExecutiveKPISnapshotResponse,
)
def get_snapshot_api(
    snapshot_id: int,
    db: Session = Depends(get_db),
):
    return get_kpi_snapshot(
        db,
        snapshot_id,
    )


# =========================================================
# Regenerate snapshot
# =========================================================


@router.put(
    "/kpi-snapshots/{snapshot_id}/regenerate",
    response_model=ExecutiveKPISnapshotResponse,
)
def regenerate_snapshot_api(
    snapshot_id: int,
    db: Session = Depends(get_db),
):
    return regenerate_kpi_snapshot(
        db,
        snapshot_id,
    )


# =========================================================
# Delete snapshot
# =========================================================


@router.delete(
    "/kpi-snapshots/{snapshot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_snapshot_api(
    snapshot_id: int,
    db: Session = Depends(get_db),
):
    delete_kpi_snapshot(
        db,
        snapshot_id,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )