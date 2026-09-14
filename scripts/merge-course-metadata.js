const fs = require("node:fs");
const path = require("node:path");

const apiDirectory = path.resolve(__dirname, "..", "api");
const oldCoursesPath = path.join(apiDirectory, "old_courses.json");
const newCoursesPath = path.join(apiDirectory, "courses.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
}

function normalizeTitle(title) {
  return typeof title === "string"
    ? title.trim().toLowerCase().replace(/\s+/g, " ")
    : "";
}

function getTitle(course) {
  return course.courseTitle ?? course.course_name;
}

const oldCourses = readJson(oldCoursesPath);
const newCourses = readJson(newCoursesPath);

const metadataByTitle = new Map(
  oldCourses
    .filter((course) => normalizeTitle(getTitle(course)))
    .map((course) => [
      normalizeTitle(getTitle(course)),
      {
        attributes: course.attributes,
        rating_metadata: course.rating_metadata,
        testimonials: course.testimonials,
        evaluation_style_facts: course.evaluation_style_facts,
      },
    ]),
);

const defaults = {
  attributes: {
    difficulty_level: 3,
    workload_level: 3,
    new_field_exploration: 3,
    concept_heavy: 3,
    math_heavy: 3,
    practical_focus: 3,
  },
  rating_metadata: { total_votes: 0 },
  testimonials: [],
  evaluation_style_facts: {
    theory_exam_pct: null,
    lab_is_fully_continuous: false,
  },
};

let matchedCount = 0;
let defaultedCount = 0;

const mergedCourses = newCourses.map((course) => {
  const metadata = metadataByTitle.get(normalizeTitle(getTitle(course)));
  if (metadata) {
    matchedCount += 1;
  } else {
    defaultedCount += 1;
  }

  return {
    ...course,
    ...(metadata ?? defaults),
  };
});

fs.writeFileSync(
  newCoursesPath,
  `${JSON.stringify(mergedCourses, null, 2)}\n`,
  "utf8",
);

console.log(
  `Merged metadata into ${mergedCourses.length} courses: ${matchedCount} matched, ${defaultedCount} defaulted.`,
);
