"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, LockKeyhole } from "lucide-react";

type Course = { name: string; branch: string; unavailable?: string };
type Collection = { title: string; rule: string; courses: Course[] };

const categories: Record<string, Collection[]> = {
  "Basic Sciences (BS)": [
    {
      title: "Mathematics",
      rule: "Constraint: Select any 1 subject (3 credits) in Sem I and 4 credits in Sem II.",
      courses: [
        { name: "Matrix Algebra and Calculus (MAC)", branch: "All branches" },
        { name: "Vector Calculus and Differential Equations (VCDE)", branch: "All branches" },
        { name: "Linear Algebra", branch: "Computer" },
        { name: "Probability and Statistics", branch: "All branches" },
      ],
    },
    {
      title: "Applied Sciences",
      rule: "Constraint: Select any 1 subject (3 credits) in Sem I and 3 credits in Sem II.",
      courses: [
        { name: "Engineering Physics", branch: "All branches" },
        { name: "Engineering Chemistry", branch: "All branches" },
        { name: "Quantum Physics", branch: "Computer" },
        { name: "Semiconductor Physics", branch: "Electrical" },
      ],
    },
  ],
  "Engineering Sciences (ESC)": [
    {
      title: "Engineering Sciences",
      rule: "Constraint: Select any 2 subjects (3 credits each) across Sem I and Sem II.",
      courses: [
        { name: "Basics of Civil Engineering", branch: "Civil" },
        { name: "Fundamentals of Physical Infrastructure", branch: "Civil" },
        { name: "AI for Multidisciplinary Applications", branch: "Computer" },
        { name: "Applied Electronics and IOT", branch: "Electronics" },
        { name: "Electrical Energy Utilization", branch: "Electrical" },
        { name: "Foundations in Mechanical Engineering", branch: "Mechanical" },
      ],
    },
  ],
  "Vocational (VSEC)": [
    {
      title: "Vocational and Skill Enhancement Courses",
      rule: "Constraint: Select any 1 subject (2 credits) in Sem I and 1 subject (2 credits) in Sem II.",
      courses: [
        { name: "Geomatic Engineering", branch: "Civil" },
        { name: "Programming for Problem Solving", branch: "Computer" },
        { name: "Web Design", branch: "Computer" },
        { name: "Electrical Workshop", branch: "Electrical", unavailable: "Not available for Electrical students" },
        { name: "Data Processing and Visualization", branch: "Electronics" },
        { name: "Robotics and Drone Operation and Safety", branch: "Manufacturing" },
      ],
    },
  ],
};

export function CourseStructure() {
  const tabs = Object.keys(categories);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [openItems, setOpenItems] = useState<string[]>([`${tabs[0]}-0`]);

  function toggleItem(id: string) {
    setOpenItems((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <section aria-labelledby="curriculum-heading" className="mt-24 border-t border-white/10 pt-16">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-400">Course Structure &amp; Guidelines</p>
        <h2 id="curriculum-heading" className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Explore the Curriculum</h2>
        <p className="mt-4 text-base leading-7 text-slate-400">Understand your credit requirements and discover courses across different domains.</p>
      </div>

      <div role="tablist" aria-label="Course categories" className="mt-10 flex flex-wrap gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`rounded-t-xl px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? "border-b-2 border-blue-400 bg-white/[0.06] text-white" : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-200"}`}>
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {categories[activeTab].map((collection, index) => {
          const id = `${activeTab}-${index}`;
          const isOpen = openItems.includes(id);
          return (
            <div key={id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
              <button type="button" aria-expanded={isOpen} onClick={() => toggleItem(id)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/[0.05]">
                <span className="font-semibold text-white">{collection.title}</span>
                <ChevronDown className={`size-5 shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180 text-blue-400" : ""}`} />
              </button>
              {isOpen && (
                <div className="border-t border-white/10 px-5 pb-5 pt-4">
                  <div className="flex items-start gap-3 rounded-xl border border-indigo-400/20 bg-indigo-900/20 px-4 py-3 text-sm leading-6 text-indigo-100">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-indigo-300" />
                    <p><span className="font-semibold text-white">{collection.rule.split(":")[0]}:</span>{collection.rule.split(":").slice(1).join(":")}</p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {collection.courses.map((course) => (
                      <div key={course.name} className={`flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 px-4 py-3 ${course.unavailable ? "opacity-50" : ""}`}>
                        <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{course.name}</p><span className="mt-1 inline-flex rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">{course.branch}</span></div>
                        {course.unavailable && <span title={course.unavailable} className="shrink-0 text-slate-500"><LockKeyhole className="size-4" aria-label={course.unavailable} /></span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CourseStructure;

