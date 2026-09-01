"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, Eye, EyeOff, BookOpen, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Reveal } from "@/components/Reveal";
import { fadeInUp, scaleIn } from "@/lib/motion";
type APP_NAME = any;
const APP_NAME: any = [];
type APP_FULL_NAME = any;
const APP_FULL_NAME: any = [];
type INSTITUTION_FULL = any;
const INSTITUTION_FULL: any = [];

type AuthMode = "login" | "register";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
}

const INITIAL_FORM: FormState = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  phone: "",
};

export default function LoginRegisterPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createClient();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setForm(INITIAL_FORM);
    setError(null);
    setSuccess(null);
    setShowPassword(false);
    setShowConfirm(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email.trim(),
        password: form.password,
      });
      if (authError) {
        setError(authError.message);
      } else {
        window.location.href = "/dashboard";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    if (!form.email.trim()) { setError("Email address is required."); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name: form.fullName.trim(),
            phone: form.phone.trim() || null,
          },
        },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setSuccess("Registration successful! Please check your email to confirm your account before logging in.");
        setForm(INITIAL_FORM);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface-muted)] flex items-stretch">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between bg-[var(--brand-navy)] overflow-hidden px-14 py-16">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--brand-gold)]/10" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-[var(--brand-gold)]/5 translate-x-1/3 translate-y-1/3" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full border border-white/5" />

        {/* Logo */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="relative z-10 flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-gold)]">
            <BookOpen className="h-6 w-6 text-[var(--brand-navy)]" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">{APP_NAME}</p>
            <p className="text-white/50 text-xs">Management System</p>
          </div>
        </motion.div>

        {/* Center content */}
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.15 }}
          className="relative z-10 space-y-8"
        >
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight text-balance">
              Your Gateway to<br />
              <span className="text-[var(--brand-gold)]">Knowledge</span>
            </h1>
            <p className="mt-4 text-white/60 text-base leading-relaxed max-w-sm">
              Access thousands of books, manage your borrowings, and stay on top of your reading journey at {INSTITUTION_FULL}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "10,000+", label: "Books in Catalogue" },
              { value: "5,000+", label: "Active Members" },
              { value: "14 Days", label: "Standard Loan Period" },
              { value: "5 Books", label: "Max Per Member" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-xl font-bold text-[var(--brand-gold)]">{stat.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.25 }}
          className="relative z-10 text-white/30 text-sm"
        >
          {APP_FULL_NAME}
        </motion.p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <Reveal className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-navy)]">
              <BookOpen className="h-5 w-5 text-[var(--brand-gold)]" />
            </div>
            <div>
              <p className="text-[var(--brand-navy)] font-bold text-base leading-tight">{APP_NAME}</p>
              <p className="text-[var(--text-muted)] text-xs">Management System</p>
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-white border border-[var(--border-light)] p-1 mb-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            {(["login", "register"] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-[var(--brand-navy)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--brand-navy)]"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Card */}
          <motion.div
            key={mode}
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            className="rounded-2xl bg-white border border-[var(--border-light)] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_16px_40px_-12px_rgba(0,0,0,0.1)] p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--brand-navy)] tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {mode === "login"
                  ? "Sign in to access your library account and manage your books."
                  : "Register as a new library member to start borrowing books."}
              </p>
            </div>

            {/* Alert messages */}
            {error && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3"
              >
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                className="mb-5 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3"
              >
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700">{success}</p>
              </motion.div>
            )}

            {/* Login form */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@ncbae.edu.pk"
                  value={form.email}
                  onChange={handleChange}
                  icon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />
                <InputField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="current-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-[var(--text-muted)] hover:text-[var(--brand-navy)] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-[var(--brand-navy)] focus:ring-[var(--brand-navy)]" />
                    <span className="text-sm text-[var(--text-muted)]">Remember me</span>
                  </label>
                  <Link href="#" className="text-sm text-[var(--brand-gold)] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-navy)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--brand-navy)]/90 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>Sign In <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>

                <p className="text-center text-sm text-[var(--text-muted)] pt-2">
                  New to the library?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="text-[var(--brand-gold)] font-semibold hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </form>
            )}

            {/* Register form */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <InputField
                  label="Full Name"
                  name="fullName"
                  type="text"
                  placeholder="Muhammad Ali Khan"
                  value={form.fullName}
                  onChange={handleChange}
                  icon={<User className="h-4 w-4" />}
                  autoComplete="name"
                />
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="you@ncbae.edu.pk"
                  value={form.email}
                  onChange={handleChange}
                  icon={<Mail className="h-4 w-4" />}
                  autoComplete="email"
                />
                <InputField
                  label="Phone Number (optional)"
                  name="phone"
                  type="tel"
                  placeholder="+92-300-0000000"
                  value={form.phone}
                  onChange={handleChange}
                  icon={<Phone className="h-4 w-4" />}
                  autoComplete="tel"
                />
                <InputField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-[var(--text-muted)] hover:text-[var(--brand-navy)] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />
                <InputField
                  label="Confirm Password"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  icon={<Lock className="h-4 w-4" />}
                  autoComplete="new-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="text-[var(--text-muted)] hover:text-[var(--brand-navy)] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                {/* Password strength hint */}
                {form.password.length > 0 && (
                  <PasswordStrength password={form.password} />
                )}

                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" required className="mt-0.5 rounded border-gray-300 text-[var(--brand-navy)] focus:ring-[var(--brand-navy)]" />
                    <span className="text-sm text-[var(--text-muted)] leading-snug">
                      I agree to the{" "}
                      <Link href="#" className="text-[var(--brand-gold)] hover:underline font-medium">library terms</Link>
                      {" "}and{" "}
                      <Link href="#" className="text-[var(--brand-gold)] hover:underline font-medium">borrowing policy</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-navy)] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[var(--brand-navy)]/90 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-navy)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>

                <p className="text-center text-sm text-[var(--text-muted)] pt-2">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="text-[var(--brand-gold)] font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </motion.div>

          {/* Info note */}
          <p className="mt-6 text-center text-xs text-[var(--text-muted)] leading-relaxed px-2">
            This system is for registered students and faculty of {INSTITUTION_FULL}. Contact the library desk for membership assistance.
          </p>
        </Reveal>
      </div>
    </main>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

interface InputFieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  autoComplete?: string;
  rightElement?: React.ReactNode;
}

function InputField({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  icon,
  autoComplete,
  rightElement,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-[var(--brand-navy)]">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3 text-[var(--text-muted)]">{icon}</span>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-[var(--border-light)] bg-[var(--surface-muted)] py-2.5 pl-10 pr-10 text-sm text-[var(--brand-navy)] placeholder:text-gray-400 transition-all duration-150 focus:border-[var(--brand-navy)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/15"
        />
        {rightElement && (
          <span className="absolute right-3">{rightElement}</span>
        )}
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number", pass: /\d/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const strengthLabel = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  const strengthColor =
    score <= 1 ? "bg-red-400" : score === 2 ? "bg-yellow-400" : score === 3 ? "bg-blue-400" : "bg-green-500";

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? strengthColor : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map((c) => (
            <span
              key={c.label}
              className={`text-xs flex items-center gap-1 ${c.pass ? "text-green-600" : "text-gray-400"}`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.pass ? "bg-green-500" : "bg-gray-300"}`} />
              {c.label}
            </span>
          ))}
        </div>
        <span className={`text-xs font-semibold ${
          score <= 1 ? "text-red-500" : score === 2 ? "text-yellow-600" : score === 3 ? "text-blue-600" : "text-green-600"
        }`}>
          {strengthLabel}
        </span>
      </div>
    </div>
  );
}