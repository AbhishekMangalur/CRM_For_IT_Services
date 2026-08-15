from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.resource_manager import (
    Employee,
    EmployeeSkill,
    ResourceRequest,
    Skill,
)


PROFICIENCY_SCORE = {
    "BEGINNER": 40,
    "INTERMEDIATE": 70,
    "ADVANCED": 90,
    "EXPERT": 100,
}


def get_matching_resources(
    db: Session,
    request_id: int,
):
    # =====================================================
    # 1. Get Resource Request
    # =====================================================

    resource_request = db.get(
        ResourceRequest,
        request_id,
    )

    if not resource_request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource request not found",
        )

    required_skill = (
        resource_request.required_skill
        .strip()
        .lower()
    )

    requested_allocation = float(
        resource_request.allocation_percentage
    )

    minimum_experience = float(
        resource_request.minimum_experience_years
    )

    # =====================================================
    # 2. Find employee skills matching requested skill
    # =====================================================

    employee_skills = (
        db.query(EmployeeSkill)
        .join(
            Skill,
            EmployeeSkill.skill_id == Skill.id,
        )
        .join(
            Employee,
            EmployeeSkill.employee_id == Employee.id,
        )
        .filter(
            Employee.is_active.is_(True)
        )
        .all()
    )

    matches = []

    # =====================================================
    # 3. Evaluate employees
    # =====================================================

    for employee_skill in employee_skills:

        employee = employee_skill.employee
        skill = employee_skill.skill

        # -------------------------------------------------
        # Skill name matching
        # -------------------------------------------------

        employee_skill_name = (
            skill.name
            .strip()
            .lower()
        )

        if employee_skill_name != required_skill:
            continue

        # -------------------------------------------------
        # Availability status
        # -------------------------------------------------

        availability_status = (
            employee.availability_status
            or ""
        ).upper()

        if availability_status not in {
            "AVAILABLE",
            "PARTIALLY_AVAILABLE",
        }:
            continue

        # -------------------------------------------------
        # Skill experience
        # -------------------------------------------------

        skill_experience = float(
            employee_skill.experience_years or 0
        )

        if skill_experience < minimum_experience:
            continue

        # -------------------------------------------------
        # Capacity check
        # -------------------------------------------------

        current_utilization = float(
            employee.current_utilization_percentage
            or 0
        )

        remaining_capacity = (
            100 - current_utilization
        )

        if remaining_capacity < requested_allocation:
            continue

        # =================================================
        # 4. Skill score
        # =================================================

        proficiency = (
            employee_skill.proficiency_level
            or ""
        ).upper()

        skill_score = PROFICIENCY_SCORE.get(
            proficiency,
            0,
        )

        # =================================================
        # 5. Experience score
        # =================================================

        if minimum_experience <= 0:
            experience_score = 100.0

        else:
            experience_score = min(
                (
                    skill_experience
                    / minimum_experience
                )
                * 100,
                100,
            )

        # =================================================
        # 6. Availability score
        # =================================================

        if availability_status == "AVAILABLE":
            availability_score = 100.0

        else:
            availability_score = 70.0

        # =================================================
        # 7. Utilization score
        # =================================================

        utilization_score = max(
            0,
            min(
                remaining_capacity,
                100,
            ),
        )

        # =================================================
        # 8. Final weighted score
        # =================================================

        final_score = round(
            (
                skill_score * 0.35
                + experience_score * 0.30
                + availability_score * 0.20
                + utilization_score * 0.15
            ),
            2,
        )

        # =================================================
        # 9. Match classification
        # =================================================

        if final_score >= 90:
            match_status = "EXCELLENT"

        elif final_score >= 75:
            match_status = "GOOD"

        elif final_score >= 60:
            match_status = "MODERATE"

        else:
            match_status = "LOW"

        # =================================================
        # 10. Add result
        # =================================================

        matches.append(
            {
                "employee_id": employee.id,
                "employee_code": employee.employee_code,
                "full_name": employee.full_name,
                "designation": employee.designation,

                "skill_id": skill.id,
                "required_skill": skill.name,

                "skill_proficiency":
                    employee_skill.proficiency_level,

                "skill_experience_years":
                    skill_experience,

                "total_experience_years":
                    float(
                        employee.total_experience_years
                        or 0
                    ),

                "availability_status":
                    employee.availability_status,

                "available_from":
                    employee.available_from,

                "current_utilization_percentage":
                    current_utilization,

                "requested_allocation_percentage":
                    requested_allocation,

                "remaining_capacity_percentage":
                    remaining_capacity,

                "skill_match_score":
                    float(skill_score),

                "experience_match_score":
                    round(
                        experience_score,
                        2,
                    ),

                "availability_match_score":
                    availability_score,

                "utilization_match_score":
                    utilization_score,

                "match_score":
                    final_score,

                "match_status":
                    match_status,
            }
        )

    # =====================================================
    # 11. Best matches first
    # =====================================================

    matches.sort(
        key=lambda item: item["match_score"],
        reverse=True,
    )

    return matches