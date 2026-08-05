# CBCS Recommendation System — Master Build Guide (Corrected)

**Corrections applied in this version** (see change list at bottom for the full diff against your uploaded draft): worked example fixed to include all 5 attributes with correct arithmetic; `branch` and `category` separated as distinct fields; human review step restored for Bucket B; `raw_workload`/`hands_on_ratio` moved out of AI computation into deterministic code; source-tracking field added and the testimonial-override mechanism actually specified; topic tags are generated freely per course and human-reviewed (no pre-built canonical list); `evaluation_style_facts` moved back to pure computed facts; divide-by-zero guard added; the 6-question design (2 averaged questions each for prior_knowledge/difficulty, 1 direct question each for workload/hands_on) is now confirmed final, with matching testimonial mirrors added in Appendix A; two real code bugs (`SEMESTER_WEEKS`, zero-division in workload normalization) fixed.

**Core philosophy, unchanged:**
- **Phase 1 (Tagging):** once per course. Deterministic math (Bucket A) + AI estimates anchored to a strict baseline, human-reviewed (Bucket B).
- **Phase 2 (Scoring):** pure Python. No AI involved in the arithmetic at all.
- **Phase 3 (Explaining):** AI writes the rationale strictly from Phase 2's already-fixed numbers.
- **Phase 4 (Display):** four independent, untampered pieces assembled on the frontend.

---

## PHASE 1: Tagging Every Course

### 1.1 The Two Buckets

**Bucket A — Computed (pure math, done in code, never by AI):**

- **Workload.** Extract raw weekly hours L (Lecture), T (Tutorial), P (Practical) directly from the syllabus. Self-study (SS) is usually reported as a **semester total**, not weekly — check your actual syllabus format before trusting this. If SS is a semester total:
  ```
  raw_workload = L + T + P + (SS_total / semester_weeks)
  ```
  If SS is already weekly, just add it directly. Once every course in the pool has a `raw_workload`, normalize across the whole set:
  ```
  workload_score = 1 + 4 × (raw_workload − min_raw) / (max_raw − min_raw)
  ```
  Re-run this normalization whenever a meaningful batch of new courses is added — a single course's raw number is meaningless until compared against the pool.

- **Hands-on balance.**
  ```
  hands_on_ratio = P / (L + T + P)     — guard: if L+T+P = 0, set hands_on_score = 3 (neutral/undefined) and flag the course for manual entry rather than dividing by zero
  hands_on_score = 1 + 4 × hands_on_ratio
  ```
  No pool-wide normalization needed — this ratio is already naturally bounded 0–1.

- **Evaluation style facts** (context only — never scored, never AI-summarized): 
  ```
  theory_exam_pct = (MSE + ESE) / (MSE + TA + ESE)
  ```
  Lab is treated as 100% continuous (CIE). Store as two numbers, not a prose sentence — a "1-sentence AI summary" can vary in wording or drop a detail between runs, which defeats the point of this being a hard fact.

**Bucket B — AI-estimated, anchored, human-reviewed, later overwritten by testimonials:**

- **Prior knowledge score** (1–5, absolute scale, anchored to a 12th-grade/JEE baseline: 1 = taught from scratch, 5 = requires heavy college-level prerequisites).
- **Difficulty score** (1–5, absolute scale: 1 = introductory/descriptive, 5 = highly abstract/mathematical).
- Both come with a **1-sentence justification** from the AI, and a **required human review step** before being stored — these numbers have no ground truth to check against yet, so a person needs to sanity-check the AI's reasoning, not just accept the number.
- **Source tracking:** every stored value for these two fields carries a `source` tag — `"estimated"` or `"testimonial_averaged"`.
- **The overwrite mechanism, made concrete:** once a course accumulates **3 or more testimonials**, recompute `prior_knowledge_score`, `difficulty_score`, and `workload_score` as the average of testimonial-reported values, overwrite the stored figure, and flip `source` to `"testimonial_averaged"`. **`hands_on_score` is never overwritten by testimonials** — it stays syllabus-computed permanently, since it's an objective ratio, not a felt experience. This is a one-time batch job you re-run periodically (e.g. weekly), not something computed live per student request.

