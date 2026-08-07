export const COURSE_CATEGORIES = [
  "BS Mathematics",
  "BS Applied Science 1",
  "BS Applied Science 2",
  "ESC 1",
  "ESC 2",
  "VSEC",
] as const;

export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

type StudentLike = {
  branch: string;
};

type CourseLike = {
  category: CourseCategory;
  branch: string;
};

export type EligibleCourse<T extends CourseLike> = T & {
  branch_proximity: 1.0;
};

export function getEligibleCourses<T extends CourseLike>(
  student: StudentLike,
  courses: T[],
): EligibleCourse<T>[] {
  return courses
    .filter(
      (course) =>
        !(
          (course.category === "ESC 1" || course.category === "ESC 2") &&
          course.branch === student.branch
        ),
    )
    .map((course) => ({
      ...course,
      branch_proximity: 1.0,
    }));
}
