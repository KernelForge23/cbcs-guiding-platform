import json

file_path = "api/courses.json"

bs2_ids = [
    "AS(BS)-25009", "AS(BS)-25010", "AS(BS)-25011", "AS(BS)-25012",
    "AS(BS)-25013", "AS(BS)-25014", "AS(BS)-25015", "AS(BS)-25016"
]

esc1_ids = [
    "CE(ES)-25001", "CE(ES)-25002", "CT(ES)-25001-AIMA", "CT(ES)-25001-AEIOT",
    "EE(ES)-25001", "ICE(ES)-25001", "ME(ES)-25001", "MM(FS)-25001", "MFG(ES)-25001"
]

esc2_ids = [
    "CE(ES)-25003", "CT(ES)-25002", "EE(ES)-25002", "DLD-ESC",
    "ME(ES)-25002", "MM(ES)-25002", "MFG(ES)-25002", "EE-25001"
]

with open(file_path, "r", encoding="utf-8") as f:
    courses = json.load(f)

for course in courses:
    cid = course.get("id")
    if cid in bs2_ids:
        course["category"] = "BS Applied Science 2"
    elif cid in esc1_ids:
        course["category"] = "ESC 1"
    elif cid in esc2_ids:
        course["category"] = "ESC 2"

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(courses, f, indent=2)

print("✅ Successfully updated all category names in courses.json!")