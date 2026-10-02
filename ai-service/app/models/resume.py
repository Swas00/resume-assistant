from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class Experience(BaseModel):
    """Work experience section"""

    job_title: str
    company: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None


class Education(BaseModel):
    """Education section"""

    degree: str
    school: str
    field: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[str] = None


class Certification(BaseModel):
    """Certification/Training"""

    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None


class ParsedResume(BaseModel):
    """Complete parsed resume structure"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "phone": "+1234567890",
                "location": "New York, USA",
                "skills": ["Python", "JavaScript", "React"],
                "experiences": [
                    {
                        "job_title": "Senior Developer",
                        "company": "TechCorp",
                        "start_date": "2020-01",
                        "end_date": "2023-12",
                        "description": "Led development of mobile app",
                    }
                ],
                "education": [
                    {
                        "degree": "B.S.",
                        "school": "Stanford University",
                        "field": "Computer Science",
                        "graduation_year": 2020,
                        "gpa": "3.8",
                    }
                ],
                "certifications": [
                    {
                        "name": "AWS Certified Solutions Architect",
                        "issuer": "Amazon",
                        "date": "2022",
                    }
                ],
                "confidence": 0.85,
            }
        }
    )

    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    summary: Optional[str] = None

    skills: List[str] = []

    experiences: List[Experience] = []
    education: List[Education] = []
    certifications: List[Certification] = []

    # Metadata
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="0-1 parse confidence")
    raw_text: str = ""


class ParseRequest(BaseModel):
    """Request to parse resume text"""

    text: str


class ParseResponse(BaseModel):
    """Response from parser"""

    success: bool
    message: str
    data: Optional[ParsedResume] = None
