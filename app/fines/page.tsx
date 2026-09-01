"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, DollarSign, FileText, Search, Filter, Info, BookOpen, Calendar, ChevronDown } from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

type FineStatus = "paid" | "unpaid" | "waived";

interface MockFine {
  id: string;
  bookTitle: string;
  author: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
  overdueDays: number;
  fineAmount: number;
  status: FineStatus;
}

const MOCK_FINES: MockFine[] = [
  {
    id: "f1",
    bookTitle: "Introduction to Algorithms",
    author: "Cormen",
    issueDate: "2025-01-10",
    dueDate: "2025-01-24",
    returnDate: "2025-02-05",
    overdueDays: 12,
    fineAmount: 60,
    status: "paid",
  },
  {
    id: "f2",
    bookTitle: "Database System Concepts",
    author: "Silberschatz",
    issueDate: "2025-02-01",
    dueDate: "2025-02-15",
    returnDate: null,
    overdueDays: 18,
    fineAmount: 90,
    status: "unpaid",
  },
  {
    id: "f3",
    bookTitle: "Operating System Concepts",
    author: "Silberschatz",
    issueDate: "2025-02-20",
    dueDate: "2025-03-06",
    returnDate: "2025-03-10",
    overdueDays: 4,
    fineAmount: 20,
    status: "paid",
  },
  {
    id: "f4",
    bookTitle: "Computer Networks",
    author: "Tanenbaum",
    issueDate: "2025-03-01",
    dueDate: "2025-03-15",
    returnDate: null,
    overdueDays: 22,
    fineAmount: 110,
    status: "unpaid",
  },
  {
    id: "f5",
    bookTitle: "Artificial Intelligence",
    author: "Russell",
    issueDate: "2025-03-10",
    dueDate: "2025-03-24",
    returnDate: "2025-03-28",
    overdueDays: 4,
    fineAmount: 20,
    status: "waived",
  },
  {
    id: "f6",
    bookTitle: "Software Engineering",
    author: "Pressman",
    issueDate: "2025-04-01",
    dueDate: "2025-04-15",
    returnDate: null,
    overdueDays: 10,
    fineAmount: 50,
    status: "unpaid",
  },
  {
    id: "f7",
    bookTitle: "Discrete Mathematics",
    author: "Rosen",
    issueDate: "2025-04-10",
    dueDate: "2025-04-24",
    returnDate: "2025-04-30",
    overdueDays: 6,
    fineAmount: 30,
    status: "paid",
  },
  {
    id: "f8",
    bookTitle: "Data Structures",
    author: "Goodrich",
    issueDate: "2025-05-01",
    dueDate: "2025-05-15",
    returnDate: null,
    overdueDays: 5,
    fineAmount: 25,
    status: "unpaid",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "Not returned";
  const [y, m, d] = iso.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: FineStatus }) {
  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
        <CheckCircle className="h-3 w-3" />
        Paid
      </span>
    );
  }
  if (status === "waived") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
        <CheckCircle className="h-3 w-3" />
        Waived
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
      <AlertCircle className="h-3 w-3" />
      Unpaid
    </span>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  borderColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-6 flex flex-col gap-4",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]",
        borderColor
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
        <span className={cn("rounded-xl p-2.5", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </span>
      </div>
      <div
        className="text-3xl font-bold tracking-tight"
        style={{ color: "var(--foreground)" }}
      >
        {value}
      </div>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl border bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)]"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors duration-200 hover:bg-[#f5f0e8]/60"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-shrink-0 transition-transform duration-300",
            open ? "rotate-180" : ""
          )}
          style={{ color: "var(--accent)" }}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-4 text-sm leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {answer}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FineStatus>("all");

  // Computed totals
  const totalAmount = MOCK_FINES.reduce((s, f) => s + f.fineAmount, 0);
  const pendingAmount = MOCK_FINES.filter((f) => f.status === "unpaid").reduce(
    (s, f) => s + f.fineAmount,
    0
  );
  const clearedAmount = MOCK_FINES.filter(
    (f) => f.status === "paid" || f.status === "waived"
  ).reduce((s, f) => s + f.fineAmount, 0);

  // Filtered rows
  const filtered = MOCK_FINES.filter((f) => {
    const matchSearch = f.bookTitle
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ? true : f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const FAQ = [
    {
      question: "How are fines calculated?",
      answer:
        "Fines are calculated at Rs. 5 per day for every day a book is overdue beyond the standard 14-day loan period. For example, if you return a book 10 days late, your fine will be Rs. 50. Fines are automatically recorded in the system when a book is returned or when an overdue check is run.",
    },
    {
      question: "Can fines be waived?",
      answer:
        "Yes. Fines may be waived at the discretion of the library administration. If you believe a fine was applied in error, or if you have a valid reason for the delay, please visit the circulation desk and speak with a librarian. Waiver requests are reviewed on a case-by-case basis.",
    },
    {
      question: "What happens if I don't pay my fine?",
      answer:
        "Unpaid fines will prevent you from borrowing additional books until the outstanding balance is cleared. Persistent non-payment may result in suspension of your library membership. Please clear all dues at the circulation desk during library hours (Mon–Fri 8 AM – 8 PM, Sat 9 AM – 5 PM).",
    },
  ];

  return (
    <div style={{ backgroundColor: "var(--background)", minHeight: "100vh" }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 50%, rgba(200,169,110,0.4) 0%, transparent 60%)",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="max-w-2xl"
          >
            {/* Breadcrumb */}
            <motion.p
              variants={fadeInUp}
              className="text-xs font-medium mb-4 tracking-wide"
              style={{ color: "rgba(200,169,110,0.8)" }}
            >
              Dashboard / My Fines
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-3 mb-4"
            >
              <div
                className="rounded-xl p-2.5"
                style={{ backgroundColor: "rgba(200,169,110,0.15)" }}
              >
                <DollarSign
                  className="h-6 w-6"
                  style={{ color: "var(--accent)" }}
                />
              </div>
              <h1
                className="text-3xl md:text-4xl font-bold tracking-tight"
                style={{ color: "var(--card)" }}
              >
                My Fine Records
              </h1>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="text-base leading-relaxed"
              style={{ color: "rgba(245,240,232,0.75)" }}
            >
              Track your overdue fines and payment history. Clear outstanding
              dues at the circulation desk to continue borrowing books.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5"
          >
            <motion.div variants={fadeInUp}>
              <SummaryCard
                icon={FileText}
                label="Total Fines"
                value={`Rs. ${totalAmount}`}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                borderColor="border-blue-100"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <SummaryCard
                icon={AlertCircle}
                label="Pending Amount"
                value={`Rs. ${pendingAmount}`}
                iconBg="bg-red-50"
                iconColor="text-red-600"
                borderColor="border-red-100"
              />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <SummaryCard
                icon={CheckCircle}
                label="Paid / Waived"
                value={`Rs. ${clearedAmount}`}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                borderColor="border-emerald-100"
              />
            </motion.div>
          </motion.div>
        </Reveal>

        {/* ── Filter Bar ────────────────────────────────────────────────── */}
        <Reveal>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--muted-foreground)" }}
              />
              <input
                type="text"
                placeholder="Search by book title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-white text-sm outline-none transition-all duration-200 focus:ring-2"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                  // @ts-ignore
                  "--tw-ring-color": "var(--accent)",
                }}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }}
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | FineStatus)
                }
                className="appearance-none pl-9 pr-8 py-2.5 rounded-xl border bg-white text-sm outline-none transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <option value="all">All Statuses</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="waived">Waived</option>
              </select>
              <ChevronDown
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "var(--muted-foreground)" }}
              />
            </div>
          </div>
        </Reveal>

        {/* ── Fine Table ────────────────────────────────────────────────── */}
        <Reveal>
          <div
            className="rounded-2xl border bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Table header */}
            <div
              className="px-5 py-4 border-b flex items-center gap-2"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "rgba(30,58,95,0.03)",
              }}
            >
              <BookOpen
                className="h-4 w-4"
                style={{ color: "var(--primary)" }}
              />
              <h2
                className="text-sm font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Fine Records
              </h2>
              <span
                className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "rgba(200,169,110,0.15)",
                  color: "var(--accent)",
                }}
              >
                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FileText
                  className="h-10 w-10 mx-auto mb-3"
                  style={{ color: "var(--border)" }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  No fine records match your filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      className="border-b text-xs font-semibold uppercase tracking-wide"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--muted-foreground)",
                        backgroundColor: "rgba(245,240,232,0.5)",
                      }}
                    >
                      <th className="text-left px-5 py-3">Book / Author</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">
                        Issue Date
                      </th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">
                        Due Date
                      </th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">
                        Return Date
                      </th>
                      <th className="text-center px-4 py-3 hidden sm:table-cell">
                        Overdue Days
                      </th>
                      <th className="text-right px-4 py-3">Fine (Rs.)</th>
                      <th className="text-center px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((fine, idx) => (
                      <motion.tr
                        key={fine.id}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: idx * 0.04 }}
                        className="border-b last:border-0 transition-colors duration-150 hover:bg-[#f5f0e8]/40"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <td className="px-5 py-4">
                          <p
                            className="font-semibold leading-tight"
                            style={{ color: "var(--foreground)" }}
                          >
                            {fine.bookTitle}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {fine.author}
                          </p>
                        </td>
                        <td
                          className="px-4 py-4 hidden md:table-cell"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {fmtDate(fine.issueDate)}
                        </td>
                        <td
                          className="px-4 py-4 hidden md:table-cell"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {fmtDate(fine.dueDate)}
                        </td>
                        <td
                          className="px-4 py-4 hidden lg:table-cell"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          {fmtDate(fine.returnDate)}
                        </td>
                        <td className="px-4 py-4 text-center hidden sm:table-cell">
                          <span
                            className={cn(
                              "inline-block font-bold text-sm",
                              fine.overdueDays > 14
                                ? "text-red-600"
                                : fine.overdueDays > 7
                                ? "text-amber-600"
                                : "text-orange-500"
                            )}
                          >
                            {fine.overdueDays}d
                          </span>
                        </td>
                        <td
                          className="px-4 py-4 text-right font-bold"
                          style={{ color: "var(--foreground)" }}
                        >
                          {fine.fineAmount}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={fine.status} />
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Reveal>

        {/* ── Payment Policy ────────────────────────────────────────────── */}
        <Reveal>
          <div
            className="rounded-2xl border bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="rounded-xl p-3 flex-shrink-0"
                style={{ backgroundColor: "rgba(200,169,110,0.12)" }}
              >
                <Info
                  className="h-5 w-5"
                  style={{ color: "var(--accent)" }}
                />
              </div>
              <div className="flex-1">
                <h2
                  className="text-lg font-bold mb-4"
                  style={{ color: "var(--foreground)" }}
                >
                  Fine &amp; Borrowing Policy
                </h2>
                <ul className="space-y-3">
                  {[
                    {
                      icon: Calendar,
                      text: "Standard loan period: 14 days from the date of issue.",
                    },
                    {
                      icon: DollarSign,
                      text: "Overdue fine rate: Rs. 5 per day after the due date.",
                    },
                    {
                      icon: BookOpen,
                      text: "Maximum books per member: 5 books at any one time.",
                    },
                    {
                      icon: AlertCircle,
                      text: "Fines must be cleared before new books can be issued.",
                    },
                    {
                      icon: Clock,
                      text: "Contact the circulation desk to dispute a fine or request a waiver.",
                    },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <item.icon
                        className="h-4 w-4 mt-0.5 flex-shrink-0"
                        style={{ color: "var(--accent)" }}
                      />
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ── FAQ Accordion ─────────────────────────────────────────────── */}
        <Reveal>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText
                className="h-5 w-5"
                style={{ color: "var(--primary)" }}
              />
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--foreground)" }}
              >
                Frequently Asked Questions
              </h2>
            </div>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </Reveal>

        {/* Bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
