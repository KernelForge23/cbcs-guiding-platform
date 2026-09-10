"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Globe2, LockKeyhole } from "lucide-react";

type Course = { name: string; department?: string; unavailable?: string; homeBranchRestricted?: boolean };
type Collection = { title: string; rule: string; courses: Course[] };

const categories: Record<string, Collection[]> = {
  "Basic Sciences (BS)": [
    {
      title: "Mathematics",
      rule: "Select any 1 subject (3 credits) in Sem I and 4 credits in Sem II.",
      courses: [
        { name: "Matrix Algebra & Calculus (MAC) + Vector Calculus & Diff. Equations (VCDE)" },
        { name: "Linear Algebra + Probability & Statistics (PS)" },
      ],
    },
    {
      title: "Applied Sciences",
      rule: "Select any 1 subject (3 credits) in Sem I and 3 credits in Sem II.",
      courses: [
        { name: "Engineering Physics + Engineering Chemistry" },
        { name: "Engineering Chemistry + Engineering Physics" },
        { name: "Engineering Physics + Quantum Physics" },
        { name: "Engineering Physics + Semiconductor Physics" },
        { name: "Engineering Chemistry + Semiconductor Physics" },
      ],
    },
  ],
  "Engineering Sciences (ESC)": [
    {
      title: "ESC1",
      rule: "Select any 2 subjects (3 credits each) across Sem I and Sem II. Home branch constraints apply.",
      courses: [
        { name: "Basics of Civil Engineering", department: "Civil", homeBranchRestricted: true },
        { name: "Fundamentals of Physical Infrastructure", department: "Civil - Planning", homeBranchRestricted: true },
        { name: "AI for Multidisciplinary Applications", department: "Computer", homeBranchRestricted: true },
        { name: "Applied Electronics and IOT", department: "Electronics", homeBranchRestricted: true },
        { name: "Electrical Energy Utilization", department: "Electrical", homeBranchRestricted: true },
        { name: "Fundamentals of Measurement and Sensors", department: "Instrumentation", homeBranchRestricted: true },
        { name: "Foundations in Mechanical Engineering", department: "Mechanical", homeBranchRestricted: true },
        { name: "Nanomaterials", department: "Metallurgy", homeBranchRestricted: true },
        { name: "Basics of Manufacturing Technology", department: "Manufacturing Science", homeBranchRestricted: true },
      ],
    },
    {
      title: "ESC2",
      rule: "Select any 2 subjects (3 credits each) across Sem I and Sem II. Home branch constraints apply.",
      courses: [
        { name: "Applied Mechanics", department: "Civil", homeBranchRestricted: true },
        { name: "Fundamentals of Cyber Security", department: "Computer", homeBranchRestricted: true },
        { name: "Basic Electrical Engineering", department: "Electrical", homeBranchRestricted: true },
        { name: "Digital logic design", department: "Electronics", homeBranchRestricted: true },
        { name: "Engineering Graphics", department: "Mechanical", homeBranchRestricted: true },
        { name: "Fundamentals of Corrosion Engineering", department: "Metallurgy", homeBranchRestricted: true },
        { name: "Product prototyping practices", department: "Manufacturing Science", homeBranchRestricted: true },
        { name: "Fundamentals of Electrical Engineering", department: "Electrical", homeBranchRestricted: true },
      ],
    },
  ],
  "Vocational (VSEC)": [
    {
      title: "Vocational and Skill Enhancement Courses",
      rule: "Select any 1 subject (2 credits) in Sem I and 1 subject (2 credits) in Sem II.",
      courses: [
        { name: "Geomatic Engineering", department: "Civil" },
        { name: "Fundamentals of Construction Practices", department: "Civil" },
        { name: "Programming for Problem Solving", department: "Computer" },
        { name: "Web Design", department: "Computer" },
        { name: "Python Programming", department: "Computer" },
        { name: "Electrical Maintenance and Safety", department: "Electrical" },
        { name: "Electrical Workshop", department: "Electrical", unavailable: "Home Branch Restricted" },
        { name: "Digital Public Infrastructure", department: "Electronics" },
        { name: "Data Processing and Visualization", department: "Electronics" },
        { name: "Fundamentals of PLC", department: "Instrumentation" },
        { name: "Computer-aided Drafting", department: "Mechanical" },
        { name: "EV Architecture", department: "Mechanical" },
        { name: "Introduction to Materials Modelling", department: "Metallurgy" },
        { name: "Modern Chemical Analysis", department: "Metallurgy" },
        { name: "Manufacturing Practices and Fab Lab", department: "Manufacturing Science" },
        { name: "Robotics and Drone Operation and Safety", department: "Manufacturing Science" },
      ],
    },
  ],
};

