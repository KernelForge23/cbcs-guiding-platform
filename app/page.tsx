"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronLeft,
  GraduationCap,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Star,
} from "lucide-react";
import {
  COURSE_CATEGORIES,
  type CourseCategory,
  getEligibleCourses,
} from "./lib/getEligibleCourses";
import { formatCourseCodeForDisplay } from "./lib/courseCode";

type View =
  | "home"
  | "wizard"
  | "results"
  | "testimonial_login"
  | "testimonial_form";

  type Branch = 
  | "Artificial Intelligence and Machine Learning"
  | "Civil Engineering"
  | "Computer Science and Engineering"
  | "Electrical Engineering"
  | "Electronic and Telecommunication Engineering"
  | "Instrumentation and Control Engineering"
  | "Manufacturing Engineering and Industrial Management"
  | "Mechanical Engineering"
  | "Metallurgy and Material Engineering";

type StudentAttributes = {
  priorKnowledge: number;
  difficulty: number;
  workload: number;
  cognitiveFocus: number;
};

type CourseCard = {
  rank: number;
  course_code: string;
  course_name: string;
  branch: Branch;
  category: CourseCategory;
  branch_proximity: number;
  fit_percentage: number;
  attributes_used: Array<{
    name: string;
    student_value: number | string;
    course_value: number | string;
    score: number;
  }>;
  topic_tags: string[];
  why_this_fits?: string;
  worth_knowing?: string;
  narrative?: {
    why_this_fits?: string;
    worth_knowing?: string;
  } | null;
  testimonials: string[];
  evaluation_style_facts:
    | {
        theory_exam_pct: number | null;
        lab_is_fully_continuous: boolean;
      }
    | string
    | null;
};

type RecommendResponse = {
  courses: CourseCard[];
};

const BRANCHES: Branch[] = [
  "Artificial Intelligence and Machine Learning",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Electrical Engineering",
  "Electronic and Telecommunication Engineering",
  "Instrumentation and Control Engineering",
  "Manufacturing Engineering and Industrial Management",
  "Mechanical Engineering",
  "Metallurgy and Material Engineering"
];

const TESTIMONIAL_COURSES: Array<{
  code: string;
  name: string;
  category: CourseCategory;
}> = [
  {
    code: "MA-BS101",
    name: "Advanced Linear Algebra",
    category: "BS Mathematics",
  },
  {
    code: "MA-BS201",
    name: "Probability and Stochastic Models",
    category: "BS Mathematics",
  },
  {
    code: "AS1-BS110",
    name: "Engineering Physics in Practice",
    category: "BS Applied Science 1",
  },
  {
    code: "AS1-BS210",
    name: "Applied Chemistry for Engineers",
    category: "BS Applied Science 1",
  },
  {
    code: "AS2-BS120",
    name: "Environmental Systems and Sustainability",
    category: "BS Applied Science 2",
  },
  {
    code: "AS2-BS220",
    name: "Engineering Biology Basics",
    category: "BS Applied Science 2",
  },
  {
    code: "ESC1-130",
    name: "Data Structures and Problem Solving",
    category: "ESC 1",
  },
  {
    code: "ESC1-230",
    name: "Circuits and Instrumentation",
    category: "ESC 1",
  },
  {
    code: "ESC2-140",
    name: "Manufacturing Systems Design",
    category: "ESC 2",
  },
  {
    code: "ESC2-240",
    name: "Smart Infrastructure Analytics",
    category: "ESC 2",
  },
  {
    code: "VS-150",
    name: "Innovation and Entrepreneurship",
    category: "VSEC",
  },
  {
    code: "VS-250",
    name: "Professional Communication Lab",
    category: "VSEC",
  },
];

