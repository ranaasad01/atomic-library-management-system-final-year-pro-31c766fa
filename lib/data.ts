export const BRAND = {
  name: "NCBA&E Central Library",
  shortName: "NCBA&E Library",
  tagline: "Your gateway to knowledge",
  email: "library@ncbae.edu.pk",
  phone: "+92-42-35761999",
  helpdesk: "helpdesk@ncbae.edu.pk",
  hours: "Mon–Fri 8:00 AM – 8:00 PM · Sat 9:00 AM – 5:00 PM · Sun Closed",
  finePerDay: 5,
  loanPeriodDays: 14,
  maxBooksPerUser: 5,
  fyp: "Library Management System — NCBA&E Final Year Project",
};

export interface NavLink {
  label: string;
  href: string;
  key: string;
  adminOnly?: boolean;
  userOnly?: boolean;
}

export const navLinks: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", key: "dashboard", userOnly: true },
  { label: "Browse Books", href: "/books", key: "books" },
  { label: "Transactions", href: "/transactions", key: "transactions", userOnly: true },
  { label: "My Fines", href: "/fines", key: "fines", userOnly: true },
  { label: "Admin Panel", href: "/admin", key: "admin", adminOnly: true },
];

export const adminNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/admin", key: "adminDashboard" },
  { label: "Books", href: "/admin/books", key: "adminBooks" },
  { label: "Users", href: "/admin/users", key: "adminUsers" },
  { label: "Transactions", href: "/admin/transactions", key: "adminTransactions" },
  { label: "Fines", href: "/admin/fines", key: "adminFines" },
];

export type UserRole = "admin" | "user";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string | null;
  publisher: string | null;
  publication_year: number | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string | null;
  description: string | null;
  cover_url: string | null;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
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

export interface Transaction {
  id: string;
  book_id: string;
  user_id: string;
  issued_by: string | null;
  returned_to: string | null;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Fine {
  id: string;
  transaction_id: string;
  user_id: string;
  overdue_days: number;
  amount_per_day: number;
  total_amount: number;
  is_paid: boolean;
  is_waived: boolean;
  paid_at: string | null;
  waived_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}