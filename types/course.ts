import type {
  CohortRotation,
  SemesterCode,
  StudentBranch,
} from "../constants";

export type Branch = StudentBranch;

export type Semester = 1 | 2;
export type SemesterFilter = Semester | "ALL";
export type CourseCategory =
  | "BS Mathematics"
  | "BS Applied Science I"
  | "BS Applied Science II"
  | "ES II(Sem1) and ES IV(Sem2)"
  | "ES III(Sem 1)"
  | "VSEC";

export interface Course {
  courseCode: string;
  courseTitle: string;
  department: string;
  category: CourseCategory;
  credits: number;
  teachingScheme?: string;
  evaluationScheme?: Record<string, number>;
  semesterAvailability: ("SEM1" | "SEM2")[];
  forbiddenBranches: Branch[];
  cohortRotation: CohortRotation;
  calculatedSemesters?: SemesterCode[];
  allowedSemesters: Semester[];
  isElective: boolean;
  description?: string;
}

export const BRANCH_OPTIONS: Array<{ value: Branch; label: string }> = [
  { value: "MECH", label: "Mechanical Engineering" },
  { value: "ELECT", label: "Electrical Engineering" },
  { value: "COMP_DIV_1_2", label: "Computer Engineering (Div 1 & 2)" },
  { value: "COMP_DIV_3_4", label: "Computer Engineering (Div 3 & 4)" },
  { value: "AIML", label: "AI & Machine Learning" },
  { value: "INSTRU", label: "Instrumentation & Control" },
  { value: "ENTC", label: "Electronics & Telecommunication" },
  { value: "MFG", label: "Manufacturing Science & Engg" },
  { value: "CIVIL", label: "Civil Engineering" },
  { value: "META", label: "Metallurgical Engineering" },
];

export const GROUP_A: Branch[] = [
  "MECH",
  "ELECT",
  "COMP_DIV_1_2",
  "AIML",
  "INSTRU",
];

export const GROUP_B: Branch[] = [
  "ENTC",
  "MFG",
  "COMP_DIV_3_4",
  "CIVIL",
  "META",
];

export const APPLIED_SCIENCE_ROTATION_CODES = [
  "26U1BSPL002",
  "26U1BSPL003",
  "26U1BSBL001",
  "26U1BSCL001",
  "26U1BSCL002",
] as const;

export const VOCATIONAL_ROTATION_CODES = [
  "26U1VSEB001",
  "26U1VSEB002",
  "26U1VSEB003",
  "26U1VSEB004",
  "26U1VSEB005",
  "26U1VSEB008",
  "26U1VSEB009",
  "26U1VSEB010",
  "26U1VSEB011",
] as const;

export function isGroupA(branch: Branch): boolean {
  return GROUP_A.includes(branch);
}

export function courseIsAvailable(
  course: Course,
  branch: Branch,
  semester: SemesterFilter,
): boolean {
  if (course.forbiddenBranches.includes(branch)) return false;
  if (semester === "ALL") {
    const isAppliedScienceRotation = APPLIED_SCIENCE_ROTATION_CODES.includes(
      course.courseCode as (typeof APPLIED_SCIENCE_ROTATION_CODES)[number],
    );
    const isVocationalRotation = VOCATIONAL_ROTATION_CODES.includes(
      course.courseCode as (typeof VOCATIONAL_ROTATION_CODES)[number],
    );
    const cohortSemester = isAppliedScienceRotation
      ? isGroupA(branch)
        ? 1
        : 2
      : isVocationalRotation
        ? isGroupA(branch)
          ? 2
          : 1
        : null;

    return cohortSemester === null
      ? course.allowedSemesters.length > 0
      : course.allowedSemesters.includes(cohortSemester);
  }
  const semesterMatches = course.allowedSemesters.includes(semester);
  if (!semesterMatches) return false;

  if (course.category.startsWith("Engineering Science Elective:")) {
    return !course.forbiddenBranches.includes(branch);
  }

  const isAppliedScienceRotation = APPLIED_SCIENCE_ROTATION_CODES.includes(
    course.courseCode as (typeof APPLIED_SCIENCE_ROTATION_CODES)[number],
  );
  const isVocational = VOCATIONAL_ROTATION_CODES.includes(
    course.courseCode as (typeof VOCATIONAL_ROTATION_CODES)[number],
  );
  if (isAppliedScienceRotation) {
    return semester === 1 ? isGroupA(branch) : !isGroupA(branch);
  }
  if (isVocational) {
    return semester === 1 ? !isGroupA(branch) : isGroupA(branch);
  }
  return true;
}

export function getSemesterBadge(course: {
  allowedSemesters?: Semester[];
}): {
  label: string;
  className: string;
} {
  const allowedSemesters = course.allowedSemesters ?? [];
  if (allowedSemesters.length === 1 && allowedSemesters[0] === 1) {
    return {
      label: "Sem 1 Only",  
      className: "bg-emerald-100 text-emerald-800 border-emerald-300",
    };
  }
  if (allowedSemesters.length === 1 && allowedSemesters[0] === 2) {
    return {
      label: "Sem 2 Only",
      className: "bg-purple-100 text-purple-800 border-purple-300",
    };
  }
  return {
    label: "Sem 1 & 2 Available",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  };
}
