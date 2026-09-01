"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, ChevronDown, X, Star, MapPin, Calendar, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Book } from "@/lib/data";

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
  { label: "Relevance", value: "relevance" },
  { label: "Title A–Z", value: "title_asc" },
  { label: "Title Z–A", value: "title_desc" },
  { label: "Newest Additions", value: "newest" },
] as const;

type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number];
type SortOption = (typeof SORT_OPTIONS)[number]["value"];

function getAvailabilityBadge(available: number, total: number) {
  if (available === 0) return { label: "Issued", variant: "issued" as const };
  if (available === 1) return { label: "Low Stock", variant: "low" as const };
  return { label: "Available", variant: "available" as const };
}

function BadgePill({ variant, label }: { variant: "available" | "low" | "issued"; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "available" && "bg-emerald-100 text-emerald-800",
        variant === "low" && "bg-amber-100 text-amber-800",
        variant === "issued" && "bg-red-100 text-red-700",
      )}
    >
      {label}
    </span>
  );
}

function BookCard({ book }: { book: Book }) {
  const badge = getAvailabilityBadge(book.available_copies, book.total_copies);
  const coverFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=1e3a5f&color=f5f0e8&size=200&bold=true&length=2`;

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 12px 32px -8px rgba(30,58,95,0.18)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-white overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300"
    >
      <div className="relative h-44 bg-[var(--navy-light)] overflow-hidden">
        <img
          src={book.cover_url || coverFallback}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = coverFallback;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy)]/60 to-transparent" />
        <div className="absolute bottom-2 left-2">
          <BadgePill variant={badge.variant} label={badge.label} />
        </div>
        {book.category && (
          <div className="absolute top-2 right-2">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-[var(--navy)]">
              {book.category}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 gap-2">
        <h3 className="font-semibold text-[var(--navy)] leading-snug line-clamp-2 text-sm">
          {book.title}
        </h3>
        <p className="text-xs text-[var(--muted)] font-medium">{book.author}</p>

        {book.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-1">
            {book.description}
          </p>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 space-y-1.5">
          {book.shelf_location && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{book.shelf_location}</span>
            </div>
          )}
          {book.publication_year && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>{book.publication_year}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Copy className="h-3 w-3 shrink-0" />
            <span>
              {book.available_copies} of {book.total_copies} copies available
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BookListRow({ book }: { book: Book }) {
  const badge = getAvailabilityBadge(book.available_copies, book.total_copies);
  const coverFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(book.title)}&background=1e3a5f&color=f5f0e8&size=80&bold=true&length=2`;

  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(30,58,95,0.03)" }}
      className="flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200"
    >
      <div className="h-16 w-12 shrink-0 rounded-lg overflow-hidden bg-[var(--navy-light)]">
        <img
          src={book.cover_url || coverFallback}
          alt={book.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = coverFallback;
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-[var(--navy)] text-sm truncate">{book.title}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">{book.author}</p>
          </div>
          <BadgePill variant={badge.variant} label={badge.label} />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          {book.category && (
            <span className="text-xs text-gray-500">{book.category}</span>
          )}
          {book.isbn && (
            <span className="text-xs text-gray-400">ISBN: {book.isbn}</span>
          )}
          {book.shelf_location && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <MapPin className="h-3 w-3" /> {book.shelf_location}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Copy className="h-3 w-3" /> {book.available_copies}/{book.total_copies} copies
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function BookSearchPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [availability, setAvailability] = useState<AvailabilityOption>("All Books");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      let q = supabase.from("books").select("*");

      if (debouncedQuery.trim()) {
        q = q.or(
          `title.ilike.%${debouncedQuery}%,author.ilike.%${debouncedQuery}%,isbn.ilike.%${debouncedQuery}%,publisher.ilike.%${debouncedQuery}%`
        );
      }

      if (selectedCategory !== "All Categories") {
        q = q.eq("category", selectedCategory);
      }

      if (availability === "Available Now") {
        q = q.gt("available_copies", 1);
      } else if (availability === "Currently Issued") {
        q = q.eq("available_copies", 0);
      } else if (availability === "Low Stock") {
        q = q.eq("available_copies", 1);
      }

      if (sortBy === "title_asc") {
        q = q.order("title", { ascending: true });
      } else if (sortBy === "title_desc") {
        q = q.order("title", { ascending: false });
      } else if (sortBy === "newest") {
        q = q.order("created_at", { ascending: false });
      } else {
        q = q.order("title", { ascending: true });
      }

      const { data, error: fetchError } = await q;
      if (fetchError) throw fetchError;
      setBooks((data as Book[]) ?? []);
    } catch (err) {
      console.error("Failed to fetch books:", err);
      setError("Failed to load books. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, selectedCategory, availability, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("All Categories");
    setAvailability("All Books");
    setSortBy("relevance");
  };

  const hasActiveFilters =
    query.trim() !== "" ||
    selectedCategory !== "All Categories" ||
    availability !== "All Books" ||
    sortBy !== "relevance";

  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Hero Search Header */}
      <Reveal>
        <section className="bg-[var(--navy)] py-14 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 mb-5">
              <BookOpen className="h-4 w-4 text-[var(--gold)]" />
              <span className="text-sm font-medium text-white/90">NCBA&amp;E Central Library</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight text-balance mb-3">
              Search the Book Catalogue
            </h1>
            <p className="text-white/70 text-base mb-8 text-pretty max-w-xl mx-auto">
              Browse thousands of titles across all departments. Filter by category, availability, and more.
            </p>

            {/* Main Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN, or publisher..."
                className="w-full rounded-2xl border-0 bg-white pl-12 pr-12 py-4 text-[var(--navy)] placeholder-gray-400 shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Filters Bar */}
      <Reveal>
        <section className="sticky top-0 z-20 bg-white border-b border-[var(--border-subtle)] shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 py-2 text-sm text-[var(--navy)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Availability Filter */}
              <div className="relative">
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as AvailabilityOption)}
                  className="appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 py-2 text-sm text-[var(--navy)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] cursor-pointer"
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none rounded-xl border border-gray-200 bg-gray-50 pl-3 pr-8 py-2 text-sm text-[var(--navy)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--gold)] cursor-pointer"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </button>
              )}

              <div className="ml-auto flex items-center gap-2">
                {/* View toggle */}
                <div className="flex rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "px-3 py-2 text-sm transition-colors",
                      viewMode === "grid"
                        ? "bg-[var(--navy)] text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    )}
                    title="Grid view"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="1" width="6" height="6" rx="1" />
                      <rect x="9" y="1" width="6" height="6" rx="1" />
                      <rect x="1" y="9" width="6" height="6" rx="1" />
                      <rect x="9" y="9" width="6" height="6" rx="1" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "px-3 py-2 text-sm transition-colors",
                      viewMode === "list"
                        ? "bg-[var(--navy)] text-white"
                        : "bg-white text-gray-500 hover:bg-gray-50"
                    )}
                    title="List view"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                      <rect x="1" y="2" width="14" height="2.5" rx="1" />
                      <rect x="1" y="6.75" width="14" height="2.5" rx="1" />
                      <rect x="1" y="11.5" width="14" height="2.5" rx="1" />
                    </svg>
                  </button>
                </div>

                {!loading && (
                  <span className="text-sm text-[var(--muted)] whitespace-nowrap">
                    {books.length} {books.length === 1 ? "book" : "books"} found
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--navy)]" />
            <p className="text-[var(--muted)] text-sm">Searching the catalogue...</p>
          </div>
        ) : error ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchBooks}
                className="rounded-xl bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--navy-light)] transition-colors"
              >
                Try again
              </button>
            </div>
          </Reveal>
        ) : books.length === 0 ? (
          <Reveal>
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <BookOpen className="h-14 w-14 text-gray-300" />
              <h2 className="text-lg font-semibold text-[var(--navy)]">No books found</h2>
              <p className="text-[var(--muted)] text-sm max-w-sm">
                {hasActiveFilters
                  ? "Try adjusting your search terms or filters to find what you're looking for."
                  : "The catalogue appears to be empty. Check back later."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="rounded-xl bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </Reveal>
        ) : viewMode === "grid" ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5"
          >
            {books.map((book, i) => (
              <motion.div key={book.id} variants={fadeInUp}>
                <BookCard book={book} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {books.map((book, i) => (
              <motion.div key={book.id} variants={fadeInUp}>
                <BookListRow book={book} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Category Quick-Browse */}
      {!loading && !error && books.length > 0 && (
        <Reveal>
          <section className="bg-white border-t border-[var(--border-subtle)] py-12 px-4">
            <div className="mx-auto max-w-7xl">
              <h2 className="text-lg font-bold text-[var(--navy)] mb-6">Browse by Category</h2>
              <div className="flex flex-wrap gap-3">
                {CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200",
                      selectedCategory === cat
                        ? "border-[var(--navy)] bg-[var(--navy)] text-white shadow-md"
                        : "border-gray-200 bg-gray-50 text-[var(--navy)] hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}