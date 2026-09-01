"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Menu, X, BookOpen, User, LogOut, ChevronDown } from 'lucide-react';
import { navLinks } from "@/lib/data";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navT = (t.raw("nav") ?? {}) as Record<string, string>;

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      if (pathname === "/") {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      }
      // If not on homepage, let the getLinkHref redirect to /#section — no preventDefault
    }
    setMobileOpen(false);
  };

  const getLinkHref = (href: string): string => {
    if (href.startsWith("/")) {
      // Route link — return as-is
      return href;
    }
    if (href.startsWith("#")) {
      // Anchor link — smooth scroll on homepage, navigate to /#anchor elsewhere
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: "var(--primary)",
        borderColor: "rgba(200,169,110,0.2)",
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--accent)" }}
            >
              <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div className="hidden sm:block">
              <span
                className="text-sm font-700 leading-tight block"
                style={{ color: "var(--card)", fontWeight: 700 }}
              >
                NCBA&amp;E Library
              </span>
              <span
                className="text-xs leading-tight block"
                style={{ color: "rgba(200,169,110,0.85)" }}
              >
                Management System
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {/* Home link */}
            <Link
              href="/"
              onClick={(e) => handleNavClick(e, "/")}
              className="px-3 py-2 rounded text-sm font-medium transition-all duration-200"
              style={{
                color: isActive("/") && pathname === "/"
                  ? "var(--accent)"
                  : "rgba(245,240,232,0.85)",
                backgroundColor: isActive("/") && pathname === "/"
                  ? "rgba(200,169,110,0.12)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!(isActive("/") && pathname === "/")) {
                  (e.currentTarget as HTMLElement).style.color = "var(--card)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!(isActive("/") && pathname === "/")) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.85)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }
              }}
            >
              Home
            </Link>

            {navLinks.map((link) => {
              const label = navT[link.key] ?? link.label;
              const href = getLinkHref(link.href);
              const active = isActive(link.href);
              return (
                <Link
                  key={link.key}
                  href={href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-2 rounded text-sm font-medium transition-all duration-200"
                  style={{
                    color: active
                      ? "var(--accent)"
                      : "rgba(245,240,232,0.85)",
                    backgroundColor: active
                      ? "rgba(200,169,110,0.12)"
                      : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "var(--card)";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.85)";
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}

            {/* About link */}
            <Link
              href="/about"
              onClick={(e) => handleNavClick(e, "/about")}
              className="px-3 py-2 rounded text-sm font-medium transition-all duration-200"
              style={{
                color: isActive("/about")
                  ? "var(--accent)"
                  : "rgba(245,240,232,0.85)",
                backgroundColor: isActive("/about")
                  ? "rgba(200,169,110,0.12)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive("/about")) {
                  (e.currentTarget as HTMLElement).style.color = "var(--card)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive("/about")) {
                  (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.85)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }
              }}
            >
              About &amp; Help
            </Link>
          </div>

          {/* Right side: user menu + mobile toggle */}
          <div className="flex items-center gap-2">
            {/* User dropdown */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all duration-200"
                style={{ color: "rgba(245,240,232,0.85)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--card)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.85)";
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                }}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span>Account</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-1 w-48 rounded-xl border bg-white shadow-[0_4px_24px_-4px_rgba(30,58,95,0.18)] overflow-hidden"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--background)]"
                      style={{ color: "var(--foreground)" }}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      My Dashboard
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--background)]"
                      style={{ color: "var(--foreground)" }}
                    >
                      <BookOpen className="w-4 h-4" aria-hidden="true" />
                      Admin Panel
                    </Link>
                    <div
                      className="border-t my-1"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <Link
                      href="/auth"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-red-50"
                      style={{ color: "#dc2626" }}
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sign Out
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 rounded transition-colors"
              style={{ color: "rgba(245,240,232,0.85)" }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="md:hidden border-t overflow-hidden"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "rgba(200,169,110,0.15)",
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {/* Home */}
              <Link
                href="/"
                onClick={(e) => handleNavClick(e, "/")}
                className="block px-3 py-2.5 rounded text-sm font-medium transition-colors"
                style={{
                  color: pathname === "/" ? "var(--accent)" : "rgba(245,240,232,0.85)",
                  backgroundColor: pathname === "/" ? "rgba(200,169,110,0.12)" : "transparent",
                }}
              >
                Home
              </Link>

              {navLinks.map((link) => {
                const label = navT[link.key] ?? link.label;
                const href = getLinkHref(link.href);
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.key}
                    href={href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="block px-3 py-2.5 rounded text-sm font-medium transition-colors"
                    style={{
                      color: active ? "var(--accent)" : "rgba(245,240,232,0.85)",
                      backgroundColor: active ? "rgba(200,169,110,0.12)" : "transparent",
                    }}
                  >
                    {label}
                  </Link>
                );
              })}

              {/* About */}
              <Link
                href="/about"
                onClick={(e) => handleNavClick(e, "/about")}
                className="block px-3 py-2.5 rounded text-sm font-medium transition-colors"
                style={{
                  color: isActive("/about") ? "var(--accent)" : "rgba(245,240,232,0.85)",
                  backgroundColor: isActive("/about") ? "rgba(200,169,110,0.12)" : "transparent",
                }}
              >
                About &amp; Help
              </Link>

              <div
                className="border-t pt-2 mt-2"
                style={{ borderColor: "rgba(200,169,110,0.15)" }}
              >
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors"
                  style={{ color: "rgba(245,240,232,0.85)" }}
                >
                  <User className="w-4 h-4" aria-hidden="true" />
                  My Dashboard
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors"
                  style={{ color: "rgba(245,240,232,0.85)" }}
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Admin Panel
                </Link>
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors"
                  style={{ color: "rgba(200,169,110,0.85)" }}
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign In / Register
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
