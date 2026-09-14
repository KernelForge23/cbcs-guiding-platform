"use client";

import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Star,
  RefreshCw,
  User,
  GraduationCap,
  BookOpen,
  Flame,
  Clock,
  Compass,
  Brain,
  Calculator,
  Wrench,
  Quote,
  Lock,
  Sparkles,
  Tag,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import courseCatalog from "@/api/courses.json";

type AdminSection = "pending" | "approved";

type TestimonialStatus = "PENDING" | "APPROVED" | "REJECTED";

type AdminTestimonial = {
  id: number;
  course_code: string;
  course_category: string;
  reviewer_name: string;
  mis_no: string;
  subject_cgpa: number;
  overall_cgpa: number;
  difficulty_level: number;
  workload_level: number;
  new_field_exploration: number;
  concept_heavy: number;
  math_heavy: number;
  practical_focus: number;
  written_review: string;
  status: TestimonialStatus;
  is_featured: boolean;
  branch?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const COURSE_NAME_MAP: Record<string, string> = {};
(courseCatalog as Array<{ course_code: string; course_name: string }>).forEach(
  (c) => {
    COURSE_NAME_MAP[c.course_code] = c.course_name;
  },
);

const ADMIN_ACCOUNTS: Record<string, string> = {
  "Aaditya Shah": "KernelForge23",
  "Sumedh Shelgaonkar": "SumedhShelgaonkar",
};

export default function AdminTestimonialsPage() {
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<AdminSection>("pending");
  const [pendingTestimonials, setPendingTestimonials] = useState<
    AdminTestimonial[]
  >([]);
  const [approvedTestimonials, setApprovedTestimonials] = useState<
    AdminTestimonial[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<number[]>([]);

  async function loadDashboardData() {
    setIsLoading(true);
    setActionError(null);
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/testimonials/pending`),
        fetch(`${API_BASE_URL}/api/admin/testimonials/approved`),
      ]);

      if (!pendingRes.ok) {
        const errorBody = await pendingRes.json().catch(() => null);
        throw new Error(
          errorBody?.detail ?? "Failed to load pending testimonials.",
        );
      }
      if (!approvedRes.ok) {
        const errorBody = await approvedRes.json().catch(() => null);
        throw new Error(
          errorBody?.detail ?? "Failed to load approved testimonials.",
        );
      }

      const [pendingData, approvedData] = (await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
      ])) as [AdminTestimonial[], AdminTestimonial[]];

      setPendingTestimonials(pendingData);
      setApprovedTestimonials(approvedData);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to load admin dashboard data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedUser = usernameInput.trim();
    const expectedPassword = ADMIN_ACCOUNTS[trimmedUser];

    if (expectedPassword && expectedPassword === passwordInput) {
      setIsAuthenticated(true);
      setAuthenticatedUser(trimmedUser);
      setAuthError(null);
      setUsernameInput("");
      setPasswordInput("");
      void loadDashboardData();
      return;
    }

    setAuthError("Invalid username or password. Please try again.");
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setAuthenticatedUser(null);
  }

  function startBusy(id: number) {
    setBusyIds((current) => [...current, id]);
  }

  function stopBusy(id: number) {
    setBusyIds((current) => current.filter((busyId) => busyId !== id));
  }

  async function updateStatus(
    testimonialId: number,
    status: "APPROVED" | "REJECTED",
  ) {
    startBusy(testimonialId);
    setActionError(null);
    setActionMessage(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/testimonials/${testimonialId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? "Failed to update testimonial status.");
      }

      setActionMessage(`Testimonial #${testimonialId} marked as ${status}.`);
      await loadDashboardData();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to update testimonial status.",
      );
    } finally {
      stopBusy(testimonialId);
    }
  }

  async function toggleFeature(testimonial: AdminTestimonial) {
    const testimonialId = testimonial.id;
    startBusy(testimonialId);
    setActionError(null);
    setActionMessage(null);

    const nextFeaturedValue = !testimonial.is_featured;
    setApprovedTestimonials((current) =>
      current.map((item) =>
        item.id === testimonialId
          ? { ...item, is_featured: nextFeaturedValue }
          : item,
      ),
    );

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/testimonials/${testimonialId}/feature`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_featured: nextFeaturedValue }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.detail ?? "Failed to update featured status.");
      }

      const updated = (await response.json()) as AdminTestimonial;
      setApprovedTestimonials((current) =>
        current
          .map((item) => (item.id === updated.id ? updated : item))
          .sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.id - a.id),
      );
      setActionMessage(
        updated.is_featured
          ? `Testimonial #${updated.id} is now featured as Editor's Choice.`
          : `Testimonial #${updated.id} is no longer featured.`,
      );
    } catch (error) {
      setApprovedTestimonials((current) =>
        current.map((item) =>
          item.id === testimonialId
            ? { ...item, is_featured: testimonial.is_featured }
            : item,
        ),
      );
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to update featured status.",
      );
    } finally {
      stopBusy(testimonialId);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-4 py-12 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8 shadow-xl">
          <div className="mb-6 flex justify-between items-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Lock className="size-6" />
            </div>
            <ThemeToggle />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Portal Sign In
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in with your authorized admin credentials to access the moderation dashboard.
          </p>
          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-username" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. Aaditya Shah"
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
              />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
              />
            </div>
            {authError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              Sign In to Admin Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  const activeItems =
    activeSection === "pending" ? pendingTestimonials : approvedTestimonials;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Top Navbar */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">CBCS Admin Platform</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Course Review &amp; Testimonial Moderation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <LogOut className="size-3.5 text-rose-500" /> Sign Out ({authenticatedUser})
            </button>
          </div>
        </nav>

        {/* Header Dashboard Banner */}
        <header className="relative isolate overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="size-4" /> Moderation Center
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Testimonial Verification Dashboard
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Inspect student ratings, MIS records, branch details, and written advice to approve authentic course feedback.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboardData()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Refreshing..." : "Refresh Submissions"}
            </button>
          </div>

          {/* Section Selector Tabs */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setActiveSection("pending")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeSection === "pending"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Pending Verification</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeSection === "pending" ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400"}`}>
                {pendingTestimonials.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("approved")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                activeSection === "approved"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span>Approved &amp; Featured</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeSection === "approved" ? "bg-white/20 text-white" : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"}`}>
                {approvedTestimonials.length}
              </span>
            </button>
          </div>

          {actionMessage && (
            <div className="mt-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {actionMessage}
            </div>
          )}
          {actionError && (
            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-sm font-medium text-red-800 dark:text-red-300">
              {actionError}
            </div>
          )}
        </header>

        {/* Content Section */}
        <section className="space-y-6">
          {isLoading && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-400">
              <RefreshCw className="mx-auto size-6 animate-spin text-indigo-500 mb-2" />
              Loading testimonial submissions...
            </div>
          )}

          {!isLoading && activeItems.length === 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-12 text-center shadow-sm">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                <BookOpen className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">No Testimonials Found</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {activeSection === "pending"
                  ? "There are currently no pending course reviews awaiting review."
                  : "No approved testimonials exist yet."}
              </p>
            </div>
          )}

          {!isLoading &&
            activeItems.map((testimonial) => {
              const isBusy = busyIds.includes(testimonial.id);
              const scores = [
                { key: "Difficulty", icon: Flame, value: testimonial.difficulty_level, color: "text-amber-500 dark:text-amber-400" },
                { key: "Workload", icon: Clock, value: testimonial.workload_level, color: "text-blue-500 dark:text-blue-400" },
                { key: "Exploration", icon: Compass, value: testimonial.new_field_exploration, color: "text-emerald-500 dark:text-emerald-400" },
                { key: "Concepts", icon: Brain, value: testimonial.concept_heavy, color: "text-purple-500 dark:text-purple-400" },
                { key: "Math", icon: Calculator, value: testimonial.math_heavy, color: "text-cyan-500 dark:text-cyan-400" },
                { key: "Practical", icon: Wrench, value: testimonial.practical_focus, color: "text-rose-500 dark:text-rose-400" },
              ];

              return (
                <article
                  key={testimonial.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 p-6 shadow-sm transition hover:shadow-md sm:p-8 space-y-6"
                >
                  {/* Testimonial Header Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900">
                        #{testimonial.id}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                        <BookOpen className="size-3.5" /> {testimonial.course_code}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        <Tag className="size-3.5" /> {testimonial.course_category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {testimonial.is_featured && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/80 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Star className="size-3.5 fill-amber-500 text-amber-500" /> Editor&apos;s Choice
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        testimonial.status === "APPROVED"
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                          : testimonial.status === "REJECTED"
                          ? "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                          : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                      }`}>
                        {testimonial.status}
                      </span>
                    </div>
                  </div>

                  {/* Course Title Banner */}
                  <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 px-4 py-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      {COURSE_NAME_MAP[testimonial.course_code] ?? testimonial.course_code}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Course Code: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{testimonial.course_code}</span> · Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{testimonial.course_category}</span>
                    </p>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <User className="size-3.5 text-indigo-500" /> Student Name
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {testimonial.reviewer_name}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <GraduationCap className="size-3.5 text-indigo-500" /> MIS Number
                      </p>
                      <p className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                        {testimonial.mis_no}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Subject CGPA
                      </p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {testimonial.subject_cgpa.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10.0</span>
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Overall CGPA
                      </p>
                      <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">
                        {testimonial.overall_cgpa.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10.0</span>
                      </p>
                    </div>
                  </div>

                  {/* 6 Criteria Scores Display */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      Course Attribute Ratings (1 - 4 Scale)
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      {scores.map((score) => {
                        const IconComponent = score.icon;
                        return (
                          <div
                            key={score.key}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <IconComponent className={`size-3.5 ${score.color}`} /> {score.key}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {score.value}/4
                              </span>
                            </div>
                            {/* Score Bar */}
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all"
                                style={{ width: `${(score.value / 4) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Written Course Review */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                      <Quote className="size-3.5 text-indigo-500" /> Student Review &amp; Advice (&quot;The Inside Scoop&quot;)
                    </h4>
                    <blockquote className="rounded-xl border-l-4 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 p-4 text-sm italic leading-relaxed text-slate-800 dark:text-slate-200">
                      &ldquo;{testimonial.written_review}&rdquo;
                    </blockquote>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    {activeSection === "pending" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void updateStatus(testimonial.id, "REJECTED")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 transition hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-50"
                        >
                          <XCircle className="size-4" /> Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateStatus(testimonial.id, "APPROVED")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-4" /> Approve Testimonial
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void updateStatus(testimonial.id, "REJECTED")}
                          disabled={isBusy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-50"
                        >
                          <XCircle className="size-3.5" /> Move to Rejected
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleFeature(testimonial)}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                            testimonial.is_featured
                              ? "border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                              : "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                          }`}
                        >
                          <Star className={`size-4 ${testimonial.is_featured ? "fill-amber-500 text-amber-500" : ""}`} />
                          {testimonial.is_featured ? "Remove Editor's Choice" : "Mark Editor's Choice"}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
        </section>
      </div>
    </main>
  );
}
