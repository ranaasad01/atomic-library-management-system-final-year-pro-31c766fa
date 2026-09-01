"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Search, X, ChevronDown, BookOpen, Filter, ChevronLeft, ChevronRight, Star, MapPin, Calendar, Hash, Building, Info, AlertCircle, Check } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type BookRow = Database["public"]["Tables"]["books"]["Row"];

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "All Categories",
  "Computer Science",
  "Mathematics",
  "Physics",
  "Literature",
  "Islamic Studies",
  "Business & Economics",
  "Engineering",
  "Social Sciences",
  "Reference",
] as const;

const AVAILABILITY_OPTIONS = [
  "All Books",
  "Available Now",
  "Currently Issued",
  "Low Stock",
] as const;

const SORT_OPTIONS = [
  "Relevance",
  "Title A–Z",
  "Title Z–A",
  "Newest Additions",
] as const;

const PAGE_SIZE = 12;

// ─── Colour helpers ───────────────────────────────────────────────────────────

function availabilityBadge(available: number, total: number) {
  if (available === 0)
    return { label: "Issued", cls: "bg-red-100 text-red-700 border-red-200" };
  if (available === 1)
    return {
      label: "Low Stock",
      cls: "bg-amber-100 text-amber-700 border-amber-200",
    };
  return {
    label: "Available",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
  };
}

function categoryColor(cat: string | null) {
  const map: Record<string, string> = {
    "Computer Science": "bg-blue-50 text-blue-700",
    Mathematics: "bg-purple-50 text-purple-700",
    Physics: "bg-cyan-50 text-cyan-700",
    Literature: "bg-rose-50 text-rose-700",
    "Islamic Studies": "bg-green-50 text-green-700",
    "Business & Economics": "bg-amber-50 text-amber-700",
    Engineering: "bg-orange-50 text-orange-700",
    "Social Sciences": "bg-teal-50 text-teal-700",
    Reference: "bg-slate-100 text-slate-700",
  };
  return map[cat ?? ""] ?? "bg-slate-100 text-slate-600";
}

// ─── Cover placeholder ────────────────────────────────────────────────────────

function CoverPlaceholder({ title, author }: { title: string; author: string }) {
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const hues = [
    "from-[#1e3a5f] to-[#2d5a8e]",
    "from-[#2d5a8e] to-[#1e3a5f]",
    "from-[#c8a96e] to-[#a07840]",
    "from-[#1e3a5f] to-[#c8a96e]",
    "from-[#3a5f1e] to-[#2d8e5a]",
    "from-[#5f1e3a] to-[#8e2d5a]",
  ];
  const idx = (title.charCodeAt(0) + title.length) % hues.length;
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${hues[idx]} rounded-t-xl p-4`}
    >
      <span className="text-3xl font-bold text-white/90 tracking-wider">
        {initials}
      </span>
      <span className="mt-2 text-center text-xs text-white/60 line-clamp-2 px-2">
        {author}
      </span>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

function Dropdown<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-sm font-medium text-[#1e3a5f] shadow-sm hover:border-[#1e3a5f]/40 hover:bg-[#f5f0e8] transition-all duration-200 min-w-[160px] justify-between"
      >
        <span className="truncate">{value === options[0] ? label : value}</span>
        <ChevronDown
          className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute left-0 top-full z-50 mt-1 w-full min-w-[180px] rounded-xl border border-[#1e3a5f]/10 bg-white py-1 shadow-[0_4px_24px_-4px_rgba(30,58,95,0.18)]"
          >
            {options.map((opt) => (
              <li key={opt}>
                <button
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#f5f0e8] ${
                    value === opt
                      ? "font-semibold text-[#1e3a5f]"
                      : "text-slate-600"
                  }`}
                >
                  {value === opt && (
                    <Check className="h-3.5 w-3.5 text-[#c8a96e]" />
                  )}
                  <span className={value === opt ? "" : "ml-5"}>{opt}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Book Card ────────────────────────────────────────────────────────────────

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

