"use client";

import { useState, useMemo, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.css";
import { continueWithGoogle } from "../functions/register.function";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  const strengthInfo = useMemo(() => {
    if (!password1) return { score: 0, label: "Empty", color: "#64748b" };
    let score = 0;
    if (password1.length >= 8) score += 1;
    if (password1.length >= 12) score += 1;
    if (/[A-Z]/.test(password1) && /[a-z]/.test(password1)) score += 1;
    if (/[0-9]/.test(password1) || /[^A-Za-z0-9]/.test(password1)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Weak (8+ chars required)", color: "#f87171" };
      case 2:
        return { score: 2, label: "Fair", color: "#fbbf24" };
      case 3:
        return { score: 3, label: "Strong", color: "#34d399" };
      case 4:
        return { score: 4, label: "Superb", color: "#10b981" };
      default:
        return { score: 0, label: "Too short", color: "#f87171" };
    }
  }, [password1]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError("Please enter your full name.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password1.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password1 !== password2) {
      setError("Passwords don't match — check both fields.");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: trimmedName, email: trimmedEmail, password: password1, next }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Unable to create account. Please check your information.");
        return;
      }

      router.push(`/login?registered=1${next ? `&next=${encodeURIComponent(next)}` : ""}`);
    } catch {
      setError("Connection error. Please try again in a few moments.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSocialSignIn(provider: "google" | "github") {
    setSocialLoading(provider);
    setError(null);
    try {
      if (provider === "google") {
        const userCredential = await continueWithGoogle();
        console.log(userCredential);
      } else if (provider === "github") {
        alert("GitHub social sign-in is not yet implemented. Please use Google or email sign-up.");
      }
    } catch {
      setError("Social authentication error. Please try again.");
    } finally {
      setSocialLoading(null);
    }
  }

  return (
    <div className={styles.loginPage}>
      <main className={styles.page}>
        <section className={styles.authShell} aria-label="PortAI Sign Up">
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
                Build and export your <span className={styles.highlightText}>portfolio</span> from your CV.
              </h1>
              <p>
                Drop your resume to generate a live portfolio site, customize your projects, and export the full Next.js source code.
              </p>
            </div>

            {/* Interactive Preview Widget */}
            <div className={styles.previewWidget} aria-hidden="true">
              <div className={styles.previewHeader}>
                <div className={styles.previewStatus}>
                  <span className={styles.statusIndicator} />
                  Instant Architecture
                </div>
                <div className={styles.previewMetrics}>
                  <span className={styles.metricTag}>Zero Config</span>
                  <span className={styles.metricTag}>SEO Ready</span>
                </div>
              </div>

              <div className={styles.stepPipeline}>
                <div className={styles.stepItem}>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepIconSuccess}>1</span>
                    <div>
                      <div className={styles.stepLabel}>Drop Resume or GitHub Link</div>
                      <div className={styles.stepDetail}>AI parses skills, metrics, and architecture</div>
                    </div>
                  </div>
                  <span style={{ color: "#34d399", fontSize: "0.75rem", fontWeight: 700 }}>Automatic</span>
                </div>

                <div className={styles.stepItem}>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepIconActive}>2</span>
                    <div>
                      <div className={styles.stepLabel}>Instant Live Deployment</div>
                      <div className={styles.stepDetail}>Custom domain, dark mode, high Lighthouse scores</div>
                    </div>
                  </div>
                  <span style={{ color: "#818cf8", fontSize: "0.75rem", fontWeight: 700 }}>Live &lt; 2m</span>
                </div>
              </div>

              <div className={styles.scoreCard}>
                <div className={styles.scoreCircle}>
                  99%
                  <span className={styles.scoreLabel}>Speed</span>
                </div>
                <div className={styles.scoreDetails}>
                  <h4>Production-Grade Output</h4>
                  <p>Clean semantic markup, optimized OpenGraph images, and responsive layouts across all devices.</p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            <div className={styles.socialProof}>
              <div className={styles.avatarStack} aria-hidden="true">
                <span className={styles.avatarItem} style={{ background: "#059669" }}>EM</span>
                <span className={styles.avatarItem} style={{ background: "#2563eb" }}>KT</span>
                <span className={styles.avatarItem} style={{ background: "#d97706" }}>SL</span>
                <span className={styles.avatarItem} style={{ background: "#7c3aed" }}>★</span>
              </div>
              <div className={styles.socialText}>
                Free to start during developer preview. No credit card required.
              </div>
            </div>
          </aside>

          {/* RIGHT FORM PANEL */}
          <section className={styles.formPanel}>
            <div className={styles.authCard}>
              {/* Segmented Switcher */}
              <div className={styles.tabSwitcher}>
                <Link href="/login" className={styles.tabBtn}>
                  Sign In
                </Link>
                <Link href="/signup" className={`${styles.tabBtn} ${styles.tabBtnActive}`}>
                  Create Account
                </Link>
              </div>

              <div className={styles.formHeader}>
                <h2>Create your account</h2>
                <p>Start building your portfolio — free while in developer preview.</p>
              </div>

              {/* Social Signup */}
              <div className={styles.oauthGrid}>
                <button
                  type="button"
                  className={styles.oauthButton}
                  onClick={() => handleSocialSignIn("google")}
                  disabled={submitting || !!socialLoading}
                  aria-label="Sign up with Google"
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
                  aria-label="Sign up with GitHub"
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
                  <label htmlFor="id_full_name">Full name</label>
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
                      <path d="M16 21v-2a4 4 0 0 0-8 0v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <input
                      type="text"
                      name="full_name"
                      id="id_full_name"
                      placeholder="Jordan Lee"
                      autoComplete="name"
                      required
                      autoFocus
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (error) setError(null);
                      }}
                    />
                  </div>
                </div>

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
                      type={showPassword1 ? "text" : "password"}
                      name="password1"
                      id="id_password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password1}
                      onChange={(e) => {
                        setPassword1(e.target.value);
                        if (error) setError(null);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibility}
                      aria-label={showPassword1 ? "Hide password" : "Show password"}
                      aria-pressed={showPassword1}
                      onClick={() => setShowPassword1((s) => !s)}
                    >
                      <EyeIcon open={showPassword1} />
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password1 && (
                    <div className={styles.strengthMeter}>
                      <div className={styles.strengthBarWrapper}>
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={styles.strengthSegment}
                            style={{
                              background:
                                step <= strengthInfo.score ? strengthInfo.color : undefined,
                            }}
                          />
                        ))}
                      </div>
                      <div className={styles.strengthText}>
                        <span>Password strength:</span>
                        <span style={{ color: strengthInfo.color }}>{strengthInfo.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className={styles.field}>
                  <label htmlFor="id_password_confirm">Confirm password</label>
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
                      type={showPassword2 ? "text" : "password"}
                      name="password2"
                      id="id_password_confirm"
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={password2}
                      onChange={(e) => {
                        setPassword2(e.target.value);
                        if (error) setError(null);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.toggleVisibility}
                      aria-label={showPassword2 ? "Hide password" : "Show password"}
                      aria-pressed={showPassword2}
                      onClick={() => setShowPassword2((s) => !s)}
                    >
                      <EyeIcon open={showPassword2} />
                    </button>
                  </div>
                </div>

                <div className={styles.rowBetween}>
                  <label className={styles.remember}>
                    <input
                      type="checkbox"
                      name="agree_terms"
                      required
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                    />
                    I agree to the Terms of Service & Privacy Policy
                  </label>
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
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Free Account
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

              <p className={styles.footnote}>
                Already have an account? <Link href="/login">Sign in</Link> · <Link href="/demo">View demo</Link>
              </p>
            </div>
          </section>
        </section>
      </main>
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", background: "#07090e" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #6366f1", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}