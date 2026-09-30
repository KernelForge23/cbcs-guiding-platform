 🎓 CBCS Guiding Platform

A personalized web platform that helps engineering students choose CBCS electives based on their preferences, course characteristics, and senior experiences.

🚀 Live Demo

"Try CBCS Guiding Platform →" (https://cbcs-guiding-platform.vercel.app/)

---

📸 What is CBCS Guiding Platform?

Choosing a CBCS elective can be difficult when the available information is scattered across seniors, WhatsApp groups, spreadsheets, and personal experiences.

This platform brings that information together and helps students find courses that match how they prefer to learn.

Students answer a short questionnaire and receive a ranked list of eligible electives along with their fit percentage, course details, tags, and senior reviews.

---

✨ Features

🎯 Personalized Recommendations

Students answer six preference-based questions covering:

- Difficulty
- Workload
- Exploring new fields
- Concept-heavy learning
- Mathematics & logical problem solving
- Practical / hands-on learning

The system compares these preferences with course attributes and generates a personalized ranking.

📊 Course Fit Score

Every eligible course receives a fit percentage based on how closely its characteristics match the student's preferences.

The scoring system is deterministic, meaning the same inputs produce the same results.

📚 CBCS-Aware Filtering

Recommendations take academic constraints into account, including:

- Branch
- Semester
- Course category
- Course availability
- Branch eligibility

👨‍🎓 Senior Reviews

Students can explore experiences from seniors who have already taken a course.

Reviews can include:

- Course rating
- Workload
- Difficulty
- Practical exposure
- Prior knowledge required
- Pros & cons
- Personal experience

📝 Student Testimonials

Students can submit their own course experiences.

Submissions go through a verification flow before being displayed publicly.

📄 Export Recommendations

Students can export their selected courses and recommendation results as a PDF for future reference.

---

🧠 How It Works

              Student
                 │
                 ▼
        Select Branch / Details
                 │
                 ▼
        Preference Questionnaire
                 │
                 ▼
         Eligibility Filtering
                 │
                 ▼
       Recommendation Algorithm
                 │
                 ▼
          Calculate Fit %
                 │
                 ▼
        Rank Eligible Courses
                 │
                 ▼
       Course Details + Reviews
                 │
                 ▼
             PDF Export

Recommendation Algorithm

Each course is represented using attributes such as:

Difficulty
Workload
New Field Exploration
Concept Heavy
Math Heavy
Practical Focus

The student's answers are converted into a preference profile.

The recommendation engine then compares the student's profile with every eligible course.

For example, when a student's preferred difficulty and the course difficulty differ:

score = exp(-0.35 × |studentValue - courseValue|^1.5)

For attributes where exceeding the student's preferred workload should be penalized:

shortfall = max(0, courseValue - studentValue)

score = exp(-0.35 × shortfall^1.5)

The resulting scores are combined to produce the final fit percentage.

The system is deliberately deterministic and explainable rather than relying on a black-box model.

---

🛠️ Tech Stack

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- jsPDF

Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Uvicorn

Data

- JSON-based course catalogue
- SQLite for testimonial data

---

📁 Project Structure

cbcs-guiding-platform/
│
├── app/                  # Next.js application
│
├── components/           # Reusable UI components
│
├── api/                  # FastAPI backend
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── courses.json
│   └── routers/
│
├── public/               # Static assets
│
├── scripts/              # Data processing / maintenance scripts
│
├── types/                # TypeScript types
│
├── constants.ts
├── package.json
├── pyproject.toml
└── README.md

---

⚙️ Getting Started

Prerequisites

Make sure you have installed:

- Node.js
- npm
- Python 3.13+
- pip

1. Clone the repository

git clone https://github.com/KernelForge23/cbcs-guiding-platform.git
cd cbcs-guiding-platform

2. Install frontend dependencies

npm install

3. Install backend dependencies

pip install -r api/requirements.txt

4. Start the backend

uvicorn api.main:app --reload --port 8000

The API will be available at:

http://localhost:8000

5. Start the frontend

In another terminal:

npm run dev

Open:

http://localhost:3000

---

🔌 API

The backend currently exposes endpoints for course recommendations and testimonials.

Method| Endpoint| Purpose
"POST"| "/api/recommend"| Generate course recommendations
"GET"| "/api/courses/{course_code}"| Get course information
"POST"| "/api/testimonials/"| Submit a testimonial
"GET"| "/api/testimonials/{course_code}"| Get approved testimonials
"GET"| "/health"| Backend health check

---

🔐 Testimonial Verification

User-submitted testimonials aren't immediately treated as verified information.

Student submits review
        │
        ▼
      PENDING
        │
        ▼
     Verification
        │
        ▼
     APPROVED
        │
        ▼
 Displayed to students

This keeps unverified submissions separate from publicly displayed course experiences.

---

🗺️ Roadmap

- [ ] Admin dashboard for testimonial verification
- [ ] Expand verified course dataset
- [ ] Improve course comparison
- [ ] Add automated tests for recommendation logic
- [ ] Improve recommendation explanations
- [ ] Production database integration
- [ ] Analytics dashboard

---

🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository
2. Create a feature branch

git checkout -b feature/your-feature

3. Commit your changes

git commit -m "Add your feature"

4. Push the branch

git push origin feature/your-feature

5. Open a Pull Request

---

👥 Team

Built by Sumedh Shelgaonkar & Aaditya Shah.

---
Made to make CBCS elective selection easier.
