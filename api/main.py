import json
import os
import math 
import re
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Path as FastAPIPath
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: Gemini API Key not found!")
    client = None
else:
    client = genai.Client(api_key=api_key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
REQUIRED_NARRATIVE_FIELDS = ("why_this_fits", "worth_knowing")
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
    prior_knowledge_q1: int
    prior_knowledge_q2: int
    difficulty_q1: int
    difficulty_q2: int
    workload: int
    cognitive_focus: int
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
        course_branch = course.get("branch")
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
    # Exponential curve: small gaps stay near 100%, larger gaps drop off steeply
    return float(math.exp(-0.35 * (diff ** 1.5)))

def distance_normalized(student_value: float, course_value: float) -> float:
    diff = abs(student_value - course_value)
    # Exponential curve: small gaps stay near 100%, larger gaps drop off steeply
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
    course_branch = course.get("branch")
    if isinstance(course_branch, str) and course_branch:
        return course_branch
    proximity_map = course.get("branch_proximity", {})
    if isinstance(proximity_map, dict) and proximity_map:
        return max(proximity_map.items(), key=lambda pair: float(pair[1]))[0]
    return student_branch


def compute_fit(
    payload: WizardPayload, course: dict
) -> tuple[int, list[dict[str, float | str]]]:
    s_pk = (float(payload.prior_knowledge_q1) + float(payload.prior_knowledge_q2)) / 2.0
    s_diff = (float(payload.difficulty_q1) + float(payload.difficulty_q2)) / 2.0
    s_workload = float(payload.workload)
    s_cognitive_focus = float(payload.cognitive_focus)
    course_branch = _resolve_course_branch(course, payload.branch)
    branch_proximity = float(course.get("branch_proximity", 1.0))
    scores = {
        "prior_knowledge": shortfall_normalized(
            s_pk, _get_course_attribute(course, "prior_knowledge_score")
        ),
        "difficulty": distance_normalized(
            s_diff, _get_course_attribute(course, "difficulty_score")
        ),
        "workload": shortfall_normalized(
            s_workload, _get_course_attribute(course, "workload_score")
        ),
        "cognitive_focus": distance_normalized(
            s_cognitive_focus, _get_course_attribute(course, "cognitive_focus_score")
        ),
        "branch_proximity": branch_proximity,
    }
    attributes_used: list[dict[str, float | str]] = []

    attributes_used.append(
        {
            "name": "prior_knowledge",
            "student_value": s_pk,
            "course_value": _get_course_attribute(course, "prior_knowledge_score"),
            "score": scores["prior_knowledge"],
        }
    )
    attributes_used.append(
        {
            "name": "difficulty",
            "student_value": s_diff,
            "course_value": _get_course_attribute(course, "difficulty_score"),
            "score": scores["difficulty"],
        }
    )
    attributes_used.append(
        {
            "name": "workload",
            "student_value": s_workload,
            "course_value": _get_course_attribute(course, "workload_score"),
            "score": scores["workload"],
        }
    )
    attributes_used.append(
        {
            "name": "cognitive_focus",
            "student_value": s_cognitive_focus,
            "course_value": _get_course_attribute(course, "cognitive_focus_score"),
            "score": scores["cognitive_focus"],
        }
    )
    attributes_used.append(
        {
            "name": "branch_proximity",
            "student_value": payload.branch,
            "course_value": course_branch,
            "score": scores["branch_proximity"],
        }
    )

    fit_percentage = round(sum(scores.values()) / len(scores) * 100)
    return fit_percentage, attributes_used


def _extract_json_array(text: str) -> list[dict]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").strip()
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3].strip()
    parsed = json.loads(cleaned)
    if not isinstance(parsed, list):
        raise ValueError("Gemini response must be a JSON array")
    return parsed


def _extract_narrative_fields(payload: dict | None) -> tuple[str | None, str | None]:
    if not isinstance(payload, dict):
        return None, None
    why_this_fits = payload.get(REQUIRED_NARRATIVE_FIELDS[0])
    worth_knowing = payload.get(REQUIRED_NARRATIVE_FIELDS[1])
    if not isinstance(why_this_fits, str) or not why_this_fits.strip():
        return None, None
    if not isinstance(worth_knowing, str) or not worth_knowing.strip():
        return None, None
    return why_this_fits.strip(), worth_knowing.strip()


