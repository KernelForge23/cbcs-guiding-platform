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
import courseCatalog from "../api/courses.json";

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

type PreferenceKey =
  | "difficulty_level"
  | "workload_level"
  | "new_field_exploration"
  | "concept_heavy"
  | "math_heavy"
  | "practical_focus";

type StudentAttributes = Record<PreferenceKey, number>;

type TestimonialCategory = string;

type TestimonialCourse = {
  course_code: string;
  course_name: string;
  category: string;
};

type CourseTestimonial = {
  id: number;
  written_review: string;
  reviewer_name: string;
  subject_cgpa: number | null;
  is_featured: boolean;
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
  testimonials: CourseTestimonial[];
  evaluation_style_facts:
    | {
        theory_exam_pct: number | null;
        lab_is_fully_continuous: boolean;
      }
    | string
    | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const MIS_NUMBER_PATTERN = /^6125\d{5}$/;
const TESTIMONIAL_COURSES: TestimonialCourse[] = courseCatalog;
const TESTIMONIAL_CATEGORIES = Array.from(
  new Set(TESTIMONIAL_COURSES.map((course) => course.category)),
);

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

const DEFAULT_PREFERENCE_RATINGS: StudentAttributes = {
  difficulty_level: 0,
  workload_level: 0,
  new_field_exploration: 0,
  concept_heavy: 0,
  math_heavy: 0,
  practical_focus: 0,
};

function normalizeTestimonials(
  rawTestimonials: unknown,
): CourseTestimonial[] {
  if (!Array.isArray(rawTestimonials)) {
    return [];
  }

  return rawTestimonials
    .map((item, index): CourseTestimonial | null => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        if (!trimmed) {
          return null;
        }
        return {
          id: -(index + 1),
          written_review: trimmed,
          reviewer_name: "Verified Senior",
          subject_cgpa: null,
          is_featured: false,
        };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<CourseTestimonial>;
      if (typeof candidate.written_review !== "string") {
        return null;
      }

      const trimmedReview = candidate.written_review.trim();
      if (!trimmedReview) {
        return null;
      }

      const parsedCgpa =
        typeof candidate.subject_cgpa === "number" &&
        candidate.subject_cgpa >= 0 &&
        candidate.subject_cgpa <= 10
          ? candidate.subject_cgpa
          : null;

      return {
        id:
          typeof candidate.id === "number"
            ? candidate.id
            : -(index + 1),
        written_review: trimmedReview,
        reviewer_name:
          typeof candidate.reviewer_name === "string" && candidate.reviewer_name.trim()
            ? candidate.reviewer_name.trim()
            : "Verified Senior",
        subject_cgpa: parsedCgpa,
        is_featured: candidate.is_featured === true,
      };
    })
    .filter((testimonial): testimonial is CourseTestimonial => testimonial !== null);
}

const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Agree" },
  { value: 4, label: "Strongly Agree" },
];

const WIZARD_QUESTIONS: Array<{
  key: PreferenceKey;
  group: string;
  text: string;
}> = [
  {
    key: "difficulty_level",
    group: "Difficulty",
    text: "I am looking for a challenging course that will push my academic limits.",
  },
  {
    key: "workload_level",
    group: "Workload",
    text: "I am willing to dedicate a heavy amount of time outside of class for this subject.",
  },
  {
    key: "new_field_exploration",
    group: "Exploration",
    text: "I prefer exploring a completely new field rather than building on my 11th/12th-grade foundations.",
  },
  {
    key: "concept_heavy",
    group: "Concepts",
    text: "I enjoy theoretical coursework where I have to deeply understand complex concepts.",
  },
  {
    key: "math_heavy",
    group: "Math",
    text: "I prefer coursework that involves heavy mathematical calculations and logical problem-solving.",
  },
  {
    key: "practical_focus",
    group: "Practical",
    text: "I prefer courses that focus heavily on hands-on, practical applications.",
  },
];