const WIZARD_QUESTIONS = [
  {
    id: "q1" as const,
    group: "Prior Knowledge",
    text: "Do you prefer exploring a completely new field, or diving deeper into the foundations you built in 11th/12th grade?",
    lowLabel: "Explore a new field (Taught entirely from scratch)",
    highLabel: "Dive deeper (Actively relies on a strong 11th/12th foundation)",
  },
  {
    id: "q2" as const,
    group: "Difficulty",
    text: "Do you prefer easy, straightforward courses or more challenging ones?",
    lowLabel: "Easy and straightforward",
    highLabel: "Challenging",
  },
  {
    id: "q3" as const,
    group: "Workload",
    text: "How much time can you give a course every week, outside class?",
    lowLabel: "Very little time",
    highLabel: "A good amount of time",
  },
  {
    id: "q4" as const,
    group: "Cognitive Focus",
    text: "When choosing between courses, what type of coursework do you prefer?",
    lowLabel: "Knowledge & Concept-Heavy",
    highLabel: "Logic & Calculation-Heavy",
  },
];

const TESTIMONIAL_ATTRIBUTES = [
  {
    key: "priorKnowledge" as const,
    label:
      "How much 11th/12th-grade foundation did this course actually expect you to have?",
    lowLabel:
      "Taught completely from scratch (The professor assumed zero prior knowledge)",
    highLabel:
      "Heavily reliant on past foundations (You will struggle if your 11th/12th basics aren't strong)",
  },
  {
    key: "difficulty" as const,
    label: "How would you rate the overall academic difficulty of this course?",
    lowLabel: "Easy and straightforward",
    highLabel: "Challenging",
  },
  {
    key: "workload" as const,
    label: "How much time did this course actually demand every week, outside of class?",
    lowLabel: "Very little time",
    highLabel: "A good amount of time",
  },
  {
    key: "cognitiveFocus" as const,
    label: "How would you describe the primary focus of the coursework and exams?",
    lowLabel: "Knowledge & Concept-Heavy",
    highLabel: "Logic & Calculation-Heavy",
  },
];

function average(a: number, b: number): number {
  return Math.round(((a + b) / 2) * 10) / 10;
}

function formatTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

function getDepartmentsForCategory(
  category: CourseCategory,
  studentBranch: Branch | "",
): string[] {
  if ((category === "ESC 1" || category === "ESC 2") && studentBranch) {
    return BRANCHES.filter((department) => department !== studentBranch);
  }
  return [...BRANCHES];
}

function RatingScale({
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
}) {
  return (
    <div className="space-y-3">
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rate on a scale of 1 to 5"
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
      />
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={value === n ? "text-indigo-600" : "text-slate-500"}
          >
            {n}
          </span>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function FitBadge({ percentage }: { percentage: number }) {
  const ringColor =
    percentage >= 70 ? "#34d399" : percentage >= 40 ? "#fbbf24" : "#f87171";
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const size = 100;
  const strokeWidth = 12;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="inline-flex h-24 w-24 items-center justify-center">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size} ${size}`}
        shapeRendering="geometricPrecision"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          shapeRendering="geometricPrecision"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${center} ${center})`}
          shapeRendering="geometricPrecision"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-900 text-[20px] font-bold"
        >
          {clampedPercentage}%
        </text>
      </svg>
    </div>
  );
}

