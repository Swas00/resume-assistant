"""Rule-based job description parser: raw text -> JobParsed."""
import re
from typing import List, Optional, Tuple

from app.models.job import JobParsed

# Canonical skill names (lowercase) matched on word boundaries
SKILL_KEYWORDS = [
    "python", "javascript", "typescript", "java", "c++", "c#", "golang", "rust",
    "react", "vue", "angular", "node.js", "express", "django", "flask", "fastapi",
    "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
    "aws", "azure", "gcp", "docker", "kubernetes", "jenkins",
    "git", "sql", "html", "css", "rest", "graphql", "grpc",
    "machine learning", "deep learning", "nlp", "computer vision", "tensorflow", "pytorch",
    "agile", "scrum", "ci/cd", "devops", "microservices",
]
# Variants that should be reported under the canonical name
SKILL_ALIASES = {"postgres": "postgresql", "node": "node.js", "nodejs": "node.js", "k8s": "kubernetes", "go": "golang"}

# Matched in the job title first, then years of experience, then the body
LEVEL_KEYWORDS = {
    "senior": ["senior", "sr", "lead", "principal", "staff"],
    "entry": ["entry-level", "entry level", "fresher", "junior", "jr", "graduate", "intern"],
    "mid": ["mid-level", "mid level", "intermediate"],
}

JOB_TYPES = [
    ("full-time", r"full[\s-]?time"),
    ("part-time", r"part[\s-]?time"),
    ("internship", r"internship"),
    ("contract", r"contract(?:or)?\b"),
    ("freelance", r"freelance"),
]

_CUR = r"(?:[$₹€£]|usd|inr|rs\.?)"
_AMOUNT = r"\d[\d,]*(?:\.\d+)?\s?(?:[kKmM]|lpa|lakhs?)?"
SALARY_RES = [
    re.compile(rf"{_CUR}\s?{_AMOUNT}(?:\s?(?:-|–|—|to)\s?{_CUR}?\s?{_AMOUNT})?", re.I),
    re.compile(r"\d+(?:\.\d+)?\s?(?:-|–|—|to)\s?\d+(?:\.\d+)?\s?(?:lpa|lakhs?|k)\b", re.I),
]

NICE_RE = re.compile(r"nice[\s-]to[\s-]have|good[\s-]to[\s-]have|preferred|bonus|a plus|desired|optional", re.I)
SECTION_RE = re.compile(r"^\W*(requirements?|qualifications?|responsibilities|what you.{0,6}(?:do|need|bring)|must[\s-]have|required|about)\b", re.I)


def _skill_pattern(skill: str) -> re.Pattern:
    # Not preceded/followed by word chars or + # . so 'java' != 'javascript', 'c' != 'c++'
    return re.compile(rf"(?<![\w+#.]){re.escape(skill)}(?![\w+#])", re.I)


_SKILL_PATTERNS = [(s, _skill_pattern(s)) for s in SKILL_KEYWORDS]
_ALIAS_PATTERNS = [(canon, _skill_pattern(alias)) for alias, canon in SKILL_ALIASES.items()]


def _skills_in(line: str) -> List[str]:
    found = [s for s, pat in _SKILL_PATTERNS if pat.search(line)]
    found += [canon for canon, pat in _ALIAS_PATTERNS if pat.search(line) and canon not in found]
    return found


