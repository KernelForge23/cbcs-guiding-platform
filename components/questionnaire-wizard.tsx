"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Flame,
  Clock,
  Compass,
  Brain,
  Calculator,
  Wrench,
  HelpCircle,
} from "lucide-react";

export type PreferenceKey =
  | "difficulty_level"
  | "workload_level"
  | "new_field_exploration"
  | "concept_heavy"
  | "math_heavy"
  | "practical_focus";

export type StudentAttributes = Record<PreferenceKey, number>;

export interface QuestionItem {
  key: PreferenceKey;
  group: string;
  text: string;
}

export const WIZARD_QUESTIONS: QuestionItem[] = [
  {
    key: "difficulty_level",
    group: "Difficulty",
    text: "I am looking for a challenging course that will push my academic limits.",
  },
  {
    key: "workload_level",
    group: "Workload",
    text: "I am willing to dedicate a heavy amount of time outside of class for this subject.",
  },
  {
    key: "new_field_exploration",
    group: "Exploration",
    text: "I prefer exploring a completely new field rather than building on my 11th/12th-grade foundations.",
  },
  {
    key: "concept_heavy",
    group: "Concepts",
    text: "I enjoy theoretical coursework where I have to deeply understand complex concepts.",
  },
  {
    key: "math_heavy",
    group: "Math",
    text: "I prefer coursework that involves heavy mathematical calculations and logical problem-solving.",
  },
  {
    key: "practical_focus",
    group: "Practical",
    text: "I prefer courses that focus heavily on hands-on, practical applications.",
  },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Difficulty: Flame,
  Workload: Clock,
  Exploration: Compass,
  Concepts: Brain,
  Math: Calculator,
  Practical: Wrench,
};

const OPTIONS = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Agree" },
  { value: 4, label: "Strongly Agree" },
];

interface QuestionnaireWizardProps {
  name: string;
  ratings: StudentAttributes;
  onRatingChange: (key: PreferenceKey, value: number) => void;
  onBackToHome: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
}

export function QuestionnaireWizard({
  name,
  ratings,
  onRatingChange,
  onBackToHome,
  onSubmit,
  isLoading,
  error,
}: QuestionnaireWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  const totalQuestions = WIZARD_QUESTIONS.length;
  const currentQuestion = WIZARD_QUESTIONS[currentIndex];
  const currentValue = ratings[currentQuestion.key];

  const CategoryIcon = CATEGORY_ICONS[currentQuestion.group] || HelpCircle;

  // Calculate answered count
  const answeredCount = Object.values(ratings).filter((val) => val > 0).length;
  const isAllAnswered = answeredCount === totalQuestions;
  const progressPercent = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleSelectOption = (value: number) => {
    onRatingChange(currentQuestion.key, value);

    // Auto-advance to next question if not on the last question
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => {
        setDirection(1);
        setCurrentIndex((prev) => prev + 1);
      }, 220);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (e.key === "1") handleSelectOption(1);
      else if (e.key === "2") handleSelectOption(2);
      else if (e.key === "3") handleSelectOption(3);
      else if (e.key === "4") handleSelectOption(4);
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Enter" && isAllAnswered) onSubmit();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, isAllAnswered, isLoading, handleNext, handlePrev, onSubmit]);

  const slideVariants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 30 : -30,
      scale: 0.99,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.25, ease: "easeOut" as const },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -30 : 30,
      scale: 0.99,
      transition: { duration: 0.18, ease: "easeIn" as const },
    }),
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] flex flex-col justify-between py-4 sm:py-8 text-slate-900 dark:text-white bg-white dark:bg-slate-950">
      {/* Top Header & Progress Navigation */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            type="button"
            onClick={onBackToHome}
            disabled={isLoading}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Home</span>
          </button>

          {/* Question Step Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            {ratings[currentQuestion.key] > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
        </div>

        {/* Solid Color Progress Bar (No Gradients) */}
        <div className="relative w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Step Jump Navigator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {WIZARD_QUESTIONS.map((q, idx) => {
            const isAnswered = ratings[q.key] > 0;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.key}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`relative flex items-center justify-center h-8 rounded-full text-xs font-semibold transition-all ${
                  isCurrent
                    ? "px-4 bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-700"
                    : isAnswered
                    ? "w-8 bg-slate-100 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    : "w-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
                title={`Go to Question ${idx + 1}: ${q.group}`}
              >
                {isCurrent ? (
                  <span>Q{idx + 1}</span>
                ) : isAnswered ? (
                  <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Floating Question Card Stage */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-4 my-auto">
        <div className="relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] p-6 sm:p-10 md:p-12 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestion.key}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-6 sm:space-y-8"
            >
              {/* Category Pill & Student Greeting */}
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wider uppercase">
                  <CategoryIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{currentQuestion.group}</span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                  0{currentIndex + 1} / 0{totalQuestions}
                </span>
              </div>

              {/* Question Text */}
              <h2 className="font-question text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-relaxed sm:leading-snug">
                "{currentQuestion.text}"
              </h2>

              {/* Solid & Clean Interactive Option Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4">
                {OPTIONS.map((opt) => {
                  const isSelected = currentValue === opt.value;

                  return (
                    <motion.button
                      key={opt.value}
                      type="button"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleSelectOption(opt.value)}
                      className={`group relative flex flex-col items-center justify-center gap-3 p-4 sm:p-5 rounded-2xl border text-center font-semibold text-sm sm:text-[15px] leading-snug transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-500 text-indigo-950 dark:text-indigo-100 shadow-md"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm"
                      }`}
                    >
                      {/* Top Indicator Checkmark */}
                      <div
                        className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border transition-all duration-150 shrink-0 ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-indigo-400"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                          </motion.div>
                        )}
                      </div>
                      
                      <span>{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Keyboard Helper Hint */}
          <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">1-4</kbd> to answer</span>
            <span className="hidden sm:inline">Use <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">→</kbd> to navigate</span>
          </div>
        </div>
      </main>

      {/* Bottom Footer Actions */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto px-4 mt-6 sm:mt-8 space-y-4">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0 || isLoading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white shadow-md transition disabled:opacity-50"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isLoading || !isAllAnswered}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-sm font-bold text-white shadow-md transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ranking Courses...</span>
                </>
              ) : (
                <>
                  <span>Get My Recommendations</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
