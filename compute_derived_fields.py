import json
import os

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
        course["cognitive_focus_score"] = 3.0
        course["needs_manual_review"] = True
    else:
        course["cognitive_focus_score"] = 1 + 4 * (practical / contact_hours)
        
    evaluation = course.get("evaluation_scheme_raw", {})
    mse = float(evaluation.get("MSE", 0))
    ta = float(evaluation.get("TA", 0))
    ese = float(evaluation.get("ESE", 0))
    evaluation_total = mse + ta + ese
    
    course["evaluation_style_facts"] = {
        "theory_exam_pct": None if evaluation_total == 0 else (mse + ese) / evaluation_total,
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

if __name__ == "__main__":
    file_path = "api/courses.json"
    
    with open(file_path, "r", encoding="utf-8") as f:
        courses = json.load(f)
        
    for course in courses:
        compute_derived_fields(course)
        
    normalize_workload(courses)
    
    for course in courses:
        if "attributes" not in course:
            course["attributes"] = {}
            
        course["attributes"]["workload"] = round(course.get("workload_score", 3.0), 1)
        course["attributes"]["cognitive_focus"] = round(course.get("cognitive_focus_score", 3.0), 1)
        
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(courses, f, indent=2)
        
    abs_path = os.path.abspath(file_path)
    print(f"✅ Success! Updated {len(courses)} courses.")
    print(f"📂 Saved to: {abs_path}")