import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocaleProvider from "@/components/LocaleProvider";
import LanguageToggle from "@/components/LanguageToggle";

export const metadata: Metadata = {
  formatDetection: { telephone: false, date: false, email: false, address: false },
  title: {
    default: "NCBA&E Central Library — Library Management System",
    template: "%s | NCBA&E Library",
  },
  description:
    "Library Management System for NCBA&E Central Library. Browse books, manage loans, track fines, and access your member dashboard.",
  keywords: [
    "library",
    "NCBA&E",
    "book management",
    "library system",
    "LMS",
    "book catalogue",
  ],
  openGraph: {
    title: "NCBA&E Central Library — Library Management System",
    description:
      "Your gateway to knowledge. Manage borrowings, track due dates, and explore thousands of titles.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <LocaleProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <LanguageToggle />
        </LocaleProvider>
      </body>
    </html>
  );
}