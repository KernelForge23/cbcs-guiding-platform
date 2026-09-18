import json
import os
import math 
import re
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Path as FastAPIPath
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from api.database import Base, SessionLocal, engine
from api.models import Testimonial
from api.routers.testimonials import router as testimonials_router

root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / ".env.local")
load_dotenv(root_dir / ".env")
load_dotenv()

cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allowed_origins = ["*"]

app = FastAPI()
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(testimonials_router)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok"}

COURSES_PATH = Path(__file__).parent / "courses.json"

BRANCH_CLUSTERS: dict[str, str] = {
    "Artificial Intelligence and Machine Learning": "Software_and_Computing",
    "Computer Science and Engineering": "Software_and_Computing",
    "Electronic and Telecommunication Engineering": "Circuit_and_Hardware",
    "Electrical Engineering": "Circuit_and_Hardware",
    "Instrumentation and Control Engineering": "Circuit_and_Hardware",
    "Mechanical Engineering": "Core_and_Mechanics",
    "Manufacturing Engineering and Industrial Management": "Core_and_Mechanics",
    "Metallurgy and Material Engineering": "Materials_and_Process",
    "Civil Engineering": "Infrastructure"
}
ESC_CATEGORIES = {"ESC 1", "ESC 2"}
COURSE_CODE_MAX_LENGTH = 64
COURSE_CODE_ALLOWED_CHARS_PATTERN = re.compile(r"^[A-Za-z0-9() /-]+$")
COURSE_CODE_PATH_PATTERN = r"^[A-Za-z0-9()]+-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$"
CourseCodePath = Annotated[
    str,
    FastAPIPath(
        min_length=1,
        max_length=COURSE_CODE_MAX_LENGTH,
        pattern=COURSE_CODE_PATH_PATTERN,
        description="Course code such as CT(ES)-25001-AIMA",
    ),
]

class WizardPayload(BaseModel):
    difficulty_level: int
    workload_level: int
    new_field_exploration: int
    concept_heavy: int
    math_heavy: int
    practical_focus: int
    branch: str


def load_courses() -> list[dict]:
    with open(COURSES_PATH, encoding="utf-8") as handle:
        raw_courses = json.load(handle)

    if not isinstance(raw_courses, list):
        raise ValueError("courses.json must contain a top-level array")

    normalized_courses: list[dict] = []
    seen_course_codes: set[str] = set()

    for index, course in enumerate(raw_courses):
        if not isinstance(course, dict):
            raise ValueError(f"Course at index {index} must be an object")

        normalized_course = dict(course)
        course_code = _normalize_course_code(normalized_course.get("course_code"), index)
        if course_code in seen_course_codes:
            raise ValueError(f"Duplicate course_code found in seed data: '{course_code}'")

        seen_course_codes.add(course_code)
        normalized_course["course_code"] = course_code
        normalized_courses.append(normalized_course)

    return normalized_courses


def _normalize_course_code(raw_value: object, index: int) -> str:
    if not isinstance(raw_value, str):
        raise ValueError(f"Course at index {index} has a non-string course_code")

    normalized = raw_value.strip()
    if len(normalized) > COURSE_CODE_MAX_LENGTH:
        raise ValueError(
            f"Course at index {index} has course_code longer than {COURSE_CODE_MAX_LENGTH} characters"
        )

    if normalized and not COURSE_CODE_ALLOWED_CHARS_PATTERN.fullmatch(normalized):
        raise ValueError(
            f"Course at index {index} has unsupported characters in course_code '{normalized}'"
        )

    return normalized


def getEligibleCourses(student: WizardPayload, courses: list[dict]) -> list[dict]:
    eligible_courses: list[dict] = []
    for course in courses:
        category = course.get("category")
        course_branch = course.get("department")
        is_esc_hard_block = (
            category in ESC_CATEGORIES
            and isinstance(course_branch, str)
            and course_branch == student.branch
        )
        if is_esc_hard_block:
            continue

        course_with_flattened_proximity = dict(course)
        course_with_flattened_proximity["branch_proximity"] = 1.0
        eligible_courses.append(course_with_flattened_proximity)

    return eligible_courses


def branch_lookup(student_branch: str, course_branch: str) -> float:
    if student_branch == course_branch:
        return 1.0
    student_cluster = BRANCH_CLUSTERS.get(student_branch)
    course_cluster = BRANCH_CLUSTERS.get(course_branch)
    if student_cluster and course_cluster and student_cluster == course_cluster:
        return 0.6
    return 0.3

def shortfall_normalized(student_value: float, course_value: float) -> float:
    diff = max(0.0, course_value - student_value)
    return float(math.exp(-0.35 * (diff ** 1.5)))

def distance_normalized(student_value: float, course_value: float) -> float:
    diff = abs(student_value - course_value)
    return float(math.exp(-0.35 * (diff ** 1.5)))


def _get_course_attribute(course: dict, key: str) -> float:
    # Handle key naming differences (e.g., 'prior_knowledge_score' vs 'prior_knowledge')
    short_key = key.replace("_score", "")
    
    # 1. Check top-level dictionary
    if key in course:
        return float(course[key])
    if short_key in course:
        return float(course[short_key])
        
    # 2. Check nested 'attributes' dictionary
    attributes = course.get("attributes", {})
    if key in attributes:
        return float(attributes[key])
    if short_key in attributes:
        return float(attributes[short_key])
        
    raise KeyError(f"Course missing required attribute '{key}' or '{short_key}'")


