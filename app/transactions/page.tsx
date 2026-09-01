"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
type FINE_RATE = any;
const FINE_RATE: any = [];
type LOAN_PERIOD_DAYS = any;
const LOAN_PERIOD_DAYS: any = [];
type formatDate = any;
const formatDate: any = [];
type calcFine = any;
const calcFine: any = [];
type getTransactionStatusLabel = any;
const getTransactionStatusLabel: any = [];
import { BookOpen, ArrowLeftRight, CheckCircle, AlertCircle, Clock, X, Search, RefreshCw, ChevronDown, Calendar, User, Hash } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BookRow {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  available_copies: number;
  total_copies: number;
  shelf_location: string | null;
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
  total_amount: number;
  is_paid: boolean;
  is_waived: boolean;
}

interface EnrichedTransaction extends TransactionRow {
  book_title: string;
  book_author: string;
  fine?: FineRow | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysOverdue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

function computeStatus(tx: TransactionRow): "issued" | "overdue" | "returned" {
  if (tx.return_date) return "returned";
  const overdue = getDaysOverdue(tx.due_date);
  return overdue > 0 ? "overdue" : "issued";
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const s = status as "issued" | "overdue" | "returned";
  const map = {
    issued: {
      label: "Issued",
      cls: "bg-blue-100 text-blue-800 border-blue-200",
      icon: <Clock className="w-3 h-3" />,
    },
    overdue: {
      label: "Overdue",
      cls: "bg-red-100 text-red-800 border-red-200",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    returned: {
      label: "Returned",
      cls: "bg-green-100 text-green-800 border-green-200",
      icon: <CheckCircle className="w-3 h-3" />,
    },
  };
  const cfg = map[s] ?? map.issued;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// Confirm Dialog
function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-[var(--brand-border)]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <h3 className="text-lg font-semibold text-[var(--brand-navy)]">{title}</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">{message}</p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[var(--brand-navy)] text-white text-sm font-medium hover:bg-[var(--brand-navy)]/90 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Return
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Issue Book Modal
function IssueModal({
  open,
  onClose,
  onIssued,
  currentUserId,
  currentUserName,
}: {
  open: boolean;
  onClose: () => void;
  onIssued: () => void;
  currentUserId: string;
  currentUserName: string;
}) {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [issueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate] = useState(addDays(new Date(), LOAN_PERIOD_DAYS));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [booksLoading, setBooksLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBooksLoading(true);
    const supabase = createClient();
    supabase
      .from("books")
      .select("id,title,author,isbn,category,available_copies,total_copies,shelf_location")
      .gt("available_copies", 0)
      .order("title")
      .then(({ data }) => {
        setBooks((data as BookRow[]) ?? []);
        setBooksLoading(false);
      });
  }, [open]);

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      (b.isbn ?? "").includes(bookSearch)
  );

  async function handleIssue() {
    if (!selectedBook) {
      setError("Please select a book.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: txErr } = await supabase.from("transactions").insert({
      book_id: selectedBook.id,
      user_id: currentUserId,
      issued_by: currentUserId,
      issue_date: new Date(issueDate).toISOString(),
      due_date: new Date(dueDate).toISOString(),
      status: "issued",
      notes: notes || null,
    });
    if (txErr) {
      setError(txErr.message);
      setLoading(false);
      return;
    }
    // Decrement available_copies
    await supabase
      .from("books")
      .update({ available_copies: selectedBook.available_copies - 1 })
      .eq("id", selectedBook.id);
    setLoading(false);
    setSelectedBook(null);
    setBookSearch("");
    setNotes("");
    onIssued();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[var(--brand-border)]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--brand-gold)]" />
                <h2 className="text-lg font-semibold text-[var(--brand-navy)]">Issue a Book</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Member */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Member
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 font-medium">{currentUserName}</span>
                  <span className="ml-auto text-xs text-gray-400 font-mono">
                    {currentUserId.slice(0, 8)}…
                  </span>
                </div>
              </div>

