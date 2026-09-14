"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Atom,
  Calculator,
  ChevronDown,
  Cpu,
  LockKeyhole,
  Settings,
  TestTubes,
  Wrench,
} from "lucide-react";

type CurriculumCourse = { name: string; code?: string; dept?: string; badge: string };
type CurriculumCategory = { category: string; credits: string; icon: "Calculator" | "TestTubes" | "Atom" | "Settings" | "Cpu" | "Wrench"; constraintInfo?: string; courses: CurriculumCourse[] };

const curriculumData: CurriculumCategory[] = [
  { category: "Basic Science - Mathematics", credits: "3 + 4 Credits", icon: "Calculator", courses: [{ name: "Matrix Algebra & Calculus + Vector Calculus & Diff. Eq.", code: "26U1BSML002/004", badge: "Sem 1 & 2" }, { name: "Linear Algebra + Probability and Statistics", code: "26U1BSML001/003", badge: "Sem 1 & 2" }] },
  { category: "Basic Science - Applied Sciences I", credits: "3 Credits", icon: "TestTubes", courses: [{ name: "Engineering Physics + Engineering Chemistry", code: "BSPB001 / BSCB001", badge: "Sem 1 & 2" }, { name: "Engineering Physics + Quantum Physics", code: "BSPB001 / BSPL001", badge: "Sem 1 & 2" }] },
  { category: "Basic Science - Applied Sciences II", credits: "1 Credit", icon: "Atom", constraintInfo: "Rotates based on cohort.", courses: [{ name: "Electromagnetism", dept: "Physics", badge: "Grp A: Sem 1 | Grp B: Sem 2" }, { name: "Semiconductor Physics", dept: "Physics", badge: "Grp A: Sem 1 | Grp B: Sem 2" }, { name: "Biology for Engineers", dept: "Biology", badge: "Grp A: Sem 1 | Grp B: Sem 2" }, { name: "Emerging Tech in Energy Storage", dept: "Chemistry", badge: "Grp A: Sem 1 | Grp B: Sem 2" }, { name: "Nanomaterials in Emerging Tech", dept: "Chemistry", badge: "Grp A: Sem 1 | Grp B: Sem 2" }] },
  { category: "Engineering Science Electives (ES-II & ES-IV)", credits: "3 Credits", icon: "Settings", courses: [{ name: "Basics of Civil Engineering", dept: "Civil", badge: "Sem 1 & 2" }, { name: "Fundamentals of Physical Infrastructure", dept: "Civil-Planning", badge: "Sem 2 Only" }, { name: "AI for Multidisciplinary Applications", dept: "Computer", badge: "Sem 1 & 2" }, { name: "Electrical Energy Utilization", dept: "Electrical", badge: "Sem 1 & 2" }, { name: "Applied Electronics and IOT", dept: "E & TC", badge: "Sem 1 & 2" }, { name: "Fundamentals of Measurement and Sensors", dept: "Instrumentation", badge: "Sem 1 & 2" }, { name: "Foundation in Mechanical Engineering", dept: "Mechanical", badge: "Sem 1 & 2" }, { name: "Basics of Manufacturing Technology", dept: "Manufacturing", badge: "Sem 1 & 2" }, { name: "Nanomaterials", dept: "Metallurgy", badge: "Sem 1 & 2" }] },
  { category: "Engineering Science Electives (ES-III)", credits: "3 Credits", icon: "Cpu", constraintInfo: "Strictly Semester 1 Only for all branches.", courses: [{ name: "Applied Mechanics", dept: "Civil", badge: "Sem 1 Only" }, { name: "Fundamentals of Cyber Security", dept: "Computer", badge: "Sem 1 Only" }, { name: "Basic Electrical Engineering", dept: "Electrical", badge: "Sem 1 Only" }, { name: "Digital Logic Design", dept: "E & TC", badge: "Sem 1 Only" }, { name: "Engineering Graphics", dept: "Mechanical", badge: "Sem 1 Only" }, { name: "Product Prototyping Practices", dept: "Manufacturing", badge: "Sem 1 Only" }, { name: "Fundamentals of Corrosion Engineering", dept: "Metallurgy", badge: "Sem 1 Only" }] },
  { category: "Vocational and Skill Enhancement (VSEC)", credits: "2 Credits", icon: "Wrench", constraintInfo: "Rotates based on cohort, with specific strict exceptions.", courses: [{ name: "Geomatic Engineering", dept: "Civil", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Fundamentals of Construction Practices", dept: "Civil", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Programming for Problem Solving", dept: "Computer", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Web Design", dept: "Computer", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Python Programming", dept: "Computer", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Electrical Maintenance and Safety", dept: "Electrical", badge: "Sem 1 Only" }, { name: "Fundamentals of PLC", dept: "Instrumentation", badge: "Sem 1 Only" }, { name: "Computer Aided Drafting", dept: "Mechanical", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "EV Architecture", dept: "Mechanical", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Manufacturing Practices and Fab Lab", dept: "Manufacturing", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Robotics and Drone Operation and Safety", dept: "Manufacturing", badge: "Grp B: Sem 1 | Grp A: Sem 2" }, { name: "Electrical Workshop", dept: "Electrical", badge: "Sem 2 Only" }, { name: "Digital Public Infrastructure", dept: "E & TC", badge: "Sem 2 Only" }, { name: "Data Preprocessing and Visualization", dept: "E & TC", badge: "Sem 2 Only" }] },
];

const iconMap = { Calculator, TestTubes, Atom, Settings, Cpu, Wrench };
type Course = CurriculumCourse;

function badgeClass(badge: string) {
  if (badge.includes("Grp")) return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200";
  if (badge.includes("Only")) return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200";
  return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200";
}

function CourseCard({ course }: { course: Course }) {
  return <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-white/[0.05] dark:hover:border-indigo-400/40">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold leading-5 text-slate-900 dark:text-white">{course.name}</p>{"code" in course && course.code && <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">{course.code}</p>}{"dept" in course && course.dept && <p className="mt-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">{course.dept}</p>}</div><LockKeyhole className="mt-0.5 size-4 shrink-0 text-slate-400" aria-label="Branch and cohort constraints apply" /></div>
    <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass(course.badge)}`}>{course.badge}</span>
  </motion.div>;
}

export function CourseStructure() {
  const [open, setOpen] = useState<number[]>([0]);
  const toggle = (index: number) => setOpen((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  return <section aria-labelledby="curriculum-heading" className="mt-24 border-t border-slate-200 pt-16 dark:border-white/10">
    <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">Course Structure Explorer</p><h2 id="curriculum-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">Choice Based Credit System</h2><p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-400">Explore the curriculum as an interactive map of categories, semester rules, and cohort rotations.</p></div>
    <div className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Cohort Legend</p><div className="mt-5 grid gap-3"><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-400/10"><p className="font-bold text-blue-800 dark:text-blue-100">Group A</p><p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-200">MECH, ELECT, COMP (Div 1 &amp; 2), AIML, INSTRU</p></div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10"><p className="font-bold text-amber-800 dark:text-amber-100">Group B</p><p className="mt-1 text-sm leading-6 text-amber-700 dark:text-amber-200">E &amp; TC, MFG, COMP (Div 3 &amp; 4), CIVIL, META</p></div></div><div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">Sem 1 &amp; 2</span><span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">Strict semester</span><span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Rotatory</span></div></aside>
      <div className="relative"><div className="absolute left-5 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-indigo-300 via-blue-300 to-transparent lg:block dark:from-indigo-500/70 dark:via-blue-500/50" aria-hidden="true" />{curriculumData.map((item, index) => { const Icon = iconMap[item.icon as keyof typeof iconMap]; const isOpen = open.includes(index); return <motion.div layout key={item.category} className="relative mb-4 lg:pl-12"><span className="absolute left-[17px] top-7 hidden size-4 rounded-full border-4 border-slate-50 bg-indigo-500 lg:block dark:border-slate-950" aria-hidden="true" /><button type="button" onClick={() => toggle(index)} aria-expanded={isOpen} className="relative z-10 flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-left shadow-sm backdrop-blur transition hover:border-indigo-300 hover:shadow-md dark:border-white/10 dark:bg-slate-900/80 dark:hover:border-indigo-400/40"><span className="flex min-w-0 items-center gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"><Icon className="size-5" /></span><span className="min-w-0"><span className="block text-sm font-bold text-slate-900 dark:text-white">{item.category}</span><span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{item.credits}{item.constraintInfo ? ` · ${item.constraintInfo}` : ""}</span></span></span><ChevronDown className={`size-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-indigo-500" : ""}`} /></button><AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-2 grid gap-3 sm:grid-cols-2">{item.courses.map((course) => <CourseCard key={course.name} course={course} />)}</div></motion.div>}</AnimatePresence></motion.div>; })}</div>
    </div>
  </section>;
}

export default CourseStructure;
