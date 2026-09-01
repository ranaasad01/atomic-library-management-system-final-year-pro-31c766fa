"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Clock, DollarSign, Search, Filter, ChevronDown, Eye, X, AlertTriangle, TrendingUp, Users, BookOpen, Calendar } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
type FINE_RATE = any;
const FINE_RATE: any = [];
type LOAN_PERIOD_DAYS = any;
const LOAN_PERIOD_DAYS: any = [];
type formatDate = any;
const formatDate: any = [];

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

interface EnrichedFine extends FineRow {
  borrower_name: string;
  borrower_email: string;
  member_id: string;
  book_title: string;
  book_author: string;
  due_date: string;
  return_date: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTERS = ["All", "Unpaid", "Paid", "Waived"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "rounded-2xl border p-5 flex flex-col gap-3",
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)] text-[var(--brand-navy)]"
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          accent ? "bg-white/15" : "bg-[var(--brand-cream)]"
        )}
      >
        <Icon
          className={cn("w-5 h-5", accent ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]")}
        />
      </div>
      <div>
        <p className={cn("text-xs font-medium uppercase tracking-wider", accent ? "text-white/60" : "text-[var(--brand-muted)]")}>
          {label}
        </p>
        <p className={cn("text-2xl font-bold mt-0.5", accent ? "text-white" : "text-[var(--brand-navy)]")}>
          {value}
        </p>
        {sub && (
          <p className={cn("text-xs mt-0.5", accent ? "text-white/50" : "text-[var(--brand-muted)]")}>
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ fine }: { fine: EnrichedFine }) {
  if (fine.is_waived) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
        <X className="w-3 h-3" /> Waived
      </span>
    );
  }
  if (fine.is_paid) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <AlertCircle className="w-3 h-3" /> Unpaid
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function FineDetailModal({
  fine,
  onClose,
  onMarkPaid,
  onWaive,
}: {
  fine: EnrichedFine;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onWaive: (id: string) => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="bg-[var(--brand-navy)] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Fine Details</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors rounded-lg p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <StatusBadge fine={fine} />
            <span className="text-xs text-[var(--brand-muted)]">
              Fine ID: {fine.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {/* Amount */}
          <div className="bg-[var(--brand-cream)] rounded-xl p-4 text-center">
            <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wider mb-1">Total Fine Amount</p>
            <p className="text-4xl font-bold text-[var(--brand-navy)]">
              Rs. {fine.total_amount.toFixed(0)}
            </p>
            <p className="text-xs text-[var(--brand-muted)] mt-1">
              {fine.overdue_days} day{fine.overdue_days !== 1 ? "s" : ""} × Rs. {fine.amount_per_day}/day
            </p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Borrower", value: fine.borrower_name },
              { label: "Member ID", value: fine.member_id || "N/A" },
              { label: "Book", value: fine.book_title },
              { label: "Author", value: fine.book_author },
              { label: "Due Date", value: formatDate(fine.due_date) },
              { label: "Returned", value: fine.return_date ? formatDate(fine.return_date) : "Not returned" },
              { label: "Overdue Days", value: `${fine.overdue_days} days` },
              { label: "Created", value: formatDate(fine.created_at) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-[var(--brand-muted)] mb-0.5">{label}</p>
                <p className="font-medium text-[var(--brand-navy)] truncate">{value}</p>
              </div>
            ))}
          </div>

          {fine.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <p className="font-medium mb-0.5">Notes</p>
              <p>{fine.notes}</p>
            </div>
          )}

          {/* Actions */}
          {!fine.is_paid && !fine.is_waived && (
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { onMarkPaid(fine.id); onClose(); }}
                className="flex-1 bg-[var(--brand-navy)] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[var(--brand-navy)]/90 transition-colors"
              >
                Mark as Paid
              </button>
              <button
                onClick={() => { onWaive(fine.id); onClose(); }}
                className="flex-1 border border-[var(--brand-border)] text-[var(--brand-navy)] rounded-xl py-2.5 text-sm font-medium hover:bg-[var(--brand-cream)] transition-colors"
              >
                Waive Fine
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FineManagementPage() {
  const supabase = createClient();

  const [fines, setFines] = useState<EnrichedFine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [selectedFine, setSelectedFine] = useState<EnrichedFine | null>(null);

  // ── Fetch & enrich ──────────────────────────────────────────────────────────

  const fetchFines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: fineRows, error: fineErr } = await supabase
        .from("fines")
        .select("*")
        .order("created_at", { ascending: false });

      if (fineErr) throw fineErr;
      if (!fineRows || fineRows.length === 0) {
        setFines([]);
        setLoading(false);
        return;
      }

      // Collect IDs for batch fetches
      const txIds = [...new Set(fineRows.map((f: FineRow) => f.transaction_id))];
      const userIds = [...new Set(fineRows.map((f: FineRow) => f.user_id))];

      const [{ data: txRows }, { data: profileRows }] = await Promise.all([
        supabase.from("transactions").select("id,book_id,user_id,issue_date,due_date,return_date,status").in("id", txIds),
        supabase.from("profiles").select("id,full_name,email,member_id").in("id", userIds),
      ]);

      const bookIds = [...new Set((txRows ?? []).map((t: TransactionRow) => t.book_id))];
      const { data: bookRows } = await supabase
        .from("books")
        .select("id,title,author")
        .in("id", bookIds);

      // Build lookup maps
      const txMap = new Map<string, TransactionRow>(
        (txRows ?? []).map((t: TransactionRow) => [t.id, t])
      );
      const profileMap = new Map<string, ProfileRow>(
        (profileRows ?? []).map((p: ProfileRow) => [p.id, p])
      );
      const bookMap = new Map<string, BookRow>(
        (bookRows ?? []).map((b: BookRow) => [b.id, b])
      );

      const enriched: EnrichedFine[] = fineRows.map((f: FineRow) => {
        const tx = txMap.get(f.transaction_id);
        const profile = profileMap.get(f.user_id);
        const book = tx ? bookMap.get(tx.book_id) : undefined;
        return {
          ...f,
          borrower_name: profile?.full_name ?? "Unknown",
          borrower_email: profile?.email ?? "",
          member_id: profile?.member_id ?? "N/A",
          book_title: book?.title ?? "Unknown Book",
          book_author: book?.author ?? "",
          due_date: tx?.due_date ?? "",
          return_date: tx?.return_date ?? null,
        };
      });

      setFines(enriched);
    } catch (err) {
      console.error("Failed to load fines:", err);
      setError("Failed to load fine records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleMarkPaid = async (id: string) => {
    const { error: err } = await supabase
      .from("fines")
      .update({ is_paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);
    if (!err) {
      setFines((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, is_paid: true, paid_at: new Date().toISOString() } : f
        )
      );
    }
  };

  const handleWaive = async (id: string) => {
    const { error: err } = await supabase
      .from("fines")
      .update({ is_waived: true })
      .eq("id", id);
    if (!err) {
      setFines((prev) =>
        prev.map((f) => (f.id === id ? { ...f, is_waived: true } : f))
      );
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────

  const totalFines = fines.length;
  const unpaidFines = fines.filter((f) => !f.is_paid && !f.is_waived);
  const paidFines = fines.filter((f) => f.is_paid);
  const waivedFines = fines.filter((f) => f.is_waived);
  const totalOutstanding = unpaidFines.reduce((s, f) => s + f.total_amount, 0);
  const totalCollected = paidFines.reduce((s, f) => s + f.total_amount, 0);

  // ── Filtered list ────────────────────────────────────────────────────────────

  const filtered = fines.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      f.borrower_name.toLowerCase().includes(q) ||
      f.book_title.toLowerCase().includes(q) ||
      f.member_id.toLowerCase().includes(q) ||
      f.borrower_email.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Paid" && f.is_paid) ||
      (statusFilter === "Waived" && f.is_waived) ||
      (statusFilter === "Unpaid" && !f.is_paid && !f.is_waived);

    return matchesSearch && matchesStatus;
  });

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      {/* Page Header */}
      <Reveal>
        <div className="bg-[var(--brand-navy)] px-6 py-10 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[var(--brand-gold)]/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[var(--brand-gold)]" />
              </div>
              <span className="text-[var(--brand-gold)] text-sm font-semibold uppercase tracking-widest">
                Fine Management
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-1">
              Overdue Fines
            </h1>
            <p className="text-white/60 mt-2 text-sm max-w-xl">
              Track, manage, and resolve overdue fines across all library members. Fine rate: Rs.{" "}
              {FINE_RATE}/day after a {LOAN_PERIOD_DAYS}-day loan period.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        {/* Stats */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              {
                icon: AlertCircle,
                label: "Outstanding Fines",
                value: `Rs. ${totalOutstanding.toFixed(0)}`,
                sub: `${unpaidFines.length} unpaid record${unpaidFines.length !== 1 ? "s" : ""}`,
                accent: true,
              },
              {
                icon: CheckCircle,
                label: "Total Collected",
                value: `Rs. ${totalCollected.toFixed(0)}`,
                sub: `${paidFines.length} paid`,
                accent: false,
              },
              {
                icon: X,
                label: "Waived",
                value: `${waivedFines.length}`,
                sub: "fine records waived",
                accent: false,
              },
              {
                icon: TrendingUp,
                label: "Total Records",
                value: `${totalFines}`,
                sub: "all time",
                accent: false,
              },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Info banner */}
        <Reveal>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-semibold">Fine Policy: </span>
              Fines are calculated at Rs. {FINE_RATE} per day for each day a book is overdue beyond the{" "}
              {LOAN_PERIOD_DAYS}-day loan period. Fines can be marked as paid upon cash collection at the
              counter, or waived by an administrator with appropriate justification.
            </div>
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)]" />
              <input
                type="text"
                placeholder="Search by member name, book title, or member ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--brand-border)] text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)]"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="pl-9 pr-8 py-2.5 rounded-xl border border-[var(--brand-border)] text-sm text-[var(--brand-navy)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] appearance-none cursor-pointer"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--brand-muted)] pointer-events-none" />
            </div>
          </div>
        </Reveal>

        {/* Table */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--brand-border)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--brand-navy)]">
                Fine Records
                <span className="ml-2 text-xs font-normal text-[var(--brand-muted)]">
                  ({filtered.length} result{filtered.length !== 1 ? "s" : ""})
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3 text-[var(--brand-muted)]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-2 border-[var(--brand-navy)]/20 border-t-[var(--brand-navy)] rounded-full"
                />
                <p className="text-sm">Loading fine records...</p>
              </div>
            ) : error ? (
              <div className="py-20 flex flex-col items-center gap-3 text-red-600">
                <AlertCircle className="w-10 h-10 opacity-50" />
                <p className="text-sm font-medium">{error}</p>
                <button
                  onClick={fetchFines}
                  className="text-xs underline text-[var(--brand-navy)] hover:text-[var(--brand-gold)] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3 text-[var(--brand-muted)]">
                <CheckCircle className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">No fine records found</p>
                <p className="text-xs">
                  {search || statusFilter !== "All"
                    ? "Try adjusting your search or filter."
                    : "All members are in good standing."}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--brand-cream)] text-[var(--brand-muted)] text-xs uppercase tracking-wider">
                        {["Member", "Book", "Overdue Days", "Amount", "Status", "Date", "Actions"].map(
                          (h) => (
                            <th key={h} className="px-5 py-3 text-left font-semibold">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-border)]">
                      {filtered.map((fine) => (
                        <motion.tr
                          key={fine.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ backgroundColor: "rgba(245,240,232,0.5)" }}
                          className="transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[var(--brand-navy)]">{fine.borrower_name}</p>
                            <p className="text-xs text-[var(--brand-muted)]">{fine.member_id}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[var(--brand-navy)] max-w-[180px] truncate">
                              {fine.book_title}
                            </p>
                            <p className="text-xs text-[var(--brand-muted)] truncate max-w-[180px]">
                              {fine.book_author}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                              <Clock className="w-3.5 h-3.5" />
                              {fine.overdue_days}d
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-bold text-[var(--brand-navy)]">
                            Rs. {fine.total_amount.toFixed(0)}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge fine={fine} />
                          </td>
                          <td className="px-5 py-3.5 text-[var(--brand-muted)] text-xs">
                            {formatDate(fine.created_at)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedFine(fine)}
                                className="p-1.5 rounded-lg hover:bg-[var(--brand-cream)] text-[var(--brand-navy)] transition-colors"
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {!fine.is_paid && !fine.is_waived && (
                                <>
                                  <button
                                    onClick={() => handleMarkPaid(fine.id)}
                                    className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium hover:bg-green-200 transition-colors"
                                  >
                                    Paid
                                  </button>
                                  <button
                                    onClick={() => handleWaive(fine.id)}
                                    className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium hover:bg-purple-200 transition-colors"
                                  >
                                    Waive
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[var(--brand-border)]">
                  {filtered.map((fine) => (
                    <div key={fine.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-[var(--brand-navy)] text-sm">{fine.borrower_name}</p>
                          <p className="text-xs text-[var(--brand-muted)]">{fine.member_id}</p>
                        </div>
                        <StatusBadge fine={fine} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--brand-muted)]">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="truncate">{fine.book_title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <Clock className="w-3 h-3" /> {fine.overdue_days}d overdue
                          </span>
                          <span className="font-bold text-[var(--brand-navy)]">
                            Rs. {fine.total_amount.toFixed(0)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedFine(fine)}
                            className="p-1.5 rounded-lg bg-[var(--brand-cream)] text-[var(--brand-navy)]"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!fine.is_paid && !fine.is_waived && (
                            <button
                              onClick={() => handleMarkPaid(fine.id)}
                              className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-medium"
                            >
                              Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Reveal>

        {/* Summary breakdown */}
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Users,
                label: "Members with Unpaid Fines",
                value: `${new Set(unpaidFines.map((f) => f.user_id)).size}`,
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-100",
              },
              {
                icon: Calendar,
                label: "Avg. Overdue Days",
                value:
                  fines.length > 0
                    ? `${(fines.reduce((s, f) => s + f.overdue_days, 0) / fines.length).toFixed(1)}d`
                    : "0d",
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100",
              },
              {
                icon: DollarSign,
                label: "Collection Rate",
                value:
                  totalFines > 0
                    ? `${Math.round((paidFines.length / totalFines) * 100)}%`
                    : "0%",
                color: "text-green-600",
                bg: "bg-green-50",
                border: "border-green-100",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-2xl border p-5 flex items-center gap-4",
                  item.bg,
                  item.border
                )}
              >
                <div className={cn("w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm")}>
                  <item.icon className={cn("w-5 h-5", item.color)} />
                </div>
                <div>
                  <p className="text-xs text-[var(--brand-muted)] font-medium">{item.label}</p>
                  <p className={cn("text-2xl font-bold mt-0.5", item.color)}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Detail Modal */}
      {selectedFine && (
        <FineDetailModal
          fine={selectedFine}
          onClose={() => setSelectedFine(null)}
          onMarkPaid={handleMarkPaid}
          onWaive={handleWaive}
        />
      )}
    </div>
  );
}