const COURSE_CODE_SUFFIX_PATTERN = /^(.+)-([A-Za-z0-9]+)$/;

export function formatCourseCodeForDisplay(courseCode: string): string {
  const normalized = courseCode.trim();
  if (!normalized) {
    return normalized;
  }

  const match = COURSE_CODE_SUFFIX_PATTERN.exec(normalized);
  if (!match) {
    return normalized;
  }

  const [, baseCode, suffix] = match;
  if (/^\d+$/.test(suffix)) {
    return normalized;
  }

  return `${baseCode} (${suffix})`;
}

export function encodeCourseCodeForRoute(courseCode: string): string {
  return encodeURIComponent(courseCode);
}

export function decodeCourseCodeFromRoute(encodedCourseCode: string): string {
  return decodeURIComponent(encodedCourseCode);
}
