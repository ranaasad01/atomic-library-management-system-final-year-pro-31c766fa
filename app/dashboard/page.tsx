"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, AlertCircle, Clock, Activity, Search, ArrowRight, CheckCircle, AlertTriangle, RotateCcw, User, Calendar, DollarSign } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
type APP_NAME = any;
const APP_NAME: any = [];
type LOAN_PERIOD_DAYS = any;
const LOAN_PERIOD_DAYS: any = [];
type FINE_RATE = any;
const FINE_RATE: any = [];
type formatDate = any;
const formatDate: any = [];
type getDaysUntilDue = any;
const getDaysUntilDue: any = [];
type getAvailabilityBadge = any;
const getAvailabilityBadge: any = [];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  member_id: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  publication_year: number | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string | null;
  description: string | null;
  cover_url: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

interface TransactionRow {
  id: string;
  book_id: string;
  user_id: string;
  issued_by: string | null;
  returned_to: string | null;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

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

interface EnrichedTransaction extends TransactionRow {
  book?: BookRow;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

function isOverdue(dueDate: string, returnDate: string | null): boolean {
  if (returnDate) return false;
  return new Date(dueDate) < new Date();
}

function daysOverdue(dueDate: string): number {
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function daysUntilDue(dueDate: string): number {
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isDueThisWeek(dueDate: string, returnDate: string | null): boolean {
  if (returnDate) return false;
  const days = daysUntilDue(dueDate);
  return days >= 0 && days <= 7;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
  loading?: boolean;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] flex items-center gap-4"
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      <div className={cn("rounded-xl p-3", accent)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-12 animate-pulse rounded bg-gray-200 mb-1" />
        ) : (
          <div className="text-2xl font-bold text-[var(--brand-dark)] leading-none">
            {value}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
  const overdue = isOverdue(dueDate, null) && status !== "returned";
  if (status === "returned")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
        <CheckCircle className="h-3 w-3" /> Returned
      </span>
    );
  if (overdue)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
        <AlertTriangle className="h-3 w-3" /> Overdue
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
      <Clock className="h-3 w-3" /> Issued
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [fines, setFines] = useState<FineRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [profileRes, txRes, finesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("fines")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_paid", false)
          .eq("is_waived", false),
      ]);

      if (profileRes.data) setProfile(profileRes.data as ProfileRow);

      const txRows: TransactionRow[] = txRes.data ?? [];

      // Fetch books for each transaction
      const bookIds = [...new Set(txRows.map((t) => t.book_id))];
      let booksMap: Record<string, BookRow> = {};
      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from("books")
          .select("*")
          .in("id", bookIds);
        if (booksData) {
          booksMap = Object.fromEntries(
            (booksData as BookRow[]).map((b) => [b.id, b])
          );
        }
      }

      const enriched: EnrichedTransaction[] = txRows.map((t) => ({
        ...t,
        book: booksMap[t.book_id],
      }));

