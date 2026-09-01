"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit, Trash2, X, Check, BookOpen, AlertCircle, ChevronDown, Save, Eye, Filter } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type BookRow = Database["public"]["Tables"]["books"]["Row"];

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

const EMPTY_FORM = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  publisher: "",
  publication_year: "",
  total_copies: "1",
  available_copies: "1",
  shelf_location: "",
  description: "",
  cover_url: "",
};

type FormState = typeof EMPTY_FORM;

function Badge({ available, total }: { available: number; total: number }) {
  if (available === 0)
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        Unavailable
      </span>
    );
  if (available <= 1)
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        Low Stock
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      Available ({available}/{total})
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]",
        accent
          ? "border-[var(--brand-gold)]/30 bg-[var(--brand-navy)] text-white"
          : "border-[var(--brand-gold)]/20 bg-white"
      )}
    >
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-widest",
          accent ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]/60"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-3xl font-bold tracking-tight",
          accent ? "text-white" : "text-[var(--brand-navy)]"
        )}
      >
        {value}
      </p>
      {sub && (
        <p
          className={cn(
            "mt-0.5 text-xs",
            accent ? "text-white/60" : "text-[var(--brand-navy)]/50"
          )}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function BookFormModal({
  open,
  onClose,
  onSave,
  initial,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
  initial?: BookRow | null;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          title: initial.title ?? "",
          author: initial.author ?? "",
          isbn: initial.isbn ?? "",
          category: initial.category ?? "",
          publisher: initial.publisher ?? "",
          publication_year: initial.publication_year?.toString() ?? "",
          total_copies: initial.total_copies?.toString() ?? "1",
          available_copies: initial.available_copies?.toString() ?? "1",
          shelf_location: initial.shelf_location ?? "",
          description: initial.description ?? "",
          cover_url: initial.cover_url ?? "",
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setError(null);
    }
  }, [open, initial]);

  const set = (k: keyof FormState, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setError("Title and Author are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--brand-gold)]/20 bg-white shadow-[0_8px_48px_-8px_rgba(0,0,0,0.24)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--brand-gold)]/15 bg-white px-6 py-4">
                <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                  {initial ? "Edit Book" : "Add New Book"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--brand-navy)]/50 transition-colors hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g. Introduction to Algorithms"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={form.author}
                      onChange={(e) => set("author", e.target.value)}
                      placeholder="e.g. Thomas H. Cormen"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      ISBN
                    </label>
                    <input
                      value={form.isbn}
                      onChange={(e) => set("isbn", e.target.value)}
                      placeholder="978-0-262-03384-8"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={form.category}
                        onChange={(e) => set("category", e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.filter((c) => c !== "All Categories").map(
                          (c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          )
                        )}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-navy)]/40" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Publisher
                    </label>
                    <input
                      value={form.publisher}
                      onChange={(e) => set("publisher", e.target.value)}
                      placeholder="e.g. MIT Press"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Publication Year
                    </label>
                    <input
                      type="number"
                      value={form.publication_year}
                      onChange={(e) => set("publication_year", e.target.value)}
                      placeholder="2024"
                      min="1800"
                      max="2099"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Total Copies
                    </label>
                    <input
                      type="number"
                      value={form.total_copies}
                      onChange={(e) => set("total_copies", e.target.value)}
                      min="1"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Available Copies
                    </label>
                    <input
                      type="number"
                      value={form.available_copies}
                      onChange={(e) => set("available_copies", e.target.value)}
                      min="0"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Shelf Location
                    </label>
                    <input
                      value={form.shelf_location}
                      onChange={(e) => set("shelf_location", e.target.value)}
                      placeholder="e.g. A-12"
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Cover Image URL
                    </label>
                    <input
                      value={form.cover_url}
                      onChange={(e) => set("cover_url", e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/60">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => set("description", e.target.value)}
                      rows={3}
                      placeholder="Brief description of the book..."
                      className="w-full resize-none rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)]/40 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[var(--brand-gold)]/15 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl border border-[var(--brand-gold)]/25 px-5 py-2.5 text-sm font-medium text-[var(--brand-navy)] transition hover:bg-[var(--brand-cream)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-navy)]/90 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : initial ? "Update Book" : "Add Book"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DeleteConfirmModal({
  open,
  book,
  onClose,
  onConfirm,
}: {
  open: boolean;
  book: BookRow | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && book && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-[0_8px_48px_-8px_rgba(0,0,0,0.24)]">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--brand-navy)]">
                Delete Book
              </h3>
              <p className="mt-2 text-sm text-[var(--brand-navy)]/60">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-[var(--brand-navy)]">
                  &ldquo;{book.title}&rdquo;
                </span>
                ? This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-[var(--brand-gold)]/25 py-2.5 text-sm font-medium text-[var(--brand-navy)] transition hover:bg-[var(--brand-cream)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ViewBookModal({
  open,
  book,
  onClose,
}: {
  open: boolean;
  book: BookRow | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && book && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--brand-gold)]/20 bg-white shadow-[0_8px_48px_-8px_rgba(0,0,0,0.24)]">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--brand-gold)]/15 bg-white px-6 py-4">
                <h2 className="text-lg font-semibold text-[var(--brand-navy)]">
                  Book Details
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[var(--brand-navy)]/50 transition-colors hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex gap-4">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="h-28 w-20 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-black/5"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-cream)] ring-1 ring-[var(--brand-gold)]/20">
                      <BookOpen className="h-8 w-8 text-[var(--brand-gold)]" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold leading-snug text-[var(--brand-navy)]">
                      {book.title}
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--brand-navy)]/60">
                      {book.author}
                    </p>
                    <div className="mt-2">
                      <Badge
                        available={book.available_copies}
                        total={book.total_copies}
                      />
                    </div>
                    {book.category && (
                      <span className="mt-2 inline-block rounded-full bg-[var(--brand-navy)]/8 px-2.5 py-0.5 text-xs font-medium text-[var(--brand-navy)]/70">
                        {book.category}
                      </span>
                    )}
                  </div>
                </div>

                <dl className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: "ISBN", value: book.isbn },
                    { label: "Publisher", value: book.publisher },
                    {
                      label: "Year",
                      value: book.publication_year?.toString(),
                    },
                    { label: "Shelf", value: book.shelf_location },
                    {
                      label: "Total Copies",
                      value: book.total_copies?.toString(),
                    },
                    {
                      label: "Available",
                      value: book.available_copies?.toString(),
                    },
                  ].map(({ label, value }) =>
                    value ? (
                      <div
                        key={label}
                        className="rounded-xl bg-[var(--brand-cream)]/60 px-3 py-2"
                      >
                        <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          {label}
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-[var(--brand-navy)]">
                          {value}
                        </dd>
                      </div>
                    ) : null
                  )}
                </dl>

                {book.description && (
                  <div className="mt-4 rounded-xl bg-[var(--brand-cream)]/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                      Description
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--brand-navy)]/70">
                      {book.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminBooksPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<BookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [availFilter, setAvailFilter] = useState<"all" | "available" | "unavailable">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editBook, setEditBook] = useState<BookRow | null>(null);
  const [viewBook, setViewBook] = useState<BookRow | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteBook, setDeleteBook] = useState<BookRow | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setBooks(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filtered = books.filter((b) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.isbn ?? "").toLowerCase().includes(q) ||
      (b.category ?? "").toLowerCase().includes(q);
    const matchCat =
      categoryFilter === "All Categories" || b.category === categoryFilter;
    const matchAvail =
      availFilter === "all"
        ? true
        : availFilter === "available"
        ? b.available_copies > 0
        : b.available_copies === 0;
    return matchSearch && matchCat && matchAvail;
  });

  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableCopies = books.reduce((s, b) => s + b.available_copies, 0);
  const issuedCopies = totalCopies - availableCopies;

  const handleSave = async (form: FormState) => {
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn.trim() || null,
      category: form.category || null,
      publisher: form.publisher.trim() || null,
      publication_year: form.publication_year
        ? parseInt(form.publication_year, 10)
        : null,
      total_copies: parseInt(form.total_copies, 10) || 1,
      available_copies: parseInt(form.available_copies, 10) || 0,
      shelf_location: form.shelf_location.trim() || null,
      description: form.description.trim() || null,
      cover_url: form.cover_url.trim() || null,
    };

    if (editBook) {
      const { error: err } = await supabase
        .from("books")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editBook.id);
      if (err) throw new Error(err.message);
      showToast("Book updated successfully.");
    } else {
      const { error: err } = await supabase.from("books").insert([payload]);
      if (err) throw new Error(err.message);
      showToast("Book added successfully.");
    }

    setModalOpen(false);
    setEditBook(null);
    await fetchBooks();
  };

  const handleDelete = async () => {
    if (!deleteBook) return;
    const { error: err } = await supabase
      .from("books")
      .delete()
      .eq("id", deleteBook.id);
    if (err) {
      showToast(err.message, false);
    } else {
      showToast("Book deleted.");
      await fetchBooks();
    }
    setDeleteOpen(false);
    setDeleteBook(null);
  };

  return (
    <main className="min-h-screen bg-[var(--brand-cream)]/30 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={cn(
              "fixed right-4 top-4 z-[100] flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg",
              toast.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            )}
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast.ok ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <Reveal>
        <div className="border-b border-[var(--brand-gold)]/15 bg-white px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[var(--brand-gold)]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-navy)]/50">
                    Admin Panel
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--brand-navy)] sm:text-3xl">
                  Book Management
                </h1>
                <p className="mt-1 text-sm text-[var(--brand-navy)]/55">
                  Add, edit, and manage the library catalogue. {totalBooks} titles in collection.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditBook(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-navy)]/90"
              >
                <Plus className="h-4 w-4" />
                Add New Book
              </motion.button>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl space-y-6 px-4 pt-8 sm:px-8">
        {/* Stats */}
        <Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="Total Titles"
              value={totalBooks}
              sub="Unique books"
              accent
            />
            <StatCard
              label="Total Copies"
              value={totalCopies}
              sub="Across all titles"
            />
            <StatCard
              label="Available"
              value={availableCopies}
              sub="Ready to issue"
            />
            <StatCard
              label="Issued Out"
              value={issuedCopies}
              sub="Currently borrowed"
            />
          </div>
        </Reveal>

        {/* Filters */}
        <Reveal>
          <div className="rounded-2xl border border-[var(--brand-gold)]/15 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-navy)]/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, ISBN, or category..."
                  className="w-full rounded-xl border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/40 py-2.5 pl-9 pr-4 text-sm text-[var(--brand-navy)] placeholder-[var(--brand-navy)]/35 outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 shrink-0 text-[var(--brand-navy)]/40" />
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none rounded-xl border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/40 py-2.5 pl-3 pr-8 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-navy)]/40" />
                </div>

                <div className="relative">
                  <select
                    value={availFilter}
                    onChange={(e) =>
                      setAvailFilter(
                        e.target.value as "all" | "available" | "unavailable"
                      )
                    }
                    className="appearance-none rounded-xl border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)]/40 py-2.5 pl-3 pr-8 text-sm text-[var(--brand-navy)] outline-none transition focus:border-[var(--brand-gold)] focus:ring-2 focus:ring-[var(--brand-gold)]/20"
                  >
                    <option value="all">All Availability</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-navy)]/40" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Table */}
        <Reveal>
          <div className="overflow-hidden rounded-2xl border border-[var(--brand-gold)]/15 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <motion.div
                  className="h-8 w-8 rounded-full border-2 border-[var(--brand-gold)] border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-sm text-[var(--brand-navy)]/50">
                  Loading books...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <AlertCircle className="h-8 w-8 text-red-400" />
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={fetchBooks}
                  className="rounded-xl border border-[var(--brand-gold)]/25 px-4 py-2 text-sm font-medium text-[var(--brand-navy)] transition hover:bg-[var(--brand-cream)]"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <BookOpen className="h-10 w-10 text-[var(--brand-gold)]/50" />
                <p className="text-sm font-medium text-[var(--brand-navy)]/60">
                  {search || categoryFilter !== "All Categories" || availFilter !== "all"
                    ? "No books match your filters."
                    : "No books in the catalogue yet."}
                </p>
                {!search && categoryFilter === "All Categories" && availFilter === "all" && (
                  <button
                    onClick={() => {
                      setEditBook(null);
                      setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-navy)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-navy)]/90"
                  >
                    <Plus className="h-4 w-4" /> Add First Book
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--brand-gold)]/10 bg-[var(--brand-cream)]/50">
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          Book
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          Category
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          ISBN
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          Shelf
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          Copies
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          Status
                        </th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--brand-navy)]/50">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-gold)]/8">
                      <AnimatePresence initial={false}>
                        {filtered.map((book) => (
                          <motion.tr
                            key={book.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="group transition-colors hover:bg-[var(--brand-cream)]/30"
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                {book.cover_url ? (
                                  <img
                                    src={book.cover_url}
                                    alt={book.title}
                                    className="h-10 w-7 shrink-0 rounded-md object-cover shadow-sm ring-1 ring-black/5"
                                    onError={(e) => {
                                      (
                                        e.currentTarget as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-10 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--brand-cream)] ring-1 ring-[var(--brand-gold)]/20">
                                    <BookOpen className="h-4 w-4 text-[var(--brand-gold)]" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="max-w-[200px] truncate font-semibold text-[var(--brand-navy)]">
                                    {book.title}
                                  </p>
                                  <p className="truncate text-xs text-[var(--brand-navy)]/50">
                                    {book.author}
                                    {book.publication_year
                                      ? ` · ${book.publication_year}`
                                      : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              {book.category ? (
                                <span className="rounded-full bg-[var(--brand-navy)]/8 px-2.5 py-0.5 text-xs font-medium text-[var(--brand-navy)]/70">
                                  {book.category}
                                </span>
                              ) : (
                                <span className="text-xs text-[var(--brand-navy)]/30">
                                  —
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4 font-mono text-xs text-[var(--brand-navy)]/60">
                              {book.isbn ?? "—"}
                            </td>
                            <td className="px-4 py-4 text-xs text-[var(--brand-navy)]/60">
                              {book.shelf_location ?? "—"}
                            </td>
                            <td className="px-4 py-4 text-xs text-[var(--brand-navy)]/70">
                              {book.available_copies}/{book.total_copies}
                            </td>
                            <td className="px-4 py-4">
                              <Badge
                                available={book.available_copies}
                                total={book.total_copies}
                              />
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setViewBook(book);
                                    setViewOpen(true);
                                  }}
                                  className="rounded-lg p-1.5 text-[var(--brand-navy)]/40 transition hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)]"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setEditBook(book);
                                    setModalOpen(true);
                                  }}
                                  className="rounded-lg p-1.5 text-[var(--brand-navy)]/40 transition hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)]"
                                  title="Edit book"
                                >
                                  <Edit className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    setDeleteBook(book);
                                    setDeleteOpen(true);
                                  }}
                                  className="rounded-lg p-1.5 text-[var(--brand-navy)]/40 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete book"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="divide-y divide-[var(--brand-gold)]/8 md:hidden">
                  {filtered.map((book) => (
                    <div key={book.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="h-14 w-10 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-black/5"
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-cream)] ring-1 ring-[var(--brand-gold)]/20">
                            <BookOpen className="h-5 w-5 text-[var(--brand-gold)]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[var(--brand-navy)]">
                            {book.title}
                          </p>
                          <p className="text-xs text-[var(--brand-navy)]/55">
                            {book.author}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                              available={book.available_copies}
                              total={book.total_copies}
                            />
                            {book.category && (
                              <span className="rounded-full bg-[var(--brand-navy)]/8 px-2 py-0.5 text-xs text-[var(--brand-navy)]/60">
                                {book.category}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            onClick={() => {
                              setViewBook(book);
                              setViewOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-[var(--brand-navy)]/40 transition hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)]"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditBook(book);
                              setModalOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-[var(--brand-navy)]/40 transition hover:bg-[var(--brand-cream)] hover:text-[var(--brand-navy)]"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteBook(book);
                              setDeleteOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-[var(--brand-navy)]/40 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--brand-gold)]/10 px-5 py-3">
                  <p className="text-xs text-[var(--brand-navy)]/45">
                    Showing {filtered.length} of {totalBooks} book
                    {totalBooks !== 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>

      {/* Modals */}
      <BookFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditBook(null);
        }}
        onSave={handleSave}
        initial={editBook}
        loading={loading}
      />

      <ViewBookModal
        open={viewOpen}
        book={viewBook}
        onClose={() => {
          setViewOpen(false);
          setViewBook(null);
        }}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        book={deleteBook}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteBook(null);
        }}
        onConfirm={handleDelete}
      />
    </main>
  );
}