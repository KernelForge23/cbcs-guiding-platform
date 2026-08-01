import json
import os
import re
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

def generate_batch_narratives(top_courses):
    prompt = (
        "You are an expert academic advisor. I will provide 3 courses below. "
        "For each course, write a short 'why_this_fits' (based on student preferences) "
        "and 'worth_knowing' (evaluation/workload facts).\n\n"
        "Return ONLY a valid JSON array of objects. Do not include markdown formatting or backticks. "
        "Each object must have these exact keys: 'course_code', 'why_this_fits', 'worth_knowing'.\n\nCourses:\n"
    )
    
    for course, fit, _ in top_courses:
        prompt += f"- {course['course_code']}: {course['course_name']} (Fit: {fit}%)\n"
        prompt += f"  Facts: {course.get('evaluation_style_facts', '')}\n\n"

    try:
        # The API call is now protected by a try block
        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
        )
        
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:-3].strip()
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:-3].strip()
            
        return json.loads(raw_text)
        
    except Exception as e:
        # If Google throws a 429 rate limit, we catch it here instead of crashing!
        print(f"Gemini API Blocked/Failed: {e}")
        return []

@app.post("/api/recommend")
def get_recommendations(payload: WizardPayload):
    if not client:
        raise HTTPException(status_code=500, detail="API Key missing")

    courses = load_courses()
    scored = []

    for course in courses:
        fit_percentage, attributes_used = calculate_fit(payload, course)
        scored.append((course, fit_percentage, attributes_used))

    scored.sort(key=lambda item: item[1], reverse=True)
    top_courses = scored

    # 1. Fetch narratives in ONE batch call
    ai_narratives = generate_batch_narratives(top_courses)
    
    # Convert list to a dictionary for easy lookup by course_code
    narratives_dict = {item.get("course_code"): item for item in ai_narratives if isinstance(item, dict)}

    # 2. Build the final cards dynamically
    course_cards = []
    for rank, (course, fit_percentage, attributes_used) in enumerate(top_courses, start=1):
        course_code = course.get("course_code")
        
        # Grab the AI generated text for this specific course, or use safe fallbacks
        ai_text = narratives_dict.get(course_code, {})
        why_this_fits = ai_text.get("why_this_fits", "Excellent match based on your wizard preferences.")
        worth_knowing = ai_text.get("worth_knowing", course.get("evaluation_style_facts", "Standard evaluation."))
        
        # Safely extract a testimonial if it exists
        testimonial_list = course.get("testimonials", [])
        testimonial_text = testimonial_list[0] if testimonial_list else ""

        # Construct the final card payload for the Next.js frontend
        card = {
            "rank": rank,
            "course_code": course_code,
            "course_name": course.get("course_name"),
            "fit_percentage": fit_percentage,
            "topic_tags": course.get("topic_tags", []),
            "why_this_fits": why_this_fits,
            "worth_knowing": worth_knowing,
            "testimonials": course.get("testimonials", [])
        }
        course_cards.append(card)

    return {"courses": course_cards}



