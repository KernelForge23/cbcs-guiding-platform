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
from api.database import Base, engine
from api.routers.testimonials import router as testimonials_router

root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / ".env.local")
load_dotenv(root_dir / ".env")
load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
cors_origins_env = os.getenv("CORS_ORIGINS")
if cors_origins_env:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    allowed_origins = ["*"]

if not api_key:
    print("WARNING: Gemini API Key not found!")
    client = None
else:
    client = genai.Client(api_key=api_key)

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
) -> tuple[int, list[dict[str, float | str]]]:
    
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
    
    attributes_used: list[dict[str, float | str]] = []

    for key, s_val in zip(
        ["difficulty_level", "workload_level", "new_field_exploration", "concept_heavy", "math_heavy", "practical_focus"],
        [s_diff, s_workload, s_exp, s_concept, s_math, s_practical]
    ):
        attributes_used.append({
            "name": key,
            "student_value": s_val,
            "course_value": _get_course_attribute(course, key),
            "score": scores[key],
        })
        
    attributes_used.append({
        "name": "branch_proximity",
        "student_value": payload.branch,
        "course_value": course_branch,
        "score": scores["branch_proximity"],
    })

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


MODELS_TO_TRY = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash"]

ATTR_LABELS = {
    "difficulty_level": "difficulty level",
    "workload_level": "workload demand",
    "new_field_exploration": "new field exploration preference",
    "concept_heavy": "conceptual focus",
    "math_heavy": "mathematical calculation focus",
    "practical_focus": "hands-on practical orientation",
    "branch_proximity": "department alignment",
}


def _normalize_code(code: str | None) -> str:
    if not code:
        return ""
    return re.sub(r"[^A-Za-z0-9]", "", str(code)).upper()


def _fallback_narrative_for_course(course: dict, attributes_used: list[dict] | None = None) -> tuple[str, str]:
    if attributes_used:
        attr_scores = []
        for item in attributes_used:
            name = item.get("name")
            score = item.get("score")
            if name and isinstance(score, (int, float)) and name in ATTR_LABELS:
                attr_scores.append((name, float(score), item.get("student_value"), item.get("course_value")))

        if attr_scores:
            attr_scores.sort(key=lambda x: x[1], reverse=True)
            top1 = attr_scores[0]
            top2 = attr_scores[1] if len(attr_scores) > 1 else None
            lowest = attr_scores[-1]

            why_parts = [f"Matches your preference for {ATTR_LABELS[top1[0]]}."]
            if top2 and top2[1] >= 0.5:
                why_parts.append(f"Also aligns well with your {ATTR_LABELS[top2[0]]}.")

            why_this_fits = " ".join(why_parts)

            if lowest[1] < 0.8:
                worth_knowing = f"Note: The course demands {ATTR_LABELS[lowest[0]]} (course: {lowest[3]}/4 vs your profile: {lowest[2]}/4). Plan your schedule accordingly."
            else:
                worth_knowing = "This course aligns smoothly across all your requested learning preferences."

            return why_this_fits, worth_knowing

    course_name = course.get("course_name", "This course")
    return (
        f"{course_name} is recommended based on your evaluated learning style and workload capacity.",
        "Review student testimonials and course details before finalizing your selection.",
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

    last_error = None
    for model_name in MODELS_TO_TRY:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                narratives = _extract_json_array(response.text)
                res = [item for item in narratives if isinstance(item, dict)]
                if res:
                    print(f"Successfully generated AI narratives via model '{model_name}' for {len(res)} courses")
                    return res
        except Exception as e:
            last_error = e
            continue

    if last_error:
        print(f"Warning: Gemini narrative generation failed across models: {last_error}")
    return []

@app.post("/recommend")
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
    except Exception as exc:
        print(f"Failed to generate narratives via Gemini API: {exc}")
        ai_narratives = []

    narratives_by_exact = {}
    narratives_by_norm = {}
    for idx, item in enumerate(ai_narratives):
        if isinstance(item, dict):
            c_code = item.get("course_code")
            if c_code:
                narratives_by_exact[str(c_code).strip()] = item
                narratives_by_norm[_normalize_code(c_code)] = item

    course_cards = []
    for rank, (course, fit_percentage, attributes_used) in enumerate(top_courses, start=1):
        course_code = course.get("course_code")

        ai_item = None
        if course_code:
            ai_item = narratives_by_exact.get(str(course_code).strip())
            if not ai_item:
                ai_item = narratives_by_norm.get(_normalize_code(course_code))
        if not ai_item and (rank - 1) < len(ai_narratives) and isinstance(ai_narratives[rank - 1], dict):
            ai_item = ai_narratives[rank - 1]

        why_this_fits, worth_knowing = _extract_narrative_fields(ai_item)
        if not why_this_fits or not worth_knowing:
            why_this_fits, worth_knowing = _fallback_narrative_for_course(course, attributes_used)

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


@app.get("/courses/{course_code}")
@app.get("/api/courses/{course_code}")
def get_course_by_code(course_code: CourseCodePath):
    courses = load_courses()
    for course in courses:
        if course.get("course_code") == course_code:
            return course
    raise HTTPException(status_code=404, detail="Course not found")
