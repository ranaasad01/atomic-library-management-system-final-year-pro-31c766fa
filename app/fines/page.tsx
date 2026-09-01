"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, DollarSign, FileText, Search, Filter, ChevronDown, Info, BookOpen, Calendar } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
type FINE_RATE = any;
const FINE_RATE: any = [];
type LOAN_PERIOD_DAYS = any;
const LOAN_PERIOD_DAYS: any = [];
type formatDate = any;
const formatDate: any = [];
import { staggerContainer, fadeInUp } from "@/lib/motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FineRow {
  id: string;
  transaction_id: string;
  user_id: string;
  overdue_days: number;
  amount_per_day: number;
  total_amount: number;
  is_paid: boolean;
  is_waived: boolean;
  paid_at: string | null;
  waived_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TransactionRow {
  id: string;
  book_id: string;
  user_id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  notes: string | null;
}

interface BookRow {
  id: string;
  title: string;
  author: string;
}

interface EnrichedFine extends FineRow {
  transaction?: TransactionRow;
  book?: BookRow;
}

type FilterStatus = "all" | "unpaid" | "paid" | "waived";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/5 bg-white p-5",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]",
        "flex flex-col gap-3"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--muted)]">{label}</span>
        <span className={cn("rounded-xl p-2", accent)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="text-2xl font-bold text-[var(--navy)] tracking-tight">
        {value}
      </div>
      {sub && (
        <div className="text-xs text-[var(--muted)]">{sub}</div>
      )}
    </div>
  );
}

// ─── Fine Status Badge ────────────────────────────────────────────────────────

function FineBadge({ fine }: { fine: FineRow }) {
  if (fine.is_waived) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">
        <CheckCircle className="h-3 w-3" /> Waived
      </span>
    );
  }
  if (fine.is_paid) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 border border-green-200">
        <CheckCircle className="h-3 w-3" /> Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
      <AlertCircle className="h-3 w-3" /> Unpaid
    </span>
  );
}

// ─── Fine Row Card ────────────────────────────────────────────────────────────

function FineCard({ fine, index }: { fine: EnrichedFine; index: number }) {
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      className={cn(
        "rounded-2xl border bg-white p-5",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]",
        "transition-all duration-200 hover:shadow-[0_2px_4px_rgba(0,0,0,0.06),0_12px_32px_-8px_rgba(0,0,0,0.14)]",
        fine.is_paid || fine.is_waived
          ? "border-black/5"
          : "border-red-200/60"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Book info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 flex-shrink-0 rounded-xl bg-[var(--navy)]/8 p-2">
            <BookOpen className="h-4 w-4 text-[var(--navy)]" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--navy)] truncate">
              {fine.book?.title ?? "Unknown Book"}
            </p>
            <p className="text-sm text-[var(--muted)] truncate">
              {fine.book?.author ?? ""}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)] font-mono">
              Fine ID: {fine.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Status + amount */}
        <div className="flex flex-col items-start gap-2 sm:items-end flex-shrink-0">
          <FineBadge fine={fine} />
          <span
            className={cn(
              "text-xl font-bold",
              fine.is_paid || fine.is_waived
                ? "text-[var(--muted)]"
                : "text-red-600"
            )}
          >
            Rs. {fine.total_amount.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-black/5 pt-4">
        <div>
          <p className="text-xs text-[var(--muted)] mb-0.5">Overdue Days</p>
          <p className="text-sm font-semibold text-[var(--navy)]">
            {fine.overdue_days} {fine.overdue_days === 1 ? "day" : "days"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-0.5">Rate / Day</p>
          <p className="text-sm font-semibold text-[var(--navy)]">
            Rs. {fine.amount_per_day}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-0.5">Due Date</p>
          <p className="text-sm font-semibold text-[var(--navy)]">
            {fine.transaction?.due_date
              ? formatDate(fine.transaction.due_date)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-[var(--muted)] mb-0.5">
            {fine.is_paid ? "Paid On" : fine.is_waived ? "Waived" : "Issued On"}
          </p>
          <p className="text-sm font-semibold text-[var(--navy)]">
            {fine.is_paid && fine.paid_at
              ? formatDate(fine.paid_at)
              : fine.is_waived
              ? "By Admin"
              : formatDate(fine.created_at)}
          </p>
        </div>
      </div>

      {fine.notes && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200/60 px-3 py-2">
          <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">{fine.notes}</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-green-50 p-5 mb-4">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--navy)] mb-1">
        {filtered ? "No fines match your filter" : "No fines on your account"}
      </h3>
      <p className="text-sm text-[var(--muted)] max-w-xs">
        {filtered
          ? "Try adjusting the filter or search term to find what you're looking for."
          : "Great job! Return books on time to keep your record clean."}
      </p>
    </div>
  );
}

