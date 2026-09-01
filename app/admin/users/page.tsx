"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, Filter, UserCheck, UserX, Shield, BookOpen, AlertCircle, CheckCircle, XCircle, Edit, Eye, MoreVertical, Plus, Download, RefreshCw, Mail, Phone, Calendar, Hash, ChevronDown, X } from 'lucide-react';
import { Reveal } from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  member_id: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type RoleFilter = "all" | "admin" | "user";
type StatusFilter = "all" | "active" | "inactive";

// ─── Stat Card ────────────────────────────────────────────────────────────────

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
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-2xl border p-5 flex items-start gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.10)]",
        accent
          ? "bg-[var(--brand-navy)] border-[var(--brand-navy)] text-white"
          : "bg-white border-[var(--brand-border)]"
      )}
    >
      <div
        className={cn(
          "rounded-xl p-2.5 flex-shrink-0",
          accent ? "bg-white/10" : "bg-[var(--brand-cream)]"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            accent ? "text-[var(--brand-gold)]" : "text-[var(--brand-navy)]"
          )}
        />
      </div>
      <div>
        <p
          className={cn(
            "text-xs font-medium uppercase tracking-wide",
            accent ? "text-white/60" : "text-[var(--brand-muted)]"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "text-2xl font-bold mt-0.5",
            accent ? "text-white" : "text-[var(--brand-navy)]"
          )}
        >
          {value}
        </p>
        {sub && (
          <p
            className={cn(
              "text-xs mt-0.5",
              accent ? "text-white/50" : "text-[var(--brand-muted)]"
            )}
          >
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isAdmin
          ? "bg-[var(--brand-navy)] text-white"
          : "bg-[var(--brand-cream)] text-[var(--brand-navy)]"
      )}
    >
      {isAdmin ? <Shield className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
      {isAdmin ? "Admin" : "Member"}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        active
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      )}
    >
      {active ? (
        <CheckCircle className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  onClose,
  onToggleStatus,
  onToggleRole,
  saving,
}: {
  user: Profile;
  onClose: () => void;
  onToggleStatus: (id: string, current: boolean) => void;
  onToggleRole: (id: string, current: string) => void;
  saving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg rounded-2xl bg-white border border-[var(--brand-border)] shadow-[0_8px_40px_-8px_rgba(0,0,0,0.18)] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[var(--brand-navy)] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{user.full_name}</h2>
            <p className="text-white/60 text-sm">{user.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium">
                Member ID
              </p>
              <p className="text-sm font-semibold text-[var(--brand-navy)] flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                {user.member_id ?? "Not assigned"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium">
                Role
              </p>
              <RoleBadge role={user.role} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium">
                Status
              </p>
              <StatusBadge active={user.is_active} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium">
                Joined
              </p>
              <p className="text-sm font-semibold text-[var(--brand-navy)] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                {new Date(user.created_at).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {user.phone && (
              <div className="space-y-1">
                <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium">
                  Phone
                </p>
                <p className="text-sm font-semibold text-[var(--brand-navy)] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                  {user.phone}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium">
                Email
              </p>
              <p className="text-sm font-semibold text-[var(--brand-navy)] flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 text-[var(--brand-gold)] flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>
            </div>
          </div>

          {user.address && (
            <div className="rounded-xl bg-[var(--brand-cream)] px-4 py-3">
              <p className="text-xs text-[var(--brand-muted)] uppercase tracking-wide font-medium mb-1">
                Address
              </p>
              <p className="text-sm text-[var(--brand-navy)]">{user.address}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              disabled={saving}
              onClick={() => onToggleStatus(user.id, user.is_active)}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                user.is_active
                  ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              )}
            >
              {user.is_active ? (
                <UserX className="h-4 w-4" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              {user.is_active ? "Deactivate" : "Activate"}
            </button>
            <button
              disabled={saving}
              onClick={() => onToggleRole(user.id, user.role)}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold bg-[var(--brand-cream)] text-[var(--brand-navy)] border border-[var(--brand-border)] hover:bg-[var(--brand-gold)]/10 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" />
              {user.role === "admin" ? "Make Member" : "Make Admin"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const supabase = createClient();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw err;
      setUsers(data ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Derived stats ──────────────────────────────────────────────────────────

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role === "admin").length;
  const inactiveUsers = users.filter((u) => !u.is_active).length;

  // ── Filtered list ──────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.member_id ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? u.is_active : !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleToggleStatus = async (id: string, current: boolean) => {
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from("profiles")
        .update({ is_active: !current, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (err) throw err;
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: !current } : u))
      );
      if (selectedUser?.id === id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, is_active: !current } : prev
        );
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRole = async (id: string, current: string) => {
    const newRole = current === "admin" ? "user" : "admin";
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (err) throw err;
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
      );
      if (selectedUser?.id === id) {
        setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : prev));
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--brand-cream)] pb-16">
      {/* Page Header */}
      <Reveal>
        <div className="bg-[var(--brand-navy)] px-6 py-10 md:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[var(--brand-gold)] text-xs font-semibold uppercase tracking-widest mb-1">
                  Admin Panel
                </p>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  User Management
                </h1>
                <p className="text-white/60 text-sm mt-1">
                  View, manage, and control library member accounts and roles.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchUsers}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-all duration-200"
                >
                  <RefreshCw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                  Refresh
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-navy)] hover:bg-[var(--brand-gold)]/90 transition-all duration-200">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mx-auto max-w-7xl px-6 md:px-12 mt-8 space-y-8">
        {/* Stats */}
        <Reveal>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {[
              {
                icon: Users,
                label: "Total Members",
                value: totalUsers,
                sub: "registered accounts",
                accent: true,
              },
              {
                icon: UserCheck,
                label: "Active",
                value: activeUsers,
                sub: `${totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}% of total`,
              },
              {
                icon: Shield,
                label: "Admins",
                value: adminCount,
                sub: "with admin access",
              },
              {
                icon: UserX,
                label: "Inactive",
                value: inactiveUsers,
                sub: "deactivated accounts",
              },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeInUp}>
                <StatCard {...s} />
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* Search & Filters */}
        <Reveal>
          <div className="rounded-2xl bg-white border border-[var(--brand-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--brand-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, email, or member ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-cream)] pl-10 pr-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/20 focus:border-[var(--brand-navy)] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--brand-muted)] hover:text-[var(--brand-navy)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  showFilters
                    ? "bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]"
                    : "bg-[var(--brand-cream)] text-[var(--brand-navy)] border-[var(--brand-border)] hover:border-[var(--brand-navy)]"
                )}
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showFilters && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* Expanded filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-4 pt-4 border-t border-[var(--brand-border)] flex flex-wrap gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                    Role
                  </label>
                  <div className="flex gap-2">
                    {(["all", "user", "admin"] as RoleFilter[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-150",
                          roleFilter === r
                            ? "bg-[var(--brand-navy)] text-white"
                            : "bg-[var(--brand-cream)] text-[var(--brand-navy)] border border-[var(--brand-border)] hover:border-[var(--brand-navy)]"
                        )}
                      >
                        {r === "all" ? "All Roles" : r === "admin" ? "Admins" : "Members"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                    Status
                  </label>
                  <div className="flex gap-2">
                    {(["all", "active", "inactive"] as StatusFilter[]).map(
                      (s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={cn(
                            "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-150",
                            statusFilter === s
                              ? "bg-[var(--brand-navy)] text-white"
                              : "bg-[var(--brand-cream)] text-[var(--brand-navy)] border border-[var(--brand-border)] hover:border-[var(--brand-navy)]"
                          )}
                        >
                          {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {(roleFilter !== "all" || statusFilter !== "all") && (
                  <button
                    onClick={() => {
                      setRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="self-end text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" /> Clear filters
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </Reveal>

        {/* Results count */}
        <Reveal>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--brand-muted)]">
              Showing{" "}
              <span className="font-semibold text-[var(--brand-navy)]">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[var(--brand-navy)]">
                {totalUsers}
              </span>{" "}
              members
            </p>
            {search && (
              <p className="text-xs text-[var(--brand-muted)]">
                Results for &quot;{search}&quot;
              </p>
            )}
          </div>
        </Reveal>

        {/* Error */}
        {error && (
          <Reveal>
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={fetchUsers}
                className="ml-auto text-xs underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </Reveal>
        )}

        {/* Loading skeleton */}
        {loading && (
          <Reveal>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-white border border-[var(--brand-border)] animate-pulse"
                />
              ))}
            </div>
          </Reveal>
        )}

        {/* User Table */}
        {!loading && !error && (
          <Reveal>
            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-white border border-[var(--brand-border)] py-20 text-center">
                <Users className="h-12 w-12 text-[var(--brand-muted)] mx-auto mb-3 opacity-40" />
                <p className="text-[var(--brand-navy)] font-semibold text-lg">
                  No members found
                </p>
                <p className="text-[var(--brand-muted)] text-sm mt-1">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-[var(--brand-border)] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)] overflow-hidden">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--brand-border)] bg-[var(--brand-cream)]">
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Member
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Member ID
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Role
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Joined
                        </th>
                        <th className="text-right px-5 py-3.5 text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wide">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--brand-border)]">
                      {filtered.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.25 }}
                          className="hover:bg-[var(--brand-cream)]/50 transition-colors duration-150"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-[var(--brand-navy)] flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {user.full_name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-[var(--brand-navy)]">
                                  {user.full_name}
                                </p>
                                <p className="text-xs text-[var(--brand-muted)]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-mono text-xs bg-[var(--brand-cream)] border border-[var(--brand-border)] rounded-lg px-2 py-1 text-[var(--brand-navy)]">
                              {user.member_id ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <RoleBadge role={user.role} />
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge active={user.is_active} />
                          </td>
                          <td className="px-5 py-4 text-[var(--brand-muted)] text-xs">
                            {new Date(user.created_at).toLocaleDateString(
                              "en-PK",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setSelectedUser(user)}
                                className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-cream)] px-3 py-1.5 text-xs font-medium text-[var(--brand-navy)] hover:border-[var(--brand-navy)] transition-all duration-150"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() =>
                                  handleToggleStatus(user.id, user.is_active)
                                }
                                disabled={saving}
                                className={cn(
                                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
                                  user.is_active
                                    ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                )}
                              >
                                {user.is_active ? (
                                  <UserX className="h-3.5 w-3.5" />
                                ) : (
                                  <UserCheck className="h-3.5 w-3.5" />
                                )}
                                {user.is_active ? "Deactivate" : "Activate"}
                              </motion.button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-[var(--brand-border)]">
                  {filtered.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="p-4 flex items-start gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-[var(--brand-navy)] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {user.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--brand-navy)] text-sm truncate">
                            {user.full_name}
                          </p>
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="flex-shrink-0 rounded-lg p-1.5 text-[var(--brand-muted)] hover:text-[var(--brand-navy)] hover:bg-[var(--brand-cream)] transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[var(--brand-muted)] truncate">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <RoleBadge role={user.role} />
                          <StatusBadge active={user.is_active} />
                          {user.member_id && (
                            <span className="font-mono text-xs bg-[var(--brand-cream)] border border-[var(--brand-border)] rounded px-1.5 py-0.5 text-[var(--brand-navy)]">
                              {user.member_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </Reveal>
        )}

        {/* Footer note */}
        {!loading && !error && filtered.length > 0 && (
          <Reveal>
            <p className="text-center text-xs text-[var(--brand-muted)] pb-4">
              Showing {filtered.length} member{filtered.length !== 1 ? "s" : ""}.
              Changes are saved immediately to the database.
            </p>
          </Reveal>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleStatus={handleToggleStatus}
          onToggleRole={handleToggleRole}
          saving={saving}
        />
      )}
    </div>
  );
}