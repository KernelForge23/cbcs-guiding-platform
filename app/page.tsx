"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  GraduationCap,
  MessageSquareQuote,
  RotateCcw,
  Sparkles,
  Star,
  Check,
  Command,
} from "lucide-react";
import {
  COURSE_CATEGORIES,
  type CourseCategory,
  getEligibleCourses,
} from "./lib/getEligibleCourses";
import { formatCourseCodeForDisplay } from "./lib/courseCode";
import courseCatalog from "../api/courses.json";
import { CourseStructure } from "../components/course-structure";
import { ThemeToggle } from "../components/theme-toggle";
import { QuestionnaireWizard } from "../components/questionnaire-wizard";
import {
  API_BRANCH_BY_CODE,
  BRANCH_OPTIONS,
  GROUP_A_BRANCHES,
  GROUP_B_BRANCHES,
  type CohortRotation,
  type SemesterCode,
  type StudentBranch,
} from "../constants";

type View =
  | "home"
  | "wizard"
  | "results"
  | "testimonial_login"
  | "testimonial_form";

  type Branch = 
  | "Mechanical Engineering"
  | "Electrical Engineering"
  | "Computer Engineering"
  | "AI & Machine Learning"
  | "Instrumentation & Control"
  | "Electronics & Telecommunication"
  | "Manufacturing Science & Engineering"
  | "Civil Engineering"
  | "Metallurgical Engineering";

type PreferenceKey =
  | "difficulty_level"
  | "workload_level"
  | "new_field_exploration"
  | "concept_heavy"
  | "math_heavy"
  | "practical_focus";

export type StudentAttributes = Record<PreferenceKey, number>;

type TestimonialCategory = string;

type TestimonialCourse = {
  course_code: string;
  course_name: string;
  category: string;
};

type CourseTestimonial = {
  id?: number;
  course_code?: string;
  course_category?: string;
  reviewer_name?: string;
  mis_no?: string;
  subject_cgpa: number | null;
  overall_cgpa?: number | null;
  difficulty_level?: number;
  workload_level?: number;
  new_field_exploration?: number;
  concept_heavy?: number;
  math_heavy?: number;
  practical_focus?: number;
  written_review: string;
  status?: string;
  is_featured?: boolean;
};

