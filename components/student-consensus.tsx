"use client";

import React, { ReactNode } from "react";
import { Quote } from "lucide-react";
import {
  PLACEHOLDER_CONSENSUS_TEXT,
  getStudentConsensusText,
} from "@/lib/student-consensus-data";

export interface StudentConsensusProps {
  /**
   * The formatted consensus text (supports markdown **bold** or HTML <strong> tags).
   * If omitted, falls back to course lookup via courseCode/courseName,
   * or the exact Digital Public Infrastructure placeholder content.
   */
  text?: string;
  courseCode?: string;
  courseName?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Parses markdown **bold** syntax and HTML <strong>/<b> tags into styled <strong> elements
 * that aggressively pop against muted text for rapid skimmability (Bionic Reading effect).
 */
export function formatBionicReadingText(rawText: string): ReactNode[] {
  // Regex splits on **text**, <strong>text</strong>, or <b>text</b>
  const tokens = rawText.split(
    /(\*\*[\s\S]*?\*\*|<strong>[\s\S]*?<\/strong>|<b>[\s\S]*?<\/b>)/g,
  );

  return tokens.map((token, idx) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      const inner = token.slice(2, -2);
      return (
        <strong
          key={idx}
          className="text-slate-900 dark:text-white font-semibold drop-shadow-sm transition-colors"
        >
          {inner}
        </strong>
      );
    }
    if (token.startsWith("<strong>") && token.endsWith("</strong>")) {
      const inner = token.slice(8, -9);
      return (
        <strong
          key={idx}
          className="text-slate-900 dark:text-white font-semibold drop-shadow-sm transition-colors"
        >
          {inner}
        </strong>
      );
    }
    if (token.startsWith("<b>") && token.endsWith("</b>")) {
      const inner = token.slice(3, -4);
      return (
        <strong
          key={idx}
          className="text-slate-900 dark:text-white font-semibold drop-shadow-sm transition-colors"
        >
          {inner}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{token}</React.Fragment>;
  });
}

/**
 * Modern, SaaS-style "Student Consensus" blockquote component.
 * Uses a Bionic Reading typography technique where key concepts pop in high-contrast bold
 * (slate-900 in light mode, bright white in dark mode) while standard text is comfortably readable
 * (slate-600 in light mode, slate-400 in dark mode), making dense paragraphs instantly skimmable.
 */
export function StudentConsensus({
  text,
  courseCode,
  courseName,
  className = "",
  children,
}: StudentConsensusProps) {
  // Determine text content
  const resolvedText =
    text ??
    (courseCode || courseName
      ? getStudentConsensusText(courseCode, courseName)
      : PLACEHOLDER_CONSENSUS_TEXT);

  return (
    <blockquote
      className={`bg-slate-100/80 border border-slate-200/90 dark:bg-slate-900/60 dark:border-slate-800 backdrop-blur-md rounded-2xl p-6 md:p-8 relative overflow-hidden text-left shadow-sm dark:shadow-xl transition-colors ${className}`}
    >
      {/* Oversized, subtle background Quote icon in absolute top-right corner */}
      <Quote
        className="absolute -top-4 -right-4 w-32 h-32 text-slate-300/70 dark:text-slate-800/50 rotate-12 pointer-events-none select-none transition-all"
        aria-hidden="true"
      />

      {/* Top-left vibrant badge */}
      <div className="relative z-10">
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20 text-xs px-3 py-1 rounded-full font-bold tracking-widest uppercase mb-4 inline-block shadow-sm transition-colors">
          STUDENT CONSENSUS
        </span>
      </div>

      {/* Breathable, skimmable typography */}
      <p className="relative z-10 text-lg md:text-xl leading-relaxed md:leading-loose text-slate-600 dark:text-slate-400 [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_strong]:font-semibold [&_strong]:drop-shadow-sm [&_b]:text-slate-900 dark:[&_b]:text-white [&_b]:font-semibold [&_b]:drop-shadow-sm transition-colors">
        {children ? children : formatBionicReadingText(resolvedText)}
      </p>
    </blockquote>
  );
}

export default StudentConsensus;
