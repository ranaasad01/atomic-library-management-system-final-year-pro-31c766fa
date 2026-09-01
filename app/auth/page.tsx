"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, BookOpen, AlertCircle, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { useRouter } from "next/navigation";
import { Reveal } from "@/components/Reveal";
type APP_NAME = any;
const APP_NAME: any = [];
type APP_TAGLINE = any;
const APP_TAGLINE: any = [];
type INSTITUTION_FULL = any;
const INSTITUTION_FULL: any = [];
import { createClient } from "@/lib/supabase/client";

// Inline IdCard as a simple SVG component since it's not in lucide-react
function IdCard({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="12" r="2" />
      <path d="M14 9h4" />
      <path d="M14 12h4" />
      <path d="M14 15h4" />
    </svg>
  );
}

type Tab = "login" | "register";
type Role = "user" | "admin";

interface FormErrors {
  full_name?: string;
  member_id?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
}

const tabVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.25, ease: "easeIn" } },
};

const heroFeatures = [
  { icon: "📚", text: "Access 10,000+ books across all disciplines" },
  { icon: "🔍", text: "Smart search with category and availability filters" },
  { icon: "📋", text: "Track your issued books and due dates" },
  { icon: "💳", text: "Manage fines and transaction history" },
];

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [role, setRole] = useState<Role>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regMemberId, setRegMemberId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  const supabase = createClient();

  function validateLogin(): boolean {
    const errs: FormErrors = {};
    if (!loginEmail.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) errs.email = "Enter a valid email address.";
    if (!loginPassword) errs.password = "Password is required.";
    else if (loginPassword.length < 6) errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateRegister(): boolean {
    const errs: FormErrors = {};
    if (!regFullName.trim()) errs.full_name = "Full name is required.";
    if (!regMemberId.trim()) errs.member_id = "Member ID is required.";
    if (!regEmail.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) errs.email = "Enter a valid email address.";
    if (regPhone && !/^\+?[\d\s\-()]{7,15}$/.test(regPhone)) errs.phone = "Enter a valid phone number.";
    if (!regPassword) errs.password = "Password is required.";
    else if (regPassword.length < 6) errs.password = "Password must be at least 6 characters.";
    if (!regConfirm) errs.confirm_password = "Please confirm your password.";
    else if (regPassword !== regConfirm) errs.confirm_password = "Passwords do not match.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!validateLogin()) return;
    setLoading(true);
    setErrors({});
    setSuccess("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) {
        setErrors({ general: error.message || "Invalid credentials. Please try again." });
        setLoading(false);
        return;
      }

      if (data.user) {
        // Fetch profile to determine role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const userRole = profile?.role ?? "user";
        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          if (userRole === "admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }, 800);
      }
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!validateRegister()) return;
    setLoading(true);
    setErrors({});
    setSuccess("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: {
          data: {
            full_name: regFullName.trim(),
            member_id: regMemberId.trim(),
            phone: regPhone.trim() || null,
            role: "user",
          },
        },
      });

      if (error) {
        setErrors({ general: error.message || "Registration failed. Please try again." });
        setLoading(false);
        return;
      }

      if (data.user) {
        setSuccess("Account created! Please check your email to verify your account, then log in.");
        setTimeout(() => {
          setTab("login");
          setSuccess("");
          setRegFullName("");
          setRegMemberId("");
          setRegEmail("");
          setRegPhone("");
          setRegPassword("");
          setRegConfirm("");
        }, 3000);
      }
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--auth-bg)] flex items-stretch">
      {/* Left: Branded Hero Panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-[var(--brand-navy)] text-white relative overflow-hidden px-12 py-16">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-[var(--brand-gold)]/10 pointer-events-none" />
        <div className="absolute top-1/2 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

        {/* Logo & Brand */}
        <Reveal>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-[var(--brand-gold)] flex items-center justify-center shadow-lg">
                <BookOpen className="w-6 h-6 text-[var(--brand-navy)]" />
              </div>
              <div>
                <div className="text-lg font-bold leading-tight">{APP_NAME}</div>
                <div className="text-xs text-white/60 font-medium tracking-wide uppercase">Management System</div>
              </div>
            </div>

            <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
              Welcome to the<br />
              <span className="text-[var(--brand-gold)]">Central Library</span>
            </h1>
            <p className="text-white/70 text-base leading-relaxed mb-2">{APP_TAGLINE}</p>
            <p className="text-white/50 text-sm">{INSTITUTION_FULL}</p>
          </div>
        </Reveal>
      </div>

      {/* Right: Auth Forms */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setErrors({}); setSuccess(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t
                    ? "bg-white text-[var(--brand-navy)] shadow"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.form
                key="login"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">Sign In to Your Account</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your registered email and password.</p>
                </div>

                {errors.general && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errors.general}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. s2021-bcs-045@ncbae.edu.pk"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--brand-navy)] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--brand-navy)]/90 transition disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Sign In
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleRegister}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-2xl font-bold text-[var(--brand-navy)]">Create Member Account</h2>
                  <p className="text-sm text-gray-500 mt-1">Register with your NCBA&E credentials.</p>
                </div>

                {errors.general && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errors.general}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="As on your CNIC or student card"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                  </div>
                  {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member ID</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={regMemberId}
                      onChange={(e) => setRegMemberId(e.target.value)}
                      placeholder="Student roll number or faculty employee ID"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                  </div>
                  {errors.member_id && <p className="text-xs text-red-500 mt-1">{errors.member_id}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. s2021-bcs-045@ncbae.edu.pk"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="Optional — for overdue notifications"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                  </div>
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="Must match the password above"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--brand-navy)] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[var(--brand-navy)]/90 transition disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Create Account
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