function BookCard({
  book,
  onSelect,
}: {
  book: BookRow;
  onSelect: (b: BookRow) => void;
}) {
  const badge = availabilityBadge(book.available_copies, book.total_copies);
  const catCls = categoryColor(book.category);
  const canIssue = book.available_copies > 0;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col rounded-xl border border-[#1e3a5f]/10 bg-white overflow-hidden shadow-[0_1px_4px_rgba(30,58,95,0.06)] cursor-pointer"
      onClick={() => onSelect(book)}
    >
      {/* Cover */}
      <div className="relative h-44 w-full flex-shrink-0 bg-slate-100">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-full w-full object-cover rounded-t-xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <CoverPlaceholder title={book.title} author={book.author} />
        )}
        <span
          className={`absolute top-2 right-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}
        >
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        {book.category && (
          <span
            className={`self-start rounded-full px-2 py-0.5 text-xs font-medium ${catCls}`}
          >
            {book.category}
          </span>
        )}
        <h3 className="text-sm font-semibold text-[#1e3a5f] line-clamp-2 leading-snug group-hover:text-[#c8a96e] transition-colors">
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-1">{book.author}</p>

        <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {book.available_copies}/{book.total_copies} copies
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (canIssue) onSelect(book);
            }}
            disabled={!canIssue}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              canIssue
                ? "bg-[#1e3a5f] text-white hover:bg-[#c8a96e] hover:text-[#1e3a5f]"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {canIssue ? "Issue" : "Unavailable"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Book Details Panel ───────────────────────────────────────────────────────

const panelVariants: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: "100%",
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

function BookDetailsPanel({
  book,
  onClose,
}: {
  book: BookRow;
  onClose: () => void;
}) {
  const badge = availabilityBadge(book.available_copies, book.total_copies);
  const catCls = categoryColor(book.category);
  const canIssue = book.available_copies > 0;

  const meta: { icon: React.ReactNode; label: string; value: string | null }[] =
    [
      {
        icon: <Hash className="h-4 w-4" />,
        label: "ISBN",
        value: book.isbn,
      },
      {
        icon: <Building className="h-4 w-4" />,
        label: "Publisher",
        value: book.publisher,
      },
      {
        icon: <Calendar className="h-4 w-4" />,
        label: "Year",
        value: book.publication_year?.toString() ?? null,
      },
      {
        icon: <MapPin className="h-4 w-4" />,
        label: "Shelf Location",
        value: book.shelf_location,
      },
      {
        icon: <BookOpen className="h-4 w-4" />,
        label: "Total Copies",
        value: `${book.total_copies} (${book.available_copies} available)`,
      },
    ];

  return (
    <>
      {/* Overlay */}
      <motion.div
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.aside
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-[−8px_0_40px_rgba(30,58,95,0.15)] flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-[#f5f0e8]">
          <span className="text-sm font-semibold text-[#1e3a5f] uppercase tracking-wide">
            Book Details
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cover */}
        <div className="relative h-56 w-full flex-shrink-0 bg-slate-100">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <CoverPlaceholder title={book.title} author={book.author} />
          )}
          <span
            className={`absolute bottom-3 right-3 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 p-6">
          {/* Title & Author */}
          <div>
            {book.category && (
              <span
                className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${catCls}`}
              >
                {book.category}
              </span>
            )}
            <h2 className="text-xl font-bold text-[#1e3a5f] leading-snug">
              {book.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              {book.author}
            </p>
          </div>

          {/* Description */}
          {book.description && (
            <div className="rounded-xl bg-[#f5f0e8] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-[#c8a96e]" />
                <span className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">
                  Description
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                {book.description}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="rounded-xl border border-slate-100 divide-y divide-slate-100">
            {meta.map(
              (m) =>
                m.value && (
                  <div
                    key={m.label}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span className="text-[#c8a96e] flex-shrink-0">
                      {m.icon}
                    </span>
                    <span className="text-xs text-slate-400 w-28 flex-shrink-0">
                      {m.label}
                    </span>
                    <span className="text-sm text-[#1e3a5f] font-medium">
                      {m.value}
                    </span>
                  </div>
                )
            )}
          </div>

          {/* Issue CTA */}
          <div className="mt-auto">
            {canIssue ? (
              <button className="w-full rounded-xl bg-[#1e3a5f] py-3 text-sm font-semibold text-white hover:bg-[#c8a96e] hover:text-[#1e3a5f] transition-all duration-200 shadow-sm">
                Request Issue
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600">
                  All copies are currently issued. Check back later.
                </p>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-400">
              Visit the library desk or use the Transactions page to complete
              the issue process.
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BookCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-100 bg-white overflow-hidden animate-pulse">
      <div className="h-44 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-16 bg-slate-200 rounded-full" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="h-3 w-2/3 bg-slate-200 rounded" />
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-7 w-16 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BooksPage() {
  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState<string>("All Categories");
  const [availability, setAvailability] = useState<string>("All Books");
  const [sort, setSort] = useState<string>("Relevance");
  const [page, setPage] = useState(1);
  const [selectedBook, setSelectedBook] = useState<BookRow | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Fetch from Supabase
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: sbError } = await supabase
          .from("books")
          .select("*")
          .order("created_at", { ascending: false });

        if (sbError) throw new Error(sbError.message);
        setBooks(data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load books.");
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, []);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...books];

    // Search
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.isbn ?? "").toLowerCase().includes(q) ||
          (b.category ?? "").toLowerCase().includes(q) ||
          (b.publisher ?? "").toLowerCase().includes(q)
      );
    }

    // Category
    if (category !== "All Categories") {
      result = result.filter((b) => b.category === category);
    }

    // Availability
    if (availability === "Available Now") {
      result = result.filter((b) => b.available_copies > 0);
    } else if (availability === "Currently Issued") {
      result = result.filter((b) => b.available_copies === 0);
    } else if (availability === "Low Stock") {
      result = result.filter((b) => b.available_copies === 1);
    }

    // Sort
    if (sort === "Title A–Z") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "Title Z–A") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sort === "Newest Additions") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [books, debouncedQuery, category, availability, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategoryChange = useCallback((v: string) => {
    setCategory(v);
    setPage(1);
  }, []);
  const handleAvailabilityChange = useCallback((v: string) => {
    setAvailability(v);
    setPage(1);
  }, []);
  const handleSortChange = useCallback((v: string) => {
    setSort(v);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    setCategory("All Categories");
    setAvailability("All Books");
    setSort("Relevance");
    setPage(1);
  }, []);

  const hasActiveFilters =
    debouncedQuery ||
    category !== "All Categories" ||
    availability !== "All Books" ||
    sort !== "Relevance";

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* ── Hero / Header ── */}
      <Reveal>
        <section className="bg-[#1e3a5f] py-12 px-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c8a96e]/20">
                <BookOpen className="h-5 w-5 text-[#c8a96e]" />
              </div>
              <span className="text-sm font-medium text-[#c8a96e] uppercase tracking-widest">
                NCBA&amp;E Central Library
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight text-balance">
              Browse the Book Catalogue
            </h1>
            <p className="mt-2 text-base text-white/60 max-w-xl leading-relaxed">
              Search across thousands of titles. Filter by subject, check
              availability, and request an issue directly from the catalogue.
            </p>

            {/* Search bar */}
            <div className="mt-6 relative max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN, or category..."
                className="w-full rounded-xl border border-white/10 bg-white/10 backdrop-blur-sm pl-12 pr-12 py-3.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c8a96e]/60 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* ── Filter Bar ── */}
      <Reveal delay={0.05}>
        <div className="sticky top-0 z-30 border-b border-[#1e3a5f]/10 bg-white/90 backdrop-blur-md shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </div>

            <Dropdown
              label="Category"
              options={CATEGORIES}
              value={category as (typeof CATEGORIES)[number]}
              onChange={handleCategoryChange}
            />
            <Dropdown
              label="Availability"
              options={AVAILABILITY_OPTIONS}
              value={availability as (typeof AVAILABILITY_OPTIONS)[number]}
              onChange={handleAvailabilityChange}
            />
            <Dropdown
              label="Sort By"
              options={SORT_OPTIONS}
              value={sort as (typeof SORT_OPTIONS)[number]}
              onChange={handleSortChange}
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}

            <div className="ml-auto text-sm text-slate-400">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <span>
                  <span className="font-semibold text-[#1e3a5f]">
                    {filtered.length}
                  </span>{" "}
                  {filtered.length === 1 ? "book" : "books"} found
                </span>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── Main Content ── */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Error */}
        {error && (
          <Reveal>
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </Reveal>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e3a5f]/10 mb-4">
                <BookOpen className="h-8 w-8 text-[#1e3a5f]/40" />
              </div>
              <h3 className="text-lg font-semibold text-[#1e3a5f]">
                No books found
              </h3>
              <p className="mt-1 text-sm text-slate-400 max-w-xs">
                Try adjusting your search or filters to find what you are
                looking for.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white hover:bg-[#c8a96e] hover:text-[#1e3a5f] transition-all"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </Reveal>
        ) : (
          <motion.div
            key={`${page}-${debouncedQuery}-${category}-${availability}-${sort}`}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {paginated.map((book) => (
              <BookCard key={book.id} book={book} onSelect={setSelectedBook} />
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Reveal delay={0.1}>
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-[#f5f0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="px-2 text-slate-400 text-sm"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition-all ${
                          page === p
                            ? "bg-[#1e3a5f] text-white shadow-sm"
                            : "border border-[#1e3a5f]/15 bg-white text-[#1e3a5f] hover:bg-[#f5f0e8]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 rounded-lg border border-[#1e3a5f]/20 bg-white px-3 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-[#f5f0e8] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </Reveal>
        )}

        {/* Page info */}
        {!loading && filtered.length > 0 && (
          <Reveal delay={0.12}>
            <p className="mt-4 text-center text-xs text-slate-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}{" "}
              results
            </p>
          </Reveal>
        )}
      </main>

      {/* ── Book Details Slide-over ── */}
      <AnimatePresence>
        {selectedBook && (
          <BookDetailsPanel
            book={selectedBook}
            onClose={() => setSelectedBook(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}