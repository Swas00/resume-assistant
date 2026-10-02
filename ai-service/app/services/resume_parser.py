"""Rule-based + spaCy resume parser: raw resume text -> ParsedResume."""
import re
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

from dateutil import parser as date_parser

from app.models.resume import Certification, Education, Experience, ParsedResume
from app.utils.logger import logger

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
PHONE_RE = re.compile(r"(?<!\w)(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)|\d{2,4})[\s.-]?\d{3}[\s.-]?\d{3,4}(?!\w)")
GPA_RE = re.compile(r"GPA[:\s]*([0-4](?:\.\d{1,2})?)", re.I)
YEAR_RE = re.compile(r"\b(19|20)\d{2}\b")

_MONTH = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?"
_DATE = rf"(?:{_MONTH}\s+\d{{4}}|\d{{1,2}}/\d{{4}}|\d{{4}})"
DATE_RANGE_RE = re.compile(
    rf"(?P<start>{_DATE})\s*(?:-|–|—|to)\s*(?P<end>{_DATE}|Present|Current|Now)", re.I
)

SECTION_HEADINGS: Dict[str, List[str]] = {
    "summary": ["summary", "profile", "objective", "about me", "professional summary"],
    "skills": ["skills", "technical skills", "core competencies", "technologies"],
    "experience": ["experience", "work experience", "professional experience", "employment history", "employment"],
    "education": ["education", "academic background", "qualifications"],
    "certifications": ["certifications", "certificates", "licenses", "training", "courses"],
}

DEGREE_RE = re.compile(
    r"\b(B\.?\s?S\.?c?|B\.?\s?A\.?|B\.?\s?Tech|B\.?\s?E\.?|M\.?\s?S\.?c?|M\.?\s?A\.?|M\.?\s?Tech|MBA|Ph\.?D\.?"
    r"|Bachelor(?:'s)?(?:\s+of\s+\w+)?|Master(?:'s)?(?:\s+of\s+\w+)?|Associate(?:'s)?|Doctor(?:ate)?)\b",
    re.I,
)
SCHOOL_RE = re.compile(r"\b(University|College|Institute|School|Academy|Polytechnic)\b", re.I)

# Common skills matched anywhere in the text (in addition to the Skills section)
KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "SQL",
    "React", "Angular", "Vue", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring", "Next.js",
    "MongoDB", "PostgreSQL", "MySQL", "Redis", "GraphQL", "REST", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
    "Git", "CI/CD", "Linux", "TensorFlow", "PyTorch", "Pandas", "NumPy", "spaCy", "HTML", "CSS", "Tailwind",
    "Machine Learning", "NLP", "Agile", "Scrum",
]


@lru_cache(maxsize=1)
def _load_nlp():
    """Load the spaCy model once; fall back to regex-only parsing if unavailable."""
    try:
        import spacy

        return spacy.load("en_core_web_sm")
    except Exception as exc:  # model not installed, etc.
        logger.warning(f"spaCy model unavailable, using regex-only parsing: {exc}")
        return None


def _month_index(value: str) -> Optional[int]:
    """'Jan 2020' / '01/2020' / '2020' -> months since year 0, or None."""
    if re.fullmatch(r"present|current|now", value.strip(), re.I):
        from datetime import date

        today = date.today()
        return today.year * 12 + today.month
    try:
        d = date_parser.parse(value, default=date_parser.parse("2000-01-01"))
    except (ValueError, OverflowError):
        return None
    return d.year * 12 + d.month


def _normalize_date(value: str) -> Optional[str]:
    """Return 'YYYY-MM' (or 'Present')."""
    if re.fullmatch(r"present|current|now", value.strip(), re.I):
        return "Present"
    idx = _month_index(value)
    if idx is None:
        return None
    year, month = divmod(idx - 1, 12)
    return f"{year:04d}-{month + 1:02d}"


def _heading(line: str) -> Optional[str]:
    """Return the section key if the line is a section heading."""
    cleaned = re.sub(r"[^a-z ]", "", line.lower()).strip()
    if not cleaned or len(cleaned) > 30:
        return None
    for key, names in SECTION_HEADINGS.items():
        if cleaned in names:
            return key
    return None


