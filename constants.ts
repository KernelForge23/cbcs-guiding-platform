export const GROUP_A_BRANCHES = [
  "MECH",
  "ELECT",
  "COMP_DIV_1_2",
  "AIML",
  "INSTRU",
] as const;

export const GROUP_B_BRANCHES = [
  "ENTC",
  "MFG",
  "COMP_DIV_3_4",
  "CIVIL",
  "META",
] as const;

export type StudentBranch =
  | (typeof GROUP_A_BRANCHES)[number]
  | (typeof GROUP_B_BRANCHES)[number];

export type SemesterCode = "SEM1" | "SEM2";

export type CohortRotation =
  | "GROUP_A_SEM1_GROUP_B_SEM2"
  | "GROUP_B_SEM1_GROUP_A_SEM2"
  | "NONE";

export const BRANCH_OPTIONS: Array<{
  value: StudentBranch;
  label: string;
}> = [
  { value: "MECH", label: "Mechanical Engineering" },
  { value: "ELECT", label: "Electrical Engineering" },
  { value: "COMP_DIV_1_2", label: "Computer Engineering (Div 1 & 2)" },
  { value: "AIML", label: "AI & Machine Learning" },
  { value: "INSTRU", label: "Instrumentation & Control" },
  { value: "ENTC", label: "Electronics & Telecommunication" },
  { value: "MFG", label: "Manufacturing Science & Engineering" },
  { value: "COMP_DIV_3_4", label: "Computer Engineering (Div 3 & 4)" },
  { value: "CIVIL", label: "Civil Engineering" },
  { value: "META", label: "Metallurgical Engineering" },
];

export const API_BRANCH_BY_CODE: Record<StudentBranch, string> = {
  MECH: "Mechanical Engineering",
  ELECT: "Electrical Engineering",
  COMP_DIV_1_2: "Computer Science and Engineering",
  AIML: "Artificial Intelligence and Machine Learning",
  INSTRU: "Instrumentation and Control Engineering",
  ENTC: "Electronic and Telecommunication Engineering",
  MFG: "Manufacturing Engineering and Industrial Management",
  COMP_DIV_3_4: "Computer Science and Engineering",
  CIVIL: "Civil Engineering",
  META: "Metallurgy and Material Engineering",
};

