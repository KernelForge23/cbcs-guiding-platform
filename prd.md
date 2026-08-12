# Product Requirements Document (PRD)
**Project:** CBCS Guiding Platform  
**Version:** 3.1 (Verified Data, Streamlined Form & Analytics)  
**Objective:** A deterministic, AI-assisted Choice-Based Credit System (CBCS) elective recommendation platform for first-year engineering students.

---

## 1. Product Vision & Architecture Overview
The platform matches students to elective courses based on their academic persona and constraints. It strictly avoids black-box AI matching. Instead, it utilizes a deterministic mathematical backend (FastAPI) to calculate fit percentages, followed by an LLM (Gemini) acting strictly as a narrator to explain the math.

All data injected into the system (course attributes and student testimonials) is strictly gated behind a mandatory human verification protocol before interacting with the recommendation engine.

### Core Tech Stack
*   **Frontend:** Next.js + React + Tailwind CSS
*   **Backend:** FastAPI (Python)
*   **AI Engine:** Google Gemini (via `google-genai` SDK)
*   **Database/Storage:** Supabase (PostgreSQL) / Local JSON for MVP (Separated into 'Active' and 'Pending' tables)
*   **Analytics:** PostHog
*   **Hosting:** Vercel

---

## 2. Frontend User Flow & UI Requirements

### 2.1 Landing Screen (Homepage)
*   **Purpose:** Introduce the tool, collect identity for the recommendation wizard, or route past students to the testimonial portal.
*   **Elements:**
    *   **"How to Use This Guide":** A clear, persistent instructional section explaining the purpose of the platform and how the matching works.
    *   **Disclaimer:** Visible text stating: *"This is a guidance tool, not an official recommendation."*
    *   **Student Input:** `Name` (Text field) and `Branch` (Dropdown).
    *   **Action 1 (Main Flow):** "Start Wizard" button.
    *   **Action 2 (Data Collection):** "Share a Testimonial" button (Routes to 2.4).

### 2.2 Preference Wizard (The 6 Questions)
*   **UI Constraints:** Students answer 6 questions on a 1-5 scale. **All scales must default to a value of 3** to prevent decision fatigue. Every field must be validated before submission.
*   **Question Mapping:**
    *   **Prior Knowledge (Background) — Backend averages Q1 & Q2:**
        1. "Do you prefer courses on topics you already know, or topics that are totally new to you?" (1 = Already know to 5 = Totally new)
        2. "If a course covers something you've never studied, how comfortable are you picking it up as you go?" (1 = Not comfortable to 5 = Very comfortable)
    *   **Difficulty — Backend averages Q3 & Q4:**
        3. "Do you prefer easy, straightforward courses or more challenging ones?" (1 = Easy to 5 = Challenging)
        4. "How much do you enjoy spending extra time solving a tough problem?" (1 = Not much to 5 = A lot)
    *   **Workload — Single variable, direct mapping:**
        5. "How much time can you give a course every week, outside class?" (1 = Very little to 5 = A good amount)
    *   **Cognitive Focus — Single variable, direct mapping:**
            6. "When choosing between courses, what type of coursework do you prefer?" (1 = Knowledge & Concept-Heavy to 5 = Logic & Calculation-Heavy)