function CourseNode({ course }: { course: Course }) {
  const restricted = Boolean(course.homeBranchRestricted);
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`relative rounded-2xl border px-4 py-3 ${course.unavailable ? "border-white/10 bg-white/[0.02] opacity-60" : "border-white/10 bg-white/[0.04] hover:border-blue-400/40 hover:bg-white/[0.08]"}`}>
      <span className="absolute -left-2 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-blue-400" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm font-medium leading-5 text-slate-200">{course.name}</p>{course.department && <span className="mt-2 inline-flex rounded-full border border-blue-400/20 bg-blue-900/30 px-2 py-0.5 text-[11px] font-medium text-blue-300">{course.department}</span>}</div>
        <span title={course.unavailable || (restricted ? "Home Branch Restricted" : "Open to all branches")} className="shrink-0 text-slate-400">{restricted ? <LockKeyhole className="size-4" aria-label="Home Branch Restricted" /> : <Globe2 className="size-4" aria-label="Open to all branches" />}</span>
      </div>
    </motion.div>
  );
}

export function CourseStructure() {
  const tabs = Object.keys(categories);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [openItems, setOpenItems] = useState<string[]>([`${tabs[0]}-0`]);
  const toggleItem = (id: string) => setOpenItems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <section aria-labelledby="curriculum-heading" className="mt-24 border-t border-white/10 pt-16">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Course Structure &amp; Guidelines</p><h2 id="curriculum-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Course Structure Mindmap</h2><p className="mt-4 text-base leading-7 text-slate-400">Follow each category from its root requirement to the course paths that fit your academic journey.</p></div>
      <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Course categories">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => { setActiveTab(tab); setOpenItems([]); }} className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? "border-blue-400/40 bg-blue-500/15 text-white shadow-lg shadow-blue-950/20" : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}>{tab}</button>)}</div>
      <AnimatePresence mode="wait"><motion.div key={activeTab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="mt-8 space-y-5">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">01</span><span className="text-sm font-semibold text-slate-300">{activeTab}</span><div className="h-px flex-1 bg-gradient-to-r from-blue-400/60 to-transparent" /></div>
        {categories[activeTab].map((collection, index) => { const id = `${activeTab}-${index}`; const isOpen = openItems.includes(id); return <motion.div layout key={id} className="relative ml-4 border-l border-blue-400/30 pl-7"><span className="absolute -left-1.5 top-7 size-3 rounded-full border-2 border-slate-950 bg-blue-400" aria-hidden="true" /><button type="button" aria-expanded={isOpen} onClick={() => toggleItem(id)} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-left transition hover:border-blue-400/40 hover:bg-white/[0.08]"><span><span className="block font-semibold text-white">{collection.title}</span><span className="mt-1 block text-xs leading-5 text-slate-400">Constraint: {collection.rule}</span></span><ChevronDown className={`size-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-blue-400" : ""}`} /></button><AnimatePresence initial={false}>{isOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="ml-5 border-l border-dashed border-white/15 py-4 pl-5"><div className="grid gap-3 sm:grid-cols-2">{collection.courses.map((course) => <CourseNode key={course.name} course={course} />)}</div></div></motion.div>}</AnimatePresence></motion.div>; })}
      </motion.div></AnimatePresence>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-slate-400 sm:justify-start sm:gap-6 sm:rounded-full"><span className="inline-flex items-center gap-2"><LockKeyhole className="size-4 text-blue-400" /> Home Branch Restricted <span className="hidden sm:inline">(Students from the offering department cannot take this course).</span></span><span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Open Course <span className="hidden sm:inline">(Available to all branches).</span></span></div>
    </section>
  );
}

export default CourseStructure;
