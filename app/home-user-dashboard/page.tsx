"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, AlertCircle, CheckCircle, TrendingUp, Calendar, ArrowRight, BookMarked, DollarSign, RefreshCw, User, Bell } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
type APP_NAME = any;
const APP_NAME: any = [];
type FINE_RATE = any;
const FINE_RATE: any = [];
type formatDate = any;
const formatDate: any = [];
type getDaysUntilDue = any;
const getDaysUntilDue: any = [];
type getTransactionStatusLabel = any;
const getTransactionStatusLabel: any = [];
type getAvailabilityBadge = any;
const getAvailabilityBadge: any = [];
import type { Transaction, Book, Fine, Profile } from "@/lib/data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const LOAN_PERIOD_DAYS = 14;

// ─── Types ───────────────────────────────────────────────────────────────────────────────

interface TransactionWithBook extends Transaction {
  book?: Book;
}

interface DashboardStats {
  booksIssued: number;
  booksReturned: number;
  overdueBooks: number;
  totalFines: number;
  unpaidFines: number;
}

// ─── Mock activity chart data (not in schema, so inline) ──────────────────────────────────────
const ACTIVITY_DATA = [
  { month: "Aug", issued: 2, returned: 1 },
  { month: "Sep", issued: 3, returned: 2 },
  { month: "Oct", issued: 1, returned: 3 },
  { month: "Nov", issued: 4, returned: 2 },
  { month: "Dec", issued: 2, returned: 4 },
  { month: "Jan", issued: 3, returned: 2 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    issued: "bg-blue-100 text-blue-700 border-blue-200",
    returned: "bg-green-100 text-green-700 border-green-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
    >
      {getTransactionStatusLabel(status as "issued" | "returned" | "overdue")}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)] text-[var(--brand-navy)]"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          accent ? "bg-white/15" : "bg-[var(--brand-cream)]"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${accent ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]"}`}
        />
      </div>
      <div>
        <div
          className={`text-2xl font-bold tracking-tight ${accent ? "text-white" : "text-[var(--brand-navy)]"}`}
        >
          {value}
        </div>
        <div
          className={`text-sm font-medium mt-0.5 ${accent ? "text-white/80" : "text-[var(--brand-muted)]"}`}
        >
          {label}
        </div>
        {sub && (
          <div
            className={`text-xs mt-1 ${accent ? "text-white/60" : "text-[var(--brand-muted)]"}`}
          >
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<TransactionWithBook[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    booksIssued: 0,
    booksReturned: 0,
    overdueBooks: 0,
    totalFines: 0,
    unpaidFines: 0,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) setProfile(profileData as Profile);

        // Fetch transactions with book info
        const { data: txData } = await supabase
          .from("transactions")
          .select("*, books(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const txList: TransactionWithBook[] = (txData ?? []).map((t: Record<string, unknown>) => ({
          ...(t as unknown as Transaction),
          book: t.books as Book | undefined,
        }));
        setTransactions(txList);

        // Fetch fines
        const { data: fineData } = await supabase
          .from("fines")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        const fineList = (fineData ?? []) as Fine[];
        setFines(fineList);

        // Compute stats
        const issued = txList.filter((t) => t.status === "issued").length;
        const returned = txList.filter((t) => t.status === "returned").length;
        const overdue = txList.filter((t) => t.status === "overdue").length;
        const totalFines = fineList.reduce((s, f) => s + Number(f.total_amount), 0);
        const unpaidFines = fineList
          .filter((f) => !f.is_paid && !f.is_waived)
          .reduce((s, f) => s + Number(f.total_amount), 0);

        setStats({ booksIssued: issued, booksReturned: returned, overdueBooks: overdue, totalFines, unpaidFines });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeTransactions = transactions.filter((t) => t.status === "issued" || t.status === "overdue");
  const recentTransactions = transactions.slice(0, 5);
  const unpaidFines = fines.filter((f) => !f.is_paid && !f.is_waived);

  const greeting = mounted
    ? (() => {
        const h = new Date().getHours();
        if (h < 12) return "Good morning";
        if (h < 17) return "Good afternoon";
        return "Good evening";
      })()
    : "Welcome";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-cream)]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[var(--brand-navy)] animate-spin" />
          <p className="text-[var(--brand-muted)] text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--brand-cream)] pb-16">
      {/* ── Hero / Welcome Banner ──────────────────────────────────────────────────── */}
      <Reveal>
        <section className="bg-[var(--brand-navy)] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--brand-gold)]/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-[var(--brand-gold)]" />
                  </div>
                  <span className="text-white/60 text-sm font-medium">{greeting}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {profile?.full_name ?? "Member"}
                </h1>
                <p className="text-white/60 text-sm">
                  Member ID: {profile?.member_id ?? "N/A"} &nbsp;&bull;&nbsp; {APP_NAME}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/books"
                  className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-[var(--brand-navy)] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[var(--brand-gold)]/90 transition"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse Books
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-10">
        {/* ── Stats Grid */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
          >
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={BookMarked}
                label="Books Issued"
                value={stats.booksIssued}
                sub="active loans"
                accent
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={CheckCircle}
                label="Books Returned"
                value={stats.booksReturned}
                sub="all time"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={AlertCircle}
                label="Overdue"
                value={stats.overdueBooks}
                sub="past due date"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={DollarSign}
                label="Total Fines"
                value={`Rs. ${stats.totalFines}`}
                sub="all time"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                icon={Bell}
                label="Unpaid Fines"
                value={`Rs. ${stats.unpaidFines}`}
                sub="outstanding"
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* ── Active Transactions */}
        {activeTransactions.length > 0 && (
          <Reveal>
            <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-[var(--brand-navy)]">Currently Issued Books</h2>
                  <p className="text-sm text-[var(--brand-muted)] mt-0.5">
                    Loan period: {LOAN_PERIOD_DAYS} days. Overdue fines accrue daily.
                  </p>
                </div>
                <Link
                  href="/transactions"
                  className="text-sm font-medium text-[var(--brand-navy)] hover:underline flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {activeTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[var(--brand-cream)] border border-[var(--brand-border)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />
                      </div>
                      <div>
                        <div className="font-semibold text-[var(--brand-navy)] text-sm">
                          {tx.book?.title ?? "Unknown Book"}
                        </div>
                        <div className="text-xs text-[var(--brand-muted)] mt-0.5">
                          {tx.book?.author} &bull; Due: {formatDate(tx.due_date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={tx.status} />
                      <span className="text-xs text-[var(--brand-muted)]">
                        {getDaysUntilDue(tx.due_date)} days left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Unpaid Fines */}
        {unpaidFines.length > 0 && (
          <Reveal>
            <div className="bg-white rounded-2xl border border-red-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-red-700">Pending Fines</h2>
                  <p className="text-sm text-red-500 mt-0.5">Please clear outstanding fines at the library counter.</p>
                </div>
                <Link
                  href="/fines"
                  className="text-sm font-medium text-red-600 hover:underline flex items-center gap-1"
                >
                  View details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-3">
                {unpaidFines.map((fine) => (
                  <div
                    key={fine.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100"
                  >
                    <div className="text-sm text-red-700">
                      {fine.overdue_days} days overdue &bull; Rs. {fine.amount_per_day}/day
                    </div>
                    <div className="font-bold text-red-700">Rs. {fine.total_amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        )}

        {/* ── Activity Chart */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--brand-navy)]">Reading Activity</h2>
                <p className="text-sm text-[var(--brand-muted)] mt-0.5">Books issued vs returned over the last 6 months.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[var(--brand-gold)]" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ACTIVITY_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="issued" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-navy)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--brand-navy)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="returned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-gold)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--brand-gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="issued" stroke="var(--brand-navy)" fill="url(#issued)" strokeWidth={2} />
                <Area type="monotone" dataKey="returned" stroke="var(--brand-gold)" fill="url(#returned)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Reveal>

        {/* ── Recent Transactions */}
        <Reveal>
          <div className="bg-white rounded-2xl border border-[var(--brand-border)] p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-[var(--brand-navy)]">Recent Activity</h2>
                <p className="text-sm text-[var(--brand-muted)] mt-0.5">Your latest library transactions.</p>
              </div>
              <Link
                href="/transactions"
                className="text-sm font-medium text-[var(--brand-navy)] hover:underline flex items-center gap-1"
              >
                View full history <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-[var(--brand-muted)] text-sm">
                No transactions yet. Start by borrowing a book!
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--brand-cream)] border border-[var(--brand-border)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--brand-navy)]/10 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-[var(--brand-navy)]" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--brand-navy)]">
                          {tx.book?.title ?? "Unknown Book"}
                        </div>
                        <div className="text-xs text-[var(--brand-muted)]">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {formatDate(tx.issue_date)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={tx.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        {/* ── CTA */}
        <Reveal>
          <div className="bg-[var(--brand-navy)] rounded-2xl p-8 text-center text-white">
            <BookOpen className="w-10 h-10 text-[var(--brand-gold)] mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ready to Find Your Next Book?</h2>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
              Explore the NCBA&E Central Library catalogue — search by title, author, ISBN, or category.
            </p>
            <Link
              href="/books"
              className="inline-flex items-center gap-2 bg-[var(--brand-gold)] text-[var(--brand-navy)] px-6 py-3 rounded-xl font-semibold hover:bg-[var(--brand-gold)]/90 transition"
            >
              Search the Catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
