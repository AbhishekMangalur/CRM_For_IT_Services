import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.alliance import (
    Partner,
    PartnerCertification,
)
from app.models.resource_manager import (
    Employee,
    EmployeeSkill,
    Skill,
)


REQUIRED_COLUMNS = {
    "employee_code",
    "full_name",
    "email",
    "designation",
    "department",
    "total_experience_years",
    "location",
    "employment_type",
    "cost_rate",
    "currency",
    "availability_status",
    "available_from",
    "current_utilization_percentage",
    "is_active",
    "skills",
    "certifications",
}


# =========================================================
# Helpers
# =========================================================


def parse_bool(value: str | None) -> bool:
    if not value:
        return False

    return value.strip().lower() in {
        "true",
        "1",
        "yes",
        "y",
    }


def parse_date(
    value: str | None,
    field_name: str,
):
    if not value:
        return None

    value = value.strip()

    if not value:
        return None

    try:
        return datetime.strptime(
            value,
            "%Y-%m-%d",
        ).date()

    except ValueError as error:
        raise ValueError(
            f"{field_name} must use YYYY-MM-DD format"
        ) from error


def parse_float(
    value: str | None,
    field_name: str,
    default: float = 0,
) -> float:
    if value is None or not value.strip():
        return default

    try:
        return float(value)

    except ValueError as error:
        raise ValueError(
            f"{field_name} must be numeric"
        ) from error


def parse_decimal(
    value: str | None,
    field_name: str,
    default: Decimal = Decimal("0"),
) -> Decimal:
    if value is None or not value.strip():
        return default

    try:
        return Decimal(value)

    except InvalidOperation as error:
        raise ValueError(
            f"{field_name} must be numeric"
        ) from error


# =========================================================
# Skill parsing
#
# Format:
#
# AWS|ADVANCED|4;
# Python|INTERMEDIATE|2
# =========================================================


def parse_skills(
    value: str | None,
) -> list[dict]:
    if not value or not value.strip():
        return []

    parsed_skills = []

    skill_entries = value.split(";")

    for entry in skill_entries:
        entry = entry.strip()

        if not entry:
            continue

        parts = [
            item.strip()
            for item in entry.split("|")
        ]

        # Support both:
        #
        # Skill|Level|Experience
        #
        # OR
        #
        # Skill|Level|Experience|
        # CertificationName|
        # CertificationNumber|
        # CertificationExpiryDate

        if len(parts) not in {3, 6}:
            raise ValueError(
                "Each skill must use either "
                "'SkillName|ProficiencyLevel|ExperienceYears' "
                "or "
                "'SkillName|ProficiencyLevel|ExperienceYears|"
                "CertificationName|CertificationNumber|"
                "CertificationExpiryDate'"
            )

        skill_name = parts[0]

        proficiency_level = (
            parts[1].upper()
        )

        experience_years = parse_float(
            parts[2],
            f"experience_years for skill {skill_name}",
        )

        if not skill_name:
            raise ValueError(
                "Skill name cannot be empty"
            )

        if experience_years < 0:
            raise ValueError(
                "Skill experience cannot be negative"
            )

        certification_name = None
        certification_number = None
        certification_expiry_date = None

        if len(parts) == 6:
            certification_name = (
                parts[3] or None
            )

            certification_number = (
                parts[4] or None
            )

            certification_expiry_date = parse_date(
                parts[5],
                "certification_expiry_date",
            )

        parsed_skills.append(
            {
                "name": skill_name,
                "proficiency_level":
                    proficiency_level,

                "experience_years":
                    experience_years,

                "certification_name":
                    certification_name,

                "certification_number":
                    certification_number,

                "certification_expiry_date":
                    certification_expiry_date,
            }
        )

    return parsed_skills

# =========================================================
# Certification parsing
#
# Preferred format:
#
# Partner
# | Certification Name
# | Level
# | Number
# | Issued Date
# | Expiry Date
# | Verification URL
#
# Example:
#
# AWS|AWS Solutions Architect|ASSOCIATE|
# AWS-001|2026-01-01|2029-01-01|
# https://verify.example.com/aws-001
#
# Short format also supported:
#
# Partner|Name|Level|Number|ExpiryDate
# =========================================================


