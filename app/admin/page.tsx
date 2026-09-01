"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, ArrowLeftRight, AlertCircle, TrendingUp, Clock, CheckCircle, XCircle, RefreshCw, Activity, BarChart2, Shield } from 'lucide-react';
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Book = Database["public"]["Tables"]["books"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Fine = Database["public"]["Tables"]["fines"]["Row"];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: boolean;
  href?: string;
}

function StatCard({ label, value, icon, sub, accent, href }: StatCardProps) {
  const inner = (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 8px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all duration-300 ${
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)] text-[var(--brand-navy)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium tracking-wide ${
            accent ? "text-white/70" : "text-[var(--brand-muted)]"
          }`}
        >
          {label}
        </span>
        <span
          className={`p-2 rounded-xl ${
            accent ? "bg-white/10" : "bg-[var(--brand-gold)]/10"
          }`}
        >
          {icon}
        </span>
      </div>
      <div
        className={`text-3xl font-bold tracking-tight ${
          accent ? "text-white" : "text-[var(--brand-navy)]"
        }`}
      >
        {value}
      </div>
      {sub && (
        <p
          className={`text-xs ${
            accent ? "text-white/60" : "text-[var(--brand-muted)]"
          }`}
        >
          {sub}
        </p>
      )}
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

interface QuickActionProps {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

function QuickAction({ label, description, href, icon }: QuickActionProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-4 p-4 rounded-xl border border-[var(--brand-border)] bg-white hover:border-[var(--brand-gold)] hover:bg-[var(--brand-cream)] transition-all duration-200 cursor-pointer"
      >
        <span className="p-2 rounded-lg bg-[var(--brand-gold)]/10 text-[var(--brand-gold)] shrink-0">
          {icon}
        </span>
        <div>
          <p className="font-semibold text-[var(--brand-navy)] text-sm">{label}</p>
          <p className="text-xs text-[var(--brand-muted)] mt-0.5">{description}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    issued: {
      label: "Issued",
      cls: "bg-blue-50 text-blue-700 border-blue-200",
    },
    returned: {
      label: "Returned",
      cls: "bg-green-50 text-green-700 border-green-200",
    },
    overdue: {
      label: "Overdue",
      cls: "bg-red-50 text-red-700 border-red-200",
    },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-50 text-gray-600 border-gray-200" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

function SimpleBarChart({
  data,
}: {
  data: { label: string; value: number; max: number }[];
}) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-[var(--brand-muted)] w-24 shrink-0 truncate">
            {item.label}
          </span>
          <div className="flex-1 h-2 bg-[var(--brand-cream)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full bg-[var(--brand-gold)] rounded-full"
            />
          </div>
          <span className="text-xs font-semibold text-[var(--brand-navy)] w-6 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [pRes, bRes, tRes, fRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("books").select("*"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("fines").select("*"),
    ]);
    if (pRes.data) setProfiles(pRes.data);
    if (bRes.data) setBooks(bRes.data);
    if (tRes.data) setTransactions(tRes.data);
    if (fRes.data) setFines(fRes.data);
    setLastRefreshed(new Date());
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-transactions-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          fetchAll();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchAll]);

  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const totalMembers = profiles.filter((p) => p.role === "user").length;
  const activeMembers = profiles.filter((p) => p.role === "user" && p.is_active).length;
  const issuedCount = transactions.filter((t) => t.status === "issued").length;
  const overdueCount = transactions.filter((t) => t.status === "overdue").length;
  const returnedCount = transactions.filter((t) => t.status === "returned").length;
  const unpaidFines = fines.filter((f) => !f.is_paid && !f.is_waived);
  const totalFineAmount = unpaidFines.reduce((s, f) => s + Number(f.total_amount), 0);

  const recentTransactions = transactions.slice(0, 8);

  const categoryMap: Record<string, number> = {};
  books.forEach((b) => {
    const cat = b.category ?? "Uncategorized";
    categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({
      label,
      value,
      max: Math.max(...Object.values(categoryMap)),
    }));

  const quickActions: QuickActionProps[] = [
    {
      label: "Manage Books",
      description: "Add, edit, or remove books from the catalogue",
      href: "/admin/books",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      label: "Manage Users",
      description: "View and administer library member accounts",
      href: "/admin/users",
      icon: <Users className="w-4 h-4" />,
    },
    {
      label: "Transactions",
      description: "Issue books, process returns, and view logs",
      href: "/admin/transactions",
      icon: <ArrowLeftRight className="w-4 h-4" />,
    },
    {
      label: "Fine Management",
      description: "Review, waive, or mark fines as paid",
      href: "/admin/fines",
      icon: <AlertCircle className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--brand-cream)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5 text-[var(--brand-gold)]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                  Admin Panel
                </span>
              </div>
              <h1 className="text-3xl font-bold text-[var(--brand-navy)] tracking-tight">
                Library Dashboard
              </h1>
              <p className="text-sm text-[var(--brand-muted)] mt-1">
                NCBA&amp;E Central Library — real-time overview of all library activity
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--brand-muted)]">
                Last updated:{" "}
                {lastRefreshed.toLocaleTimeString("en-PK", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <motion.button
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.4 }}
                onClick={fetchAll}
                disabled={loading}
                className="p-2 rounded-xl border border-[var(--brand-border)] bg-white text-[var(--brand-navy)] hover:border-[var(--brand-gold)] transition-colors disabled:opacity-50"
                aria-label="Refresh dashboard"
              >
                <RefreshCw className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Total Books"
                value={loading ? "—" : totalBooks}
                icon={<BookOpen className="w-5 h-5 text-[var(--brand-gold)]" />}
                sub={`${availableCopies} of ${totalCopies} copies available`}
                href="/admin/books"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Library Members"
                value={loading ? "—" : totalMembers}
                icon={<Users className="w-5 h-5 text-[var(--brand-gold)]" />}
                sub={`${activeMembers} active accounts`}
                href="/admin/users"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Books Issued"
                value={loading ? "—" : issuedCount}
                icon={<ArrowLeftRight className="w-5 h-5 text-white" />}
                sub={`${overdueCount} overdue · ${returnedCount} returned`}
                accent
                href="/admin/transactions"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <StatCard
                label="Unpaid Fines"
                value={loading ? "—" : `Rs ${totalFineAmount.toFixed(0)}`}
                icon={<AlertCircle className="w-5 h-5 text-[var(--brand-gold)]" />}
                sub={`${unpaidFines.length} outstanding fine records`}
                href="/admin/fines"
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* Secondary Stats Row */}
        <Reveal>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-green-50">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </span>
              <div>
                <p className="text-2xl font-bold text-[var(--brand-navy)]">
                  {loading ? "—" : returnedCount}
                </p>
                <p className="text-xs text-[var(--brand-muted)]">Returned</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-red-50">
                <XCircle className="w-5 h-5 text-red-600" />
              </span>
              <div>
                <p className="text-2xl font-bold text-[var(--brand-navy)]">
                  {loading ? "—" : overdueCount}
                </p>
                <p className="text-xs text-[var(--brand-muted)]">Overdue</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white p-4 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-50">
                <Clock className="w-5 h-5 text-blue-600" />
              </span>
              <div>
                <p className="text-2xl font-bold text-[var(--brand-navy)]">
                  {loading ? "—" : issuedCount}
                </p>
                <p className="text-xs text-[var(--brand-muted)]">Active Issues</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Recent Transactions Table */}
          <Reveal className="lg:col-span-2">
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--brand-border)]">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--brand-gold)]" />
                  <h2 className="font-semibold text-[var(--brand-navy)] text-sm">
                    Recent Transactions
                  </h2>
                </div>
                <Link
                  href="/admin/transactions"
                  className="text-xs text-[var(--brand-gold)] hover:underline font-medium"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-[var(--brand-muted)] text-sm">
                  Loading transactions...
                </div>
              ) : recentTransactions.length === 0 ? (
                <div className="p-8 text-center text-[var(--brand-muted)] text-sm">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[var(--brand-cream)]">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Book ID
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Issue Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Due Date
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-border)]">
                      {recentTransactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="hover:bg-[var(--brand-cream)]/50 transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-xs text-[var(--brand-navy)] truncate max-w-[120px]">
                            {tx.book_id.slice(0, 8)}…
                          </td>
                          <td className="px-4 py-3 text-[var(--brand-muted)] text-xs">
                            {formatDate(tx.issue_date)}
                          </td>
                          <td className="px-4 py-3 text-[var(--brand-muted)] text-xs">
                            {formatDate(tx.due_date)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={tx.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Reveal>

          {/* Quick Actions */}
          <Reveal>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--brand-border)]">
                <TrendingUp className="w-4 h-4 text-[var(--brand-gold)]" />
                <h2 className="font-semibold text-[var(--brand-navy)] text-sm">
                  Quick Actions
                </h2>
              </div>
              <div className="p-4 space-y-3">
                {quickActions.map((qa) => (
                  <QuickAction key={qa.href} {...qa} />
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom Row: Category Chart + Overdue Alert */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Books by Category */}
          <Reveal>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-[var(--brand-border)]">
                <BarChart2 className="w-4 h-4 text-[var(--brand-gold)]" />
                <h2 className="font-semibold text-[var(--brand-navy)] text-sm">
                  Books by Category
                </h2>
              </div>
              <div className="p-6">
                {loading ? (
                  <p className="text-sm text-[var(--brand-muted)] text-center py-4">
                    Loading...
                  </p>
                ) : topCategories.length === 0 ? (
                  <p className="text-sm text-[var(--brand-muted)] text-center py-4">
                    No books catalogued yet.
                  </p>
                ) : (
                  <SimpleBarChart data={topCategories} />
                )}
              </div>
            </div>
          </Reveal>

          {/* Overdue Alerts */}
          <Reveal>
            <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--brand-border)]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <h2 className="font-semibold text-[var(--brand-navy)] text-sm">
                    Overdue Alerts
                  </h2>
                </div>
                {overdueCount > 0 && (
                  <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-medium">
                    {overdueCount} overdue
                  </span>
                )}
              </div>
              <div className="p-4">
                {loading ? (
                  <p className="text-sm text-[var(--brand-muted)] text-center py-4">
                    Loading...
                  </p>
                ) : overdueCount === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <p className="text-sm text-[var(--brand-muted)]">
                      No overdue transactions right now.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {transactions
                      .filter((t) => t.status === "overdue")
                      .slice(0, 10)
                      .map((tx) => {
                        const dueDate = new Date(tx.due_date);
                        const today = new Date();
                        const diffMs = today.getTime() - dueDate.getTime();
                        const daysOverdue = Math.max(
                          0,
                          Math.floor(diffMs / (1000 * 60 * 60 * 24))
                        );
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100"
                          >
                            <div>
                              <p className="text-xs font-semibold text-red-700 font-mono">
                                Book: {tx.book_id.slice(0, 8)}…
                              </p>
                              <p className="text-xs text-red-500 mt-0.5">
                                Due: {formatDate(tx.due_date)}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                              +{daysOverdue}d
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
                {overdueCount > 0 && (
                  <Link
                    href="/admin/transactions"
                    className="mt-3 block text-center text-xs text-[var(--brand-gold)] hover:underline font-medium"
                  >
                    Manage all overdue transactions
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Library Health Summary */}
        <Reveal>
          <div className="mt-6 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-navy)] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Library Health Summary
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  A snapshot of the current state of NCBA&amp;E Central Library operations.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-gold)]">
                    {loading
                      ? "—"
                      : totalCopies > 0
                      ? `${Math.round((availableCopies / totalCopies) * 100)}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-white/60">Availability Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-gold)]">
                    {loading
                      ? "—"
                      : totalMembers > 0
                      ? `${Math.round((activeMembers / totalMembers) * 100)}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-white/60">Active Members</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--brand-gold)]">
                    {loading ? "—" : transactions.length}
                  </p>
                  <p className="text-xs text-white/60">Total Transactions</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

      </div>
    </div>
  );
}