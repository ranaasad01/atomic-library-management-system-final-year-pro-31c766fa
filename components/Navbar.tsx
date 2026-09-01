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
    }
    setMobileOpen(false);
  };

  const getLinkHref = (href: string) => {
    if (href.startsWith("#")) {
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
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--card)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "rgba(255,255,255,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(245,240,232,0.85)";
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        "transparent";
                    }
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-all duration-200"
                style={{ color: "rgba(245,240,232,0.85)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    "transparent";
                }}
                aria-label="User menu"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  <User className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                </div>
                <span className="hidden lg:block">Ahmed</span>
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-1 w-48 rounded-lg border shadow-card overflow-hidden"
                    style={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        Ahmed Khan
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Member · S2021-BCS-045
                      </p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
                      style={{ color: "var(--foreground)" }}
                      onClick={() => setUserMenuOpen(false)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "var(--background)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                      My Dashboard
                    </Link>
                    <Link
                      href="/auth"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors w-full text-left"
                      style={{ color: "#dc2626" }}
                      onClick={() => setUserMenuOpen(false)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      Sign Out
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded transition-colors"
            style={{ color: "rgba(245,240,232,0.85)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
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
              borderColor: "rgba(200,169,110,0.2)",
            }}
          >
            <div className="px-4 py-3 space-y-1">
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
                      backgroundColor: active
                        ? "rgba(200,169,110,0.12)"
                        : "transparent",
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
              <div
                className="pt-3 mt-3 border-t"
                style={{ borderColor: "rgba(200,169,110,0.2)" }}
              >
                <div className="flex items-center gap-3 px-3 py-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    <User className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--card)" }}
                    >
                      Ahmed Khan
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(200,169,110,0.85)" }}
                    >
                      S2021-BCS-045
                    </p>
                  </div>
                </div>
                <Link
                  href="/auth"
                  className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium transition-colors"
                  style={{ color: "#fca5a5" }}
                  onClick={() => setMobileOpen(false)}
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  Sign Out
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}