def parse_certifications(
    value: str | None,
) -> list[dict]:
    if not value or not value.strip():
        return []

    parsed_certifications = []

    certification_entries = value.split(";")

    for entry in certification_entries:
        entry = entry.strip()

        if not entry:
            continue

        parts = [
            item.strip()
            for item in entry.split("|")
        ]

        if len(parts) not in {
            5,
            7,
        }:
            raise ValueError(
                "Certification must use either "
                "'Partner|Name|Level|Number|ExpiryDate' "
                "or "
                "'Partner|Name|Level|Number|IssuedDate|"
                "ExpiryDate|VerificationURL'"
            )

        partner_name = parts[0]
        certification_name = parts[1]
        certification_level = (
            parts[2] or None
        )
        certification_number = (
            parts[3] or None
        )

        if not partner_name:
            raise ValueError(
                "Certification partner cannot be empty"
            )

        if not certification_name:
            raise ValueError(
                "Certification name cannot be empty"
            )

        if len(parts) == 5:
            issued_date = None

            expiry_date = parse_date(
                parts[4],
                "certification expiry date",
            )

            verification_url = None

        else:
            issued_date = parse_date(
                parts[4],
                "certification issued date",
            )

            expiry_date = parse_date(
                parts[5],
                "certification expiry date",
            )

            verification_url = (
                parts[6] or None
            )

        if (
            issued_date
            and expiry_date
            and expiry_date < issued_date
        ):
            raise ValueError(
                "Certification expiry date cannot "
                "be before issued date"
            )

        parsed_certifications.append(
            {
                "partner_name": partner_name,
                "certification_name":
                    certification_name,
                "certification_level":
                    certification_level,
                "certification_number":
                    certification_number,
                "issued_date": issued_date,
                "expiry_date": expiry_date,
                "verification_url":
                    verification_url,
            }
        )

    return parsed_certifications


# =========================================================
# Employee
# =========================================================


def get_employee_by_code(
    db: Session,
    employee_code: str,
):
    return db.scalar(
        select(Employee).where(
            Employee.employee_code
            == employee_code
        )
    )


def get_employee_by_email(
    db: Session,
    email: str,
):
    return db.scalar(
        select(Employee).where(
            func.lower(Employee.email)
            == email.lower()
        )
    )


# =========================================================
# Skills
# =========================================================


def get_skill_by_name(
    db: Session,
    skill_name: str,
):
    return db.scalar(
        select(Skill).where(
            func.lower(Skill.name)
            == skill_name.lower()
        )
    )


def get_or_create_skill(
    db: Session,
    skill_name: str,
):
    skill = get_skill_by_name(
        db,
        skill_name,
    )

    if skill:
        return skill, False

    skill = Skill(
        name=skill_name.strip(),
        category="HRMS_IMPORT",
        description=(
            "Skill imported from HRMS employee CSV"
        ),
        is_active=True,
    )

    db.add(skill)
    db.flush()

    return skill, True


def get_employee_skill(
    db: Session,
    employee_id: int,
    skill_id: int,
):
    return db.scalar(
        select(EmployeeSkill).where(
            EmployeeSkill.employee_id
            == employee_id,
            EmployeeSkill.skill_id
            == skill_id,
        )
    )


# =========================================================
# Partners / Certifications
# =========================================================


def get_partner_by_name(
    db: Session,
    partner_name: str,
):
    return db.scalar(
        select(Partner).where(
            func.lower(Partner.name)
            == partner_name.lower()
        )
    )


def get_existing_certification(
    db: Session,
    employee_id: int,
    partner_id: int,
    certification_name: str,
    certification_number: str | None,
):
    query = select(
        PartnerCertification
    ).where(
        PartnerCertification.employee_id
        == employee_id,
        PartnerCertification.partner_id
        == partner_id,
        func.lower(
            PartnerCertification.certification_name
        )
        == certification_name.lower(),
    )

    if certification_number:
        query = query.where(
            PartnerCertification.certification_number
            == certification_number
        )

    return db.scalar(query)


# =========================================================
# Main Import
# =========================================================


