"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import Link from "next/link";
import { BookOpen, Users, ArrowRight, Search, Shield, Clock, Star, CheckCircle, BookMarked, BarChart3, AlertCircle, Library } from 'lucide-react';
import { cn } from "@/lib/utils";
type APP_NAME = any;
const APP_NAME: any = [];
type INSTITUTION_FULL = any;
const INSTITUTION_FULL: any = [];
type APP_TAGLINE = any;
const APP_TAGLINE: any = [];

// ─── Inline mock data ────────────────────────────────────────────────────────

const STATS = [
  { value: "12,400+", label: "Books in Catalogue" },
  { value: "3,200+", label: "Registered Members" },
  { value: "98.5%", label: "On-Time Returns" },
  { value: "14 Days", label: "Standard Loan Period" },
];

const FEATURES = [
  {
    icon: Search,
    title: "Smart Book Search",
    desc: "Find any title instantly by author, ISBN, category, or keyword. Filter by availability and sort by relevance or newest additions.",
  },
  {
    icon: BookMarked,
    title: "Issue & Return Workflow",
    desc: "Seamless checkout and return process with automatic due-date tracking, transaction logs, and real-time availability updates.",
  },
  {
    icon: AlertCircle,
    title: "Fine Management",
    desc: "Automated overdue fine calculation at PKR 5 per day. Members can view outstanding fines; admins can waive or mark them paid.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    desc: "Separate interfaces for library members and administrators. JWT-secured sessions ensure every action is properly authorized.",
  },
  {
    icon: BarChart3,
    title: "Admin Dashboard",
    desc: "Live overview of library activity — books issued today, overdue items, pending fines, and member growth at a glance.",
  },
  {
    icon: Clock,
    title: "Transaction History",
    desc: "Complete audit trail of every issue and return event. Filter by date, member, or book to resolve disputes instantly.",
  },
];