def _fallback_narrative_for_course(course: dict) -> tuple[str, str]:
    why_this_fits, worth_knowing = _extract_narrative_fields(course.get("narrative"))
    if why_this_fits and worth_knowing:
        return why_this_fits, worth_knowing

    course_name = course.get("course_name", "This course")
    return (
        f"AI narrative for {course_name} is currently generating. Please check back shortly.",
        "No AI caveat is available yet. Review core attributes and testimonials for now.",
    )


def generate_batch_narratives(top_courses: list[tuple[dict, int, list[dict[str, float | str]]]]) -> list[dict]:
    prompt_courses = []
    for course, fit_percentage, attributes_used in top_courses:
        prompt_courses.append(
            {
                "course_code": course.get("course_code"),
                "course_name": course.get("course_name"),
                "fit_percentage": fit_percentage,
                "attributes_used": attributes_used,
                "evaluation_style_facts": course.get("evaluation_style_facts"),
            }
        )

    prompt_payload = json.dumps(prompt_courses, ensure_ascii=False, indent=2)
    prompt = (
        "You are a course-fit advisor. I am providing a JSON payload containing the computed "
        "fit_percentage, matched attributes_used, and evaluation_style_facts for one or more courses.\n"
        "Return ONLY a valid JSON array (no markdown, no backticks), where each object has exactly:\n"
        '{"course_code","why_this_fits","worth_knowing"}.\n'
        "Rules:\n"
        "- why_this_fits must highlight the 1-2 highest scoring attributes in plain language.\n"
        "- worth_knowing must highlight the single lowest scoring attribute as an honest caveat.\n"
        "- Do NOT recalculate fit_percentage.\n"
        "- Do NOT invent attributes not present in attributes_used.\n\n"
        f"Input:\n{prompt_payload}"
    )

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
    )
    if not response.text:
        raise ValueError("Gemini response was empty")
    narratives = _extract_json_array(response.text)
    return [item for item in narratives if isinstance(item, dict)]

@app.post("/api/recommend")
def get_recommendations(payload: WizardPayload):
    if not client:
        raise HTTPException(status_code=500, detail="API Key missing")

    courses = load_courses()
    eligible_courses = getEligibleCourses(payload, courses)
    scored = []

    for course in eligible_courses:
        fit_percentage, attributes_used = compute_fit(payload, course)
        scored.append((course, fit_percentage, attributes_used))

    scored.sort(key=lambda item: item[1], reverse=True)
    top_courses = scored

    ai_narratives: list[dict] = []
    try:
        ai_narratives = generate_batch_narratives(top_courses)
    except Exception:
        ai_narratives = []

    narratives_dict = {
        item.get("course_code"): item
        for item in ai_narratives
        if isinstance(item, dict) and item.get("course_code")
    }

    course_cards = []
    for rank, (course, fit_percentage, attributes_used) in enumerate(top_courses, start=1):
        course_code = course.get("course_code")

        why_this_fits, worth_knowing = _extract_narrative_fields(
            narratives_dict.get(course_code)
        )
        if not why_this_fits or not worth_knowing:
            why_this_fits, worth_knowing = _fallback_narrative_for_course(course)

        card = {
            "rank": rank,
            "course_code": course_code,
            "course_name": course.get("course_name"),
            "branch": course.get("branch"),
            "category": course.get("category"),
            "branch_proximity": course.get("branch_proximity", 1.0),
            "fit_percentage": fit_percentage,
            "attributes_used": attributes_used,
            "evaluation_style_facts": course.get("evaluation_style_facts"),
            "topic_tags": course.get("topic_tags", []),
            "why_this_fits": why_this_fits,
            "worth_knowing": worth_knowing,
            "narrative": {
                "why_this_fits": why_this_fits,
                "worth_knowing": worth_knowing,
            },
            "testimonials": course.get("testimonials", [])
        }
        course_cards.append(card)

    return {"courses": course_cards}


@app.get("/api/courses/{course_code}")
def get_course_by_code(course_code: CourseCodePath):
    courses = load_courses()
    for course in courses:
        if course.get("course_code") == course_code:
            return course
    raise HTTPException(status_code=404, detail="Course not found")