def import_employees_from_csv(
    db: Session,
    file: UploadFile,
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file is required",
        )

    if not file.filename.lower().endswith(
        ".csv"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are supported",
        )

    # -----------------------------------------------------
    # Read CSV
    # -----------------------------------------------------

    try:
        raw_content = file.file.read()

        content = raw_content.decode(
            "utf-8-sig"
        )

    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file must use UTF-8 encoding",
        ) from error

    reader = csv.DictReader(
        io.StringIO(content)
    )

    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV file has no header",
        )

    headers = {
        header.strip()
        for header in reader.fieldnames
        if header
    }

    missing_columns = (
        REQUIRED_COLUMNS
        - headers
    )

    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message":
                    "CSV is missing required columns",
                "missing_columns":
                    sorted(missing_columns),
            },
        )

    # -----------------------------------------------------
    # Counters
    # -----------------------------------------------------

    rows_processed = 0

    employees_created = 0
    employees_updated = 0

    skills_created = 0

    employee_skills_created = 0
    employee_skills_updated = 0

    certifications_created = 0
    certifications_updated = 0

    failed_rows = 0

    errors = []

    # -----------------------------------------------------
    # Process CSV
    # -----------------------------------------------------

    for row_number, row in enumerate(
        reader,
        start=2,
    ):
        rows_processed += 1

        try:
            # =============================================
            # Basic employee values
            # =============================================

            employee_code = (
                row["employee_code"]
                .strip()
                .upper()
            )

            full_name = (
                row["full_name"]
                .strip()
            )

            email = (
                row["email"]
                .strip()
                .lower()
            )

            designation = (
                row["designation"]
                .strip()
            )

            if not employee_code:
                raise ValueError(
                    "employee_code is required"
                )

            if not full_name:
                raise ValueError(
                    "full_name is required"
                )

            if not email:
                raise ValueError(
                    "email is required"
                )

            if not designation:
                raise ValueError(
                    "designation is required"
                )

            total_experience = parse_float(
                row[
                    "total_experience_years"
                ],
                "total_experience_years",
            )

            cost_rate = parse_decimal(
                row["cost_rate"],
                "cost_rate",
            )

            utilization = parse_float(
                row[
                    "current_utilization_percentage"
                ],
                "current_utilization_percentage",
            )

            if (
                utilization < 0
                or utilization > 100
            ):
                raise ValueError(
                    "current_utilization_percentage "
                    "must be between 0 and 100"
                )

            available_from = parse_date(
                row["available_from"],
                "available_from",
            )

            # =============================================
            # Parse skills & certifications BEFORE
            # making database changes
            # =============================================

            parsed_skills = parse_skills(
                row.get("skills")
            )

            parsed_certifications = (
                parse_certifications(
                    row.get(
                        "certifications"
                    )
                )
            )

            # =============================================
            # Resolve certification partners first
            #
            # This makes sure we don't partially import
            # an employee and later discover partner
            # does not exist.
            # =============================================

            resolved_certifications = []

            for certification in (
                parsed_certifications
            ):
                partner = get_partner_by_name(
                    db,
                    certification[
                        "partner_name"
                    ],
                )

                if not partner:
                    raise ValueError(
                        "Partner "
                        f"'{certification['partner_name']}' "
                        "does not exist. Create the "
                        "partner in Alliance module first."
                    )

                if not partner.is_active:
                    raise ValueError(
                        "Partner "
                        f"'{partner.name}' is inactive"
                    )

                resolved_certifications.append(
                    (
                        partner,
                        certification,
                    )
                )

            # =============================================
            # Find employee
            # =============================================

            employee = get_employee_by_code(
                db,
                employee_code,
            )

            email_employee = (
                get_employee_by_email(
                    db,
                    email,
                )
            )

            if (
                email_employee
                and (
                    employee is None
                    or email_employee.id
                    != employee.id
                )
            ):
                raise ValueError(
                    "Email already belongs to "
                    "another employee"
                )

            employee_data = {
                "employee_code":
                    employee_code,

                "full_name":
                    full_name,

                "email":
                    email,

                "designation":
                    designation,

                "department":
                    row["department"].strip()
                    or None,

                "total_experience_years":
                    total_experience,

                "location":
                    row["location"].strip()
                    or None,

                "employment_type":
                    row[
                        "employment_type"
                    ].strip().upper()
                    or "FULL_TIME",

                "cost_rate":
                    cost_rate,

                "currency":
                    row["currency"]
                    .strip()
                    .upper()
                    or "INR",

                "availability_status":
                    row[
                        "availability_status"
                    ]
                    .strip()
                    .upper()
                    or "AVAILABLE",

                "available_from":
                    available_from,

                "current_utilization_percentage":
                    utilization,

                "is_active":
                    parse_bool(
                        row["is_active"]
                    ),
            }

            # =============================================
            # CREATE / UPDATE EMPLOYEE
            # =============================================

            if employee is None:
                employee = Employee(
                    **employee_data
                )

                db.add(employee)

                # Need employee.id for skill mappings
                db.flush()

                employees_created += 1

            else:
                for (
                    field_name,
                    value,
                ) in employee_data.items():
                    setattr(
                        employee,
                        field_name,
                        value,
                    )

                db.flush()

                employees_updated += 1

            # =============================================
            # SKILLS
            # =============================================

            for skill_data in parsed_skills:

                skill, was_created = (
                    get_or_create_skill(
                        db,
                        skill_data["name"],
                    )
                )

                if was_created:
                    skills_created += 1

                employee_skill = (
                    get_employee_skill(
                        db,
                        employee.id,
                        skill.id,
                    )
                )

                if employee_skill:
                    employee_skill.proficiency_level = (
                        skill_data["proficiency_level"]
                    )

                    employee_skill.experience_years = (
                        skill_data["experience_years"]
                    )

                    employee_skill.certification_name = (
                        skill_data["certification_name"]
                    )

                    employee_skill.certification_number = (
                        skill_data["certification_number"]
                    )

                    employee_skill.certification_expiry_date = (
                        skill_data[
                            "certification_expiry_date"
                        ]
                    )

                    employee_skills_updated += 1

                else:
                    employee_skill = EmployeeSkill(
                        employee_id=employee.id,

                        skill_id=skill.id,

                        proficiency_level=(
                            skill_data["proficiency_level"]
                        ),

                        experience_years=(
                            skill_data["experience_years"]
                        ),

                        certification_name=(
                            skill_data["certification_name"]
                        ),

                        certification_number=(
                            skill_data["certification_number"]
                        ),

                        certification_expiry_date=(
                            skill_data[
                                "certification_expiry_date"
                            ]
                        ),
                    )

                    db.add(
                        employee_skill
                    )

                    employee_skills_created += 1

            # =============================================
            # PARTNER CERTIFICATIONS
            # =============================================

            for (
                partner,
                certification,
            ) in resolved_certifications:

                existing_certification = (
                    get_existing_certification(
                        db=db,
                        employee_id=employee.id,
                        partner_id=partner.id,
                        certification_name=(
                            certification[
                                "certification_name"
                            ]
                        ),
                        certification_number=(
                            certification[
                                "certification_number"
                            ]
                        ),
                    )
                )

                if existing_certification:
                    existing_certification.certification_level = (
                        certification[
                            "certification_level"
                        ]
                    )

                    existing_certification.certification_number = (
                        certification[
                            "certification_number"
                        ]
                    )

                    existing_certification.issued_date = (
                        certification[
                            "issued_date"
                        ]
                    )

                    existing_certification.expiry_date = (
                        certification[
                            "expiry_date"
                        ]
                    )

                    existing_certification.verification_url = (
                        certification[
                            "verification_url"
                        ]
                    )

                    existing_certification.is_active = True

                    certifications_updated += 1

                else:
                    new_certification = (
                        PartnerCertification(
                            partner_id=partner.id,
                            employee_id=employee.id,
                            certification_name=(
                                certification[
                                    "certification_name"
                                ]
                            ),
                            certification_level=(
                                certification[
                                    "certification_level"
                                ]
                            ),
                            certification_number=(
                                certification[
                                    "certification_number"
                                ]
                            ),
                            issued_date=(
                                certification[
                                    "issued_date"
                                ]
                            ),
                            expiry_date=(
                                certification[
                                    "expiry_date"
                                ]
                            ),
                            verification_url=(
                                certification[
                                    "verification_url"
                                ]
                            ),
                            is_active=True,
                        )
                    )

                    db.add(
                        new_certification
                    )

                    certifications_created += 1

            # =============================================
            # Commit ONE complete employee row
            #
            # Employee + Skills + Mapping +
            # Certifications all succeed together.
            # =============================================

            db.commit()

        except (
            ValueError,
            TypeError,
            IntegrityError,
        ) as error:
            db.rollback()

            failed_rows += 1

            errors.append(
                {
                    "row":
                        row_number,

                    "employee_code":
                        row.get(
                            "employee_code",
                            "",
                        ),

                    "message":
                        str(error),
                }
            )

        except Exception as error:
            db.rollback()

            failed_rows += 1

            errors.append(
                {
                    "row":
                        row_number,

                    "employee_code":
                        row.get(
                            "employee_code",
                            "",
                        ),

                    "message":
                        str(error),
                }
            )

    # =====================================================
    # Response
    # =====================================================

    return {
        "message":
            "HRMS data imported successfully",

        "rows_processed":
            rows_processed,

        "employees_created":
            employees_created,

        "employees_updated":
            employees_updated,

        "skills_created":
            skills_created,

        "employee_skills_created":
            employee_skills_created,

        "employee_skills_updated":
            employee_skills_updated,

        "certifications_created":
            certifications_created,

        "certifications_updated":
            certifications_updated,

        "failed_rows":
            failed_rows,

        "errors":
            errors,
    }