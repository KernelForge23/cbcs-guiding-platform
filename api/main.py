import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
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

class WizardPayload(BaseModel):
    prior_knowledge_q1: int
    prior_knowledge_q2: int
    difficulty_q1: int
    difficulty_q2: int
    workload: int
    hands_on: int
    branch: str


def load_courses() -> list[dict]:
    with open(COURSES_PATH, encoding="utf-8") as handle:
        return json.load(handle)


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
    return (5.0 - max(0.0, course_value - student_value) - 1.0) / 4.0


def distance_normalized(student_value: float, course_value: float) -> float:
    return (5.0 - abs(student_value - course_value) - 1.0) / 4.0


def _get_course_attribute(course: dict, key: str) -> float:
    if key in course:
        return float(course[key])
    attributes = course.get("attributes", {})
    if key in attributes:
        return float(attributes[key])
    raise KeyError(f"Course missing required attribute '{key}'")


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
    s_hands_on = float(payload.hands_on)
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
        "hands_on": distance_normalized(
            s_hands_on, _get_course_attribute(course, "hands_on_score")
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
            "name": "hands_on",
            "student_value": s_hands_on,
            "course_value": _get_course_attribute(course, "hands_on_score"),
            "score": scores["hands_on"],
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

    try:
        ai_narratives = generate_batch_narratives(top_courses)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Invalid narrative response from Gemini: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Narrative generation failed: {exc}",
        ) from exc

    narratives_dict = {
        item.get("course_code"): item
        for item in ai_narratives
        if isinstance(item, dict) and item.get("course_code")
    }

    course_cards = []
    for rank, (course, fit_percentage, attributes_used) in enumerate(top_courses, start=1):
        course_code = course.get("course_code")

        ai_text = narratives_dict.get(course_code, {})
        why_this_fits = ai_text.get("why_this_fits")
        worth_knowing = ai_text.get("worth_knowing")
        if not isinstance(why_this_fits, str) or not isinstance(worth_knowing, str):
            raise HTTPException(
                status_code=502,
                detail=f"Gemini narrative missing required fields for {course_code}",
            )

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
            "testimonials": course.get("testimonials", [])
        }
        course_cards.append(card)

    return {"courses": course_cards}
