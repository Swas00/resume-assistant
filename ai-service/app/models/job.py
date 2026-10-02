from typing import List, Optional

from pydantic import BaseModel, Field


class JobParsed(BaseModel):
    """Structured data extracted from a job description"""

    job_title: Optional[str] = None
    company: Optional[str] = None
    required_skills: List[str] = []
    nice_to_have_skills: List[str] = []
    experience_level: Optional[str] = None  # "entry", "mid", "senior"
    salary_range: Optional[str] = None  # e.g. "500k-700k"
    location: Optional[str] = None
    job_type: Optional[str] = None  # "full-time", "contract", etc.
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)  # 0-1


class ParseJobResponse(BaseModel):
    """Response from the job parser"""

    success: bool
    message: str
    data: Optional[JobParsed] = None