class JobParser:
    @staticmethod
    def parse_job(job_text: str) -> JobParsed:
        """Parse a job description and extract key information."""
        lines = [ln.strip() for ln in job_text.replace("\r", "").split("\n") if ln.strip()]

        job_title, company, location = JobParser._title_company_location(lines, job_text)
        job_type = JobParser._job_type(job_text)
        salary_range = JobParser._salary(job_text)
        required, nice = JobParser._skills(lines)
        experience_level = JobParser._level(job_title, job_text)

        if not location and re.search(r"\bremote\b", job_text, re.I):
            location = "Remote"

        fields_found = sum(
            bool(v) for v in (job_title, company, location, job_type, salary_range, required, experience_level)
        )

        return JobParsed(
            job_title=job_title,
            company=company,
            required_skills=required,
            nice_to_have_skills=nice,
            experience_level=experience_level,
            salary_range=salary_range,
            location=location,
            job_type=job_type,
            confidence_score=round(fields_found / 7.0, 2),
        )

    # -- title / company / location ----------------------------------------

    @staticmethod
    def _label(text: str, labels: str) -> Optional[str]:
        m = re.search(rf"^\s*(?:{labels})\s*[:\-–]\s*(.+?)\s*$", text, re.I | re.M)
        return m.group(1).strip() if m else None

    @staticmethod
    def _title_company_location(lines: List[str], text: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        job_title = JobParser._label(text, "job title|position|role|title")
        company = JobParser._label(text, "company|employer|organization|organisation")
        location = JobParser._label(text, "location|based in|city")

        first = next((ln for ln in lines[:5] if 3 < len(ln) <= 150), None)
        if first and not job_title:
            # "Senior Python Developer at Google in Bangalore" / "Title @ Company - City"
            m = re.match(r"^(?P<title>.+?)\s+(?:at|@)\s+(?P<rest>.+)$", first, re.I)
            if m:
                job_title = m.group("title").strip(" -–|,")
                rest = m.group("rest")
                parts = re.split(r"\s+(?:in|based in)\s+|\s+[-–|]\s+|,\s*", rest, maxsplit=1, flags=re.I)
                company = company or parts[0].strip()
                if len(parts) > 1 and not location:
                    location = parts[1].strip(" .")
            else:
                job_title = re.split(r"\s+[-–|]\s+", first, maxsplit=1)[0].strip()

        if not company:
            m = re.search(r"^\s*([A-Z][\w&.\- ]{1,40}?)\s+is\s+(?:hiring|looking for|seeking)", text, re.M)
            if m:
                company = m.group(1).strip()

        return job_title, company, location

    # -- type / salary / level ---------------------------------------------

    @staticmethod
    def _job_type(text: str) -> Optional[str]:
        for name, pattern in JOB_TYPES:
            if re.search(pattern, text, re.I):
                return name
        return None

    @staticmethod
    def _salary(text: str) -> Optional[str]:
        for pattern in SALARY_RES:
            m = pattern.search(text)
            if m:
                return re.sub(r"\s+", " ", m.group(0)).strip()
        return None

    @staticmethod
    def _level(title: Optional[str], text: str) -> Optional[str]:
        def by_keywords(haystack: str) -> Optional[str]:
            for level, words in LEVEL_KEYWORDS.items():
                if any(re.search(rf"(?<![\w-]){re.escape(w)}(?![\w])", haystack, re.I) for w in words):
                    return level
            return None

        if title:
            level = by_keywords(title)
            if level:
                return level

        # Years of experience: "5+ years", "3-5 years" -> use the lower bound
        years = [int(m.group(1)) for m in re.finditer(r"(\d{1,2})\s*\+?\s*(?:-|–|to)?\s*\d{0,2}\s*\+?\s*years?", text, re.I)]
        if years:
            lowest = min(years)
            return "entry" if lowest < 2 else "mid" if lowest < 5 else "senior"

        return by_keywords(text)

    # -- skills -------------------------------------------------------------

    @staticmethod
    def _skills(lines: List[str]) -> Tuple[List[str], List[str]]:
        """Skills under a nice-to-have heading (or on a nice-to-have line) go to
        nice_to_have; anything also mentioned elsewhere counts as required."""
        required: List[str] = []
        nice: List[str] = []
        in_nice_section = False

        for line in lines:
            if NICE_RE.search(line):
                if len(line) < 60:  # a heading: following lines belong to the section
                    in_nice_section = True
                is_nice = True
            else:
                if SECTION_RE.match(line) and len(line) < 60:
                    in_nice_section = False
                is_nice = in_nice_section

            for skill in _skills_in(line):
                target = nice if is_nice else required
                if skill not in target:
                    target.append(skill)

        nice = [s for s in nice if s not in required]
        return required, nice
