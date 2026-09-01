"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown, Search, Filter, BookOpen, Clock, CheckCircle, AlertCircle, RefreshCw, Eye, X, Calendar, User, ChevronDown } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { staggerContainer, fadeInUp } from "@/lib/motion";

// ── Types ────────────────────────────────────────────────────────────────────

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

interface BookRow {
  id: string;
  title: string;
  author: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  member_id: string | null;
}

interface EnrichedTransaction extends TransactionRow {
  book?: BookRow;
  user?: ProfileRow;
}

// ── Local helpers (NOT imported from @/lib/data) ─────────────────────────────

const FINE_RATE_PER_DAY = 5; // PKR per day

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calcOverdueDays(dueDate: string, returnDate: string | null): number {
  const due = new Date(dueDate);
  const ret = returnDate ? new Date(returnDate) : new Date();
  const diff = Math.floor((ret.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "issued":
      return "Issued";
    case "returned":
      return "Returned";
    case "overdue":
      return "Overdue";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case "issued":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "returned":
      return "bg-green-100 text-green-800 border-green-200";
    case "overdue":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

const STATUS_FILTERS = ["All", "issued", "returned", "overdue"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[var(--brand-dark)]">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
        </div>
        <div className={cn("rounded-xl p-2.5", color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function TransactionModal({
  tx,
  onClose,
}: {
  tx: EnrichedTransaction;
  onClose: () => void;
}) {
  const overdue = calcOverdueDays(tx.due_date, tx.return_date);
  const fine = tx.status === "overdue" || overdue > 0 ? overdue * FINE_RATE_PER_DAY : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-black/5 bg-white shadow-2xl"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--brand-dark)]">Transaction Detail</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                getStatusStyle(tx.status)
              )}
            >
              {getStatusLabel(tx.status)}
            </span>
            <span className="text-xs text-gray-400">ID: {tx.id.slice(0, 8)}…</span>
          </div>

          {/* Book */}
          <div className="rounded-xl bg-[var(--brand-cream)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-gold)]">Book</p>
            <p className="mt-1 font-semibold text-[var(--brand-dark)]">
              {tx.book?.title ?? "Unknown Title"}
            </p>
            <p className="text-sm text-gray-500">{tx.book?.author ?? "—"}</p>
          </div>

          {/* Member */}
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Member</p>
            <p className="mt-1 font-semibold text-[var(--brand-dark)]">
              {tx.user?.full_name ?? "Unknown User"}
            </p>
            <p className="text-sm text-gray-500">{tx.user?.email ?? "—"}</p>
            {tx.user?.member_id && (
              <p className="text-xs text-gray-400">ID: {tx.user.member_id}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Issue Date", value: fmtDate(tx.issue_date) },
              { label: "Due Date", value: fmtDate(tx.due_date) },
              { label: "Return Date", value: fmtDate(tx.return_date) },
            ].map((d) => (
              <div key={d.label} className="rounded-lg border border-gray-100 p-3 text-center">
                <p className="text-xs text-gray-400">{d.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-[var(--brand-dark)]">{d.value}</p>
              </div>
            ))}
          </div>

          {/* Fine */}
          {fine > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-red-600">Overdue Fine</p>
                <p className="text-sm text-red-500">
                  {overdue} day{overdue !== 1 ? "s" : ""} × PKR {FINE_RATE_PER_DAY}/day
                </p>
              </div>
              <p className="text-xl font-bold text-red-700">PKR {fine}</p>
            </div>
          )}

          {/* Notes */}
          {tx.notes && (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Notes</p>
              <p className="mt-1 text-sm text-gray-600">{tx.notes}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminTransactionsPage() {
  const supabase = createClient();

  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<EnrichedTransaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch transactions
      const { data: txData, error: txErr } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: sortDir === "asc" });

      if (txErr) throw txErr;
      const txRows: TransactionRow[] = txData ?? [];

      // Fetch books
      const bookIds = [...new Set(txRows.map((t) => t.book_id))];
      let bookMap: Record<string, BookRow> = {};
      if (bookIds.length > 0) {
        const { data: booksData } = await supabase
          .from("books")
          .select("id, title, author")
          .in("id", bookIds);
        (booksData ?? []).forEach((b: BookRow) => {
          bookMap[b.id] = b;
        });
      }

      // Fetch profiles
      const userIds = [...new Set(txRows.map((t) => t.user_id))];
      let profileMap: Record<string, ProfileRow> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email, member_id")
          .in("id", userIds);
        (profilesData ?? []).forEach((p: ProfileRow) => {
          profileMap[p.id] = p;
        });
      }

      const enriched: EnrichedTransaction[] = txRows.map((tx) => ({
        ...tx,
        book: bookMap[tx.book_id],
        user: profileMap[tx.user_id],
      }));

      setTransactions(enriched);
    } catch (err) {
      setError("Failed to load transactions. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sortDir, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Realtime ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const channel = supabase
      .channel("admin-transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalIssued = transactions.filter((t) => t.status === "issued").length;
  const totalReturned = transactions.filter((t) => t.status === "returned").length;
  const totalOverdue = transactions.filter((t) => t.status === "overdue").length;
  const totalFines = transactions
    .filter((t) => t.status === "overdue")
    .reduce((acc, t) => acc + calcOverdueDays(t.due_date, t.return_date) * FINE_RATE_PER_DAY, 0);

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      tx.book?.title?.toLowerCase().includes(q) ||
      tx.book?.author?.toLowerCase().includes(q) ||
      tx.user?.full_name?.toLowerCase().includes(q) ||
      tx.user?.email?.toLowerCase().includes(q) ||
      tx.user?.member_id?.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "All" || tx.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Page Header */}
        <Reveal>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--brand-dark)]">
                Transaction Log
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Full history of all book issues, returns, and overdue records across the library.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-sm font-medium text-[var(--brand-dark)] shadow-sm transition-all duration-200 hover:bg-[var(--brand-gold)]/10 hover:shadow-md"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <Reveal>
          <motion.div
            className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                label: "Total Transactions",
                value: transactions.length,
                icon: BookOpen,
                color: "bg-[var(--brand-dark)]/10 text-[var(--brand-dark)]",
                sub: "All time",
              },
              {
                label: "Currently Issued",
                value: totalIssued,
                icon: Clock,
                color: "bg-blue-100 text-blue-700",
                sub: "Active loans",
              },
              {
                label: "Returned",
                value: totalReturned,
                icon: CheckCircle,
                color: "bg-green-100 text-green-700",
                sub: "Completed",
              },
              {
                label: "Overdue",
                value: totalOverdue,
                icon: AlertCircle,
                color: "bg-red-100 text-red-700",
                sub: `PKR ${totalFines.toLocaleString("en-PK")} in fines`,
              },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Filters & Search */}
        <Reveal>
          <div className="mb-6 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by book, member, email, or transaction ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 outline-none transition-all focus:border-[var(--brand-gold)] focus:bg-white focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  showFilters
                    ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10 text-[var(--brand-dark)]"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[var(--brand-gold)]/50"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showFilters && "rotate-180"
                  )}
                />
              </button>

              {/* Sort */}
              <button
                onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:border-[var(--brand-gold)]/50"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortDir === "desc" ? "Newest First" : "Oldest First"}
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <motion.div
                className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <Filter className="h-3.5 w-3.5" /> Status:
                </span>
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150",
                      statusFilter === s
                        ? "border-[var(--brand-dark)] bg-[var(--brand-dark)] text-white"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[var(--brand-gold)]"
                    )}
                  >
                    {s === "All" ? "All Statuses" : getStatusLabel(s)}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </Reveal>

        {/* Table */}
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                <RefreshCw className="h-8 w-8 animate-spin text-[var(--brand-gold)]" />
                <p className="text-sm">Loading transactions…</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-red-500">
                <AlertCircle className="h-8 w-8" />
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchData}
                  className="mt-1 rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                <BookOpen className="h-10 w-10 text-gray-200" />
                <p className="text-sm font-medium">No transactions found</p>
                <p className="text-xs text-gray-300">
                  {search || statusFilter !== "All"
                    ? "Try adjusting your search or filters."
                    : "No transactions have been recorded yet."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/60">
                        {["Book", "Member", "Issue Date", "Due Date", "Return Date", "Status", "Fine", ""].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map((tx) => {
                        const overdue = calcOverdueDays(tx.due_date, tx.return_date);
                        const fine =
                          tx.status === "overdue" || (tx.status !== "returned" && overdue > 0)
                            ? overdue * FINE_RATE_PER_DAY
                            : 0;
                        return (
                          <motion.tr
                            key={tx.id}
                            className="group transition-colors hover:bg-[var(--brand-cream)]/60"
                            whileHover={{ x: 1 }}
                            transition={{ duration: 0.15 }}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--brand-dark)]/8">
                                  <BookOpen className="h-4 w-4 text-[var(--brand-dark)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-[var(--brand-dark)] line-clamp-1">
                                    {tx.book?.title ?? "Unknown"}
                                  </p>
                                  <p className="text-xs text-gray-400">{tx.book?.author ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-gold)]/15">
                                  <User className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800 line-clamp-1">
                                    {tx.user?.full_name ?? "Unknown"}
                                  </p>
                                  <p className="text-xs text-gray-400">{tx.user?.member_id ?? tx.user?.email ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Calendar className="h-3.5 w-3.5 text-gray-300" />
                                {fmtDate(tx.issue_date)}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div
                                className={cn(
                                  "flex items-center gap-1.5",
                                  tx.status === "overdue" ? "text-red-600 font-medium" : "text-gray-600"
                                )}
                              >
                                <Clock className="h-3.5 w-3.5 opacity-60" />
                                {fmtDate(tx.due_date)}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-500">
                              {tx.return_date ? (
                                <div className="flex items-center gap-1.5 text-green-600">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {fmtDate(tx.return_date)}
                                </div>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                                  getStatusStyle(tx.status)
                                )}
                              >
                                {getStatusLabel(tx.status)}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              {fine > 0 ? (
                                <span className="font-semibold text-red-600">
                                  PKR {fine.toLocaleString("en-PK")}
                                </span>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <button
                                onClick={() => setSelected(tx)}
                                className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--brand-gold)]/10 hover:text-[var(--brand-dark)]"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-gray-50 md:hidden">
                  {filtered.map((tx) => {
                    const overdue = calcOverdueDays(tx.due_date, tx.return_date);
                    const fine =
                      tx.status === "overdue" || (tx.status !== "returned" && overdue > 0)
                        ? overdue * FINE_RATE_PER_DAY
                        : 0;
                    return (
                      <div
                        key={tx.id}
                        className="cursor-pointer p-4 transition-colors hover:bg-[var(--brand-cream)]/50"
                        onClick={() => setSelected(tx)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-[var(--brand-dark)]">
                              {tx.book?.title ?? "Unknown Book"}
                            </p>
                            <p className="text-xs text-gray-500">{tx.user?.full_name ?? "Unknown Member"}</p>
                          </div>
                          <span
                            className={cn(
                              "flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold",
                              getStatusStyle(tx.status)
                            )}
                          >
                            {getStatusLabel(tx.status)}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span>Issued: {fmtDate(tx.issue_date)}</span>
                          <span>Due: {fmtDate(tx.due_date)}</span>
                          {fine > 0 && (
                            <span className="font-semibold text-red-500">Fine: PKR {fine}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer count */}
                <div className="border-t border-gray-100 px-5 py-3">
                  <p className="text-xs text-gray-400">
                    Showing {filtered.length} of {transactions.length} transaction
                    {transactions.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>

      {/* Detail Modal */}
      {selected && (
        <TransactionModal tx={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}