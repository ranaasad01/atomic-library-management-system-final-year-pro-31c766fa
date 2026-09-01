"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { BookOpen, Mail, Phone, Clock } from 'lucide-react';
import { BRAND } from "@/lib/data";

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations();

  const handleAnchorClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#") && pathname === "/") {
      e.preventDefault();
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getLinkHref = (href: string) => {
    if (href.startsWith("#")) {
      return pathname === "/" ? href : "/" + href;
    }
    return href;
  };

  const userLinks = [
    { label: t("footer.dashboard"), href: "/dashboard" },
    { label: t("footer.books"), href: "/books" },
    { label: t("footer.transactions"), href: "/transactions" },
    { label: t("footer.fines"), href: "/fines" },
  ];

  const adminLinks = [
    { label: t("footer.adminDashboard"), href: "/admin" },
    { label: t("footer.adminBooks"), href: "/admin/books" },
    { label: t("footer.adminUsers"), href: "/admin/users" },
    { label: t("footer.adminTransactions"), href: "/admin/transactions" },
  ];

  return (
    <footer
      className="border-t mt-auto"
      style={{
        backgroundColor: "var(--primary)",
        borderColor: "rgba(200,169,110,0.2)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "var(--accent)" }}
              >
                <BookOpen className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: "var(--card)" }}
              >
                NCBA&amp;E Library
              </span>
            </div>
            <p
              className="text-xs leading-relaxed mb-4"
              style={{ color: "rgba(245,240,232,0.6)" }}
            >
              {t("footer.tagline")}
            </p>
            <div className="space-y-1.5">
              <a
                href={`mailto:${BRAND.email}`}
                className="flex items-center gap-2 text-xs transition-colors"
                style={{ color: "rgba(200,169,110,0.85)" }}
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                {BRAND.email}
              </a>
              <a
                href={`tel:${BRAND.phone}`}
                className="flex items-center gap-2 text-xs transition-colors"
                style={{ color: "rgba(200,169,110,0.85)" }}
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                {BRAND.phone}
              </a>
              <div
                className="flex items-start gap-2 text-xs"
                style={{ color: "rgba(245,240,232,0.5)" }}
              >
                <Clock
                  className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{BRAND.hours}</span>
              </div>
            </div>
          </div>

          {/* User Links */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--accent)" }}
            >
              {t("footer.memberPortal")}
            </h3>
            <ul className="space-y-2">
              {userLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={getLinkHref(link.href)}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-xs transition-colors"
                    style={{ color: "rgba(245,240,232,0.65)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--card)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(245,240,232,0.65)";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Admin Links */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--accent)" }}
            >
              {t("footer.adminPanel")}
            </h3>
            <ul className="space-y-2">
              {adminLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={getLinkHref(link.href)}
                    onClick={(e) => handleAnchorClick(e, link.href)}
                    className="text-xs transition-colors"
                    style={{ color: "rgba(245,240,232,0.65)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "var(--card)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color =
                        "rgba(245,240,232,0.65)";
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policy */}
          <div>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--accent)" }}
            >
              {t("footer.libraryPolicy")}
            </h3>
            <ul className="space-y-2">
              <li
                className="text-xs"
                style={{ color: "rgba(245,240,232,0.65)" }}
              >
                {t("footer.loanPeriod")}
              </li>
              <li
                className="text-xs"
                style={{ color: "rgba(245,240,232,0.65)" }}
              >
                {t("footer.fineRate")}
              </li>
              <li
                className="text-xs"
                style={{ color: "rgba(245,240,232,0.65)" }}
              >
                {t("footer.maxBooks")}
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderColor: "rgba(200,169,110,0.15)" }}
        >
          <p
            className="text-xs"
            style={{ color: "rgba(245,240,232,0.45)" }}
          >
            {t("footer.copyright")}
          </p>
          <p
            className="text-xs"
            style={{ color: "rgba(245,240,232,0.45)" }}
          >
            {t("footer.fyp")}
          </p>
        </div>
      </div>
    </footer>
  );
}