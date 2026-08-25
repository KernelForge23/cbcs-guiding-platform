import json
import sys
from pathlib import Path
from typing import Any

OLD_TO_NEW_SCALE = {
    1: 1,
    2: 2,
    3: 2,
    4: 3,
    5: 4,
}

COGNITIVE_SPLIT_MAP = {
    1: (4, 1),
    2: (3, 2),
    3: (2, 2),
    4: (2, 3),
    5: (1, 4),
}

OLD_FACTOR_KEYS = (
    "difficulty",
    "workload",
    "prior_knowledge",
    "cognitive_focus",
)


def parse_scale_value(raw_value: Any, field_name: str, course_id: str) -> int:
    if isinstance(raw_value, bool) or raw_value is None:
        raise ValueError(f"Course '{course_id}': invalid {field_name}={raw_value!r}")

    if isinstance(raw_value, float) and not raw_value.is_integer():
        raise ValueError(f"Course '{course_id}': {field_name} must be an integer 1-5, got {raw_value!r}")

    value = int(raw_value)
    if value not in OLD_TO_NEW_SCALE:
        raise ValueError(f"Course '{course_id}': {field_name} must be in 1-5, got {raw_value!r}")
    return value


def has_all_old_keys(data: dict[str, Any]) -> bool:
    return all(key in data for key in OLD_FACTOR_KEYS)


def migrate_factor_block(factors: dict[str, Any], course_id: str) -> None:
    difficulty = parse_scale_value(factors["difficulty"], "difficulty", course_id)
    workload = parse_scale_value(factors["workload"], "workload", course_id)
    prior_knowledge = parse_scale_value(factors["prior_knowledge"], "prior_knowledge", course_id)
    cognitive_focus = parse_scale_value(factors["cognitive_focus"], "cognitive_focus", course_id)

    factors["difficulty_level"] = OLD_TO_NEW_SCALE[difficulty]
    factors["workload_level"] = OLD_TO_NEW_SCALE[workload]
    factors["new_field_exploration"] = OLD_TO_NEW_SCALE[prior_knowledge]

    concept_heavy, math_heavy = COGNITIVE_SPLIT_MAP[cognitive_focus]
    factors["concept_heavy"] = concept_heavy
    factors["math_heavy"] = math_heavy
    factors["practical_focus"] = 2

    for key in OLD_FACTOR_KEYS:
        del factors[key]


def migrate_courses(courses: list[dict[str, Any]]) -> list[dict[str, Any]]:
    for index, course in enumerate(courses):
        course_id = str(course.get("id", f"index_{index}"))
        attributes = course.get("attributes")

        if isinstance(attributes, dict) and has_all_old_keys(attributes):
            migrate_factor_block(attributes, course_id)
            continue

        if has_all_old_keys(course):
            migrate_factor_block(course, course_id)
            continue

        raise KeyError(
            f"Course '{course_id}': expected old factor keys in 'attributes' or at top level."
        )

    return courses


def main() -> None:
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("api/courses.json")
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else input_path.with_name("updated_courses.json")

    with input_path.open("r", encoding="utf-8") as infile:
        courses = json.load(infile)

    if not isinstance(courses, list):
        raise ValueError("Input JSON must be an array of course objects.")

    migrated_courses = migrate_courses(courses)

    with output_path.open("w", encoding="utf-8") as outfile:
        json.dump(migrated_courses, outfile, indent=2, ensure_ascii=False)

    print(f"Updated {len(migrated_courses)} courses.")
    print(f"Input:  {input_path.resolve()}")
    print(f"Output: {output_path.resolve()}")


if __name__ == "__main__":
    main()
