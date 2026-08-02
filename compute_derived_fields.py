SEMESTER_WEEKS = 14


def compute_derived_fields(course: dict) -> dict:
    teaching = course.get("teaching_scheme", {})
    lecture = float(teaching.get("L", 0))
    tutorial = float(teaching.get("T", 0))
    practical = float(teaching.get("P", 0))
    self_study = float(teaching.get("self_study", 0))

    is_weekly = bool(teaching.get("self_study_is_weekly", False))
    ss_weekly = self_study if is_weekly else self_study / SEMESTER_WEEKS
    raw_workload = lecture + tutorial + practical + ss_weekly
    course["raw_workload"] = raw_workload

    contact_hours = lecture + tutorial + practical
    if contact_hours == 0:
        course["hands_on_score"] = 3.0
        course["needs_manual_review"] = True
    else:
        course["hands_on_score"] = 1 + 4 * (practical / contact_hours)

    evaluation = course.get("evaluation_scheme_raw", {})
    mse = float(evaluation.get("MSE", 0))
    ta = float(evaluation.get("TA", 0))
    ese = float(evaluation.get("ESE", 0))
    evaluation_total = mse + ta + ese
    course["evaluation_style_facts"] = {
        "theory_exam_pct": None
        if evaluation_total == 0
        else (mse + ese) / evaluation_total,
        "lab_is_fully_continuous": True,
    }
    return course


def normalize_workload(all_courses: list[dict]) -> list[dict]:
    if not all_courses:
        return all_courses

    raw_values = [float(course.get("raw_workload", 0)) for course in all_courses]
    lo = min(raw_values)
    hi = max(raw_values)

    for course in all_courses:
        raw = float(course.get("raw_workload", 0))
        if hi == lo:
            course["workload_score"] = 3.0
        else:
            course["workload_score"] = 1 + 4 * (raw - lo) / (hi - lo)
        source = course.setdefault("source", {})
        source["workload"] = "computed"

    return all_courses
