"use client";

import { useState, useEffect, useTransition, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./login.module.css";
import {
  loginWithEmail,
  loginWithGoogle,
  loginWithGithub,
  requestPasswordReset,
  formatLoginError,
} from "../functions/login.function";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const registered = searchParams.get("registered");
  const [, startTransition] = useTransition();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    registered ? "Account created successfully! Please sign in with your credentials." : null
  );

  // Check if session is already active on load
  useEffect(() => {
    let isMounted = true;
    async function checkExistingSession() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json().catch(() => ({}));
        if (data?.authenticated && isMounted) {
          router.replace(next || "/dashboard");
        }
      } catch {
        // Continue showing login page
      }
    }
    checkExistingSession();
    return () => {
      isMounted = false;
    };
  }, [next, router]);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await loginWithEmail({
        email: trimmedEmail,
        password,
        remember,
      });

      setSuccessMessage("Sign in verified! Launching your workspace…");

      startTransition(() => {
        router.push(next || "/dashboard");
        router.refresh();
      });
    } catch (err: unknown) {
      setError(formatLoginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSocialSignIn(provider: "google" | "github"): Promise<void> {
    setSocialLoading(provider);
    setError(null);
    setSuccessMessage(null);

    try {
      if (provider === "google") {
        await loginWithGoogle(remember);
        setSuccessMessage("Google account connected! Launching workspace…");
      } else if (provider === "github") {
        await loginWithGithub(remember);
        setSuccessMessage("GitHub account connected! Launching workspace…");
      }

      startTransition(() => {
        router.push(next || "/dashboard");
        router.refresh();
      });
    } catch (err: unknown) {
      setError(formatLoginError(err));
    } finally {
      setSocialLoading(null);
    }
  }

  function handleQuickDemo(): void {
    setEmail("demo@portai.com");
    setPassword("portai2026");
    setError(null);
  }

  async function handleForgotPasswordSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    const trimmed = forgotEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setForgotError("Please enter a valid email address.");
      return;
    }

    setForgotLoading(true);

    try {
      const msg = await requestPasswordReset(trimmed);
      setForgotSuccess(msg);
    } catch (err: unknown) {
      setForgotError(formatLoginError(err));
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <main className={styles.page}>
        <section className={styles.authShell} aria-label="PortAI Sign In">
          {/* LEFT BRAND & PREVIEW PANEL */}
          <aside className={styles.brandPanel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Link href="/" className={styles.wordmark}>
                <span className={styles.mark} aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z"></path>
                    <path d="m9 12 2 2 4-5"></path>
                  </svg>
                </span>
                <span>PortAI</span>
              </Link>
              <span className={styles.versionBadge}>
                CV to Live Site
              </span>
            </div>

            <div className={styles.brandCopy}>
              <div className={styles.eyebrow}>
                <span className={styles.eyebrowPulse} />
                Portfolio Engine
              </div>
              <h1>
                Turn your CV into a <span className={styles.highlightText}>live portfolio</span> in minutes.
              </h1>
              <p>
                Upload your resume to generate a hosted portfolio link and export the complete Next.js source code.
              </p>
            </div>

            {/* Interactive Preview Widget */}
            <div className={styles.previewWidget} aria-hidden="true">
              <div className={styles.previewHeader}>
                <div className={styles.previewStatus}>
                  <span className={styles.statusIndicator} />
                  Portfolio Pipeline
                </div>
                <div className={styles.previewMetrics}>
                  <span className={styles.metricTag}>Next.js 16</span>
                  <span className={styles.metricTag}>React 19</span>
                  <span className={styles.metricTag}>TypeScript</span>
                </div>
              </div>

              <div className={styles.stepPipeline}>
                <div className={styles.stepItem}>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepIconSuccess}>1</span>
                    <div>
                      <div className={styles.stepLabel}>Resume & GitHub Synced</div>
                      <div className={styles.stepDetail}>Work history & technical skills parsed</div>
                    </div>
                  </div>
                  <span style={{ color: "#34d399", fontSize: "0.75rem", fontWeight: 700 }}>Parsed</span>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepIconActive}>2</span>
                    <div>
                      <div className={styles.stepLabel}>Hosted Link & Code Export</div>
                      <div className={styles.stepDetail}>Live portfolio URL and downloadable Next.js source</div>
                    </div>
                  </div>
                  <span style={{ color: "#818cf8", fontSize: "0.75rem", fontWeight: 700 }}>Ready</span>
                </div>
              </div>

              <div className={styles.scoreCard}>
                <div className={styles.scoreCircle}>
                  98%
                  <span className={styles.scoreLabel}>Score</span>
                </div>
                <div className={styles.scoreDetails}>
                  <h4>Recruiter Readiness Index</h4>
                  <p>Optimized for ATS filtering, sub-second load times, and clean engineering impact metrics.</p>
                </div>
              </div>
            </div>

            {/* Social Proof Footer */}
            <div className={styles.socialProof}>
              <div className={styles.avatarStack} aria-hidden="true">
                <span className={styles.avatarItem} style={{ background: "#4f46e5" }}>JD</span>
                <span className={styles.avatarItem} style={{ background: "#0891b2" }}>AL</span>
                <span className={styles.avatarItem} style={{ background: "#059669" }}>RK</span>
                <span className={styles.avatarItem} style={{ background: "#7c3aed" }}>+</span>
              </div>
              <div className={styles.socialText}>
                Trusted by <strong>14,000+</strong> engineers from Stripe, Linear, Vercel & OpenAI.
              </div>
            </div>
          </aside>

          {/* RIGHT FORM PANEL */}
          <section className={styles.formPanel}>
            <div className={styles.authCard}>
              {/* Segmented Switcher */}
              <div className={styles.tabSwitcher}>
                <Link href="/login" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
                  Sign In
                </Link>
                <Link href="/signup" className={styles.tabBtn}>
                  Create Account
                </Link>
              </div>

              <div className={styles.formHeader}>
                <h2>Welcome back</h2>
                <p>Sign in to continue refining your projects and publishing settings.</p>
              </div>

              {/* Social Login Options */}
              <div className={styles.oauthGrid}>
                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={() => handleSocialSignIn("google")}
                  disabled={submitting || !!socialLoading}
                  aria-label="Continue with Google"
                >
                  {socialLoading === "google" ? (
                    <span className={styles.spinner} aria-hidden="true" />
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A11.99 11.99 0 0 0 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.26 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
                      />
                    </svg>
                  )}
                  Google
                </button>

                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={() => handleSocialSignIn("github")}
                  disabled={submitting || !!socialLoading}
                  aria-label="Continue with GitHub"
                >
                  {socialLoading === "github" ? (
                    <span className={styles.spinner} aria-hidden="true" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  )}
                  GitHub
                </button>
              </div>

              <div className={styles.divider}>or with email</div>

              {successMessage && (
                <div className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              {error && (
                <div className={styles.notice} role="alert">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ flexShrink: 0, marginTop: 1 }}>
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {next && <input type="hidden" name="next" value={next} />}

                <div className={styles.field}>
                  <label htmlFor="id_email">Email address</label>
                  <div className={styles.inputShell}>
                    <svg
                      className={styles.inputIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                      <path d="m3 7 9 6 9-6"></path>
                    </svg>
                    <input
                      type="email"
                      name="email"
                      id="id_email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label htmlFor="id_password">Password</label>
                  <div className={`${styles.inputShell} ${styles.passwordWrap}`}>
                    <svg
                      className={styles.inputIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2"></rect>
                      <path d="M8 11V8a4 4 0 0 1 8 0v3"></path>
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="id_password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError(null);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibility}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                <div className={styles.rowBetween}>
                  <label className={styles.remember}>
                    <input
                      type="checkbox"
                      name="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Keep me signed in
                  </label>
                  <button
                    type="button"
                    className={styles.forgotButton}
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccess(null);
                      setForgotError(null);
                      setForgotModalOpen(true);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  className={styles.submit}
                  disabled={submitting || !!socialLoading}
                  aria-busy={submitting}
                >
                  {submitting ? (
                    <>
                      <span className={styles.spinner} aria-hidden="true" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in to Workspace
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m13 6 6 6-6 6"></path>
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Demo Testing Chip */}
              <div className={styles.demoBox}>
                <span>Testing credentials: demo@portai.com</span>
                <button type="button" className={styles.demoBtn} onClick={handleQuickDemo}>
                  Fill Demo
                </button>
              </div>

              <p className={styles.footnote}>
                New to PortAI? <Link href="/signup">Create an account</Link> · <Link href="/demo">View demo</Link>
              </p>
            </div>
          </section>
        </section>
      </main>

      {/* Forgot Password Frosted Glass Modal */}
      {forgotModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) setForgotModalOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
        >
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 id="forgot-modal-title" className={styles.modalTitle}>
                Reset your password
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setForgotModalOpen(false)}
                aria-label="Close dialog"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <p className={styles.modalDescription}>
              Enter your account email address and we&apos;ll send you a link to reset your password.
            </p>

            {forgotSuccess && (
              <div className={`${styles.notice} ${styles.noticeSuccess}`} role="status">
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotError && (
              <div className={styles.notice} role="alert">
                <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" style={{ flexShrink: 0 }}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>{forgotError}</span>
              </div>
            )}

            {!forgotSuccess ? (
              <form onSubmit={handleForgotPasswordSubmit}>
                <div className={styles.field}>
                  <label htmlFor="forgot_email">Email address</label>
                  <div className={styles.inputShell}>
                    <svg
                      className={styles.inputIcon}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.9}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                      <path d="m3 7 9 6 9-6"></path>
                    </svg>
                    <input
                      type="email"
                      id="forgot_email"
                      required
                      placeholder="you@example.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError(null);
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setForgotModalOpen(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className={styles.submit} style={{ width: "auto" }} disabled={forgotLoading}>
                    {forgotLoading ? "Sending link…" : "Send reset link"}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.submit}
                  style={{ width: "100%" }}
                  onClick={() => setForgotModalOpen(false)}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.9 17.9A10.9 10.9 0 0 1 12 18.5C5.5 18.5 2 12 2 12a18 18 0 0 1 4.1-4.9M9.9 5.7a10.8 10.8 0 0 1 2.1-.2C18.5 5.5 22 12 22 12a18.5 18.5 0 0 1-2.2 3.1M14.1 14.1a3 3 0 0 1-4.2-4.2"></path>
      <path d="M3 3l18 18"></path>
    </svg>
  ) : (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#07090e" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