def _resolve_course_branch(course: dict, student_branch: str) -> str:
    course_branch = course.get("department")
    if isinstance(course_branch, str) and course_branch:
        return course_branch
    proximity_map = course.get("branch_proximity", {})
    if isinstance(proximity_map, dict) and proximity_map:
        return max(proximity_map.items(), key=lambda pair: float(pair[1]))[0]
    return student_branch


def compute_fit(
    payload: WizardPayload, course: dict
) -> int:
    
    s_diff = float(payload.difficulty_level)
    s_workload = float(payload.workload_level)
    s_exp = float(payload.new_field_exploration)
    s_concept = float(payload.concept_heavy)
    s_math = float(payload.math_heavy)
    s_practical = float(payload.practical_focus)

    course_branch = _resolve_course_branch(course, payload.branch)
    branch_proximity = float(course.get("branch_proximity", 1.0))

    scores = {
        "difficulty_level": distance_normalized(s_diff, _get_course_attribute(course, "difficulty_level")),
        "workload_level": shortfall_normalized(s_workload, _get_course_attribute(course, "workload_level")),
        "new_field_exploration": shortfall_normalized(s_exp, _get_course_attribute(course, "new_field_exploration")),
        "concept_heavy": distance_normalized(s_concept, _get_course_attribute(course, "concept_heavy")),
        "math_heavy": distance_normalized(s_math, _get_course_attribute(course, "math_heavy")),
        "practical_focus": distance_normalized(s_practical, _get_course_attribute(course, "practical_focus")),
        "branch_proximity": branch_proximity,
    }
    
    fit_percentage = round(sum(scores.values()) / len(scores) * 100)
    return fit_percentage


def load_approved_testimonials(course_codes: list[str]) -> dict[str, list[dict]]:
    if not course_codes:
        return {}

    db = SessionLocal()
    try:
        testimonials = (
            db.query(Testimonial)
            .filter(
                Testimonial.course_code.in_(course_codes),
                Testimonial.status == "APPROVED",
            )
            .order_by(Testimonial.is_featured.desc(), Testimonial.id.desc())
            .all()
        )
        grouped: dict[str, list[dict]] = {}
        for testimonial in testimonials:
            reviews = grouped.setdefault(testimonial.course_code, [])
            if len(reviews) >= 3:
                continue
            reviews.append(
                {
                    "id": testimonial.id,
                    "course_code": testimonial.course_code,
                    "course_category": testimonial.course_category,
                    "reviewer_name": testimonial.reviewer_name,
                    "mis_no": testimonial.mis_no,
                    "subject_cgpa": testimonial.subject_cgpa,
                    "overall_cgpa": testimonial.overall_cgpa,
                    "difficulty_level": testimonial.difficulty_level,
                    "workload_level": testimonial.workload_level,
                    "new_field_exploration": testimonial.new_field_exploration,
                    "concept_heavy": testimonial.concept_heavy,
                    "math_heavy": testimonial.math_heavy,
                    "practical_focus": testimonial.practical_focus,
                    "written_review": testimonial.written_review,
                    "status": testimonial.status,
                    "is_featured": testimonial.is_featured,
                }
            )
        return grouped
    finally:
        db.close()

@app.post("/recommend")
@app.post("/api/recommend")
def get_recommendations(payload: WizardPayload):
    courses = load_courses()
    eligible_courses = getEligibleCourses(payload, courses)
    scored = []

    for course in eligible_courses:
        fit_percentage = compute_fit(payload, course)
        scored.append((course, fit_percentage))

    scored.sort(key=lambda item: item[1], reverse=True)
    top_courses = scored

    course_codes = [
        course.get("course_code")
        for course, _ in top_courses
        if isinstance(course.get("course_code"), str)
    ]
    approved_testimonials = load_approved_testimonials(course_codes)

    course_cards = []
    for rank, (course, fit_percentage) in enumerate(top_courses, start=1):
        course_code = course.get("course_code")

        card = {
            "rank": rank,
            "course_code": course_code,
            "course_name": course.get("course_name"),
            "department": course.get("department"),
            "category": course.get("category"),
            "semesterAvailability": course.get("semesterAvailability", []),
            "forbiddenBranches": course.get("forbiddenBranches", []),
            "cohortRotation": course.get("cohortRotation", "NONE"),
            "branch_proximity": course.get("branch_proximity", 1.0),
            "fit_percentage": fit_percentage,
            "topic_tags": course.get("topic_tags", []),
            "testimonials": approved_testimonials.get(
                course_code,
                course.get("testimonials", []),
            ),
        }
        course_cards.append(card)

    return {"courses": course_cards}


@app.get("/courses/{course_code}")
@app.get("/api/courses/{course_code}")
def get_course_by_code(course_code: CourseCodePath):
    courses = load_courses()
    for course in courses:
        if course.get("course_code") == course_code:
            return course
    raise HTTPException(status_code=404, detail="Course not found")
