const fs = require("node:fs");
const path = require("node:path");

const dataDirectory = path.resolve(__dirname, "..", "api");
const oldCoursesPath = path.join(dataDirectory, "old_courses.json");
const newCoursesPath = path.join(dataDirectory, "courses.json");

function normalizeTitle(title) {
  return typeof title === "string"
    ? title.trim().toLowerCase().replace(/\s+/g, " ")
    : "";
}

const oldCourses = JSON.parse(fs.readFileSync(oldCoursesPath, "utf8"));
const newCourses = JSON.parse(fs.readFileSync(newCoursesPath, "utf8"));

const topicTagsByTitle = new Map(
  oldCourses
    .filter(
      (course) =>
        normalizeTitle(course.courseTitle) &&
        Array.isArray(course.topic_tags),
    )
    .map((course) => [normalizeTitle(course.courseTitle), course.topic_tags]),
);

const updatedCourses = newCourses.map((course) => {
  const topicTags = topicTagsByTitle.get(normalizeTitle(course.courseTitle));

  return {
    ...course,
    topic_tags: Array.isArray(topicTags) ? topicTags : [],
  };
});

fs.writeFileSync(
  newCoursesPath,
  `${JSON.stringify(updatedCourses, null, 2)}\n`,
  "utf8",
);

console.log(`Updated ${updatedCourses.length} courses in ${newCoursesPath}`);