      setTransactions(enriched);
      setFines((finesRes.data as FineRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeLoans = transactions.filter((t) => t.status !== "returned");
  const dueThisWeek = transactions.filter(
    (t) => t.status !== "returned" && isDueThisWeek(t.due_date, t.return_date)
  );
  const pendingFinesTotal = fines.reduce((s, f) => s + Number(f.total_amount), 0);
  const totalTransactions = transactions.length;

  const recentActivity = transactions.slice(0, 8);

  return (
    <main className="min-h-screen bg-[var(--brand-cream)] pb-20">
      {/* ── Welcome Header ─────────────────────────────────────────────────── */}
      <Reveal>
        <section className="bg-[var(--brand-dark)] text-white px-4 py-10 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="rounded-full bg-[var(--brand-gold)]/20 p-2">
                    <User className="h-5 w-5 text-[var(--brand-gold)]" />
                  </div>
                  <span className="text-sm font-medium text-[var(--brand-gold)]">
                    Library Member
                  </span>
                </div>
                {loading ? (
                  <div className="h-9 w-64 animate-pulse rounded bg-white/10 mb-2" />
                ) : (
                  <h1 className="text-3xl font-bold tracking-tight text-white">
                    Welcome back,{" "}
                    <span className="text-[var(--brand-gold)]">
                      {profile?.full_name?.split(" ")[0] ?? "Member"}
                    </span>
                  </h1>
                )}
                <p className="mt-1 text-white/60 text-sm">
                  {profile?.member_id
                    ? `Member ID: ${profile.member_id}`
                    : profile?.email ?? ""}
                  {" · "}
                  {APP_NAME}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/books"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-5 py-2.5 text-sm font-semibold text-[var(--brand-dark)] transition-all duration-200 hover:brightness-110 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
                >
                  <Search className="h-4 w-4" />
                  Search Books
                </Link>
                <Link
                  href="/fines"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <DollarSign className="h-4 w-4" />
                  View Fines
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="mx-auto max-w-6xl px-4 mt-8 space-y-8">
        {/* ── Stat Overview ────────────────────────────────────────────────── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            <StatCard
              icon={BookOpen}
              label="Books Issued"
              value={loading ? "—" : activeLoans.length}
              accent="bg-[var(--brand-dark)]"
              loading={loading}
            />
            <StatCard
              icon={Clock}
              label="Due This Week"
              value={loading ? "—" : dueThisWeek.length}
              accent="bg-amber-500"
              loading={loading}
            />
            <StatCard
              icon={AlertCircle}
              label="Pending Fines"
              value={
                loading
                  ? "—"
                  : `Rs ${pendingFinesTotal.toLocaleString("en-PK")}`
              }
              accent="bg-red-500"
              loading={loading}
            />
            <StatCard
              icon={Activity}
              label="Total Transactions"
              value={loading ? "—" : totalTransactions}
              accent="bg-[var(--brand-gold)]"
              loading={loading}
            />
          </motion.div>
        </Reveal>

        {/* ── Two-column split ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Issued Books Card */}
          <Reveal>
            <div className="rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--brand-dark)]" />
                  <h2 className="font-semibold text-[var(--brand-dark)]">
                    Active Loans
                  </h2>
                </div>
                <span className="rounded-full bg-[var(--brand-dark)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--brand-dark)]">
                  {activeLoans.length} book{activeLoans.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 animate-pulse">
                      <div className="h-4 w-3/4 rounded bg-gray-100 mb-2" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  ))
                ) : activeLoans.length === 0 ? (
                  <div className="px-6 py-10 text-center text-gray-400 text-sm">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No active loans. Browse books to get started.
                  </div>
                ) : (
                  activeLoans.slice(0, 5).map((tx) => {
                    const overdue = isOverdue(tx.due_date, tx.return_date);
                    const days = daysUntilDue(tx.due_date);
                    return (
                      <div
                        key={tx.id}
                        className="px-6 py-4 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {tx.book?.title ?? "Unknown Book"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {tx.book?.author ?? ""}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span
                              className={cn(
                                "text-xs",
                                overdue ? "text-red-600 font-medium" : "text-gray-500"
                              )}
                            >
                              Due:{" "}
                              {new Date(tx.due_date).toLocaleDateString("en-PK", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                              {overdue
                                ? ` (${daysOverdue(tx.due_date)}d overdue)`
                                : days <= 3
                                ? ` (${days}d left)`
                                : ""}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={tx.status} dueDate={tx.due_date} />
                      </div>
                    );
                  })
                )}
              </div>
              {activeLoans.length > 5 && (
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
                  <Link
                    href="/transactions"
                    className="text-xs font-medium text-[var(--brand-dark)] hover:text-[var(--brand-gold)] transition-colors flex items-center gap-1"
                  >
                    View all {activeLoans.length} loans
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </Reveal>

          {/* Pending Fines Card */}
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h2 className="font-semibold text-[var(--brand-dark)]">
                    Pending Fines
                  </h2>
                </div>
                {pendingFinesTotal > 0 && (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                    Rs {pendingFinesTotal.toLocaleString("en-PK")} due
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 animate-pulse">
                      <div className="h-4 w-3/4 rounded bg-gray-100 mb-2" />
                      <div className="h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                  ))
                ) : fines.length === 0 ? (
                  <div className="px-6 py-10 text-center text-gray-400 text-sm">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400 opacity-60" />
                    No pending fines. Great job returning books on time!
                  </div>
                ) : (
                  fines.slice(0, 5).map((fine) => {
                    const tx = transactions.find(
                      (t) => t.id === fine.transaction_id
                    );
                    return (
                      <div
                        key={fine.id}
                        className="px-6 py-4 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {tx?.book?.title ?? "Book"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {fine.overdue_days} day{fine.overdue_days !== 1 ? "s" : ""} overdue
                            {" · "}Rs {Number(fine.amount_per_day).toFixed(0)}/day
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-red-600">
                          Rs {Number(fine.total_amount).toLocaleString("en-PK")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              {fines.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-100 bg-red-50/50">
                  <Link
                    href="/fines"
                    className="text-xs font-medium text-red-700 hover:text-red-900 transition-colors flex items-center gap-1"
                  >
                    Manage all fines
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── Recent Activity Table ─────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[var(--brand-dark)]" />
                <h2 className="font-semibold text-[var(--brand-dark)]">
                  Recent Activity
                </h2>
              </div>
              <Link
                href="/transactions"
                className="text-xs font-medium text-[var(--brand-dark)] hover:text-[var(--brand-gold)] transition-colors flex items-center gap-1"
              >
                Full history <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Book
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                      Issue Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                      Return Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4">
                          <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
                        </td>
                        <td className="px-4 py-4">
                          <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
                        </td>
                      </tr>
                    ))
                  ) : recentActivity.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-10 text-center text-gray-400 text-sm"
                      >
                        <RotateCcw className="h-7 w-7 mx-auto mb-2 opacity-30" />
                        No transaction history yet.
                      </td>
                    </tr>
                  ) : (
                    recentActivity.map((tx) => (
                      <tr
                        key={tx.id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900 truncate max-w-[180px]">
                            {tx.book?.title ?? "Unknown Book"}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[180px]">
                            {tx.book?.author ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">
                          {new Date(tx.issue_date).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                          {new Date(tx.due_date).toLocaleDateString("en-PK", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-4 text-gray-600 hidden md:table-cell whitespace-nowrap">
                          {tx.return_date
                            ? new Date(tx.return_date).toLocaleDateString(
                                "en-PK",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>
                        <td className="px-4 py-4">
                          {tx.status === "returned" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                              <CheckCircle className="h-3 w-3" /> Returned
                            </span>
                          ) : isOverdue(tx.due_date, tx.return_date) ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
                              <Clock className="h-3 w-3" /> Issued
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* ── CTA Strip ────────────────────────────────────────────────────── */}
        <Reveal>
          <div className="rounded-2xl bg-[var(--brand-dark)] px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white">
                Discover your next read
              </h3>
              <p className="text-white/60 text-sm mt-1">
                Browse thousands of titles across all departments at NCBA&amp;E
                Central Library.
              </p>
            </div>
            <Link
              href="/books"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[var(--brand-dark)] transition-all duration-200 hover:brightness-110 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
            >
              <Search className="h-4 w-4" />
              Browse Book Catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}