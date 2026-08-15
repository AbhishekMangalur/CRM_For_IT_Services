from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.executive import ExecutiveKPISnapshot


def create_snapshot(
    db: Session,
    snapshot: ExecutiveKPISnapshot,
) -> ExecutiveKPISnapshot:
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    return snapshot


def get_snapshot(
    db: Session,
    snapshot_id: int,
) -> ExecutiveKPISnapshot | None:
    return db.get(
        ExecutiveKPISnapshot,
        snapshot_id,
    )


def get_snapshot_by_month(
    db: Session,
    snapshot_month,
) -> ExecutiveKPISnapshot | None:
    return db.scalar(
        select(ExecutiveKPISnapshot).where(
            ExecutiveKPISnapshot.snapshot_month
            == snapshot_month
        )
    )


def get_all_snapshots(
    db: Session,
    skip: int = 0,
    limit: int = 100,
) -> list[ExecutiveKPISnapshot]:
    snapshots = db.scalars(
        select(ExecutiveKPISnapshot)
        .order_by(
            ExecutiveKPISnapshot.snapshot_month.desc()
        )
        .offset(skip)
        .limit(limit)
    ).all()

    return list(snapshots)


def delete_snapshot(
    db: Session,
    snapshot: ExecutiveKPISnapshot,
) -> None:
    db.delete(snapshot)
    db.commit()