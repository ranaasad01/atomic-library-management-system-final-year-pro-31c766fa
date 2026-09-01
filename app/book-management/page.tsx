"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit, Trash2, X, Check, BookOpen, Filter, ChevronDown, AlertCircle, Image, Save } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

type Book = Database["public"]["Tables"]["books"]["Row"];

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
];

const AVAILABILITY = ["All", "Available", "Issued Out", "Low Stock"];

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

type FormData = typeof EMPTY_FORM;

function getAvailBadge(available: number, total: number) {
  if (available === 0)
    return { label: "Issued Out", cls: "bg-red-100 text-red-700 border-red-200" };
  if (available === 1)
    return { label: "Low Stock", cls: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Available", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" };
}

export default function BookManagementPage() {
  const supabase = createClient();

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [availFilter, setAvailFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
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
      availFilter === "All" ||
      (availFilter === "Available" && b.available_copies > 1) ||
      (availFilter === "Issued Out" && b.available_copies === 0) ||
      (availFilter === "Low Stock" && b.available_copies === 1);
    return matchSearch && matchCat && matchAvail;
  });

  function openAdd() {
    setEditingBook(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(book: Book) {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn ?? "",
      category: book.category ?? "",
      publisher: book.publisher ?? "",
      publication_year: book.publication_year?.toString() ?? "",
      total_copies: book.total_copies.toString(),
      available_copies: book.available_copies.toString(),
      shelf_location: book.shelf_location ?? "",
      description: book.description ?? "",
      cover_url: book.cover_url ?? "",
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingBook(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  }

  function handleField(key: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!formData.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formData.author.trim()) {
      setFormError("Author is required.");
      return;
    }
    const totalCopies = parseInt(formData.total_copies, 10);
    const availCopies = parseInt(formData.available_copies, 10);
    if (isNaN(totalCopies) || totalCopies < 1) {
      setFormError("Total copies must be at least 1.");
      return;
    }
    if (isNaN(availCopies) || availCopies < 0 || availCopies > totalCopies) {
      setFormError("Available copies must be between 0 and total copies.");
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      title: formData.title.trim(),
      author: formData.author.trim(),
      isbn: formData.isbn.trim() || null,
      category: formData.category || null,
      publisher: formData.publisher.trim() || null,
      publication_year: formData.publication_year
        ? parseInt(formData.publication_year, 10)
        : null,
      total_copies: totalCopies,
      available_copies: availCopies,
      shelf_location: formData.shelf_location.trim() || null,
      description: formData.description.trim() || null,
      cover_url: formData.cover_url.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingBook) {
      const { error: err } = await supabase
        .from("books")
        .update(payload)
        .eq("id", editingBook.id);
      if (err) {
        setFormError(err.message);
        setSaving(false);
        return;
      }
      showToast("Book updated successfully.");
    } else {
      const { error: err } = await supabase.from("books").insert({
        ...payload,
        created_at: new Date().toISOString(),
      });
      if (err) {
        setFormError(err.message);
        setSaving(false);
        return;
      }
      showToast("Book added successfully.");
    }

    setSaving(false);
    closeModal();
    fetchBooks();
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    const { error: err } = await supabase.from("books").delete().eq("id", id);
    if (err) {
      showToast(err.message, "error");
    } else {
      showToast("Book deleted.");
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
    setDeleting(false);
    setDeleteConfirm(null);
  }

  const totalBooks = books.length;
  const totalCopies = books.reduce((s, b) => s + b.total_copies, 0);
  const availableNow = books.filter((b) => b.available_copies > 0).length;
  const issuedOut = books.filter((b) => b.available_copies === 0).length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-lg border",
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-red-50 text-red-800 border-red-200"
            )}
          >
            {toast.type === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            key="delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl border border-black/5 p-8 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--brand-dark)] text-lg">Delete Book</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Are you sure you want to remove this book from the catalogue? All associated data will be affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete Book"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-white rounded-2xl shadow-2xl border border-black/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-[var(--brand-primary)]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[var(--brand-dark)]">
                    {editingBook ? "Edit Book" : "Add New Book"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {formError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleField("title", e.target.value)}
                      placeholder="e.g. Introduction to Algorithms"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => handleField("author", e.target.value)}
                      placeholder="e.g. Thomas H. Cormen"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      ISBN
                    </label>
                    <input
                      type="text"
                      value={formData.isbn}
                      onChange={(e) => handleField("isbn", e.target.value)}
                      placeholder="e.g. 978-0-262-03384-8"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleField("category", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors bg-white"
                    >
                      <option value="">Select category</option>
                      {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Publisher
                    </label>
                    <input
                      type="text"
                      value={formData.publisher}
                      onChange={(e) => handleField("publisher", e.target.value)}
                      placeholder="e.g. MIT Press"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Publication Year
                    </label>
                    <input
                      type="number"
                      value={formData.publication_year}
                      onChange={(e) => handleField("publication_year", e.target.value)}
                      placeholder="e.g. 2022"
                      min="1800"
                      max="2099"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Total Copies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.total_copies}
                      onChange={(e) => handleField("total_copies", e.target.value)}
                      min="1"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Available Copies <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.available_copies}
                      onChange={(e) => handleField("available_copies", e.target.value)}
                      min="0"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Shelf Location
                    </label>
                    <input
                      type="text"
                      value={formData.shelf_location}
                      onChange={(e) => handleField("shelf_location", e.target.value)}
                      placeholder="e.g. A-12, Row 3"
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.cover_url}
                      onChange={(e) => handleField("cover_url", e.target.value)}
                      placeholder="https://..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleField("description", e.target.value)}
                      rows={3}
                      placeholder="Brief description of the book..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-primary)]/90 transition-colors disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : editingBook ? "Save Changes" : "Add Book"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--brand-dark)] tracking-tight">
                Book Management
              </h1>
              <p className="mt-1 text-gray-500 text-sm">
                Add, edit, and manage the library catalogue for NCBA&amp;E Central Library.
              </p>
            </div>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-primary)]/90 transition-all duration-200 hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Add New Book
            </button>
          </div>
        </Reveal>

        {/* Stats Row */}
        <Reveal delay={0.05}>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: "Total Titles", value: totalBooks, color: "text-[var(--brand-primary)]", bg: "bg-[var(--brand-primary)]/8" },
              { label: "Total Copies", value: totalCopies, color: "text-[var(--brand-gold)]", bg: "bg-[var(--brand-gold)]/10" },
              { label: "Available Now", value: availableNow, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Fully Issued", value: issuedOut, color: "text-red-600", bg: "bg-red-50" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
              >
                <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3", stat.bg)}>
                  <BookOpen className={cn("h-5 w-5", stat.color)} />
                </div>
                <div className={cn("text-2xl font-bold", stat.color)}>{loading ? "—" : stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Search & Filters */}
        <Reveal delay={0.1}>
          <div className="bg-white rounded-2xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, author, ISBN, or category..."
                  className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-colors"
                />
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                  showFilters
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFilters && "rotate-180")} />
              </button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 mt-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Category
                      </label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] bg-white"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Availability
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABILITY.map((a) => (
                          <button
                            key={a}
                            onClick={() => setAvailFilter(a)}
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                              availFilter === a
                                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]"
                                : "border-gray-200 text-gray-600 hover:border-[var(--brand-primary)]/40"
                            )}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Reveal>

        {/* Results count */}
        <Reveal delay={0.12}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? "Loading catalogue..." : `${filtered.length} book${filtered.length !== 1 ? "s" : ""} found`}
            </p>
            {(search || categoryFilter !== "All Categories" || availFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("All Categories");
                  setAvailFilter("All");
                }}
                className="text-xs text-[var(--brand-primary)] hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </Reveal>

        {/* Book Table / Cards */}
        <Reveal delay={0.15}>
          {loading ? (
            <div className="bg-white rounded-2xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0 animate-pulse"
                >
                  <div className="h-12 w-9 rounded-lg bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-20 bg-gray-100 rounded-full" />
                  <div className="h-8 w-16 bg-gray-100 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-100 p-10 text-center">
              <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 font-medium">Failed to load books</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <button
                onClick={fetchBooks}
                className="mt-4 rounded-xl bg-[var(--brand-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-primary)]/90 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/5 p-14 text-center">
              <BookOpen className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No books found</p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? "Try a different search term or clear the filters." : "Start by adding your first book to the catalogue."}
              </p>
              {!search && (
                <button
                  onClick={openAdd}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-primary)]/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add First Book
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-2xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.08)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Book</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copies</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shelf</th>
                      <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-right px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <AnimatePresence>
                      {filtered.map((book, i) => {
                        const badge = getAvailBadge(book.available_copies, book.total_copies);
                        return (
                          <motion.tr
                            key={book.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.25 }}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-9 rounded-lg bg-[var(--brand-primary)]/8 flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--brand-primary)]/10">
                                  {book.cover_url ? (
                                    <img
                                      src={book.cover_url}
                                      alt={book.title}
                                      className="h-full w-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <Image className="h-4 w-4 text-[var(--brand-primary)]/40" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[var(--brand-dark)] truncate max-w-[200px]">
                                    {book.title}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {book.author}
                                    {book.publication_year ? ` · ${book.publication_year}` : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-600 text-xs">
                                {book.category ?? <span className="text-gray-300">—</span>}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-700 font-medium">
                                {book.available_copies}
                                <span className="text-gray-400 font-normal">/{book.total_copies}</span>
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-500 text-xs font-mono">
                                {book.shelf_location ?? <span className="text-gray-300">—</span>}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", badge.cls)}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => openEdit(book)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-3 py-1.5 text-xs font-medium text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                  Edit
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => setDeleteConfirm(book.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </motion.button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                <AnimatePresence>
                  {filtered.map((book, i) => {
                    const badge = getAvailBadge(book.available_copies, book.total_copies);
                    return (
                      <motion.div
                        key={book.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className="bg-white rounded-2xl border border-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-4px_rgba(0,0,0,0.08)] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-10 rounded-lg bg-[var(--brand-primary)]/8 flex items-center justify-center flex-shrink-0 overflow-hidden border border-[var(--brand-primary)]/10">
                            {book.cover_url ? (
                              <img
                                src={book.cover_url}
                                alt={book.title}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Image className="h-4 w-4 text-[var(--brand-primary)]/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--brand-dark)] text-sm leading-tight">
                              {book.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", badge.cls)}>
                                {badge.label}
                              </span>
                              {book.category && (
                                <span className="text-xs text-gray-400">{book.category}</span>
                              )}
                              <span className="text-xs text-gray-500 font-medium">
                                {book.available_copies}/{book.total_copies} copies
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                          <button
                            onClick={() => openEdit(book)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--brand-primary)]/20 bg-[var(--brand-primary)]/5 px-3 py-2 text-xs font-medium text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(book.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </Reveal>
      </div>
    </div>
  );
}