def _split_sections(lines: List[str]) -> Tuple[List[str], Dict[str, List[str]]]:
    header: List[str] = []
    sections: Dict[str, List[str]] = {}
    current: Optional[str] = None
    for line in lines:
        key = _heading(line)
        if key:
            current = key
            sections.setdefault(key, [])
        elif current is None:
            header.append(line)
        else:
            sections[current].append(line)
    return header, sections


def _strip_bullet(line: str) -> str:
    return re.sub(r"^\s*[•\-*▪●·]+\s*", "", line).strip()


class ResumeParser:
    """Extract structured data from raw resume text."""

    @classmethod
    def parse(cls, text: str) -> ParsedResume:
        lines = [ln.strip() for ln in text.replace("\r", "").split("\n")]
        non_empty = [ln for ln in lines if ln]
        header, sections = _split_sections(non_empty)

        nlp = _load_nlp()
        email = cls._email(text)
        phone = cls._phone(text)
        name = cls._name(header or non_empty[:5], nlp)
        location = cls._location(header or non_empty[:8], nlp)
        skills = cls._skills(text, sections.get("skills", []))
        experiences = cls._experiences(sections.get("experience", []))
        education = cls._education(sections.get("education", []))
        certifications = cls._certifications(sections.get("certifications", []))
        summary = " ".join(sections.get("summary", [])).strip() or None

        found = [
            (0.15, bool(name)),
            (0.15, bool(email)),
            (0.10, bool(phone)),
            (0.20, bool(skills)),
            (0.25, bool(experiences)),
            (0.15, bool(education)),
        ]
        confidence = round(sum(w for w, ok in found if ok), 2)

        return ParsedResume(
            name=name,
            email=email,
            phone=phone,
            location=location,
            summary=summary,
            skills=skills,
            experiences=experiences,
            education=education,
            certifications=certifications,
            confidence=confidence,
            raw_text=text,
        )

    # -- contact info -------------------------------------------------------

    @staticmethod
    def _email(text: str) -> Optional[str]:
        m = EMAIL_RE.search(text)
        return m.group(0) if m else None

    @staticmethod
    def _phone(text: str) -> Optional[str]:
        for m in PHONE_RE.finditer(text):
            candidate = m.group(0).strip()
            if len(re.sub(r"\D", "", candidate)) >= 10 and not DATE_RANGE_RE.search(candidate):
                return candidate
        return None

    @staticmethod
    def _name(top_lines: List[str], nlp) -> Optional[str]:
        candidates = [ln for ln in top_lines[:5] if not EMAIL_RE.search(ln) and not re.search(r"\d", ln)]
        if nlp is not None:
            for ln in candidates:
                for ent in nlp(ln).ents:
                    if ent.label_ == "PERSON":
                        return ent.text.strip()
        for ln in candidates:
            words = ln.split()
            if 1 < len(words) <= 4 and all(w[0].isupper() for w in words if w[0].isalpha()):
                return ln
        return None

    @staticmethod
    def _location(top_lines: List[str], nlp) -> Optional[str]:
        for ln in top_lines:
            m = re.search(r"([A-Z][a-zA-Z .]+,\s*[A-Z][a-zA-Z .]{1,})", ln)
            if m and not EMAIL_RE.search(m.group(1)):
                return m.group(1).strip()
        if nlp is not None:
            for ln in top_lines:
                for ent in nlp(ln).ents:
                    if ent.label_ == "GPE":
                        return ent.text.strip()
        return None

    # -- skills -------------------------------------------------------------

    @staticmethod
    def _skills(text: str, skills_lines: List[str]) -> List[str]:
        found: Dict[str, str] = {}
        for ln in skills_lines:
            body = ln.split(":", 1)[1] if ":" in ln else ln
            for part in re.split(r"[,;|•·●▪]|\s{2,}", _strip_bullet(body)):
                part = part.strip(" .-")
                if 1 < len(part) <= 40:
                    found.setdefault(part.lower(), part)
        for skill in KNOWN_SKILLS:
            if re.search(rf"(?<![\w+#.]){re.escape(skill)}(?![\w+#])", text, re.I):
                found.setdefault(skill.lower(), skill)
        return list(found.values())

    # -- experience ---------------------------------------------------------

    @classmethod
    def _experiences(cls, lines: List[str]) -> List[Experience]:
        entries: List[dict] = []
        previous_plain: Optional[str] = None
        for ln in lines:
            m = DATE_RANGE_RE.search(ln)
            if m:
                head = DATE_RANGE_RE.sub("", ln).strip(" ,|()-–—@")
                if not head and previous_plain:
                    head, previous_plain = previous_plain, None
                    if entries and entries[-1]["desc"] and entries[-1]["desc"][-1] == head:
                        entries[-1]["desc"].pop()  # the title line was captured as description
                entries.append({"head": head, "start": m.group("start"), "end": m.group("end"), "desc": []})
            elif entries:
                entries[-1]["desc"].append(_strip_bullet(ln))
                previous_plain = _strip_bullet(ln)
            else:
                previous_plain = _strip_bullet(ln)

        result: List[Experience] = []
        for e in entries:
            title, company = cls._split_title_company(e["head"])
            if not title:
                continue
            start_idx, end_idx = _month_index(e["start"]), _month_index(e["end"])
            months = end_idx - start_idx if start_idx and end_idx and end_idx >= start_idx else None
            result.append(
                Experience(
                    job_title=title,
                    company=company,
                    start_date=_normalize_date(e["start"]),
                    end_date=_normalize_date(e["end"]),
                    description=" ".join(d for d in e["desc"] if d) or None,
                    duration_months=months,
                )
            )
        return result

    @staticmethod
    def _split_title_company(head: str) -> Tuple[str, str]:
        parts = [p.strip() for p in re.split(r"\s+at\s+|\s*[|,@]\s*|\s+[-–—]\s+", head, maxsplit=1) if p.strip()]
        if len(parts) == 2:
            return parts[0], parts[1]
        return (parts[0] if parts else ""), ""

    # -- education ----------------------------------------------------------

    @staticmethod
    def _education(lines: List[str]) -> List[Education]:
        result: List[Education] = []
        cleaned = [_strip_bullet(ln) for ln in lines]
        for i, ln in enumerate(cleaned):
            degree_m = DEGREE_RE.search(ln)
            if not degree_m:
                continue
            window = [ln] + cleaned[max(0, i - 1) : i] + cleaned[i + 1 : i + 3]
            school = next((w for w in window if SCHOOL_RE.search(w)), "")
            school_name = ""
            if school:
                m = re.search(r"([A-Z][\w&.'\- ]*\b(?:University|College|Institute|School|Academy|Polytechnic)\b[\w&.'\- ]*)", school)
                school_name = (m.group(1) if m else school).strip(" ,|-")
            field_m = re.search(r"\b(?:in|of)\s+([A-Z][A-Za-z &]+?)(?:,|\||\(|\s+-|$)", ln[degree_m.end() :])
            gpa_m = next((GPA_RE.search(w) for w in window if GPA_RE.search(w)), None)
            year_m = next((YEAR_RE.search(w) for w in window if YEAR_RE.search(w)), None)
            result.append(
                Education(
                    degree=degree_m.group(0).strip(),
                    school=school_name,
                    field=field_m.group(1).strip() if field_m else None,
                    graduation_year=int(year_m.group(0)) if year_m else None,
                    gpa=gpa_m.group(1) if gpa_m else None,
                )
            )
        return result

    # -- certifications -----------------------------------------------------

    @staticmethod
    def _certifications(lines: List[str]) -> List[Certification]:
        result: List[Certification] = []
        for ln in lines:
            text = _strip_bullet(ln)
            if len(text) < 3:
                continue
            year_m = YEAR_RE.search(text)
            body = YEAR_RE.sub("", text).strip(" ,|()-–—")
            parts = [p.strip() for p in re.split(r"\s+[-–—]\s+|\s*[|,]\s*", body, maxsplit=1) if p.strip()]
            result.append(
                Certification(
                    name=parts[0] if parts else body,
                    issuer=parts[1] if len(parts) > 1 else None,
                    date=year_m.group(0) if year_m else None,
                )
            )
        return result