// ─── Policy Info Banner ───────────────────────────────────────────────────────

function PolicyBanner() {
  const FINE_PER_DAY = FINE_RATE;
  const LOAN_DAYS = LOAN_PERIOD_DAYS;
  return (
    <div className="rounded-2xl border border-[var(--gold)]/30 bg-[var(--cream)] p-5 flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="flex-shrink-0 rounded-xl bg-[var(--gold)]/15 p-3">
        <Info className="h-5 w-5 text-[var(--gold)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[var(--navy)] text-sm">
          Library Fine Policy
        </p>
        <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
          Books must be returned within <strong>{LOAN_DAYS} days</strong> of
          issue. Overdue books incur a fine of{" "}
          <strong>Rs. {FINE_PER_DAY} per day</strong>. Fines must be cleared
          before issuing new books. Contact the library desk for waiver requests.
        </p>
      </div>
      <div className="flex-shrink-0 flex items-center gap-2 text-xs text-[var(--muted)]">
        <Calendar className="h-3.5 w-3.5" />
        <span>Loan period: {LOAN_DAYS} days</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FinesPage() {
  const supabase = createClient();

  const [fines, setFines] = useState<EnrichedFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to view your fines.");
        setLoading(false);
        return;
      }

      // Fetch fines for current user
      const { data: fineData, error: fineErr } = await supabase
        .from("fines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (fineErr) throw fineErr;

      if (!fineData || fineData.length === 0) {
        setFines([]);
        setLoading(false);
        return;
      }

      // Fetch related transactions
      const txIds = fineData.map((f) => f.transaction_id);
      const { data: txData } = await supabase
        .from("transactions")
        .select("id, book_id, user_id, issue_date, due_date, return_date, status, notes")
        .in("id", txIds);

      // Fetch related books
      const bookIds = (txData ?? []).map((t) => t.book_id);
      const { data: bookData } = await supabase
        .from("books")
        .select("id, title, author")
        .in("id", bookIds.length > 0 ? bookIds : ["00000000-0000-0000-0000-000000000000"]);

      const txMap = new Map((txData ?? []).map((t) => [t.id, t]));
      const bookMap = new Map((bookData ?? []).map((b) => [b.id, b]));

      const enriched: EnrichedFine[] = fineData.map((f) => {
        const tx = txMap.get(f.transaction_id);
        const book = tx ? bookMap.get(tx.book_id) : undefined;
        return { ...f, transaction: tx, book };
      });

      setFines(enriched);
    } catch (err) {
      console.error("Error fetching fines:", err);
      setError("Failed to load fines. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalFines = fines.length;
  const unpaidFines = fines.filter((f) => !f.is_paid && !f.is_waived);
  const paidFines = fines.filter((f) => f.is_paid);
  const waivedFines = fines.filter((f) => f.is_waived);
  const totalUnpaidAmount = unpaidFines.reduce(
    (sum, f) => sum + f.total_amount,
    0
  );
  const totalPaidAmount = paidFines.reduce((sum, f) => sum + f.total_amount, 0);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = fines.filter((f) => {
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "unpaid"
        ? !f.is_paid && !f.is_waived
        : filterStatus === "paid"
        ? f.is_paid
        : f.is_waived;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      (f.book?.title ?? "").toLowerCase().includes(q) ||
      (f.book?.author ?? "").toLowerCase().includes(q) ||
      f.id.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const filterLabels: Record<FilterStatus, string> = {
    all: "All Fines",
    unpaid: "Unpaid",
    paid: "Paid",
    waived: "Waived",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[var(--cream)] pb-20">
      {/* ── Page Header ── */}
      <Reveal>
        <section className="bg-[var(--navy)] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-white/10 p-2.5">
                <DollarSign className="h-5 w-5 text-[var(--gold)]" />
              </div>
              <span className="text-sm font-medium text-white/60 uppercase tracking-widest">
                My Account
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight sm:text-4xl">
              Fine Management
            </h1>
            <p className="mt-2 text-white/60 text-sm leading-relaxed max-w-xl">
              Track overdue fines, view payment history, and stay up to date
              with your library account balance.
            </p>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* ── Policy Banner ── */}
        <Reveal>
          <PolicyBanner />
        </Reveal>

        {/* ── Stat Cards ── */}
        <Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Fines"
              value={String(totalFines)}
              icon={FileText}
              accent="bg-[var(--navy)]/8 text-[var(--navy)]"
              sub="All time"
            />
            <StatCard
              label="Unpaid"
              value={String(unpaidFines.length)}
              icon={AlertCircle}
              accent="bg-red-50 text-red-600"
              sub={`Rs. ${totalUnpaidAmount.toFixed(0)} due`}
            />
            <StatCard
              label="Paid"
              value={String(paidFines.length)}
              icon={CheckCircle}
              accent="bg-green-50 text-green-600"
              sub={`Rs. ${totalPaidAmount.toFixed(0)} cleared`}
            />
            <StatCard
              label="Waived"
              value={String(waivedFines.length)}
              icon={Clock}
              accent="bg-purple-50 text-purple-600"
              sub="By admin"
            />
          </div>
        </Reveal>

        {/* ── Unpaid Alert ── */}
        {!loading && unpaidFines.length > 0 && (
          <Reveal>
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 text-sm">
                  Outstanding Balance: Rs. {totalUnpaidAmount.toFixed(0)}
                </p>
                <p className="text-xs text-red-700 mt-0.5">
                  You have {unpaidFines.length} unpaid{" "}
                  {unpaidFines.length === 1 ? "fine" : "fines"}. Please visit
                  the library desk to clear your balance before borrowing more
                  books.
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Search + Filter ── */}
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search by book title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white pl-9 pr-4 py-2.5 text-sm text-[var(--navy)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/40 focus:border-[var(--gold)]/60 transition-all"
              />
            </div>

            {/* Filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--navy)] hover:bg-[var(--cream)] transition-all"
              >
                <Filter className="h-4 w-4 text-[var(--muted)]" />
                {filterLabels[filterStatus]}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[var(--muted)] transition-transform",
                    showFilterMenu && "rotate-180"
                  )}
                />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-black/8 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.14)] overflow-hidden">
                  {(["all", "unpaid", "paid", "waived"] as FilterStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          setShowFilterMenu(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm transition-colors",
                          filterStatus === status
                            ? "bg-[var(--navy)] text-white font-medium"
                            : "text-[var(--navy)] hover:bg-[var(--cream)]"
                        )}
                      >
                        {filterLabels[status]}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </Reveal>

        {/* ── Fine List ── */}
        <Reveal>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-black/5 bg-white p-5 animate-pulse"
                >
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 rounded bg-gray-100" />
                      <div className="h-3 w-32 rounded bg-gray-100" />
                    </div>
                    <div className="h-6 w-20 rounded-full bg-gray-100" />
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3 border-t border-black/5 pt-4">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="space-y-1">
                        <div className="h-2.5 w-16 rounded bg-gray-100" />
                        <div className="h-3.5 w-12 rounded bg-gray-100" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
              <p className="font-semibold text-red-800">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState filtered={filterStatus !== "all" || searchQuery !== ""} />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {filtered.map((fine, i) => (
                <FineCard key={fine.id} fine={fine} index={i} />
              ))}
            </motion.div>
          )}
        </Reveal>

        {/* ── Summary Footer ── */}
        {!loading && !error && fines.length > 0 && (
          <Reveal>
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]">
              <h3 className="text-sm font-semibold text-[var(--navy)] mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[var(--gold)]" />
                Account Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-[var(--cream)] p-3 text-center">
                  <p className="text-xs text-[var(--muted)] mb-1">Total Fines</p>
                  <p className="text-lg font-bold text-[var(--navy)]">
                    {totalFines}
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 p-3 text-center">
                  <p className="text-xs text-red-600 mb-1">Amount Due</p>
                  <p className="text-lg font-bold text-red-700">
                    Rs. {totalUnpaidAmount.toFixed(0)}
                  </p>
                </div>
                <div className="rounded-xl bg-green-50 p-3 text-center">
                  <p className="text-xs text-green-600 mb-1">Amount Paid</p>
                  <p className="text-lg font-bold text-green-700">
                    Rs. {totalPaidAmount.toFixed(0)}
                  </p>
                </div>
                <div className="rounded-xl bg-purple-50 p-3 text-center">
                  <p className="text-xs text-purple-600 mb-1">Waived</p>
                  <p className="text-lg font-bold text-purple-700">
                    {waivedFines.length}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)] text-center">
                For fine disputes or waiver requests, contact the library desk
                or email{" "}
                <a
                  href="mailto:library@ncbae.edu.pk"
                  className="text-[var(--gold)] hover:underline font-medium"
                >
                  library@ncbae.edu.pk
                </a>
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </main>
  );
}