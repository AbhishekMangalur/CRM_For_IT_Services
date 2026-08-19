from collections.abc import Generator

from sqlalchemy import (
    create_engine,
    inspect,
    or_,
    text,
    update,
)
from sqlalchemy.engine import make_url
from sqlalchemy.orm import (
    DeclarativeBase,
    Session,
    sessionmaker,
)

from app.core.config import settings


class Base(DeclarativeBase):
    pass


database_url = make_url(settings.database_url)
engine_options: dict[str, object] = {"pool_pre_ping": True}

if database_url.get_backend_name() == "postgresql":
    engine_options.update(
        pool_size=3,
        max_overflow=2,
        pool_timeout=30,
        pool_recycle=180,
        connect_args={
            "connect_timeout": 10,
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
    )

engine = create_engine(settings.database_url, **engine_options)


SessionLocal = sessionmaker(
    bind=engine,
    class_=Session,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


def normalize_currency_to_usd() -> None:
    """
    Normalize existing currency values and database
    defaults to USD.
    """

    with engine.begin() as connection:
        preparer = (
            connection.dialect.identifier_preparer
        )

        for table in Base.metadata.sorted_tables:
            currency = table.columns.get(
                "currency"
            )

            if currency is None:
                continue

            connection.execute(
                update(table)
                .where(
                    or_(
                        currency.is_(None),
                        currency != "USD",
                    )
                )
                .values(
                    currency="USD"
                )
            )

            if (
                connection.dialect.name
                == "postgresql"
            ):
                table_name = (
                    preparer.format_table(
                        table
                    )
                )

                column_name = (
                    preparer.quote(
                        currency.name
                    )
                )

                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        f"ALTER COLUMN {column_name} "
                        "SET DEFAULT 'USD'"
                    )
                )


def ensure_rfp_completed_at_column() -> None:
    """Add and backfill the RFP completion timestamp for existing databases."""

    with engine.begin() as connection:
        inspector = inspect(connection)

        if "rfps" not in inspector.get_table_names():
            return

        column_names = {
            column["name"]
            for column in inspector.get_columns("rfps")
        }

        if "completed_at" not in column_names:
            column_type = (
                "TIMESTAMP WITH TIME ZONE"
                if connection.dialect.name == "postgresql"
                else "DATETIME"
            )
            connection.execute(
                text(
                    "ALTER TABLE rfps ADD COLUMN completed_at "
                    f"{column_type} NULL"
                )
            )

        connection.execute(
            text(
                "UPDATE rfps SET completed_at = updated_at "
                "WHERE completed_at IS NULL "
                "AND rfp_status IN ('SUBMITTED', 'WON', 'LOST')"
            )
        )


def ensure_proposal_document_columns() -> None:
    """Add persistent PDF document columns to existing proposal tables."""

    with engine.begin() as connection:
        inspector = inspect(connection)
        if "proposals" not in inspector.get_table_names():
            return

        existing = {
            column["name"] for column in inspector.get_columns("proposals")
        }
        binary_type = "BYTEA" if connection.dialect.name == "postgresql" else "BLOB"
        columns = {
            "sow_document_filename": "VARCHAR(255)",
            "sow_document_content": binary_type,
            "proposal_document_filename": "VARCHAR(255)",
            "proposal_document_content": binary_type,
        }

        for column_name, column_type in columns.items():
            if column_name not in existing:
                connection.execute(
                    text(
                        f"ALTER TABLE proposals ADD COLUMN {column_name} "
                        f"{column_type} NULL"
                    )
                )