**Testimonial object schema** (referenced in Appendix A's 6 questions, not previously given explicit field names):
```json
{
  "testimonial_id": "...",
  "course_code": "CS-401",
  "prior_knowledge_reported": 3,
  "difficulty_reported": 4,
  "workload_reported": 4,
  "hands_on_reported": 3,
  "satisfaction_rating": 4,
  "quote_best_part": "...",
  "quote_hardest_part": "...",
  "quote_advice": "...",
  "student_year": "2025",
  "anonymous": true
}
```
Each of `prior_knowledge_reported`, `difficulty_reported`, `workload_reported` is itself the average of that attribute's 2 (or, for workload, 1) testimonial questions from Appendix A — average at submission time, store the single resulting number.

**The overwrite batch job (Python — run periodically, not per student request):**
```python
def refresh_testimonial_averages(course, testimonials_for_course):
    if len(testimonials_for_course) < 3:
        return course  # not enough data yet — leave the current source (estimated/computed) as-is

    for field, reported_key in [
        ("prior_knowledge_score", "prior_knowledge_reported"),
        ("difficulty_score", "difficulty_reported"),
        ("workload_score", "workload_reported"),
    ]:
        avg = sum(t[reported_key] for t in testimonials_for_course) / len(testimonials_for_course)
        course[field] = avg
        course["source"][field.replace("_score", "")] = "testimonial_averaged"

    course["testimonial_count"] = len(testimonials_for_course)
    # hands_on_score deliberately untouched — stays syllabus-computed forever
    return course
```

### 1.2 The PDF Extraction Prompt (revised — facts only, no AI arithmetic)

Feed each syllabus PDF, plus a 1-page 12th/JEE baseline summary, to an LLM with this prompt. Note what changed: the AI now extracts **raw fields only** — it no longer computes `raw_workload` or `hands_on_ratio` itself. That math moves to Section 1.3, in code, where it's actually checkable.

> **Prompt:**
> You are a curriculum data engineer. I am attaching a university course syllabus PDF and a baseline 12th-grade/JEE knowledge summary. Read them carefully and return a single valid JSON object.
> **Steps:**
> 1. Extract `course_name`, `course_code`, `branch` (department/discipline), and `category` (e.g., Core / Program Elective / Open Elective — this is distinct from `branch`, do not conflate them).
> 2. Extract weekly hours for L (Lecture), T (Tutorial), P (Practical), and the self-study figure exactly as stated — including whether it is a weekly or semester-total figure.
> 3. Extract the evaluation scheme's raw marks (MSE, TA, ESE, CIE, or whatever fields this syllabus uses) — numbers only, no computation.
> 4. Estimate `prior_knowledge_score` (1–5 absolute scale, anchored to the attached 12th/JEE baseline). Provide a 1-sentence justification citing a specific course outcome.
> 5. Estimate `difficulty_score` (1–5 absolute scale, based on conceptual/mathematical depth). Provide a 1-sentence justification.
> 6. Generate 3–5 concise `topic_tags` that best describe this course's core content areas — Title Case, 1–3 words each, based on the actual syllabus content (e.g., "Data Engineering," "Machine Learning," not generic filler like "Computer Science"). These are for display only and will be manually reviewed per course after generation, so don't worry about matching wording used on other courses.
> 7. Output `testimonials` as an empty array `[]` and `source` as `"estimated"` for both Bucket B fields.
>
> Output ONLY valid JSON, no markdown outside the code block, matching this structure exactly:
> ```json
> {
>   "course_code": "...",
>   "course_name": "...",
>   "branch": "...",
>   "category": "...",
>   "teaching_scheme": { "L": 0, "T": 0, "P": 0, "self_study": 0, "self_study_is_weekly": false },
>   "evaluation_scheme_raw": { "MSE": 0, "TA": 0, "ESE": 0, "CIE": 0 },
>   "prior_knowledge_score": 0,
>   "prior_knowledge_justification": "...",
>   "difficulty_score": 0,
>   "difficulty_justification": "...",
>   "topic_tags": [],
>   "source": { "prior_knowledge": "estimated", "difficulty": "estimated" },
>   "testimonials": []
> }
> ```

**Required next step, not optional:** a human reads both justifications and either accepts or overrides the two Bucket B scores before this record is considered final.

### 1.3 Code-computed fields (Python — deterministic, run after 1.2)

```python
SEMESTER_WEEKS = 14  # confirm against your actual academic calendar — adjust if different

def compute_derived_fields(course):
    L, T, P = course["teaching_scheme"]["L"], course["teaching_scheme"]["T"], course["teaching_scheme"]["P"]
    ss = course["teaching_scheme"]["self_study"]
    ss_weekly = ss if course["teaching_scheme"]["self_study_is_weekly"] else ss / SEMESTER_WEEKS

    course["raw_workload"] = L + T + P + ss_weekly

    denom = L + T + P
    if denom == 0:
        course["hands_on_score"] = 3  # neutral placeholder
        course["needs_manual_review"] = True  # actually flag it, not just default silently
    else:
        course["hands_on_score"] = 1 + 4 * (P / denom)

    ev = course["evaluation_scheme_raw"]
    ev_denom = ev["MSE"] + ev["TA"] + ev["ESE"]
    course["evaluation_style_facts"] = {
        "theory_exam_pct": None if ev_denom == 0 else round((ev["MSE"] + ev["ESE"]) / ev_denom, 2),
        "lab_is_fully_continuous": True
    }
    return course

# Run only after ALL courses have raw_workload populated:
def normalize_workload(all_courses):
    raws = [c["raw_workload"] for c in all_courses]
    lo, hi = min(raws), max(raws)
    for c in all_courses:
        if hi == lo:
            c["workload_score"] = 3  # every course has identical raw workload (or only 1 course tagged) — nothing to scale against yet
        else:
            c["workload_score"] = 1 + 4 * (c["raw_workload"] - lo) / (hi - lo)
    return all_courses
```

**Two real bugs this fixes, both of which would have broken on first run:**
- `SEMESTER_WEEKS` was referenced in the self-study conversion but never defined anywhere in the guide — a `NameError` the moment `compute_derived_fields` actually ran. Set it once, confirm the number against your real academic calendar.
- `normalize_workload` divides by `(hi - lo)`. If you tag only a handful of pilot courses and two or more happen to land on the same raw workload — genuinely likely with a small pilot batch — `hi == lo` and this throws a `ZeroDivisionError`. Now guarded.

### 1.4 Final per-course schema

```json
{
  "course_code": "CS-401",
  "course_name": "...",
  "branch": "Computer Engineering",
  "category": "Program Elective",
  "prior_knowledge_score": 3,
  "difficulty_score": 4,
  "workload_score": 4.0,
  "hands_on_score": 3.0,
  "source": { "prior_knowledge": "estimated", "difficulty": "estimated", "workload": "computed" },
  "evaluation_style_facts": { "theory_exam_pct": 0.8, "lab_is_fully_continuous": true },
  "topic_tags": ["Data Engineering", "Machine Learning"],
  "testimonial_count": 0,
  "testimonials": []
}
```

---

## PHASE 2: The Percentage — Pure Python, No AI

### 2.1 The Two Formulas

**Shortfall** (prior_knowledge, workload) — a course demanding *less* than the student can handle is fine; demanding *more* is penalized:
```
shortfall = max(0, course_value - student_value)
raw_score = 5 - shortfall
normalized_score = (raw_score - 1) / 4
```

**Distance** (difficulty, hands_on) — a mismatch in *either* direction is penalized equally:
```
distance = abs(student_value - course_value)
raw_score = 5 - distance
normalized_score = (raw_score - 1) / 4
```

**Branch proximity** — direct 0–1 value, no transform, from a fixed lookup table (1.0 = same branch, 0.6 = related branch cluster, 0.3 = unrelated). **This table itself isn't defined anywhere in this guide** — `branch_lookup()` below assumes you've built a `{branch: cluster}` mapping (e.g., which branches count as "related" — likely all computing-adjacent branches in one cluster, core sciences in another) as a plain dict before this function is called. Build that dict first; it's a one-time data task, not a formula.

### 2.2 Final Percentage

```python
def compute_fit(student, course):
    def shortfall_score(s, c):
        return (5 - max(0, c - s) - 1) / 4
    def distance_score(s, c):
        return (5 - abs(s - c) - 1) / 4

    scores = {
        "prior_knowledge": shortfall_score(student["prior_knowledge"], course["prior_knowledge_score"]),
        "workload": shortfall_score(student["workload"], course["workload_score"]),
        "difficulty": distance_score(student["difficulty"], course["difficulty_score"]),
        "hands_on": distance_score(student["hands_on"], course["hands_on_score"]),
        "branch_proximity": branch_lookup(student["branch"], course["branch"]),
    }
    fit_percentage = round(sum(scores.values()) / len(scores) * 100)
    return scores, fit_percentage
```

### 2.3 Worked Example (corrected)

Student: prior_knowledge=2, difficulty=4, workload=2, hands_on=4, branch=Computer Engineering
Course: prior_knowledge=3, difficulty=4, workload=4, hands_on=3, branch_proximity=0.60

| Attribute | Formula | Raw | Normalized |
|---|---|---|---|
| prior_knowledge | shortfall | 5-max(0,3-2)=4 | 0.75 |
| difficulty | distance | 5-\|4-4\|=5 | 1.00 |
| workload | shortfall | 5-max(0,4-2)=3 | 0.50 |
| hands_on | distance | 5-\|4-3\|=4 | 0.75 |
| branch_proximity | direct | — | 0.60 |

```
fit_percentage = round((0.75+1.00+0.50+0.75+0.60)/5 × 100) = round(0.72 × 100) = 72%
```

*(Your uploaded draft's example was missing `branch_proximity` entirely and its 4-value average didn't match its stated total — this is the corrected version, checkable by hand.)*

### 2.4 The Phase 2 → Phase 3 Payload

```json
{
  "course_code": "CS-401",
  "fit_percentage": 72,
  "attributes_used": [
    {"name": "prior_knowledge", "student_value": 2, "course_value": 3, "score": 0.75},
    {"name": "difficulty", "student_value": 4, "course_value": 4, "score": 1.00},
    {"name": "workload", "student_value": 2, "course_value": 4, "score": 0.50},
    {"name": "hands_on", "student_value": 4, "course_value": 3, "score": 0.75},
    {"name": "branch_proximity", "value": 0.60}
  ],
  "evaluation_style_facts": { "theory_exam_pct": 0.8, "lab_is_fully_continuous": true }
}
```

---

## PHASE 3: The Model Writes "Why This Fits"

The Python backend sends the Phase 2 payload to the Gemini API to generate the explanation card text.

> **Prompt:**
> You are a course-fit advisor. I am providing a JSON payload containing the computed `fit_percentage`, matched `attributes_used`, and `evaluation_style_facts` for one or more courses.
> Write a 3–4 sentence explanation per course, in two parts:
> 1. **"why_this_fits":** From `attributes_used`, highlight the 1–2 **highest-scoring** entries. State the student's value and the course's value in plain language.
> 2. **"worth_knowing":** From `attributes_used`, highlight the single **lowest-scoring** entry as an honest caveat. You may reference `evaluation_style_facts` here for added context, but never as a standalone reason — it wasn't part of the score.
>
> **Strict rules:**
> - Do NOT recalculate, restate, or alter `fit_percentage`.
> - Do NOT invent reasons outside `attributes_used`.
> - Do NOT reference or paraphrase testimonial free-text — that's shown separately, untouched.
> - Return ONLY a valid JSON array of `{course_code, why_this_fits, worth_knowing}`. No markdown, no backticks.

---

## PHASE 4: Frontend Display Assembly

The results card assembles four independent, untampered pieces:

1. **Fit percentage** — from Phase 2 (Python math).
2. **Narrative** — from Phase 3 (AI text: `why_this_fits`, `worth_knowing`).
3. **Topic tags** — from Phase 1 (syllabus extraction, generated per course and human-reviewed, displayed as `#hashtags`).
4. **Testimonials** — real student quotes and ratings, injected verbatim, unedited.

None of these four touches or generates any of the others.

---

## Appendix A: Finalized Question Wording — 6 questions, confirmed

Two attributes (prior_knowledge, difficulty) are each the **average of 2 questions**. The other two (workload, hands_on) are **single, direct-mapped questions** — this is a deliberate asymmetry, not an oversight: prior_knowledge and difficulty are more prone to single-question noise (a novelty preference and a self-teaching comfort question capture genuinely different signal), while workload and hands-on are concrete enough that one well-worded question is enough.

### Student intake (1–5 scale)

**Prior Knowledge** — backend averages Q1 & Q2:
1. "Do you prefer courses on topics you already know, or topics that are totally new to you?" (1 = Already know → 5 = Totally new)
2. "If a course covers something you've never studied, how comfortable are you picking it up as you go?" (1 = Not comfortable → 5 = Very comfortable)

**Difficulty** — backend averages Q3 & Q4:
3. "Do you prefer easy, straightforward courses or more challenging ones?" (1 = Easy → 5 = Challenging)
4. "How much do you enjoy spending extra time solving a tough problem?" (1 = Not much → 5 = A lot)

**Workload** — single variable, direct mapping:
5. "How much time can you give a course every week, outside class?" (1 = Very little → 5 = A good amount)

**Hands-on vs. Theory** — single variable, direct mapping:
6. "Do you enjoy hands-on/practical work more, or theory more?" (1 = Theory → 5 = Hands-on)

### Testimonial form (past students who completed the course) — mirrored wording

**Prior Knowledge** — averages T1 & T2:
1. "Was this course's material mostly things you already knew, or mostly new to you?" (1 = Already knew → 5 = Totally new)
2. "How much prior background do you think this course actually required to keep up comfortably?" (1 = None needed → 5 = A lot needed)

**Difficulty** — averages T3 & T4:
3. "Looking back, was this course easy/straightforward or genuinely challenging?" (1 = Easy → 5 = Challenging)
4. "How often did you find yourself spending extra time working through a tough problem?" (1 = Rarely → 5 = Very often)

**Workload** — single, direct:
5. "Realistically, how much time did this course take every week, outside class?" (1 = Very little → 5 = A lot)

**Hands-on vs. Theory** — single, direct:
6. "Was this course more hands-on/practical, or more theory-heavy?" (1 = Theory-heavy → 5 = Hands-on)

Plus, not scored: an overall satisfaction question ("How satisfied are you that you chose this course?", 1–5 — held for future validation, not matched against anything yet), open-text "best part / hardest part / advice for a junior" fields, and metadata (course, name or anonymous, branch, semester/year taken).

**One honest note on T1/T2:** these ask a past student to self-report, which means the average is somewhat shaped by who happened to take the course — a section full of already-prepared students will under-report the background the course actually needs. This washes out as testimonial volume grows (part of why the ≥3-testimonial threshold exists before this data is trusted over the AI estimate), but it's worth knowing this signal is a little noisier than the syllabus-computed attributes.

---

## Deployment Note

Next.js frontend deploys natively to Vercel. A **separate, persistent Python backend does not run on Vercel the same way** — Vercel's Python support is serverless-function-based, not a long-running service. Host the Python backend on Render, Railway, or Fly.io instead, with Supabase used purely as the database (not for edge functions, since the backend is Python, not Deno/TypeScript). Confirm this two-deployment setup (Vercel for frontend, Render/Railway for backend) is reflected in your actual deployment plan before build day.

---

## Change list vs. your uploaded draft

1. Worked example: added missing `branch_proximity`, corrected the average (was internally inconsistent).
2. Separated `branch` and `category` as distinct fields instead of one standing in for both.
3. Restored the required human-review step for Bucket B AI estimates.
4. Moved `raw_workload` and `hands_on_ratio` computation out of the AI prompt into deterministic Python (Section 1.3) — the AI now extracts raw hours only.
5. Added a `source` field (`estimated` / `testimonial_averaged` / `computed`) and specified the actual testimonial-overwrite trigger (≥3 testimonials) as a batch job, not a vague sentence. Clarified `hands_on_score` is never overwritten by testimonials.
6. ~~Restored the canonical topic-tag vocabulary constraint~~ — reversed per your latest instruction: tags are now generated freely per course (no pre-built list, no `flagged_new_tags` field), since they're display-only and you're reviewing each course's tags manually after generation anyway. Consistency of wording across courses is now on you during review, not enforced upfront by the prompt.
7. Moved `evaluation_style_facts` back to computed numbers instead of an AI-summarized sentence, keeping it genuinely in Bucket A.
8. Added a divide-by-zero guard for `hands_on_ratio` when a course has zero lecture/tutorial/practical hours.
9. Confirmed the final 6-question design (prior_knowledge and difficulty each averaged from 2 questions; workload and hands_on each a single direct question) and added the matching 6-question testimonial mirror set, with a note on the self-report bias in the prior_knowledge testimonial questions.
10. Added a deployment note on Next.js (Vercel) + Python backend needing separate hosting.
11. Fixed two real bugs found on a line-by-line pass: `SEMESTER_WEEKS` was used but never defined (would crash on first run), and `normalize_workload` divided by zero whenever two or more tagged courses share the same raw workload (realistic with a small pilot batch).
12. Added the testimonial object schema (field names were never given explicitly before) and the actual overwrite batch job code (previously only described in prose, with no function to match).
13. Flagged a prerequisite this guide depends on but doesn't build for you: the branch-cluster lookup table — a one-time data task you need before Phase 1 runs. (The canonical topic-tag vocabulary prerequisite from the previous version has been removed — tags are now generated freely per course and reviewed manually, per your latest instruction.)
