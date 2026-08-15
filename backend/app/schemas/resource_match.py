from datetime import date

from pydantic import BaseModel, ConfigDict


class ResourceMatchResponse(BaseModel):
    employee_id: int
    employee_code: str
    full_name: str
    designation: str

    skill_id: int
    required_skill: str
    skill_proficiency: str
    skill_experience_years: float

    total_experience_years: float

    availability_status: str
    available_from: date | None
    current_utilization_percentage: float

    requested_allocation_percentage: float
    remaining_capacity_percentage: float

    skill_match_score: float
    experience_match_score: float
    availability_match_score: float
    utilization_match_score: float

    match_score: float

    match_status: str

    model_config = ConfigDict(from_attributes=True)