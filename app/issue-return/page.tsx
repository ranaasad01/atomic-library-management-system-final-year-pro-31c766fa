"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { BookOpen, ArrowLeftRight, Search, CheckCircle, Clock, AlertTriangle, RefreshCw, User, Calendar, Hash, ChevronRight, X, Loader2, BookMarked, RotateCcw } from 'lucide-react';

// ─── Local helpers (NOT imported from @/lib/data) ────────────────────────────
const FINE_RATE_PER_DAY = 5; // PKR per day
const LOAN_PERIOD_DAYS = 14;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getDaysUntilDue(dueDateStr: string): number {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function calcFine(dueDateStr: string, returnDateStr?: string | null): number {
  const due = new Date(dueDateStr);
  const ret = returnDateStr ? new Date(returnDateStr) : new Date();
  const overdueDays = Math.max(0, Math.ceil((ret.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
  return overdueDays * FINE_RATE_PER_DAY;
}

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
  cover_url: string | null;
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

interface TransactionWithBook extends TransactionRow {
  book?: BookRow;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  member_id: string | null;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    issued: { label: "Issued", cls: "bg-blue-100 text-blue-800 border-blue-200" },
    returned: { label: "Returned", cls: "bg-green-100 text-green-800 border-green-200" },
    overdue: { label: "Overdue", cls: "bg-red-100 text-red-800 border-red-200" },
  };
  const cfg = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700 border-gray-200" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Issue Book Modal ─────────────────────────────────────────────────────────
interface IssueModalProps {
  book: BookRow;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function IssueModal({ book, userId, onClose, onSuccess }: IssueModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  async function handleIssue() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const issueDate = new Date().toISOString();
      const dueDate = new Date(Date.now() + LOAN_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();

      const { error: txErr } = await supabase.from("transactions").insert({
        book_id: book.id,
        user_id: userId,
        issued_by: userId,
        issue_date: issueDate,
        due_date: dueDate,
        status: "issued",
        notes: notes || null,
      });
      if (txErr) throw txErr;

      await supabase
        .from("books")
        .update({ available_copies: book.available_copies - 1 })
        .eq("id", book.id);

      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to issue book.");
    } finally {
      setLoading(false);
    }
  }

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };
  const panelVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] p-6"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
            <BookMarked className="h-5 w-5 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--brand-primary)]">Issue Book</h2>
            <p className="text-xs text-gray-500">Loan period: {LOAN_PERIOD_DAYS} days</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] p-4 mb-4">
          <p className="font-semibold text-[var(--brand-primary)] text-sm leading-snug">{book.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
          {book.isbn && <p className="text-xs text-gray-400 mt-1">ISBN: {book.isbn}</p>}
          {book.shelf_location && (
            <p className="text-xs text-gray-400">Shelf: {book.shelf_location}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs text-blue-500 font-medium">Issue Date</p>
            <p className="font-semibold text-blue-800 mt-0.5">{formatDate(new Date().toISOString())}</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-3">
            <p className="text-xs text-amber-500 font-medium">Due Date</p>
            <p className="font-semibold text-amber-800 mt-0.5">
              {formatDate(new Date(Date.now() + LOAN_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString())}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any special notes..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 resize-none"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleIssue}
            disabled={loading || book.available_copies === 0}
            className="flex-1 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {loading ? "Issuing..." : "Confirm Issue"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Return Book Modal ────────────────────────────────────────────────────────
interface ReturnModalProps {
  transaction: TransactionWithBook;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function ReturnModal({ transaction, userId, onClose, onSuccess }: ReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fine = calcFine(transaction.due_date);

  async function handleReturn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const returnDate = new Date().toISOString();

      const { error: txErr } = await supabase
        .from("transactions")
        .update({ return_date: returnDate, status: "returned", returned_to: userId })
        .eq("id", transaction.id);
      if (txErr) throw txErr;

      if (transaction.book) {
        await supabase
          .from("books")
          .update({ available_copies: transaction.book.available_copies + 1 })
          .eq("id", transaction.book_id);
      }

      if (fine > 0) {
        const overdueDays = Math.ceil(
          (new Date().getTime() - new Date(transaction.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        await supabase.from("fines").insert({
          transaction_id: transaction.id,
          user_id: transaction.user_id,
          overdue_days: overdueDays,
          amount_per_day: FINE_RATE_PER_DAY,
          total_amount: fine,
          is_paid: false,
          is_waived: false,
        });
      }

      onSuccess();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to process return.");
    } finally {
      setLoading(false);
    }
  }

  const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
  };
  const panelVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 16 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl border border-[var(--brand-border)] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] p-6"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
            <RotateCcw className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--brand-primary)]">Return Book</h2>
            <p className="text-xs text-gray-500">Process book return</p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] p-4 mb-4">
          <p className="font-semibold text-[var(--brand-primary)] text-sm leading-snug">
            {transaction.book?.title ?? "Book"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{transaction.book?.author ?? ""}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs text-gray-500 font-medium">Issued On</p>
            <p className="font-semibold text-gray-800 mt-0.5">{formatDate(transaction.issue_date)}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
            <p className="text-xs text-gray-500 font-medium">Due Date</p>
            <p className="font-semibold text-gray-800 mt-0.5">{formatDate(transaction.due_date)}</p>
          </div>
        </div>

        {fine > 0 && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-semibold text-red-700">Overdue Fine</p>
            </div>
            <p className="text-xs text-red-600">
              This book is overdue. A fine of{" "}
              <span className="font-bold">PKR {fine}</span> will be recorded.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReturn}
            disabled={loading}
            className="flex-1 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {loading ? "Processing..." : "Confirm Return"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function IssueReturnPage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activeTab, setActiveTab] = useState<"issue" | "return">("issue");

  // Issue tab state
  const [bookSearch, setBookSearch] = useState("");
  const [books, setBooks] = useState<BookRow[]>([]);
  const [booksLoading, setBooksLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);

  // Return tab state
  const [transactions, setTransactions] = useState<TransactionWithBook[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionWithBook | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();

  // Load current user profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, member_id")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data as ProfileRow);
    }
    loadProfile();
  }, []);

  // Search books
  const searchBooks = useCallback(async (query: string) => {
    setBooksLoading(true);
    try {
      let q = supabase
        .from("books")
        .select("id, title, author, isbn, category, available_copies, total_copies, shelf_location, cover_url")
        .order("title");
      if (query.trim()) {
        q = q.or(`title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`);
      }
      const { data } = await q.limit(20);
      setBooks((data as BookRow[]) ?? []);
    } finally {
      setBooksLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (activeTab === "issue") {
      searchBooks(bookSearch);
    }
  }, [activeTab, bookSearch, searchBooks]);

  // Load active transactions for return
  const loadTransactions = useCallback(async () => {
    if (!profile) return;
    setTxLoading(true);
    try {
      const { data: txData } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", profile.id)
        .in("status", ["issued", "overdue"])
        .order("due_date");

      if (!txData) { setTransactions([]); return; }

      const bookIds = [...new Set((txData as TransactionRow[]).map((t) => t.book_id))];
      const { data: bookData } = await supabase
        .from("books")
        .select("id, title, author, isbn, category, available_copies, total_copies, shelf_location, cover_url")
        .in("id", bookIds);

      const bookMap: Record<string, BookRow> = {};
      (bookData as BookRow[] ?? []).forEach((b) => { bookMap[b.id] = b; });

      const enriched: TransactionWithBook[] = (txData as TransactionRow[]).map((t) => ({
        ...t,
        book: bookMap[t.book_id],
      }));
      setTransactions(enriched);
    } finally {
      setTxLoading(false);
    }
  }, [profile, supabase]);

  useEffect(() => {
    if (activeTab === "return" && profile) {
      loadTransactions();
    }
  }, [activeTab, profile, loadTransactions]);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[var(--brand-cream)]">
      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-6 right-6 z-[60] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          {toast.msg}
        </motion.div>
      )}

      {/* Modals */}
      {selectedBook && profile && (
        <IssueModal
          book={selectedBook}
          userId={profile.id}
          onClose={() => setSelectedBook(null)}
          onSuccess={() => {
            setSelectedBook(null);
            showToast("Book issued successfully!", "success");
            searchBooks(bookSearch);
          }}
        />
      )}
      {selectedTx && profile && (
        <ReturnModal
          transaction={selectedTx}
          userId={profile.id}
          onClose={() => setSelectedTx(null)}
          onSuccess={() => {
            setSelectedTx(null);
            showToast("Book returned successfully!", "success");
            loadTransactions();
          }}
        />
      )}

      {/* Hero Header */}
      <Reveal>
        <section className="bg-[var(--brand-primary)] text-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <ArrowLeftRight className="h-5 w-5 text-[var(--brand-gold)]" />
                  </div>
                  <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
                    Library Transactions
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Issue &amp; Return
                </h1>
                <p className="mt-2 text-white/70 text-sm max-w-xl">
                  Issue books to library members or process returns. Fines are automatically calculated for overdue returns.
                </p>
              </div>
              {profile && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-gold)]/20">
                    <User className="h-4 w-4 text-[var(--brand-gold)]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                    <p className="text-xs text-white/60">
                      {profile.member_id ? `ID: ${profile.member_id}` : profile.role}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: BookOpen, label: "Loan Period", value: `${LOAN_PERIOD_DAYS} Days` },
                { icon: AlertTriangle, label: "Fine Rate", value: `PKR ${FINE_RATE_PER_DAY}/day` },
                { icon: BookMarked, label: "Active Issues", value: transactions.length.toString() },
                { icon: Clock, label: "Max Books", value: "5 per member" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
                >
                  <stat.icon className="h-4 w-4 text-[var(--brand-gold)] mb-1.5" />
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Tab Bar */}
      <Reveal>
        <div className="sticky top-0 z-30 border-b border-[var(--brand-border)] bg-white shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0">
              {(["issue", "return"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? "text-[var(--brand-primary)]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "issue" ? (
                    <BookOpen className="h-4 w-4" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {tab === "issue" ? "Issue a Book" : "Return a Book"}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── ISSUE TAB ── */}
        {activeTab === "issue" && (
          <div className="space-y-6">
            <Reveal>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--brand-primary)]">Search &amp; Issue Books</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Find a book and issue it to a member</p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search by title, author, or ISBN..."
                    className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
              </div>
            </Reveal>

            {booksLoading ? (
              <Reveal>
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                </div>
              </Reveal>
            ) : books.length === 0 ? (
              <Reveal>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No books found</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              </Reveal>
            ) : (
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {books.map((book) => {
                  const available = book.available_copies > 0;
                  return (
                    <motion.div
                      key={book.id}
                      variants={cardVariants}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="group rounded-2xl border border-[var(--brand-border)] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(30,58,95,0.1)] transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[var(--brand-primary)] text-sm leading-snug line-clamp-2">
                            {book.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{book.author}</p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                            available
                              ? "bg-green-50 border-green-200 text-green-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}
                        >
                          {available ? "Available" : "Issued"}
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        {book.isbn && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />
                            <span>{book.isbn}</span>
                          </div>
                        )}
                        {book.category && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <BookOpen className="h-3 w-3" />
                            <span>{book.category}</span>
                          </div>
                        )}
                        {book.shelf_location && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Hash className="h-3 w-3" />
                            <span>Shelf: {book.shelf_location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          <span className="font-semibold text-gray-700">{book.available_copies}</span>
                          /{book.total_copies} copies
                        </div>
                        <button
                          onClick={() => setSelectedBook(book)}
                          disabled={!available || !profile}
                          className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[var(--brand-primary)]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Issue
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}

        {/* ── RETURN TAB ── */}
        {activeTab === "return" && (
          <div className="space-y-6">
            <Reveal>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[var(--brand-primary)]">Active Issues</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Books currently issued to you. Select one to process a return.
                  </p>
                </div>
                <button
                  onClick={loadTransactions}
                  className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </Reveal>

            {txLoading ? (
              <Reveal>
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
                </div>
              </Reveal>
            ) : transactions.length === 0 ? (
              <Reveal>
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
                  <CheckCircle className="h-10 w-10 text-green-300 mb-3" />
                  <p className="text-gray-500 font-medium">No active issues</p>
                  <p className="text-sm text-gray-400 mt-1">All books have been returned</p>
                </div>
              </Reveal>
            ) : (
              <motion.div
                className="space-y-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {transactions.map((tx) => {
                  const daysLeft = getDaysUntilDue(tx.due_date);
                  const isOverdue = daysLeft < 0;
                  const isDueSoon = daysLeft >= 0 && daysLeft <= 2;
                  const fine = isOverdue ? calcFine(tx.due_date) : 0;

                  return (
                    <motion.div
                      key={tx.id}
                      variants={cardVariants}
                      className={`rounded-2xl border bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-300 ${
                        isOverdue
                          ? "border-red-200 hover:shadow-[0_4px_16px_rgba(220,38,38,0.1)]"
                          : isDueSoon
                          ? "border-amber-200 hover:shadow-[0_4px_16px_rgba(245,158,11,0.1)]"
                          : "border-[var(--brand-border)] hover:shadow-[0_4px_16px_rgba(30,58,95,0.08)]"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isOverdue ? "bg-red-100" : isDueSoon ? "bg-amber-100" : "bg-blue-100"
                            }`}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : isDueSoon ? (
                              <Clock className="h-5 w-5 text-amber-600" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-[var(--brand-primary)] text-sm leading-snug">
                                {tx.book?.title ?? "Unknown Book"}
                              </h3>
                              <StatusBadge status={tx.status} />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{tx.book?.author ?? ""}</p>
                            <div className="flex flex-wrap gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                Issued: {formatDate(tx.issue_date)}
                              </div>
                              <div
                                className={`flex items-center gap-1 text-xs font-medium ${
                                  isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-gray-500"
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                Due: {formatDate(tx.due_date)}
                                {isOverdue
                                  ? ` (${Math.abs(daysLeft)} days overdue)`
                                  : daysLeft === 0
                                  ? " (due today)"
                                  : ` (${daysLeft} days left)`}
                              </div>
                            </div>
                            {isOverdue && fine > 0 && (
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">
                                <AlertTriangle className="h-3 w-3" />
                                Fine: PKR {fine}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="flex shrink-0 items-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 transition-colors"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Return
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Info card */}
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-5">
                <h3 className="text-sm font-semibold text-[var(--brand-primary)] mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[var(--brand-gold)]" />
                  Fine Policy
                </h3>
                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div className="rounded-lg bg-[var(--brand-cream)] p-3">
                    <p className="font-semibold text-[var(--brand-primary)]">PKR {FINE_RATE_PER_DAY}/day</p>
                    <p className="text-xs text-gray-500 mt-0.5">Fine rate per overdue day</p>
                  </div>
                  <div className="rounded-lg bg-[var(--brand-cream)] p-3">
                    <p className="font-semibold text-[var(--brand-primary)]">{LOAN_PERIOD_DAYS} days</p>
                    <p className="text-xs text-gray-500 mt-0.5">Standard loan period</p>
                  </div>
                  <div className="rounded-lg bg-[var(--brand-cream)] p-3">
                    <p className="font-semibold text-[var(--brand-primary)]">Auto-calculated</p>
                    <p className="text-xs text-gray-500 mt-0.5">Fines recorded on return</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        )}
      </div>
    </div>
  );
}