### 2.3 Results Display
*   **Elements:** A ranked list of course cards from highest to lowest fit percentage.
*   **Card Anatomy:**
    *   Rank position, Course Name, and Course Code.
    *   `Fit Percentage` badge.
    *   `Topic Tags` (Displayed as #hashtags).
    *   `Why this fits you` (AI-generated explanation).
    *   `Worth knowing` (AI-generated caveat).
    *   `Testimonials` (1-2 real quotes displayed verbatim. If 0 exist, show *"Be the first to review this course"*).
*   **Actions:** 
    *   **"Start Over" Button:** Clears all state and returns the user to the Landing Screen.

### 2.4 "Share a Testimonial" Portal
*   **Page 1 (Authentication/Login):** Takes the past student's `Name`, `MIS Number` (Text field for internal ID validation), and `Branch` (Dropdown).
*   **Page 2 (Input):** Users select the `Semester Taken` and `Course Code`, rate the 4 primary attributes (`prior_knowledge`, `difficulty`, `workload`, `hands_on`), and provide an open-text review (Pros/Cons/Tips).
*   **Data Routing:** Submissions from this form do NOT go live. They are sent directly to an isolated `Pending_Testimonials` database for human review (See Section 6).

---

## 3. Data Architecture, Tagging & Mandatory Verification (Phase 1)
Each course is stored with attributes categorized by source reliability. **No attribute goes into the live database without human verification.**

### 3.1 Attribute Buckets & Calculation
*   **Bucket A (Computed):** Pure arithmetic from syllabus.
    *   `workload_score` (1-5)
    *   `cognitive_focus_score` (1-5)
    *   `topic_tags` and `evaluation_style_facts`
*   **Bucket B (Dynamic):** AI first-pass estimate, eventually replaced by verified testimonials.
    *   `prior_knowledge_score` (1-5)
    *   `difficulty_score` (1-5)
*   **Bucket D (Lookup):** Branch Proximity.
    *   1.0 = Same branch, 0.6 = Related branch, 0.3 = Unrelated branch.

### 3.2 The Mandatory Verification Protocol
Before any course becomes active in the engine, its attributes must pass through a human verification checkpoint.
1.  **Generation Phase:** The Python scripts extract Bucket A logic, estimate Bucket B using AI, and apply Bucket D lookups.
2.  **Draft State:** These initial values are saved in a "Pending/Draft" state.
3.  **Human Verification Step:** System administrators review the initial generated values against the raw syllabus and institutional context.
4.  **Finalization:** The admin provides inputs/overrides if the initial computation feels inaccurate. A final value is explicitly locked in by the admin. Only finalized values are deployed to the `courses.json` or Active Database.

---

## 4. The Math Engine (Phase 2 Backend)
The FastAPI backend receives the student payload (Branch + the 4 attributes generated from the 6 questions) and calculates the match against every *verified* course. 

### 4.1 Scoring Logic

**1. Shortfall Formula (For `prior_knowledge` and `workload`)**
A course demanding *less* than the student can handle incurs no penalty. A course demanding *more* reduces the score.

$$\text{shortfall}=\max(0,\text{courseValue}-\text{studentValue})$$

$$\text{rawScore}=5-\text{shortfall}$$

$$\text{normalizedScore}=\frac{\text{rawScore}-1}{4}$$

**2. Distance Formula (For `difficulty` and `cognitive_focus`)**
Mismatch in *either* direction penalizes the score.

$$\text{rawScore}=5-|\text{studentValue}-\text{courseValue}|$$

$$\text{normalizedScore}=\frac{\text{rawScore}-1}{4}$$

**3. Final Percentage Calculation**
Include the `branch_proximity` score directly (0 to 1.0). Average all 5 included values.

$$\text{fitPercentage}=\text{round}\left(\frac{\sum\text{normalizedScores}}{\text{count}}\times100\right)$$

*Constraint:* If an attribute is missing (null), exclude it from the denominator. Do not invent defaults. 

---

## 5. AI Narrative Integration (Phase 3)
The backend constructs a strict prompt and sends it to the Gemini API.

*   **Input Data:** The computed `fit_percentage`, the `attributes_used` array containing raw and normalized scores, and `evaluation_style_facts`.
*   **System Instructions:**
    *   Act as an academic advisor. Write a 3-4 sentence explanation.
    *   **Part 1 ("Why this fits"):** Highlight the 1-2 highest-scoring attributes. State the student's preference vs. the course reality in plain language.
    *   **Part 2 ("Worth knowing"):** Highlight the single lowest-scoring attribute as an honest caveat.
*   **Hard Constraints:**
    *   NEVER recalculate the `fit_percentage`.
    *   NEVER invent attributes or reference excluded attributes.
    *   NEVER use marketing fluff ("amazing", "perfect").
    *   NEVER summarize or alter the raw testimonial strings.

---

## 6. The Feedback Loop: Testimonial Verification Database
To ensure bad actors or spam do not corrupt the recommendation engine, testimonials follow a strict quarantine pipeline.

1.  **Quarantine (Separate DB):** Submissions from the "Share a Testimonial" UI are written exclusively to an entirely separate `Pending_Testimonials` database table.
2.  **Admin Verification:** System administrators log in to review the `Pending_Testimonials` data. They verify the MIS number validity and check the open-text review for spam or malicious content.
3.  **Integration & Recalculation:** Once approved, the admin triggers an integration script that:
    *   Moves the review to the active `Verified_Testimonials` database.
    *   Recalculates the rolling average for `prior_knowledge`, `difficulty`, and `workload` for that specific course (merging it with the previously verified baseline value).
    *   Requires a final human sign-off on the newly adjusted attribute averages before they go live in the scoring engine.

---

## 7. Analytics & Telemetry (Phase 7)
The Next.js frontend will integrate PostHog for event tracking and telemetry to analyze student flows and identify UX drop-offs.

**Key Metrics Tracked:**
*   **Base Metrics:** Daily Active Users (DAU), Unique Monthly Users, Average Session Duration.
*   **Event Tracking:**
    *   `wizard_started`: User clicks "Start Wizard".
    *   `wizard_step_completed`: Fires on every "Next" click to build a conversion funnel (identifying if students drop out on a specific question).
    *   `recommendation_generated`: Triggers when the backend successfully returns the AI course cards.
    *   `testimonial_started` / `testimonial_submitted`: Tracks the conversion rate of the feedback loop.
*   **Privacy Constraint:** Analytics must not log personally identifiable information (PII) beyond the MIS numbers strictly required for the testimonial verification database. Session replays must mask standard inputs to protect student names.