              {/* Book Selector */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Select Book
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={selectedBook ? selectedBook.title : bookSearch}
                    onChange={(e) => {
                      setBookSearch(e.target.value);
                      setSelectedBook(null);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search by title, author, or ISBN…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)]"
                  />
                  {selectedBook && (
                    <button
                      onClick={() => { setSelectedBook(null); setBookSearch(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {showDropdown && !selectedBook && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {booksLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading books…
                      </div>
                    ) : filteredBooks.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">No available books found.</div>
                    ) : (
                      filteredBooks.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setSelectedBook(b);
                            setBookSearch(b.title);
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[var(--brand-cream)] transition-colors border-b border-gray-50 last:border-0"
                        >
                          <div className="text-sm font-medium text-gray-800">{b.title}</div>
                          <div className="text-xs text-gray-500">
                            {b.author}
                            {b.isbn ? ` · ISBN: ${b.isbn}` : ""}
                            {b.shelf_location ? ` · Shelf: ${b.shelf_location}` : ""}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Issue Date
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{issueDate}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    Due Date
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--brand-cream)] border border-[var(--brand-gold)]/30">
                    <Calendar className="w-4 h-4 text-[var(--brand-gold)]" />
                    <span className="text-sm text-[var(--brand-navy)] font-medium">{dueDate}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any remarks about the issue…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleIssue}
                disabled={loading || !selectedBook}
                className="px-5 py-2 rounded-lg bg-[var(--brand-navy)] text-white text-sm font-semibold hover:bg-[var(--brand-navy)]/90 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Issue Book
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState<EnrichedTransaction | null>(null);
  const [returning, setReturning] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "issued" | "overdue">("all");

  // Fetch current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            setCurrentUser({
              id: data.user!.id,
              name: (profile as { full_name: string } | null)?.full_name ?? data.user!.email ?? "Member",
            });
          });
      }
    });
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!txData) {
      setLoading(false);
      return;
    }

    // Fetch books for enrichment
    const bookIds = [...new Set((txData as TransactionRow[]).map((t) => t.book_id))];
    const { data: booksData } = await supabase
      .from("books")
      .select("id,title,author")
      .in("id", bookIds);

    const bookMap: Record<string, { title: string; author: string }> = {};
    ((booksData as { id: string; title: string; author: string }[]) ?? []).forEach((b) => {
      bookMap[b.id] = { title: b.title, author: b.author };
    });

    // Fetch fines
    const txIds = (txData as TransactionRow[]).map((t) => t.id);
    const { data: finesData } = await supabase
      .from("fines")
      .select("id,transaction_id,total_amount,is_paid,is_waived")
      .in("transaction_id", txIds);

    const fineMap: Record<string, FineRow> = {};
    ((finesData as FineRow[]) ?? []).forEach((f) => {
      fineMap[f.transaction_id] = f;
    });

    const enriched: EnrichedTransaction[] = (txData as TransactionRow[]).map((tx) => ({
      ...tx,
      book_title: bookMap[tx.book_id]?.title ?? "Unknown Book",
      book_author: bookMap[tx.book_id]?.author ?? "",
      fine: fineMap[tx.id] ?? null,
    }));

    setTransactions(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => { fetchTransactions(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTransactions]);

  async function handleReturn(tx: EnrichedTransaction) {
    setReturning(true);
    const returnDate = new Date().toISOString();
    await supabase
      .from("transactions")
      .update({ status: "returned", return_date: returnDate, updated_at: returnDate })
      .eq("id", tx.id);

    // Increment available_copies
    const { data: bookData } = await supabase
      .from("books")
      .select("available_copies")
      .eq("id", tx.book_id)
      .single();
    if (bookData) {
      await supabase
        .from("books")
        .update({ available_copies: (bookData as { available_copies: number }).available_copies + 1 })
        .eq("id", tx.book_id);
    }

    // Create fine if overdue
    const overdueDays = getDaysOverdue(tx.due_date);
    if (overdueDays > 0 && currentUser) {
      const totalAmount = overdueDays * FINE_RATE;
      await supabase.from("fines").insert({
        transaction_id: tx.id,
        user_id: tx.user_id,
        overdue_days: overdueDays,
        amount_per_day: FINE_RATE,
        total_amount: totalAmount,
        is_paid: false,
        is_waived: false,
      });
    }

    setReturning(false);
    setConfirmReturn(null);
    fetchTransactions();
  }

  // Derived lists
  const activeTransactions = transactions.filter(
    (tx) => !tx.return_date
  );
  const historyTransactions = transactions.filter((tx) => tx.return_date);

  const filteredActive = activeTransactions.filter((tx) => {
    const status = computeStatus(tx);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    const matchesSearch =
      tx.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.book_author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredHistory = historyTransactions.filter((tx) =>
    tx.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.book_author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const overdueCount = activeTransactions.filter((tx) => getDaysOverdue(tx.due_date) > 0).length;
  const totalFinesUnpaid = transactions
    .filter((tx) => tx.fine && !tx.fine.is_paid && !tx.fine.is_waived)
    .reduce((sum, tx) => sum + (tx.fine?.total_amount ?? 0), 0);

  return (
    <main className="min-h-screen bg-[var(--brand-cream)] pb-16">
      {/* CSS Variables */}
      <style>{`
        :root {
          --brand-navy: #1e3a5f;
          --brand-gold: #c8a96e;
          --brand-cream: #f5f0e8;
          --brand-border: #e8e0d0;
        }
      `}</style>

      {/* Page Header */}
      <Reveal>
        <div className="bg-[var(--brand-navy)] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ArrowLeftRight className="w-5 h-5 text-[var(--brand-gold)]" />
                  <span className="text-[var(--brand-gold)] text-sm font-medium uppercase tracking-widest">
                    Issue &amp; Return
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                <p className="mt-1 text-white/60 text-sm">
                  Manage book issues, returns, and track your borrowing history.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIssueModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand-gold)] text-[var(--brand-navy)] font-semibold text-sm shadow-lg hover:bg-[var(--brand-gold)]/90 transition-colors self-start sm:self-auto"
              >
                <BookOpen className="w-4 h-4" />
                Issue a Book
              </motion.button>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        {/* Stats Row */}
        <Reveal>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total Issued",
                value: activeTransactions.length,
                icon: <BookOpen className="w-5 h-5" />,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Overdue",
                value: overdueCount,
                icon: <AlertCircle className="w-5 h-5" />,
                color: "text-red-600",
                bg: "bg-red-50",
              },
              {
                label: "Returned",
                value: historyTransactions.length,
                icon: <CheckCircle className="w-5 h-5" />,
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                label: "Unpaid Fines",
                value: `Rs. ${totalFinesUnpaid.toFixed(0)}`,
                icon: <Hash className="w-5 h-5" />,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4, ease: "easeOut" }}
                className="bg-white rounded-2xl border border-[var(--brand-border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
              >
                <div className={`inline-flex p-2 rounded-xl ${stat.bg} ${stat.color} mb-3`}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-[var(--brand-navy)]">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </Reveal>

        {/* Search + Filter Bar */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by book title or author…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)]"
              />
            </div>
            {activeTab === "active" && (
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | "issued" | "overdue")}
                  className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] bg-white text-gray-700"
                >
                  <option value="all">All Status</option>
                  <option value="issued">Issued</option>
                  <option value="overdue">Overdue</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            <button
              onClick={fetchTransactions}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal>
          <div className="flex gap-1 bg-white border border-[var(--brand-border)] rounded-2xl p-1 w-fit shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            {(["active", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[var(--brand-navy)] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab === "active" ? (
                  <span className="flex items-center gap-2">
                    Active Loans
                    {activeTransactions.length > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          activeTab === "active"
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {activeTransactions.length}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Return History
                    {historyTransactions.length > 0 && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          activeTab === "history"
                            ? "bg-white/20 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {historyTransactions.length}
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Active Transactions Table */}
        <AnimatePresence mode="wait">
          {activeTab === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Reveal>
                <div className="bg-white rounded-2xl border border-[var(--brand-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[var(--brand-navy)]">
                      Currently Issued Books
                    </h2>
                    <span className="text-xs text-gray-400">
                      {filteredActive.length} record{filteredActive.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading transactions…</span>
                    </div>
                  ) : filteredActive.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BookOpen className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-sm font-medium text-gray-400">No active loans found.</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Issue a book to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Book
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Issue Date
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Due Date
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Status
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Fine (est.)
                            </th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredActive.map((tx, i) => {
                            const status = computeStatus(tx);
                            const overdueDays = getDaysOverdue(tx.due_date);
                            const estimatedFine = overdueDays * FINE_RATE;
                            return (
                              <motion.tr
                                key={tx.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                className="hover:bg-gray-50/60 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900 leading-snug">
                                    {tx.book_title}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">{tx.book_author}</div>
                                </td>
                                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                                  {formatDate(tx.issue_date)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span
                                    className={
                                      status === "overdue"
                                        ? "text-red-600 font-medium"
                                        : "text-gray-600"
                                    }
                                  >
                                    {formatDate(tx.due_date)}
                                  </span>
                                  {status === "overdue" && (
                                    <div className="text-xs text-red-400 mt-0.5">
                                      {overdueDays}d overdue
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <StatusBadge status={status} />
                                </td>
                                <td className="px-4 py-4">
                                  {estimatedFine > 0 ? (
                                    <span className="text-red-600 font-semibold">
                                      Rs. {estimatedFine}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300 text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setConfirmReturn(tx)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand-navy)] text-white text-xs font-medium hover:bg-[var(--brand-navy)]/90 transition-colors"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Return
                                  </motion.button>
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Reveal>
            </motion.div>
          )}

          {/* History Table */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <Reveal>
                <div className="bg-white rounded-2xl border border-[var(--brand-border)] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-[var(--brand-navy)]">
                      Return History
                    </h2>
                    <span className="text-xs text-gray-400">
                      {filteredHistory.length} record{filteredHistory.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading history…</span>
                    </div>
                  ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Clock className="w-10 h-10 text-gray-200 mb-3" />
                      <p className="text-sm font-medium text-gray-400">No return history yet.</p>
                      <p className="text-xs text-gray-300 mt-1">
                        Returned books will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Book
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Issue Date
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Return Date
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Days Held
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Fine Incurred
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredHistory.map((tx, i) => {
                            const issueD = new Date(tx.issue_date);
                            const returnD = tx.return_date ? new Date(tx.return_date) : new Date();
                            const daysHeld = Math.max(
                              1,
                              Math.ceil(
                                (returnD.getTime() - issueD.getTime()) / (1000 * 60 * 60 * 24)
                              )
                            );
                            const fine = tx.fine;
                            return (
                              <motion.tr
                                key={tx.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04, duration: 0.3 }}
                                className="hover:bg-gray-50/60 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900 leading-snug">
                                    {tx.book_title}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">{tx.book_author}</div>
                                </td>
                                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                                  {formatDate(tx.issue_date)}
                                </td>
                                <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                                  {tx.return_date ? formatDate(tx.return_date) : "—"}
                                </td>
                                <td className="px-4 py-4 text-gray-600">
                                  {daysHeld}d
                                </td>
                                <td className="px-4 py-4">
                                  {fine ? (
                                    <div>
                                      <span
                                        className={
                                          fine.is_waived
                                            ? "text-gray-400 line-through text-xs"
                                            : fine.is_paid
                                            ? "text-green-600 font-medium"
                                            : "text-red-600 font-semibold"
                                        }
                                      >
                                        Rs. {fine.total_amount}
                                      </span>
                                      {fine.is_waived && (
                                        <span className="ml-1.5 text-xs text-gray-400">Waived</span>
                                      )}
                                      {fine.is_paid && !fine.is_waived && (
                                        <span className="ml-1.5 text-xs text-green-500">Paid</span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300 text-xs">No fine</span>
                                  )}
                                </td>
                                <td className="px-4 py-4">
                                  <StatusBadge status="returned" />
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Reveal>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <Reveal>
          <div className="bg-[var(--brand-navy)]/5 border border-[var(--brand-navy)]/10 rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--brand-navy)]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">Library Policy</span>
            </div>
            <p className="text-sm text-gray-600 sm:ml-2">
              Loan period is {LOAN_PERIOD_DAYS} days. Overdue fines are charged at Rs. {FINE_RATE} per day.
              Maximum {5} books may be issued per member at any time.
            </p>
          </div>
        </Reveal>
      </div>

      {/* Modals */}
      {currentUser && (
        <IssueModal
          open={issueModalOpen}
          onClose={() => setIssueModalOpen(false)}
          onIssued={fetchTransactions}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
        />
      )}

      <ConfirmDialog
        open={!!confirmReturn}
        title="Confirm Book Return"
        message={
          confirmReturn
            ? `Return "${confirmReturn.book_title}"? ${
                getDaysOverdue(confirmReturn.due_date) > 0
                  ? `This book is ${getDaysOverdue(confirmReturn.due_date)} day(s) overdue. A fine of Rs. ${
                      getDaysOverdue(confirmReturn.due_date) * FINE_RATE
                    } will be recorded.`
                  : "No fine will be applied."
              }`
            : ""
        }
        onConfirm={() => confirmReturn && handleReturn(confirmReturn)}
        onCancel={() => setConfirmReturn(null)}
        loading={returning}
      />
    </main>
  );
}