const CATEGORIES = [
  { name: "Computer Science", count: 1840, color: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "Business & Economics", count: 2100, color: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Mathematics", count: 980, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "Islamic Studies", count: 760, color: "bg-teal-50 text-teal-700 border-teal-200" },
  { name: "Engineering", count: 1320, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { name: "Literature", count: 1540, color: "bg-rose-50 text-rose-700 border-rose-200" },
  { name: "Physics", count: 670, color: "bg-violet-50 text-violet-700 border-violet-200" },
  { name: "Social Sciences", count: 890, color: "bg-orange-50 text-orange-700 border-orange-200" },
];

const TESTIMONIALS = [
  {
    name: "Ayesha Tariq",
    role: "BS Computer Science, Semester 6",
    quote:
      "The search feature saves me so much time. I can check availability before walking to the library and reserve books right from my phone.",
    avatar: "/images/student-female-cs.jpg",
    rating: 5,
  },
  {
    name: "Muhammad Bilal",
    role: "MBA Finance, Semester 4",
    quote:
      "Fine tracking is transparent now. I know exactly what I owe and why. The admin team waived my fine quickly when I explained the situation.",
    avatar: "/images/student-male-mba.jpg",
    rating: 5,
  },
  {
    name: "Dr. Sana Rehman",
    role: "Faculty, Department of Economics",
    quote:
      "As a faculty member I can see which books are most requested by students and recommend new acquisitions through the admin panel.",
    avatar: "/images/faculty-female-economics.jpg",
    rating: 5,
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Register Your Account",
    desc: "Sign up with your institutional email. The library admin approves your membership and assigns your unique member ID.",
  },
  {
    step: "02",
    title: "Search & Browse",
    desc: "Explore 12,000+ titles across 9 categories. Filter by availability, sort by relevance, and view shelf location before you visit.",
  },
  {
    step: "03",
    title: "Issue & Return",
    desc: "Visit the library counter. Staff issues the book against your account. Return within 14 days to avoid overdue fines.",
  },
  {
    step: "04",
    title: "Track Everything",
    desc: "Your dashboard shows active loans, due dates, transaction history, and any outstanding fines — all in one place.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const t = useTranslations();

  return (
    <main className="overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <Reveal>
        <section
          id="hero"
          className="relative min-h-[92vh] flex items-center bg-[var(--brand-navy)]"
        >
          {/* Background texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,1) 39px,rgba(255,255,255,1) 40px)",
            }}
          />
          {/* Radial glow */}
          <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-[var(--brand-gold)] opacity-[0.06] blur-[120px]" />

          <div className="relative mx-auto w-full max-w-7xl px-6 py-24 lg:px-8">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
              {/* Left: copy */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-6"
              >
                <motion.div variants={fadeInUp}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                    <Library className="h-3.5 w-3.5" />
                    {t("hero.eyebrow")}
                  </span>
                </motion.div>

                <motion.h1
                  variants={fadeInUp}
                  className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl text-balance"
                >
                  {t("hero.headline1")}{" "}
                  <span className="text-[var(--brand-gold)]">
                    {t("hero.headline2")}
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="max-w-lg text-lg leading-relaxed text-white/70"
                >
                  {t("hero.subhead")}
                </motion.p>

                <motion.div
                  variants={fadeInUp}
                  className="flex flex-wrap gap-4 pt-2"
                >
                  <Link
                    href="/books"
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[var(--brand-navy)] shadow-[0_4px_24px_rgba(200,169,110,0.35)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_6px_32px_rgba(200,169,110,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-gold)]"
                  >
                    {t("hero.cta1")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                  >
                    {t("hero.cta2")}
                  </Link>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  variants={fadeInUp}
                  className="flex flex-wrap items-center gap-6 pt-4"
                >
                  {[
                    t("hero.badge1"),
                    t("hero.badge2"),
                    t("hero.badge3"),
                  ].map((badge) => (
                    <span
                      key={badge}
                      className="flex items-center gap-1.5 text-xs text-white/50"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                      {badge}
                    </span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right: stat cards */}
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-4"
              >
                {STATS.map((s, i) => (
                  <motion.div
                    key={s.label}
                    variants={scaleIn}
                    transition={{ delay: i * 0.1 }}
                    className={cn(
                      "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm",
                      i === 1 && "mt-6",
                      i === 3 && "-mt-6"
                    )}
                  >
                    <div className="text-3xl font-bold text-[var(--brand-gold)]">
                      {s.value}
                    </div>
                    <div className="mt-1 text-sm text-white/60">{s.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <Reveal>
        <section
          id="features"
          className="bg-[var(--brand-cream)] py-24 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full border border-[var(--brand-navy)]/20 bg-[var(--brand-navy)]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--brand-navy)]">
                {t("features.eyebrow")}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-4xl text-balance">
                {t("features.heading")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[var(--brand-navy)]/60">
                {t("features.subhead")}
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <Reveal key={f.title} delay={i * 0.07}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="group flex flex-col gap-4 rounded-2xl border border-[var(--brand-navy)]/10 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] transition-shadow duration-300 hover:shadow-[0_4px_32px_-8px_rgba(30,58,95,0.18)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-navy)]/8 text-[var(--brand-navy)] transition-colors duration-300 group-hover:bg-[var(--brand-gold)]/15 group-hover:text-[var(--brand-gold)]">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--brand-navy)]">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--brand-navy)]/60">
                      {f.desc}
                    </p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <Reveal>
        <section
          id="how-it-works"
          className="bg-[var(--brand-navy)] py-24 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
              {/* Left: heading */}
              <div>
                <span className="inline-block rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                  {t("howItWorks.eyebrow")}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl text-balance">
                  {t("howItWorks.heading")}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-white/60">
                  {t("howItWorks.subhead")}
                </p>
                <Link
                  href="/auth"
                  className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[var(--brand-navy)] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-gold)]"
                >
                  {t("howItWorks.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right: steps */}
              <div className="flex flex-col gap-6">
                {HOW_IT_WORKS.map((step, i) => (
                  <Reveal key={step.step} delay={i * 0.1}>
                    <div className="flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                      <div className="flex-shrink-0 text-3xl font-bold text-[var(--brand-gold)]/30 leading-none">
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {step.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Book Categories ───────────────────────────────────────────────── */}
      <Reveal>
        <section
          id="catalogue"
          className="bg-white py-24 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-block rounded-full border border-[var(--brand-navy)]/20 bg-[var(--brand-navy)]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--brand-navy)]">
                  {t("catalogue.eyebrow")}
                </span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-4xl text-balance">
                  {t("catalogue.heading")}
                </h2>
              </div>
              <Link
                href="/books"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-navy)] underline-offset-4 hover:underline"
              >
                {t("catalogue.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {CATEGORIES.map((cat, i) => (
                <Reveal key={cat.name} delay={i * 0.06}>
                  <Link href={`/books?category=${encodeURIComponent(cat.name)}`}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        "flex flex-col gap-2 rounded-2xl border p-5 transition-shadow duration-300 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)]",
                        cat.color
                      )}
                    >
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                      <span className="text-sm font-semibold leading-snug">
                        {cat.name}
                      </span>
                      <span className="text-xs opacity-70">
                        {cat.count.toLocaleString("en-US")} {t("catalogue.books")}
                      </span>
                    </motion.div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <Reveal>
        <section
          id="testimonials"
          className="bg-[var(--brand-cream)] py-24 md:py-32"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-block rounded-full border border-[var(--brand-navy)]/20 bg-[var(--brand-navy)]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--brand-navy)]">
                {t("testimonials.eyebrow")}
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-4xl text-balance">
                {t("testimonials.heading")}
              </h2>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
              {TESTIMONIALS.map((tm, i) => (
                <Reveal key={tm.name} delay={i * 0.1}>
                  <div className="flex flex-col gap-5 rounded-2xl border border-[var(--brand-navy)]/10 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
                    {/* Stars */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: tm.rating }).map((_, si) => (
                        <Star
                          key={si}
                          className="h-4 w-4 fill-[var(--brand-gold)] text-[var(--brand-gold)]"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--brand-navy)]/70 italic">
                      &ldquo;{tm.quote}&rdquo;
                    </p>
                    <div className="mt-auto flex items-center gap-3 border-t border-[var(--brand-navy)]/8 pt-5">
                      <img
                        src={tm.avatar}
                        alt={tm.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--brand-gold)]/20"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(tm.name)}&background=1e3a5f&color=c8a96e&size=80`;
                        }}
                      />
                      <div>
                        <div className="text-sm font-semibold text-[var(--brand-navy)]">
                          {tm.name}
                        </div>
                        <div className="text-xs text-[var(--brand-navy)]/50">
                          {tm.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Admin CTA Banner ─────────────────────────────────────────────── */}
      <Reveal>
        <section
          id="admin"
          className="bg-white py-16 md:py-20"
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-[var(--brand-navy)] px-8 py-14 md:px-14">
              {/* Decorative glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[var(--brand-gold)] opacity-[0.08] blur-[80px]" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[var(--brand-gold)] opacity-[0.06] blur-[80px]" />

              <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-gold)]/15">
                      <Users className="h-5 w-5 text-[var(--brand-gold)]" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-gold)]">
                      {t("adminCta.eyebrow")}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl text-balance">
                    {t("adminCta.heading")}
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-white/60">
                    {t("adminCta.subhead")}
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-gold)] px-6 py-3 text-sm font-semibold text-[var(--brand-navy)] transition-all duration-300 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--brand-gold)]"
                  >
                    {t("adminCta.cta1")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
                  >
                    {t("adminCta.cta2")}
                  </Link>
                </div>
              </div>

              {/* Feature list */}
              <div className="relative mt-10 grid grid-cols-1 gap-3 border-t border-white/10 pt-10 sm:grid-cols-3">
                {[
                  t("adminCta.feat1"),
                  t("adminCta.feat2"),
                  t("adminCta.feat3"),
                ].map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-[var(--brand-gold)]" aria-hidden="true" />
                    {feat}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Institution strip ─────────────────────────────────────────────── */}
      <Reveal>
        <section className="border-t border-[var(--brand-navy)]/10 bg-[var(--brand-cream)] py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-navy)]">
                  <Library className="h-5 w-5 text-[var(--brand-gold)]" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--brand-navy)]">
                    {APP_NAME}
                  </div>
                  <div className="text-xs text-[var(--brand-navy)]/50">
                    {INSTITUTION_FULL}
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--brand-navy)]/50 max-w-sm">
                {t("institution.tagline")}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/books"
                  className="text-xs font-semibold text-[var(--brand-navy)] underline-offset-4 hover:underline"
                >
                  {t("institution.link1")}
                </Link>
                <Link
                  href="/auth"
                  className="text-xs font-semibold text-[var(--brand-navy)] underline-offset-4 hover:underline"
                >
                  {t("institution.link2")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>
    </main>
  );
}