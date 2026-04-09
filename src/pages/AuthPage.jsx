import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GitBranch,
  Mail,
  Lock,
  User,
  Building2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGithub,
  completeGithubProfile,
  getUserRole,
  normalizeUserRole,
} from "../firebase/auth";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FULL_TEXT =
  '"The best hires come from trusted networks... We built the infrastructure for that trust."';

function TypingQuote() {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(FULL_TEXT.slice(0, i));
      if (i >= FULL_TEXT.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  const renderColored = (text) => {
    return text
      .replace("We built", "We <built>")
      .replace("that trust.", "that <trust.>")
      .split(/(<built>|<trust\.>)/)
      .map((part, idx) => {
        if (part === "<built>")
          return (
            <span key={idx} className="text-[#C8FF00]">
              built
            </span>
          );
        if (part === "<trust.>")
          return (
            <span key={idx} className="text-rose-400">
              trust.
            </span>
          );
        return part;
      });
  };

  return (
    <blockquote
      className="text-2xl font-bold leading-snug text-[#E8E6E1] mb-4"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {renderColored(displayed)}
      {!done && (
        <span className="inline-block w-[2px] h-[1.1em] bg-[#C8FF00] ml-[1px] align-middle animate-pulse" />
      )}
    </blockquote>
  );
}

export default function AuthPage({ mode, navigate }) {
  const { setRole: setAuthRole } = useAuth();
  const [tab, setTab] = useState("signin");
  const [role, setRole] = useState(mode);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    stack: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (tab === "register") {
        if (!form.name.trim()) throw new Error("Name is required");
        if (!form.email.trim()) throw new Error("Email is required");
        if (form.password.length < 6)
          throw new Error("Password must be at least 6 characters");

        await registerWithEmail(form.email, form.password, form.name, role, {
          company: form.company,
          stack: form.stack,
        });

        setAuthRole(normalizeUserRole(role) ?? role);
      } else {
        if (!form.email.trim()) throw new Error("Email is required");
        if (!form.password.trim()) throw new Error("Password is required");

        const user = await loginWithEmail(form.email, form.password);
        const existingRole = await getUserRole(user.uid);
        if (existingRole != null && existingRole !== "") {
          setAuthRole(normalizeUserRole(existingRole) ?? existingRole);
        }
      }
    } catch (err) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "This email is already registered. Try signing in."
          : err.code === "auth/invalid-credential"
            ? "Invalid email or password."
            : err.code === "auth/user-not-found"
              ? "No account found with this email."
              : err.code === "auth/wrong-password"
                ? "Incorrect password."
                : err.code === "auth/too-many-requests"
                  ? "Too many attempts. Please wait and try again."
                  : err.message || "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGithub = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithGithub();
      if (result.needsRole) {
        await completeGithubProfile(result.user, role);
        setAuthRole(normalizeUserRole(role) ?? role);
      } else {
        setAuthRole(normalizeUserRole(result.role) ?? result.role);
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "GitHub sign-in failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithGoogle();
      if (result.needsRole) {
        await completeGithubProfile(result.user, role);
        setAuthRole(normalizeUserRole(role) ?? role);
      } else {
        setAuthRole(normalizeUserRole(result.role) ?? result.role);
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "Google sign-in failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkedin = async () => {
    setError("");
    setSubmitting(true);
    try {
      const result = await loginWithLinkedin();
      if (result.needsRole) {
        await completeGithubProfile(result.user, role);
        setAuthRole(normalizeUserRole(role) ?? role);
      } else {
        setAuthRole(normalizeUserRole(result.role) ?? result.role);
      }
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message || "LinkedIn sign-in failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
      className="min-h-screen flex bg-[#0A0A0B]"
    >
      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col ml-3 justify-between w-105 shrink-0 border-r border-white/20 bg-white/1">
        <button
          onClick={() => navigate("landing")}
          className="flex items-center gap-2 text-sm text-[#6B6966] mt-3 hover:text-[#A09E9A] transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <p className="text-xs tracking-widest uppercase text-[#C8FF00] mb-6">
            RefHire
          </p>
          <TypingQuote />
          <p className="text-sm ml-5 text-[#999]">
            — RefHire founding principle
          </p>
        </div>

        <div className="space-y-3 mb-2">
          {[
            { icon: Lock, text: "Zero-knowledge identity by default" },
            { icon: GitBranch, text: "Proof-of-work via GitHub & LeetCode" },
            { icon: Building2, text: "Corporate email verification" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 text-xs text-[#6B6966]"
            >
              <Icon size={13} className="text-[#C8FF00] shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm"
        >
          {/* Mobile back */}
          <button
            onClick={() => navigate("landing")}
            className="lg:hidden flex items-center gap-2 text-xs text-[#6B6966] hover:text-[#A09E9A] transition-colors mb-8"
          >
            <ArrowLeft size={13} /> Back
          </button>

          {/* Role toggle */}
          <div className="flex font-info border border-white/8 rounded-sm mb-8 p-0.5 gap-0.5">
            {[
              { id: "candidate", label: "Job seeker" },
              { id: "employee", label: "Referrer" },
              { id: "hiring", label: "Hiring" },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setRole(id);
                  setError("");
                }}
                className={`flex-1 py-2 text-[13px] font-medium cursor-pointer transition-all duration-200 rounded-sm ${
                  role === id
                    ? "bg-[#C8FF00] text-[#0A0A0B]"
                    : "text-[#777] hover:text-[#A09E9A]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab switch */}
          <div className="flex gap-6 mb-8 border-b border-white/6 pb-4">
            {["signin", "register"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className={`text-sm font-medium ml-20 transition-colors cursor-pointer duration-200 ${
                  tab === t
                    ? "text-[#E8E6E1] border-b-2 border-[#C8FF00]"
                    : "text-[#6B6966] hover:text-[#A09E9A]"
                }`}
              >
                {t === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          {/* Error display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2.5 mb-4"
            >
              <AlertCircle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-400">{error}</span>
            </motion.div>
          )}

          <motion.form
            key={tab + role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {tab === "register" && (
              <Field
                icon={User}
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
              />
            )}

            <Field
              icon={Mail}
              name="email"
              type="email"
              placeholder="Work email"
              value={form.email}
              onChange={handleChange}
            />
            <Field
              icon={Lock}
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />

            {tab === "register" && role === "employee" && (
              <>
                <Field
                  icon={Building2}
                  name="company"
                  placeholder="Company (will be anonymised)"
                  value={form.company}
                  onChange={handleChange}
                />
                <div className="relative">
                  <textarea
                    name="stack"
                    placeholder="Your team's tech stack (e.g. React, Node.js, AWS)"
                    value={form.stack}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] px-4 py-3 rounded-sm focus:outline-none focus:border-[#C8FF00]/50 transition-colors resize-none "
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group w-full flex items-center justify-center gap-2 bg-[#C8FF00] text-[#0A0A0B] font-semibold py-3 rounded-sm text-sm hover:bg-[#D4FF26] transition-colors duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-[#0A0A0B] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {tab === "signin" ? "Sign in" : "Create account"}
                  <ChevronRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/6" />
              <span className="text-xs text-[#666]">or continue with</span>
              <div className="flex-1 h-px bg-white/6" />
            </div>

            {/* OAuth buttons row */}
            <div className="grid grid-cols-3 gap-2">
              {/* GitHub */}
              <button
                type="button"
                onClick={handleGithub}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 border border-white/8 text-[#A09E9A] hover:text-[#E8E6E1] hover:border-white/20 py-2.5 rounded-sm text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
              >
                <GitHubIcon />
                <span>GitHub</span>
              </button>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 border border-white/8 text-[#A09E9A] hover:text-[#E8E6E1] hover:border-white/20 py-2.5 rounded-sm text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
              >
                <GoogleIcon />
                <span>Google</span>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={handleLinkedin}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 border border-white/8 text-[#A09E9A] hover:text-[#E8E6E1] hover:border-white/20 py-2.5 rounded-sm text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer"
              >
                <LinkedInIcon />
                <span>LinkedIn</span>
              </button>
            </div>
          </motion.form>
        </motion.div>
      </div>
    </motion.div>
  );
}

function Field({
  icon: Icon,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="relative">
      <Icon
        size={13}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3D3B38]"
      />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-white/3 border border-white/8 text-sm text-[#E8E6E1] placeholder-[#3D3B38] pl-9 pr-4 py-3 rounded-sm focus:outline-none focus:border-[#C8FF00]/50 transition-colors"
      />
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