const TESTIMONIAL_ATTRIBUTES: Array<{
  key: PreferenceKey;
  label: string;
}> = [
  {
    key: "difficulty_level",
    label:
      "This course was academically challenging and pushed my academic limits.",
  },
  {
    key: "workload_level",
    label:
      "I had to dedicate a heavy amount of time outside of class for this subject.",
  },
  {
    key: "new_field_exploration",
    label:
      "This course felt like exploring a completely new field rather than building on my 11th/12th-grade foundations.",
  },
  {
    key: "concept_heavy",
    label:
      "This course involved theoretical coursework that required deep understanding of complex concepts.",
  },
  {
    key: "math_heavy",
    label:
      "This course involved heavy mathematical calculations and logical problem-solving.",
  },
  {
    key: "practical_focus",
    label:
      "This course focused heavily on hands-on, practical applications.",
  },
];

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
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LIKERT_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
            value === option.value
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
          aria-pressed={value === option.value}
        >
          <span className="mr-1">{option.value}.</span>
          {option.label}
        </button>
      ))}
      <div className="col-span-2 text-center text-xs text-slate-500 sm:col-span-4">
        1 = Strongly Disagree · 4 = Strongly Agree
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

  const [wizardRatings, setWizardRatings] = useState<StudentAttributes>({
    ...DEFAULT_PREFERENCE_RATINGS,
  });

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
    TestimonialCategory | ""
  >("");
  const [courseCode, setCourseCode] = useState("");
  const [subjectCgpa, setSubjectCgpa] = useState<number | "">("");
  const [overallCgpa, setOverallCgpa] = useState<number | "">("");
  const [testimonialRatings, setTestimonialRatings] = useState<StudentAttributes>({
    ...DEFAULT_PREFERENCE_RATINGS,
  });
  const [review, setReview] = useState("");
  const [isSubmittingTestimonial, setIsSubmittingTestimonial] = useState(false);
  const [testimonialError, setTestimonialError] = useState<string | null>(null);
  const [testimonialSubmitted, setTestimonialSubmitted] = useState(false);
  const [testimonialSubmissionMessage, setTestimonialSubmissionMessage] =
    useState("");
  const isMisNumberValid =
    misNumber.trim().length === 0 || MIS_NUMBER_PATTERN.test(misNumber.trim());

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

  function handleTestimonialCategoryChange(
    e: React.ChangeEvent<HTMLSelectElement>,
  ) {
    setTestimonialCategory(e.target.value);
    setCourseCode("");
  }

  function resetAll() {
    setView("home");
    setName("");
    setBranch("");
    setWizardRatings({ ...DEFAULT_PREFERENCE_RATINGS });
    setCourses([]);
    setIsLoadingRecommendations(false);
    setRecommendationError(null);
    setTestimonialName("");
    setMisNumber("");
    setTestimonialBranch("");
    setTestimonialCategory("");
    setCourseCode("");
    setSubjectCgpa("");
    setOverallCgpa("");
    setTestimonialRatings({ ...DEFAULT_PREFERENCE_RATINGS });
    setReview("");
    setIsSubmittingTestimonial(false);
    setTestimonialError(null);
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

    const hasUnanswered = WIZARD_QUESTIONS.some(
      (question) => wizardRatings[question.key] < 1,
    );
    if (hasUnanswered) {
      setRecommendationError(
        "Please answer all six questions before getting recommendations.",
      );
      return;
    }

    setRecommendationError(null);
    setIsLoadingRecommendations(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          difficulty_level: wizardRatings.difficulty_level,
          workload_level: wizardRatings.workload_level,
          new_field_exploration: wizardRatings.new_field_exploration,
          concept_heavy: wizardRatings.concept_heavy,
          math_heavy: wizardRatings.math_heavy,
          practical_focus: wizardRatings.practical_focus,
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
      const coursesWithLiveTestimonials = await Promise.all(
        data.courses.map(async (course) => {
          const fallbackTestimonials = normalizeTestimonials(
            course.testimonials,
          );
          try {
            const testimonialsResponse = await fetch(
              `${API_BASE_URL}/api/testimonials/${encodeURIComponent(course.course_code)}`,
            );
            if (!testimonialsResponse.ok) {
              return { ...course, testimonials: fallbackTestimonials };
            }
            const liveTestimonials = normalizeTestimonials(
              await testimonialsResponse.json(),
            );
            return {
              ...course,
              testimonials:
                liveTestimonials.length > 0
                  ? liveTestimonials
                  : fallbackTestimonials,
            };
          } catch {
            return { ...course, testimonials: fallbackTestimonials };
          }
        }),
      );

      setCourses(coursesWithLiveTestimonials);
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
    if (
      !testimonialName.trim() ||
      !misNumber.trim() ||
      !isMisNumberValid ||
      !testimonialBranch
    )
      return;
    setTestimonialError(null);
    setTestimonialSubmissionMessage("");
    setTestimonialSubmitted(false);
    setView("testimonial_form");
  }

  async function handleTestimonialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !testimonialCategory ||
      !courseCode ||
      !review.trim() ||
      !isMisNumberValid ||
      subjectCgpa === "" ||
      overallCgpa === ""
    ) {
      setTestimonialError("Please fill all required fields with valid values.");
      return;
    }
    if (
      subjectCgpa < 0 ||
      subjectCgpa > 10 ||
      overallCgpa < 0 ||
      overallCgpa > 10
    ) {
      setTestimonialError("Subject and overall CGPA must be between 0.0 and 10.0.");
      return;
    }
    const hasUnratedAttribute = TESTIMONIAL_ATTRIBUTES.some(
      (attribute) => testimonialRatings[attribute.key] < 1,
    );
    if (hasUnratedAttribute) {
      setTestimonialError(
        "Please answer all six statements before submitting.",
      );
      return;
    }

    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const shouldAddAnother =
      submitter instanceof HTMLButtonElement &&
      submitter.value === "submit_add_another";

    setIsSubmittingTestimonial(true);
    setTestimonialError(null);
    setTestimonialSubmissionMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/testimonials/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_code: courseCode,
          course_category: testimonialCategory,
          reviewer_name: testimonialName.trim(),
          mis_no: misNumber.trim(),
          subject_cgpa: Number(subjectCgpa),
          overall_cgpa: Number(overallCgpa),
          difficulty_level: testimonialRatings.difficulty_level,
          workload_level: testimonialRatings.workload_level,
          new_field_exploration: testimonialRatings.new_field_exploration,
          concept_heavy: testimonialRatings.concept_heavy,
          math_heavy: testimonialRatings.math_heavy,
          practical_focus: testimonialRatings.practical_focus,
          written_review: review.trim(),
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(
          errorBody?.detail ?? "Unable to submit testimonial. Please try again.",
        );
      }

      if (shouldAddAnother) {
        setTestimonialCategory("");
        setCourseCode("");
        setSubjectCgpa("");
        setOverallCgpa("");
        setTestimonialRatings({ ...DEFAULT_PREFERENCE_RATINGS });
        setReview("");
        setTestimonialSubmissionMessage(
          "Submitted successfully. You can add another testimonial now.",
        );
        return;
      }

      setTestimonialSubmitted(true);
    } catch (error) {
      setTestimonialError(
        error instanceof Error
          ? error.message
          : "Unable to submit testimonial. Please try again.",
      );
    } finally {
      setIsSubmittingTestimonial(false);
    }
  }

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
                  Answer six short statements about your learning preferences
                  using a four-point scale from Strongly Disagree to Strongly
                  Agree.
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
                Hi {name}! For each statement, choose the option that best
                reflects you — from Strongly Disagree to Strongly Agree.
              </p>
            </header>

            <div className="space-y-5">
              {WIZARD_QUESTIONS.map((q, idx) => (
                <div
                  key={q.key}
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
                    value={wizardRatings[q.key]}
                    onChange={(value) =>
                      setWizardRatings((previous) => ({
                        ...previous,
                        [q.key]: value,
                      }))
                    }
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

                    {course.testimonials.map((testimonial, testimonialIndex) => (
                      <blockquote
                        key={`${course.course_code}-${testimonial.id}-${testimonialIndex}`}
                        className="rounded-xl border-l-4 border-indigo-300 bg-indigo-50/50 px-4 py-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {testimonial.is_featured && (
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              ✨ Editor&apos;s Choice
                            </span>
                          )}
                          {testimonial.subject_cgpa !== null && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              Scored: {testimonial.subject_cgpa.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm italic leading-relaxed text-slate-700">
                          &ldquo;{testimonial.written_review}&rdquo;
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500">
                          — {testimonial.reviewer_name}
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
          <div className="mx-auto w-full space-y-6">
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
                    placeholder="e.g. 612512345"
                    className={`w-full rounded-xl border px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                      isMisNumberValid
                        ? "border-slate-300 focus:border-indigo-500 focus:ring-indigo-200"
                        : "border-red-400 focus:border-red-500 focus:ring-red-100"
                    }`}
                  />
                  {!isMisNumberValid && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      MIS must start with 6125 and be exactly 9 digits (example:
                      612512345).
                    </p>
                  )}
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
                    !isMisNumberValid ||
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
          <div className="mx-auto w-full space-y-6">
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
                {testimonialError && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {testimonialError}
                  </div>
                )}

                <div className="mb-4 grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="course-category"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Course Category
                    </label>
                    <select
                      id="course-category"
                      value={testimonialCategory}
                      onChange={handleTestimonialCategoryChange}
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="">Select course category</option>
                      {TESTIMONIAL_CATEGORIES.map((category) => (
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
                      Course Name
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
                          ? "Select course name"
                          : "Select category first"}
                      </option>
                      {filteredTestimonialCourses.map((course) => (
                        <option key={course.course_code} value={course.course_code}>
                          {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="subject-cgpa"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Subject CGPA (out of 10)
                    </label>
                    <input
                      id="subject-cgpa"
                      type="number"
                      min={0}
                      max={10}
                      step="any"
                      required
                      value={subjectCgpa}
                      onChange={(e) =>
                        setSubjectCgpa(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="overall-cgpa"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Overall CGPA (out of 10)
                    </label>
                    <input
                      id="overall-cgpa"
                      type="number"
                      min={0}
                      max={10}
                      step="any"
                      required
                      value={overallCgpa}
                      onChange={(e) =>
                        setOverallCgpa(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
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
                        value={testimonialRatings[attr.key]}
                        onChange={(value) =>
                          setTestimonialRatings((previous) => ({
                            ...previous,
                            [attr.key]: value,
                          }))
                        }
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
                    Don&apos;t just repeat your ratings above! Tell the first-years
                    what the numbers can&apos;t. If you were talking to your junior
                    in the canteen, what is the one secret you would tell them to
                    survive this course?
                    Think about answering at least one of these:
                  </p>
                  <ul className="ml-5 mt-2 list-disc text-sm text-slate-600">
                    <li>
                      How do you actually score marks? (e.g., &quot;Memorize the
                      PYQs,&quot; &quot;The professor is very strict about
                      step-marking.&quot;)
                    </li>
                    <li>What resources saved your life? (Drop the name of that one YouTube channel or website that actually taught you the subject).</li>
                    <li>
                      Who should take this, and who should run away? (e.g.,
                      &quot;Take this if you love pure math, avoid it if you just
                      want an easy grade.&quot;)
                    </li>
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
                    disabled={isSubmittingTestimonial}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Submit &amp; Add Another
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    value="submit_final"
                    disabled={isSubmittingTestimonial}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmittingTestimonial
                      ? "Submitting..."
                      : "Submit Testimonial"}
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
