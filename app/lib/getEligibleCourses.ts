export const COURSE_CATEGORIES = [
  "BS Mathematics",
  "BS Applied Science I",
  "BS Applied Science II",
  "ES II(Sem1) and ES IV(Sem2)",
  "ES III(Sem 1)",
  "VSEC",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

type StudentLike = {
  branch: string;
};

type CourseLike = {
  category: string;
  department?: string;
};

export type EligibleCourse<T extends CourseLike> = T & {
  branch_proximity: 1.0;
};

export function getEligibleCourses<T extends CourseLike>(
  _student: StudentLike,
  courses: T[],
): EligibleCourse<T>[] {
  return courses.map((course) => ({
      ...course,
      branch_proximity: 1.0,
    }));
}
