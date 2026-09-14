"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  GraduationCap,
  MessageSquareQuote,
  SlidersHorizontal,
  Target,
  UserRound,
} from "lucide-react";

const JOURNEY_STEPS = [
  {
    step: 1,
    title: "Set Profile",
    description: "Name & Branch",
    icon: UserRound,
  },
  {
    step: 2,
    title: "Preference Wizard",
    description: "Discover learning style",
    icon: SlidersHorizontal,
  },
  {
    step: 3,
    title: "Match",
    description: "Get tailored recommendations",
    icon: Target,
  },
] as const;

type HomeHeroProps<T extends string> = {
  name: string;
  branch: T | "";
  branches: readonly T[];
  onNameChange: (value: string) => void;
  onBranchChange: (value: T | "") => void;
  onStartWizard: () => void;
  onShareTestimonial: () => void;
};

export default function HomeHero<T extends string>({
  name,
  branch,
  branches,
  onNameChange,
  onBranchChange,
  onStartWizard,
  onShareTestimonial,
}: HomeHeroProps<T>) {
  const canStart = name.trim().length > 0 && branch !== "";

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(148_163_184/0.18)_1px,transparent_0)] [background-size:28px_28px]"
      />

      <div className="relative space-y-12 sm:space-y-14">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
          >
            <GraduationCap className="h-7 w-7" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="font-[family-name:var(--font-inter)] text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              CBCS Elective Guide
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Find elective courses that match your learning style, workload
              capacity, and branch — powered by transparent, deterministic
              matching.
            </p>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          aria-label="Student journey"
          className="mx-auto max-w-3xl"
        >
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Your journey
          </p>

          <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-0">
            {JOURNEY_STEPS.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === JOURNEY_STEPS.length - 1;

              return (
                <div key={item.step} className="flex flex-1 flex-col md:flex-row">
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className="group flex flex-1 flex-col items-center rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-5 text-center shadow-sm backdrop-blur-sm transition-colors hover:border-indigo-200 hover:shadow-md md:rounded-none md:border-0 md:bg-transparent md:px-3 md:py-0 md:shadow-none md:first:rounded-l-2xl md:last:rounded-r-2xl md:hover:bg-white/60"
                  >
                    <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 transition-colors group-hover:border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white">
                      <Icon className="h-5 w-5" strokeWidth={2.25} />
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-indigo-600 ring-2 ring-indigo-100">
                        {item.step}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.description}
                    </p>
                  </motion.div>

                  {!isLast && (
                    <>
                      <div
                        aria-hidden
                        className="mx-auto hidden h-px w-16 bg-gradient-to-r from-transparent via-slate-300 to-transparent md:block md:h-auto md:w-px md:flex-none md:self-center md:bg-gradient-to-b md:from-transparent md:via-slate-300 md:to-transparent md:min-h-[72px]"
                      />
                      <div
                        aria-hidden
                        className="mx-auto h-6 w-px bg-gradient-to-b from-slate-200 to-slate-300 md:hidden"
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="student-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Name
              </label>
              <input
                id="student-name"
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label
                htmlFor="student-branch"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Branch
              </label>
              <select
                id="student-branch"
                value={branch}
                onChange={(e) => onBranchChange(e.target.value as T | "")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Select your branch</option>
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3">
            <motion.button
              type="button"
              onClick={onStartWizard}
              disabled={!canStart}
              whileHover={canStart ? { scale: 1.02 } : undefined}
              whileTap={canStart ? { scale: 0.98 } : undefined}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              Start Wizard
              <ArrowRight className="h-4 w-4" />
            </motion.button>

            <p className="text-center text-sm text-gray-400">
              This is a guidance tool, not an official recommendation.
            </p>

            <button
              type="button"
              onClick={onShareTestimonial}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              <MessageSquareQuote className="h-4 w-4" />
              Share a Testimonial
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