export default function CBCSElectiveGuide() {
  const [view, setView] = useState<View>("home");

  const [name, setName] = useState("");
  const [branch, setBranch] = useState<Branch | "">("");

  const [q1, setQ1] = useState(3);
  const [q2, setQ2] = useState(3);
  const [q3, setQ3] = useState(3);
  const [q4, setQ4] = useState(3);

  const [attributes, setAttributes] = useState<StudentAttributes | null>(null);
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<CourseCategory>(COURSE_CATEGORIES[0]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const [testimonialName, setTestimonialName] = useState("");
  const [misNumber, setMisNumber] = useState("");
  const [testimonialBranch, setTestimonialBranch] = useState<Branch | "">("");
  const [testimonialCategory, setTestimonialCategory] = useState<
    CourseCategory | ""
  >("");
  const [courseCode, setCourseCode] = useState("");
  const [tPriorKnowledge, setTPriorKnowledge] = useState(3);
  const [tDifficulty, setTDifficulty] = useState(3);
  const [tWorkload, setTWorkload] = useState(3);
  const [tCognitiveFocus, setTCognitiveFocus] = useState(3);
  const [review, setReview] = useState("");
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [testimonialSubmissionMessage, setTestimonialSubmissionMessage] =
    useState("");

  const eligibleCourses = useMemo(
    () =>
      branch
        ? getEligibleCourses({ branch }, courses)
        : [],
    [branch, courses],
  );

  const activeTabCourses = useMemo(
    () => eligibleCourses.filter((course) => course.category === activeTab),
    [activeTab, eligibleCourses],
  );

  const hostDepartments = useMemo(
    () => getDepartmentsForCategory(activeTab, branch),
    [activeTab, branch],
  );

  const visibleCourses = useMemo(() => {
    let filtered = activeTabCourses;

    // The CBCS Rule: Hide ESC courses from the student's own department
    if (activeTab.includes("ESC")) {
      filtered = filtered.filter((course) => {
        // Safe fallbacks to prevent crashes if the branch is empty on page load
        const cBranch = (course.branch || "").toLowerCase();
        const sBranch = (branch || "").toLowerCase();

        // Catch string variations (e.g. "Computer" vs "Computer Science and Engineering")
        if (cBranch.includes("computer") && sBranch.includes("computer")) return false;
        if (cBranch.includes("civil") && sBranch.includes("civil")) return false;
        if (cBranch.includes("mech") && sBranch.includes("mech")) return false;
        if (cBranch.includes("electr") && sBranch.includes("electr")) return false;
        
        return cBranch !== sBranch; // Fallback for exact matches
      });
    }

    // Notice we completely removed the selectedDepartments bouncer here!
    return filtered;
  }, [activeTabCourses, activeTab, branch]);

  const filteredTestimonialCourses = useMemo(
    () =>
      testimonialCategory
        ? TESTIMONIAL_COURSES.filter(
            (course) => course.category === testimonialCategory,
          )
        : [],
    [testimonialCategory],
  );

  const questionSetters = {
    q1: setQ1,
    q2: setQ2,
    q3: setQ3,
    q4: setQ4,
  };

  const questionValues = { q1, q2, q3, q4 };

  function resetAll() {
    setView("home");
    setName("");
    setBranch("");
    setQ1(3);
    setQ2(3);
    setQ3(3);
    setQ4(3);
    setAttributes(null);
    setCourses([]);
    setIsLoadingRecommendations(false);
    setRecommendationError(null);
    setTestimonialName("");
    setMisNumber("");
    setTestimonialBranch("");
    setTestimonialCategory("");
    setCourseCode("");
    setTPriorKnowledge(3);
    setTDifficulty(3);
    setTWorkload(3);
    setTCognitiveFocus(3);
    setReview("");
    setTestimonialSubmitted(false);
    setTestimonialSubmissionMessage("");
    setActiveTab(COURSE_CATEGORIES[0]);
    setSelectedDepartments([]);
  }

  function handleDepartmentToggle(department: string) {
    setSelectedDepartments((current) =>
      current.includes(department)
        ? current.filter((item) => item !== department)
        : [...current, department],
    );
  }

  function handleTabChange(category: CourseCategory) {
    setActiveTab(category);
    setSelectedDepartments(getDepartmentsForCategory(category, branch));
  }

  function handleStartWizard() {
    if (!name.trim() || !branch) return;
    setView("wizard");
  }

  async function handleGetRecommendations() {
    if (!branch || isLoadingRecommendations) return;

    const computed: StudentAttributes = {
      priorKnowledge: q1,
      difficulty: q2,
      workload: q3,
      cognitiveFocus: q4,
    };

    setAttributes(computed);
    setRecommendationError(null);
    setIsLoadingRecommendations(true);

    try {
      const response = await fetch("http://localhost:8000/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prior_knowledge_q1: Number(q1),
          prior_knowledge_q2: Number(q1),
          difficulty_q1: Number(q2),
          difficulty_q2: Number(q2),
          workload: Number(q3),
          cognitive_focus: Number(q4),
          branch,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.detail ?? "Failed to fetch recommendations. Please try again.",
        );
      }

      const data = (await response.json()) as RecommendResponse;
      setCourses(data.courses);
      setActiveTab(COURSE_CATEGORIES[0]);
      setSelectedDepartments(
        getDepartmentsForCategory(COURSE_CATEGORIES[0], branch),
      );
      setView("results");
    } catch (error) {
      setRecommendationError(
        error instanceof Error
          ? error.message
          : "Failed to fetch recommendations. Please try again.",
      );
    } finally {
      setIsLoadingRecommendations(false);
    }
  }

  function handleTestimonialLoginContinue() {
    if (!testimonialName.trim() || !misNumber.trim() || !testimonialBranch)
      return;
    setTestimonialSubmissionMessage("");
    setTestimonialSubmitted(false);
    setView("testimonial_form");
  }

  function handleTestimonialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!testimonialCategory || !courseCode || !review.trim()) return;

    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const shouldAddAnother =
      submitter instanceof HTMLButtonElement &&
      submitter.value === "submit_add_another";

    if (shouldAddAnother) {
      setTestimonialCategory("");
      setCourseCode("");
      setTPriorKnowledge(3);
      setTDifficulty(3);
      setTWorkload(3);
      setTCognitiveFocus(3);
      setReview("");
      setTestimonialSubmissionMessage(
        "Submitted successfully. You can add another testimonial now.",
      );
      return;
    }

    setTestimonialSubmissionMessage("");
    setTestimonialSubmitted(true);
  }

  const testimonialRatingSetters = {
    priorKnowledge: setTPriorKnowledge,
    difficulty: setTDifficulty,
    workload: setTWorkload,
    cognitiveFocus: setTCognitiveFocus,
  };

  const testimonialRatingValues = {
    priorKnowledge: tPriorKnowledge,
    difficulty: tDifficulty,
    workload: tWorkload,
    cognitiveFocus: tCognitiveFocus,
  };

  return (
    <main className="min-h-full bg-gradient-to-b from-slate-50 via-white to-indigo-50/40">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        {/* ── Home View ── */}
        {view === "home" && (
          <div className="space-y-8">
            <header className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                CBCS Elective Guide
              </h1>
              <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
                Find elective courses that match your learning style, workload
                capacity, and branch — powered by transparent, deterministic
                matching.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  How to Use This Guide
                </h2>
              </div>
              <ol className="space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    1
                  </span>
                  Enter your name and branch, then start the preference wizard.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    2
                  </span>
                  Rate six short questions about your learning preferences — all
                  default to a neutral middle so you can adjust only what
                  matters.
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    3
                  </span>
                  Review ranked course recommendations with fit scores,
                  explanations, and peer testimonials.
                </li>
              </ol>
            </section>

            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <p>
                <strong>Disclaimer:</strong> This is a guidance tool, not an
                official recommendation.
              </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="student-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Name
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label
                    htmlFor="student-branch"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Branch
                  </label>
                  <select
                    id="student-branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value as Branch | "")}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select your branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleStartWizard}
                  disabled={!name.trim() || !branch}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Wizard
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("testimonial_login")}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  Share a Testimonial
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ── Wizard View ── */}
        {view === "wizard" && (
          <div className="space-y-6">
            <header className="space-y-2">
              <p className="text-sm font-medium text-indigo-600">
                Preference Wizard
              </p>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Tell us about your learning style
              </h1>
              <p className="text-slate-600">
                Hi {name}! Answer each question on a scale of 1–5. All ratings
                start at 3 — adjust only what feels different for you.
              </p>
            </header>

            <div className="space-y-5">
              {WIZARD_QUESTIONS.map((q, idx) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="mb-4 flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        {q.group}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900 sm:text-base">
                        {q.text}
                      </p>
                    </div>
                  </div>
                  <RatingScale
                    value={questionValues[q.id]}
                    onChange={questionSetters[q.id]}
                    lowLabel={q.lowLabel}
                    highLabel={q.highLabel}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setView("home")}
                disabled={isLoadingRecommendations}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Home
              </button>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {recommendationError && (
                  <p className="text-sm text-red-600">{recommendationError}</p>
                )}
                <button
                  type="button"
                  onClick={handleGetRecommendations}
                  disabled={isLoadingRecommendations}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingRecommendations
                    ? "Ranking courses..."
                    : "Get My Recommendations"}
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        {isLoadingRecommendations && (
  <div className="flex flex-col items-center justify-center py-16 animate-pulse">
    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
      Ranking the courses according to your preferences...
    </p>
  </div>
)}

        {/* ── Results View ── */}
        {view === "results" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <header className="space-y-2">
                <p className="text-sm font-medium text-indigo-600">
                  Your Recommendations
                </p>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Top matches for {name}
                </h1>
                <p className="text-slate-600">
                  {branch} · Based on your preference profile
                  
                </p>
              </header>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {COURSE_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleTabChange(category)}
                    aria-pressed={activeTab === category}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      activeTab === category
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <details className="w-full rounded-xl border border-slate-200 bg-white sm:ml-4 sm:w-80">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-900">
                  Host Department
                </summary>
                <div className="space-y-2 border-t border-slate-100 px-4 py-3">
                  {hostDepartments.map((department) => (
                    <label
                      key={department}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(department)}
                        onChange={() => handleDepartmentToggle(department)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {department}
                    </label>
                  ))}
                </div>
              </details>
            </div>

            <div className="space-y-5">
              {visibleCourses.map((course, index) => (
                <article
                  key={course.course_code}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600">
                          {formatCourseCodeForDisplay(course.course_code)}
                        </p>
                        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                          {course.course_name}
                        </h2>
                      </div>
                      <FitBadge percentage={course.fit_percentage} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {course.topic_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                        >
                          {formatTag(tag)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5 px-5 py-5 sm:px-6">
                    {course.narrative ? (
                      <>
                        <div>
                          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                            <Star className="h-4 w-4 text-indigo-500" />
                            Why this fits you
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {course.narrative?.why_this_fits ??
                              course.why_this_fits ??
                              "AI narrative currently generating..."}
                          </p>
                        </div>

                        <div>
                          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                            Worth knowing
                          </h3>
                          <p className="text-sm leading-relaxed text-slate-600">
                            {course.narrative?.worth_knowing ??
                              course.worth_knowing ??
                              "No narrative available."}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        AI narrative currently generating...
                      </div>
                    )}

                    {course.testimonials.map((testimonial) => (
                      <blockquote
                        key={testimonial}
                        className="rounded-xl border-l-4 border-indigo-300 bg-indigo-50/50 px-4 py-3"
                      >
                        <p className="text-sm italic leading-relaxed text-slate-700">
                          &ldquo;{testimonial}&rdquo;
                        </p>
                      </blockquote>
                    ))}
                  </div>
                </article>
              ))}
              {activeTabCourses.length > 0 && visibleCourses.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
                  No courses match the selected Host Department filters.
                </div>
              )}
              {activeTabCourses.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600">
                  No eligible courses found for this category.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Testimonial Login (Page 1) ── */}
        {view === "testimonial_login" && (
          <div className="mx-auto max-w-lg space-y-6">
            <header className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <MessageSquareQuote className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Share a Testimonial
              </h1>
              <p className="text-sm text-slate-600">
                Help future students by sharing your honest course experience.
                All submissions are reviewed before going live.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 1 of 2 — Verify your identity
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="testimonial-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Name
                  </label>
                  <input
                    id="testimonial-name"
                    type="text"
                    value={testimonialName}
                    onChange={(e) => setTestimonialName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mis-number"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    MIS Number
                  </label>
                  <input
                    id="mis-number"
                    type="text"
                    value={misNumber}
                    onChange={(e) => setMisNumber(e.target.value)}
                    placeholder="e.g. 112203001"
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label
                    htmlFor="testimonial-branch"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Branch
                  </label>
                  <select
                    id="testimonial-branch"
                    value={testimonialBranch}
                    onChange={(e) =>
                      setTestimonialBranch(e.target.value as Branch | "")
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select your branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setView("home")}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTestimonialLoginContinue}
                  disabled={
                    !testimonialName.trim() ||
                    !misNumber.trim() ||
                    !testimonialBranch
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ── Testimonial Form (Page 2) ── */}
        {view === "testimonial_form" && (
          <div className="mx-auto max-w-lg space-y-6">
            <header className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-slate-900">
                Course Review
              </h1>
              <p className="text-sm text-slate-600">
                {testimonialName} · {testimonialBranch}
              </p>
            </header>

            {testimonialSubmitted ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-900">
                  Submitted for human verification
                </h2>
                <p className="mt-2 text-sm text-emerald-700">
                  Thank you! Your review will be checked by an administrator
                  before appearing on course cards.
                </p>
                <button
                  type="button"
                  onClick={resetAll}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Return to Home
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleTestimonialSubmit}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
              >
                <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Step 2 of 2 — Rate your course
                </p>
                {testimonialSubmissionMessage && (
                  <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {testimonialSubmissionMessage}
                  </div>
                )}

                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="course-category"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Category
                    </label>
                    <select
                      id="course-category"
                      value={testimonialCategory}
                      onChange={(e) => {
                        setTestimonialCategory(e.target.value as CourseCategory);
                        setCourseCode("");
                      }}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Select category</option>
                      {COURSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="course-code"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Course
                    </label>
                    <select
                      id="course-code"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      required
                      disabled={!testimonialCategory}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">
                        {testimonialCategory
                          ? "Select course"
                          : "Select category first"}
                      </option>
                      {filteredTestimonialCourses.map((course) => (
                        <option key={course.code} value={course.code}>
                          {course.name} ({formatCourseCodeForDisplay(course.code)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-5">
                  {TESTIMONIAL_ATTRIBUTES.map((attr) => (
                    <div
                      key={attr.key}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <p className="mb-3 text-sm font-medium text-slate-900">
                        {attr.label}
                      </p>
                      <RatingScale
                        value={testimonialRatingValues[attr.key]}
                        onChange={testimonialRatingSetters[attr.key]}
                        lowLabel={attr.lowLabel}
                        highLabel={attr.highLabel}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <label
                    htmlFor="review"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Leave Advice for Your Juniors (The Inside Scoop)
                  </label>
                  <p className="mt-2 text-sm text-slate-600">
                    Don't just repeat your slider scores! Tell the first-years what the numbers can't. If you were talking to your junior in the canteen, what is the one secret you would tell them to survive this course?
                    Think about answering at least one of these:
                  </p>
                  <ul className="ml-5 mt-2 list-disc text-sm text-slate-600">
                    <li>How do you actually score marks? (e.g., "Memorize the PYQs," "The professor is very strict about step-marking.")</li>
                    <li>What resources saved your life? (Drop the name of that one YouTube channel or website that actually taught you the subject).</li>
                    <li>Who should take this, and who should run away? (e.g., "Take this if you love pure math, avoid it if you just want an easy grade.")</li>
                  </ul>
                  <textarea
                    id="review"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    required
                    rows={5}
                    placeholder="Share what future students should know..."
                    className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setView("testimonial_login")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    value="submit_add_another"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Submit &amp; Add Another
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    value="submit_final"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                  >
                    Submit Testimonial
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
