"use client";

import { useState } from "react";

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
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const ADMIN_PIN = "1234";

export default function AdminTestimonialsPage() {
  const [pinInput, setPinInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  function handlePinSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pinInput.trim() === ADMIN_PIN) {
      setIsAuthenticated(true);
      setAuthError(null);
      setPinInput("");
      void loadDashboardData();
      return;
    }
    setAuthError("Invalid PIN. Please try again.");
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

      setActionMessage(`Testimonial ${testimonialId} marked as ${status}.`);
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
          ? `Testimonial ${updated.id} is now featured.`
          : `Testimonial ${updated.id} is no longer featured.`,
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
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Testimonial Admin Access
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter admin PIN to continue.
          </p>
          <form onSubmit={handlePinSubmit} className="mt-5 space-y-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter PIN"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            {authError && (
              <p className="text-sm font-medium text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </main>
    );
  }

  const activeItems =
    activeSection === "pending" ? pendingTestimonials : approvedTestimonials;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Testimonial Moderation Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review pending submissions and curate Editor&apos;s Choice testimonials.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSection("pending")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeSection === "pending"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              Pending Verification ({pendingTestimonials.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("approved")}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                activeSection === "approved"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              Approved / Editor&apos;s Choice ({approvedTestimonials.length})
            </button>
            <button
              type="button"
              onClick={() => void loadDashboardData()}
              disabled={isLoading}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {actionMessage && (
            <p className="mt-3 text-sm font-medium text-emerald-700">
              {actionMessage}
            </p>
          )}
          {actionError && (
            <p className="mt-3 text-sm font-medium text-red-700">{actionError}</p>
          )}
        </header>

        <section className="space-y-4">
          {isLoading && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
              Loading testimonials...
            </div>
          )}

          {!isLoading && activeItems.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
              No testimonials in this section.
            </div>
          )}

          {!isLoading &&
            activeItems.map((testimonial) => {
              const isBusy = busyIds.includes(testimonial.id);
              return (
                <article
                  key={testimonial.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      #{testimonial.id}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {testimonial.course_category}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {testimonial.course_code}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      Subject CGPA: {testimonial.subject_cgpa.toFixed(1)}
                    </span>
                    <span className="rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-semibold text-cyan-800">
                      Overall CGPA: {testimonial.overall_cgpa.toFixed(1)}
                    </span>
                    {testimonial.is_featured && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                        ✨ Editor&apos;s Choice
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-slate-700">
                    <p>
                      <span className="font-semibold">Reviewer:</span>{" "}
                      {testimonial.reviewer_name}
                    </p>
                    <p>
                      <span className="font-semibold">MIS:</span> {testimonial.mis_no}
                    </p>
                    <p>
                      <span className="font-semibold">Status:</span>{" "}
                      {testimonial.status}
                    </p>
                  </div>

                  <blockquote className="mt-4 rounded-xl border-l-4 border-indigo-300 bg-indigo-50/60 px-4 py-3 text-sm italic leading-relaxed text-slate-700">
                    &ldquo;{testimonial.written_review}&rdquo;
                  </blockquote>

                  {activeSection === "pending" ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void updateStatus(testimonial.id, "APPROVED")}
                        disabled={isBusy}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✅ Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void updateStatus(testimonial.id, "REJECTED")}
                        disabled={isBusy}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ❌ Reject
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => void toggleFeature(testimonial)}
                        disabled={isBusy}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          testimonial.is_featured
                            ? "bg-amber-100 text-amber-900 hover:bg-amber-200"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {testimonial.is_featured
                          ? "✨ Unfeature"
                          : "✨ Feature"}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
        </section>
      </div>
    </main>
  );
}
