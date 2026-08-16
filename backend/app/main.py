import logging

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from starlette.responses import JSONResponse

from app.core.config import settings
from app.routes.auth import router as auth_router
from app.routes.roles import router as roles_router
from app.routes.users import router as users_router
from app.routes.sales import router as sales_router
from app.routes.presale import router as presale_router
from app.routes.resource_manager import router as resource_manager_router
from app.routes.account_director import router as account_director_router
from app.routes.executive import router as executive_router
from app.routes.alliance import router as alliance_router
from app.routes.rfp import router as rfp_router
from app.routes.blended_rate import router as blended_rate_router
from app.routes.resource_match import router as resource_match_router
from app.routes.employee_import import router as employee_import_router
from app.routes.customer_health_import import router as customer_health_import_router
from app.routes.financial_import import router as financial_import_router
from app.routes.executive_kpi import router as executive_kpi_router
from app.routes.presales_template import router as presales_template_router
from app.core.database import Base, engine, normalize_currency_to_usd


logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    debug=settings.debug,
)

@app.on_event("startup")
def create_tables() -> None:
    try:
        Base.metadata.create_all(bind=engine)
        normalize_currency_to_usd()
        app.state.database_available = True
    except SQLAlchemyError as error:
        app.state.database_available = False
        engine.dispose()
        logger.warning(
            "Database initialization failed (%s); "
            "starting API in degraded mode",
            error.__class__.__name__,
        )


@app.exception_handler(SQLAlchemyError)
async def handle_database_error(
    request: Request,
    error: SQLAlchemyError,
) -> JSONResponse:
    app.state.database_available = False
    logger.error(
        "Database request failed for %s: %s",
        request.url.path,
        error.__class__.__name__,
    )

    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Database service is temporarily unavailable. "
                "Please retry shortly."
            )
        },
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(roles_router)
app.include_router(users_router)
app.include_router(sales_router)
app.include_router(presale_router)
app.include_router(resource_manager_router)
app.include_router(account_director_router)
app.include_router(executive_router)
app.include_router(alliance_router)
app.include_router(rfp_router)
app.include_router(blended_rate_router)
app.include_router(resource_match_router)
app.include_router(employee_import_router)
app.include_router(customer_health_import_router)
app.include_router(financial_import_router)
app.include_router(executive_kpi_router)
app.include_router(presales_template_router)



def root():
    return {
        "message": "CRM Backend CI/CD Test V3",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": (
            "healthy"
            if getattr(
                app.state,
                "database_available",
                False,
            )
            else "degraded"
        ),
        "database": (
            "available"
            if getattr(
                app.state,
                "database_available",
                False,
            )
            else "unavailable"
        ),
    }