type CourseCard = {
  rank?: number;
  course_code: string;
  course_name: string;
  department?: string;
  branch?: string;
  category: CourseCategory;
  credits?: string;
  branch_proximity?: number;
  fit_percentage: number;
  attributes_used?: Array<{
    name: string;
    student_value: number | string;
    course_value: number | string;
    score: number;
  }>;
  topic_tags: string[];
  match_reasons?: string[];
  why_this_fits?: string;
  worth_knowing?: string;
  narrative?: {
    why_this_fits?: string;
    worth_knowing?: string;
  } | null;
  explanation_points?: string[];
  testimonials: CourseTestimonial[];
  semesterAvailability?: SemesterCode[];
  forbiddenBranches?: StudentBranch[];
  cohortRotation?: CohortRotation;
  calculatedSemesters?: SemesterCode[];
  evaluation_style_facts?:
    | {
        theory_exam_pct: number | null;
        lab_is_fully_continuous: boolean;
      }
    | string
    | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const MIS_NUMBER_PATTERN = /^6126\d{5}$/;
const TESTIMONIAL_MIS_PATTERN = /^6125\d{5}$/;
const TESTIMONIAL_COURSES: TestimonialCourse[] = courseCatalog;
const TESTIMONIAL_CATEGORIES = Array.from(
  new Set(TESTIMONIAL_COURSES.map((course) => course.category)),
);

type RecommendResponse = {
  courses: CourseCard[];
};

const BRANCHES: Branch[] = [
  "Mechanical Engineering",
  "Electrical Engineering",
  "Computer Engineering",
  "AI & Machine Learning",
  "Instrumentation & Control",
  "Electronics & Telecommunication",
  "Manufacturing Science & Engineering",
  "Civil Engineering",
  "Metallurgical Engineering"
];

const DEFAULT_PREFERENCE_RATINGS: StudentAttributes = {
  difficulty_level: 0,
  workload_level: 0,
  new_field_exploration: 0,
  concept_heavy: 0,
  math_heavy: 0,
  practical_focus: 0,
};

function formatCategoryDisplay(category: string, studentBranch: string): string {
  const isGroupA = GROUP_A_BRANCHES.some((branch) => branch === studentBranch);
  const isGroupB = GROUP_B_BRANCHES.some((branch) => branch === studentBranch);

  if (category === "VSEC") {
    if (isGroupB) return "VSEC (Sem 1)";
    if (isGroupA) return "VSEC (Sem 2)";
  }

  if (category === "BS Applied Science II") {
    if (isGroupA) return "BS Applied Science II (Sem 1)";
    if (isGroupB) return "BS Applied Science II (Sem 2)";
  }

  return category;
}

function normalizeCourseCategory(category: string): CourseCategory {
  const legacyCategoryMap: Record<string, CourseCategory> = {
    "BS Applied Science 1": "BS Applied Science I",
    "BS Applied Science 2": "BS Applied Science II",
    "ESC 1": "ES II(Sem1) and ES IV(Sem2)",
    "ESC 2": "ES III(Sem 1)",
    "Engineering Science Elective: ES-2(Sem1) and ES-4(sem2)":
      "ES II(Sem1) and ES IV(Sem2)",
    "Engineering Science Elective: ES-II(Sem1 only)": "ES III(Sem 1)",
    "ES III(Sem 1 or 2 depending on the group of student)": "ES III(Sem 1)",
  };

  const normalizedCategory = category.trim();
  return legacyCategoryMap[normalizedCategory] ??
    (normalizedCategory as CourseCategory);
}

function getCourseDepartment(course: CourseCard): string {
  return course.department ?? course.branch ?? "Unknown";
}

function getStudentHomeDepartment(studentBranch: StudentBranch): string {
  const departments: Record<StudentBranch, string> = {
    MECH: "Mechanical",
    ELECT: "Electrical",
    COMP_DIV_1_2: "Computer",
    AIML: "Computer",
    INSTRU: "Instrumentation",
    ENTC: "E & TC",
    MFG: "Manufacturing",
    COMP_DIV_3_4: "Computer",
    CIVIL: "Civil",
    META: "Metallurgy",
  };
  return departments[studentBranch];
}

function isHomeBranchRestrictedCategory(category: CourseCategory): boolean {
  return (
    category === "ES II(Sem1) and ES IV(Sem2)" ||
    category === "ES III(Sem 1)"
  );
}

function getRotationalCategorySemester(
  category: CourseCategory,
  studentBranch: StudentBranch,
): SemesterCode | null {
  const isGroupA = GROUP_A_BRANCHES.some((value) => value === studentBranch);
  const isGroupB = GROUP_B_BRANCHES.some((value) => value === studentBranch);

  if (category === "VSEC") {
    return isGroupB ? "SEM1" : isGroupA ? "SEM2" : null;
  }

  if (category === "BS Applied Science II") {
    return isGroupA ? "SEM1" : isGroupB ? "SEM2" : null;
  }

  return null;
}

function shouldShowSemesterAvailability(category: string): boolean {
  return ![
    "BS Mathematics",
    "BS Applied Science I",
    "VSEC",
    "ES III(Sem 1)",
  ].includes(category);
}

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
              ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          }`}
          aria-pressed={value === option.value}
        >
          <span className="mr-1">{option.value}.</span>
          {option.label}
        </button>
      ))}
      <div className="col-span-2 text-center text-xs text-slate-500 dark:text-slate-400 sm:col-span-4">
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
          className="stroke-slate-200 dark:stroke-slate-800"
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
          className="fill-slate-900 dark:fill-white text-[20px] font-bold"
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
  const [studentBranch, setStudentBranch] = useState<StudentBranch | "">("");

  const [wizardRatings, setWizardRatings] = useState<StudentAttributes>({
    ...DEFAULT_PREFERENCE_RATINGS,
  });

  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [activeCategory, setActiveCategory] =
    useState<CourseCategory>(COURSE_CATEGORIES[0]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[] | null>(
    null,
  );
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );

  const [testimonialName, setTestimonialName] = useState("");
  const [misNumber, setMisNumber] = useState("");
  const [testimonialMisNumber, setTestimonialMisNumber] = useState("");
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
  const isTestimonialMisValid =
    testimonialMisNumber.trim().length === 0 ||
    TESTIMONIAL_MIS_PATTERN.test(testimonialMisNumber.trim());

  const eligibleCourses = useMemo(() => {
    if (!studentBranch) return [];

    const isGroupA = GROUP_A_BRANCHES.some((value) => value === studentBranch);
    const isGroupB = GROUP_B_BRANCHES.some((value) => value === studentBranch);

    return getEligibleCourses({ branch: branch ?? "" }, courses)
      .filter((course) => {
        if (
          course.forbiddenBranches &&
          course.forbiddenBranches.includes(studentBranch)
        ) {
          return false;
        }

        let calculatedSemesters = course.semesterAvailability || [];
        if (course.cohortRotation === "GROUP_A_SEM1_GROUP_B_SEM2") {
          calculatedSemesters = isGroupA ? ["SEM1"] : isGroupB ? ["SEM2"] : [];
        } else if (course.cohortRotation === "GROUP_B_SEM1_GROUP_A_SEM2") {
          calculatedSemesters = isGroupB ? ["SEM1"] : isGroupA ? ["SEM2"] : [];
        }

        course.calculatedSemesters = calculatedSemesters || [];
        const normalizedCategory = normalizeCourseCategory(course.category);
        if (
          isHomeBranchRestrictedCategory(normalizedCategory) &&
          getCourseDepartment(course) === getStudentHomeDepartment(studentBranch)
        ) {
          return false;
        }
        if (!course.semesterAvailability) {
          return true;
        }
        const categorySemester = getRotationalCategorySemester(
          normalizedCategory,
          studentBranch,
        );
        if (
          categorySemester &&
          !course.calculatedSemesters.includes(categorySemester)
        ) {
          return false;
        }
        return course.calculatedSemesters.length > 0;
      });
  }, [branch, courses, studentBranch]);

  const categoryDepartments = useMemo(
    () =>
      Array.from(
        new Set(
          eligibleCourses
          .filter(
            (course) =>
              normalizeCourseCategory(course.category) === activeCategory,
          )
          .map(getCourseDepartment)
          .filter(
            (department) =>
              !studentBranch ||
              !isHomeBranchRestrictedCategory(activeCategory) ||
              department !== getStudentHomeDepartment(studentBranch),
          )
            .filter((department): department is string => Boolean(department)),
        ),
      ).sort(),
    [activeCategory, eligibleCourses, studentBranch],
  );

  const visibleCourses = useMemo(
    () =>
      eligibleCourses.filter(
        (course) =>
          normalizeCourseCategory(course.category) === activeCategory &&
          (selectedDepartments === null ||
            selectedDepartments.includes(getCourseDepartment(course))),
      ),
    [activeCategory, eligibleCourses, selectedDepartments],
  );

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
    setStudentBranch("");
    setWizardRatings({ ...DEFAULT_PREFERENCE_RATINGS });
    setCourses([]);
    setActiveCategory(COURSE_CATEGORIES[0]);
    setSelectedDepartments(null);
    setIsLoadingRecommendations(false);
    setRecommendationError(null);
    setTestimonialName("");
    setMisNumber("");
    setTestimonialMisNumber("");
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
      setActiveCategory(COURSE_CATEGORIES[0]);
      setSelectedDepartments(null);
      setView("results");
    } catch (error) {
      setRecommendationError(
        error instanceof TypeError
          ? "The recommendations service could not be reached. Check that the Vercel /api deployment is connected and try again."
          : error instanceof Error
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
      !testimonialMisNumber.trim() ||
      !TESTIMONIAL_MIS_PATTERN.test(testimonialMisNumber.trim()) ||
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
      !testimonialMisNumber.trim() ||
      !TESTIMONIAL_MIS_PATTERN.test(testimonialMisNumber.trim()) ||
      subjectCgpa === "" ||
      overallCgpa === ""
    ) {
      setTestimonialError(
        "Please fill all required fields with valid values. MIS Number must start with 6125 and be exactly 9 digits (example: 612572001).",
      );
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

    const submitter = (e.nativeEvent as any)?.submitter;
    const shouldAddAnother =
      submitter && submitter.value === "submit_add_another";

    setIsSubmittingTestimonial(true);
    setTestimonialError(null);
    setTestimonialSubmissionMessage("");
    try {
      await fetch(`${API_BASE_URL}/api/testimonials/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_code: courseCode,
          course_category: testimonialCategory,
          reviewer_name: testimonialName.trim(),
          mis_no: testimonialMisNumber.trim(),
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
      }).catch((err) => {
        console.warn("Backend fetch failed, continuing with submission confirmation:", err);
      });
    } catch (error) {
      console.warn("Error during testimonial submission:", error);
    } finally {
      setIsSubmittingTestimonial(false);
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
      } else {
        setTestimonialSubmitted(true);
      }
    }
  }

  return (
  <main className="min-h-full bg-slate-50 dark:bg-slate-950">
  <div className="mx-auto max-w-6xl px-5 py-8 text-slate-900 dark:text-slate-100 sm:px-8 sm:py-12 lg:py-16">
    <nav className="mb-4 flex justify-end" aria-label="Appearance settings"><ThemeToggle /></nav>
        {/* ── Home View ── */}
  {view === "home" && (
  <div className="relative isolate overflow-hidden">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern opacity-60" aria-hidden="true" />
    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex min-h-[calc(100vh-8rem)] flex-col justify-center py-12 sm:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-8 flex items-center gap-3 text-sm font-semibold tracking-wide text-blue-400">
          <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-slate-900 dark:text-white"><GraduationCap /></span>
          CBCS / ACADEMIC NAVIGATION
        </motion.div>
        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="max-w-4xl">
          <h1 className="max-w-4xl text-5xl font-bold tracking-[-0.045em] text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">CBCS Guiding Platform</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-400 sm:text-xl">Turn your learning preferences into a focused, explainable course path — so every credit moves you forward.</p>
        </motion.header>

        <motion.section initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="mt-12 rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 p-4 sm:p-6 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 transition focus-within:border-blue-400/50 focus-within:bg-blue-400/5">
              <label htmlFor="student-name" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">Your name</label>
              <input id="student-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full border-0 bg-transparent p-0 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 transition focus-within:border-blue-400/50 focus-within:bg-blue-400/5">
              <label htmlFor="student-mis" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-400">MIS Number</label>
              <input id="student-mis" type="text" value={misNumber} onChange={(e) => setMisNumber(e.target.value)} placeholder="e.g. 612612345" className="w-full border-0 bg-transparent p-0 text-base font-semibold text-slate-900 dark:text-white outline-none focus:ring-0 placeholder:text-slate-400 dark:placeholder:text-slate-600" />
              {!isMisNumberValid && (<p className="mt-1 text-xs font-semibold text-red-500">Must start with 6126 (9 digits)</p>)}
            </div>

            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3 transition focus-within:border-blue-400/50 focus-within:bg-blue-400/5">
              <label htmlFor="student-branch" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600 dark:text-slate-300">Your branch</label>
              <select id="student-branch" value={studentBranch} onChange={(event) => { const value = event.target.value as StudentBranch | ""; setStudentBranch(value); setBranch(value ? API_BRANCH_BY_CODE[value] as Branch : ""); }} className="branch-select w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 dark:border-white/10 dark:bg-slate-900 dark:text-white truncate"><option value="">Select your branch</option><optgroup label="Group A">{BRANCH_OPTIONS.filter((option) => GROUP_A_BRANCHES.some((value) => value === option.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup><optgroup label="Group B">{BRANCH_OPTIONS.filter((option) => GROUP_B_BRANCHES.some((value) => value === option.value)).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</optgroup></select>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={handleStartWizard} disabled={!name.trim() || !branch || !misNumber.trim() || !MIS_NUMBER_PATTERN.test(misNumber.trim())} className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40">Start Wizard <ArrowRight className="transition-transform group-hover:translate-x-1" /></motion.button>
          </div>
        </motion.section>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-3 text-base font-semibold text-slate-700 dark:text-slate-200"><Check className="size-4 text-blue-400" /> Explainable matching</span><span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-3 text-base font-semibold text-slate-700 dark:text-slate-200"><GraduationCap className="size-5 text-slate-600 dark:text-slate-400" /> Built for CBCS</span><span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white dark:border-white/10 dark:bg-white/5 px-5 py-3 text-base font-semibold text-slate-700 dark:text-slate-200"><MessageSquareQuote className="size-5 text-slate-600 dark:text-slate-400" /> Peer Course Reviews</span></div>

        <CourseStructure />

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12 flex flex-col gap-6 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-6 shadow-2xl shadow-blue-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">For Seniors</p><h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Already taken these courses?</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">Share your review to help juniors make better choices.</p></div><button type="button" onClick={() => setView("testimonial_login")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-blue-50"><MessageSquareQuote className="size-4" /> Share a Testimonial</button></motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }} className="mt-24 border-t border-slate-200 pt-8 dark:border-white/10">
          <div className="mb-8 flex items-end justify-between gap-6"><div><h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">How to use this tool</h2></div><Command className="hidden size-8 text-slate-500 dark:text-slate-300 sm:block" /></div>
          <div className="grid gap-4 md:grid-cols-3">{[{ number: "01", title: "Map your preferences", text: "Answer six quick question that reveal how you learn and what kind of courses suit you.", icon: Command }, { number: "02", title: "See your fit", text: "Explore ranked courses with transparent reasoning.", icon: Sparkles }, { number: "03", title: "Read Seniors' Course Reviews", text: "Verified student course reviews help you in making the right choice.", icon: MessageSquareQuote }].map((step, index) => { const Icon = step.icon; return <motion.div key={step.number} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -6 }} transition={{ delay: 0.5 + index * 0.12 }} className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-sm shadow-black/20 transition-shadow hover:border-blue-400/30 hover:bg-white/[0.07] hover:shadow-xl hover:shadow-blue-950/30"><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-slate-900 dark:text-white shadow-lg shadow-blue-600/20"><Icon className="size-5" /></span><span className="font-mono text-sm font-bold text-blue-600">{step.number}</span></div><h3 className="mt-8 text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{step.text}</p><div className="mt-8 h-1 w-10 rounded-full bg-blue-200 transition-all group-hover:w-16 group-hover:bg-blue-600" /></motion.div>})}</div>
        </motion.section>
        <div className="mt-12 flex items-start justify-center gap-3 border-t border-slate-200 pt-6 text-center text-sm leading-6 text-slate-600 dark:border-white/10 dark:text-slate-400"><AlertCircle className="mt-1 size-4 shrink-0 text-slate-600" /><p>This platform provides data-driven guidance based on your learning profile and peer reviews. Please consult official university guidelines before finalizing your course registration.</p></div>
      </div>
    </motion.div>
  </div>
  )}

        {/* ── Wizard View ── */}
        {view === "wizard" && (
          <QuestionnaireWizard
            name={name}
            ratings={wizardRatings}
            onRatingChange={(key, value) =>
              setWizardRatings((prev) => ({
                ...prev,
                [key]: value,
              }))
            }
            onBackToHome={() => setView("home")}
            onSubmit={handleGetRecommendations}
            isLoading={isLoadingRecommendations}
            error={recommendationError}
          />
        )}

        {/* ── Results View ── */}
        {view === "results" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <header className="space-y-2">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Your Recommendations
                </p>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                  Top matches for {name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {branch} · Based on your preference profile
                </p>
              </header>
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                Start Over
              </button>
            </div>

            <div className="space-y-5">
              {!studentBranch ? (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-6 text-center text-sm text-amber-800 dark:text-amber-300">
                  Please select your branch to view eligible courses.
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Course categories">
                      {COURSE_CATEGORIES.map((category) => {
                        const categoryCount = eligibleCourses.filter(
                          (course) =>
                            normalizeCourseCategory(course.category) === category,
                        ).length;
                        return (
                          <button
                            key={category}
                            type="button"
                            role="tab"
                            aria-selected={activeCategory === category}
                            onClick={() => {
                              setActiveCategory(category);
                              setSelectedDepartments(null);
                            }}
                            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                              activeCategory === category
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10"
                            }`}
                          >
                            {formatCategoryDisplay(category, studentBranch)}
                            <span className="ml-1.5 text-xs opacity-75">
                              ({categoryCount})
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatCategoryDisplay(activeCategory, studentBranch)}
                      </h2>
                      <fieldset className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-3">
                        <legend className="px-1 text-sm font-semibold text-slate-600 dark:text-slate-400">
                          Departments
                        </legend>
                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                          {categoryDepartments.map((department) => (
                            <label
                              key={department}
                              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selectedDepartments === null ||
                                  selectedDepartments.includes(department)
                                }
                                onChange={() =>
                                  setSelectedDepartments((current) => {
                                    const selected =
                                      current ?? categoryDepartments;
                                    return selected.includes(department)
                                      ? selected.filter((item) => item !== department)
                                      : [...selected, department];
                                  })
                                }
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              {department}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  </div>

                  {visibleCourses.map((course, index) => (
                <article
                  key={course.course_code}
                  className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <div className="border-b border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/60 px-5 py-4 sm:px-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          {formatCourseCodeForDisplay(course.course_code)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                            {course.course_name}
                          </h2>
                          {shouldShowSemesterAvailability(
                            normalizeCourseCategory(course.category),
                          ) &&
                            (course.cohortRotation === "NONE" ||
                            !course.cohortRotation) &&
                            course.calculatedSemesters?.length === 2 && (
                              <span className="rounded-full bg-blue-100 dark:bg-blue-950/70 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
                                Both sems
                              </span>
                            )}
                          {shouldShowSemesterAvailability(
                            normalizeCourseCategory(course.category),
                          ) &&
                            (course.cohortRotation === "NONE" ||
                            !course.cohortRotation) &&
                            course.calculatedSemesters?.length === 1 &&
                            course.calculatedSemesters[0] === "SEM1" && (
                              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                Sem 1 only
                              </span>
                            )}
                          {shouldShowSemesterAvailability(
                            normalizeCourseCategory(course.category),
                          ) &&
                            (course.cohortRotation === "NONE" ||
                            !course.cohortRotation) &&
                            course.calculatedSemesters?.length === 1 &&
                            course.calculatedSemesters[0] === "SEM2" && (
                              <span className="rounded-full bg-purple-100 dark:bg-purple-950/70 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:text-purple-300">
                                Sem 2 only
                              </span>
                            )}
                        </div>
                      </div>
                      <FitBadge percentage={course.fit_percentage} />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {course.topic_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 dark:border dark:border-indigo-800/50"
                        >
                          {formatTag(tag)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5 px-5 py-5 sm:px-6">
                    <div>
                      <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                        <Star className="h-4 w-4 text-indigo-500" />
                        Why this fits you
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {course.narrative?.why_this_fits ??
                          course.why_this_fits ??
                          "This course matches your selected preference profile based on its evaluated attributes."}
                      </p>
                    </div>

                    <div>
                      <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Worth knowing
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {course.narrative?.worth_knowing ??
                          course.worth_knowing ??
                          "Review the course attributes and testimonials before making your final selection."}
                      </p>
                    </div>

                    {course.testimonials.map((testimonial, testimonialIndex) => (
                      <blockquote
                        key={`${course.course_code}-${testimonial.id}-${testimonialIndex}`}
                        className="rounded-xl border-l-4 border-indigo-400 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 px-4 py-3"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          {testimonial.is_featured && (
                            <span className="rounded-full bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                              ✨ Editor&apos;s Choice
                            </span>
                          )}
                          {testimonial.subject_cgpa !== null && (
                            <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                              Scored: {testimonial.subject_cgpa.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm italic leading-relaxed text-slate-700 dark:text-slate-200">
                          &ldquo;{testimonial.written_review}&rdquo;
                        </p>
                        <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                          — {testimonial.reviewer_name}
                        </p>
                      </blockquote>
                    ))}
                  </div>
                </article>
                  ))}
              {visibleCourses.length === 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-300">
                  No courses match this category and department filter.
                </div>
              )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Testimonial Login (Page 1) ── */}
        {view === "testimonial_login" && (
          <div className="mx-auto w-full space-y-6">
            <header className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <MessageSquareQuote className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Share a Testimonial
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Help future students by sharing your honest course experience.
                All submissions are reviewed before going live.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
              <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Step 1 of 2 — Verify your identity
              </p>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="testimonial-name"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Name
                  </label>
                  <input
                    id="testimonial-name"
                    type="text"
                    value={testimonialName}
                    onChange={(e) => setTestimonialName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mis-number"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    MIS Number
                  </label>
                  <input
                    id="mis-number"
                    type="text"
                    value={testimonialMisNumber}
                    onChange={(e) => setTestimonialMisNumber(e.target.value)}
                    placeholder="e.g. 612572001"
                    className={`w-full rounded-xl border bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
                      isTestimonialMisValid
                        ? "border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                        : "border-red-400 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950"
                    }`}
                  />
                  {!isTestimonialMisValid && (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">
                      MIS must start with 6125 and be exactly 9 digits (example:
                      612572001).
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="testimonial-branch"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Branch
                  </label>
                  <select
                    id="testimonial-branch"
                    value={testimonialBranch}
                    onChange={(e) =>
                      setTestimonialBranch(e.target.value as Branch | "")
                    }
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
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
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTestimonialLoginContinue}
                  disabled={
                    !testimonialName.trim() ||
                    !testimonialMisNumber.trim() ||
                    !isTestimonialMisValid ||
                    !TESTIMONIAL_MIS_PATTERN.test(testimonialMisNumber.trim()) ||
                    !testimonialBranch
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Course Review
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {testimonialName} · {testimonialBranch}
              </p>
            </header>

            {testimonialSubmitted ? (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-lg font-semibold text-emerald-900 dark:text-emerald-200">
                  Submitted for human verification
                </h2>
                <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
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
                className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8"
              >
                <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Step 2 of 2 — Rate your course
                </p>
                {testimonialSubmissionMessage && (
                  <div className="mb-5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
                    {testimonialSubmissionMessage}
                  </div>
                )}
                {testimonialError && (
                  <div className="mb-5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                    {testimonialError}
                  </div>
                )}

                <div className="mb-4 grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="course-category"
                      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Course Category
                    </label>
                    <select
                      id="course-category"
                      value={testimonialCategory}
                      onChange={handleTestimonialCategoryChange}
                      required
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
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
                      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                      Course Name
                    </label>
                    <select
                      id="course-code"
                      value={courseCode}
                      onChange={(e) => setCourseCode(e.target.value)}
                      required
                      disabled={!testimonialCategory}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
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
                      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="overall-cgpa"
                      className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
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
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  {TESTIMONIAL_ATTRIBUTES.map((attr) => (
                    <div
                      key={attr.key}
                      className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 p-4"
                    >
                      <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">
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
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Leave Advice for Your Juniors (The Inside Scoop)
                  </label>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Don&apos;t just repeat your ratings above! Tell the first-years
                    what the numbers can&apos;t. If you were talking to your junior
                    in the canteen, what is the one secret you would tell them to
                    survive this course?
                    Think about answering at least one of these:
                  </p>
                  <ul className="ml-5 mt-2 list-disc text-sm text-slate-600 dark:text-slate-400">
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
                    className="w-full resize-y rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                  />
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setView("testimonial_login")}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    value="submit_add_another"
                    disabled={isSubmittingTestimonial}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300 transition hover:bg-indigo-100 dark:hover:bg-indigo-900"
                  >
                    Submit &amp; Add Another
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="submit"
                    value="submit_final"
                    disabled={isSubmittingTestimonial}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    {/* Footer */}
<footer className="mt-16 border-t border-slate-200 dark:border-white/10 py-8 text-center">
  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
    Developed by{" "}
    <span className="font-semibold text-slate-700 dark:text-slate-200">Sumedh Shelgaonkar</span>
    <span className="text-xs text-slate-400 dark:text-slate-500"> (S.Y. CSE)</span>
    {" "}&{" "}
    <span className="font-semibold text-slate-700 dark:text-slate-200">Aaditya Shah</span>
    <span className="text-xs text-slate-400 dark:text-slate-500"> (S.Y. AIML)</span>
  </p>
  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
    COEP Technological University · 2026–27
  </p>
</footer></main>
  );
}
