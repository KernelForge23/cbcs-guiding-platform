import json
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
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

BRANCH_ALIASES: dict[str, str] = {
    "Electronics & Communication": "Electronics",
    "Information Technology": "Computer Science",
}

ATTRIBUTE_COURSE_KEYS = {
    "prior_knowledge": "prior_knowledge_score",
    "difficulty": "difficulty_score",
    "workload": "workload_score",
    "hands_on": "hands_on_score",
}


class WizardPayload(BaseModel):
    student_branch: str
    prior_knowledge: float
    difficulty: float
    workload: float
    hands_on: float


def load_courses() -> list[dict]:
    with open(COURSES_PATH, encoding="utf-8") as handle:
        return json.load(handle)


def resolve_branch_proximity(course: dict, student_branch: str) -> float | None:
    proximity_map = course.get("branch_proximity", {})
    if student_branch in proximity_map:
        return float(proximity_map[student_branch])

    alias = BRANCH_ALIASES.get(student_branch)
    if alias and alias in proximity_map:
        return float(proximity_map[alias])

    return 0.3


def shortfall_normalized(student_value: float, course_value: float) -> float:
    shortfall = max(0.0, course_value - student_value)
    raw_score = 5.0 - shortfall
    return (raw_score - 1.0) / 4.0


def distance_normalized(student_value: float, course_value: float) -> float:
    raw_score = 5.0 - abs(student_value - course_value)
    return (raw_score - 1.0) / 4.0


def calculate_fit(
    payload: WizardPayload, course: dict
) -> tuple[int, list[dict[str, float | str]]]:
    course_attrs = course.get("attributes", {})
    student_values = {
        "prior_knowledge": payload.prior_knowledge,
        "difficulty": payload.difficulty,
        "workload": payload.workload,
        "hands_on": payload.hands_on,
    }

    attributes_used: list[dict[str, float | str]] = []
    normalized_scores: list[float] = []

    for attr_name, course_key in ATTRIBUTE_COURSE_KEYS.items():
        course_value = course_attrs.get(course_key)
        if course_value is None:
            continue

        student_value = student_values[attr_name]
        if attr_name in ("prior_knowledge", "workload"):
            normalized = shortfall_normalized(student_value, float(course_value))
        else:
            normalized = distance_normalized(student_value, float(course_value))

        attributes_used.append(
            {
                "attribute": attr_name,
                "student_value": student_value,
                "course_value": float(course_value),
                "normalized_score": normalized,
            }
        )
        normalized_scores.append(normalized)

    branch_proximity = resolve_branch_proximity(course, payload.student_branch)
    if branch_proximity is not None:
        attributes_used.append(
            {
                "attribute": "branch_proximity",
                "student_branch": payload.student_branch,
                "course_value": branch_proximity,
                "normalized_score": branch_proximity,
            }
        )
        normalized_scores.append(branch_proximity)

    if not normalized_scores:
        return 0, attributes_used

    fit_percentage = round(sum(normalized_scores) / len(normalized_scores) * 100)
    return fit_percentage, attributes_used


def build_narrative_prompt(
    course: dict,
    fit_percentage: int,
    attributes_used: list[dict[str, float | str]],
) -> str:
    evaluation_facts = course.get("evaluation_style_facts", "")
    attributes_json = json.dumps(attributes_used, indent=2)

    return f"""Course: {course["course_name"]} ({course["course_code"]})
Fit Percentage (pre-computed, do NOT recalculate): {fit_percentage}%
Evaluation style facts: {evaluation_facts}

Attributes used in scoring:
{attributes_json}

Write exactly two narrative sections:

1. "Why this fits you" (3-4 sentences): Highlight the 1-2 highest-scoring attributes. State the student's preference vs. the course reality in plain language.

2. "Worth knowing" (1-2 sentences): Highlight the single lowest-scoring attribute as an honest caveat.

Hard constraints:
- NEVER recalculate the fit_percentage.
- NEVER invent attributes or reference excluded attributes.
- NEVER use marketing fluff ("amazing", "perfect").
- NEVER summarize or alter testimonial strings."""


def parse_narrative_response(text: str) -> dict[str, str]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            why = parsed.get("why_this_fits") or parsed.get("why_this_fits_you")
            worth = parsed.get("worth_knowing")
            if why and worth:
                return {"why_this_fits": str(why), "worth_knowing": str(worth)}
    except json.JSONDecodeError:
        pass

    why_match = re.search(
        r"(?:why this fits(?: you)?)[:\s]*(.+?)(?=worth knowing|$)",
        text,
        re.IGNORECASE | re.DOTALL,
    )
    worth_match = re.search(
        r"worth knowing[:\s]*(.+?)$", text, re.IGNORECASE | re.DOTALL
    )

    return {
        "why_this_fits": (
            why_match.group(1).strip()
            if why_match
            else "This course aligns with several of your stated preferences based on the computed match scores."
        ),
        "worth_knowing": (
            worth_match.group(1).strip()
            if worth_match
            else "Review the course syllabus and speak with your academic advisor before enrolling."
        ),
    }


def generate_narrative(
    course: dict,
    fit_percentage: int,
    attributes_used: list[dict[str, float | str]],
) -> dict[str, str]:
    prompt = build_narrative_prompt(course, fit_percentage, attributes_used)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are an academic advisor for first-year engineering students. "
                "Explain course matches based strictly on the provided scoring data. "
                "Return JSON with keys 'why_this_fits' and 'worth_knowing' only."
            ),
            response_mime_type="application/json",
        ),
    )

    return parse_narrative_response(response.text or "")


def build_course_card(
    rank: int,
    course: dict,
    fit_percentage: int,
    attributes_used: list[dict[str, float | str]],
) -> dict:
    narrative = generate_narrative(course, fit_percentage, attributes_used)
    testimonials = course.get("testimonials") or []

    return {
        "rank": rank,
        "course_code": course["course_code"],
        "course_name": course["course_name"],
        "fit_percentage": fit_percentage,
        "topic_tags": course.get("topic_tags", []),
        "why_this_fits": narrative["why_this_fits"],
        "worth_knowing": narrative["worth_knowing"],
        "testimonials": testimonials
        if testimonials
        else ["Be the first to review this course"],
        "evaluation_style_facts": course.get("evaluation_style_facts", ""),
    }


@app.get("/api/health")
def health_check():
    return {"status": "CBCS AI Engine is online"}


@app.post("/api/recommend")
def get_recommendations(payload: WizardPayload):
    if not client:
        raise HTTPException(status_code=500, detail="API Key missing")

    courses = load_courses()
    scored: list[tuple[dict, int, list[dict[str, float | str]]]] = []

    for course in courses:
        fit_percentage, attributes_used = calculate_fit(payload, course)
        scored.append((course, fit_percentage, attributes_used))

    scored.sort(key=lambda item: item[1], reverse=True)
    top_courses = scored[:3]

    # Replaced the list comprehension with a standard loop to add a delay
    course_cards = []
    for rank, (course, fit_percentage, attributes_used) in enumerate(top_courses, start=1):
        card = build_course_card(rank, course, fit_percentage, attributes_used)
        course_cards.append(card)
        
        # 4-second delay (Gemini free tier allows ~15 requests per minute)
        time.sleep(4) 

    return {"courses": course_cards}
