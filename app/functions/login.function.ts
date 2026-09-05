import { app } from "../lib/firebase";
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";

export interface LoginParams {
  email: string;
  password?: string;
  remember?: boolean;
}

export interface LoginServerResponse {
  success: boolean;
  message: string;
  user: {
    userId: string;
    email: string;
    name: string;
    authenticated: boolean;
    role: string;
    photoURL?: string | null;
  };
}

/**
 * Send verified session token to /api/auth/login to issue HTTP-only cookies.
 */
async function sendLoginToServer(payload: {
  email: string;
  password?: string;
  accessToken?: string;
  userId?: string;
  remember?: boolean;
  method?: string;
  name?: string;
  photoURL?: string | null;
}): Promise<LoginServerResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Authentication failed. Please verify your credentials.");
  }

  return data as LoginServerResponse;
}

/**
 * Sign in using email & password.
 * Supports both standard Firebase Auth and demo account bypass.
 */
export async function loginWithEmail({
  email,
  password = "",
  remember = false,
}: LoginParams): Promise<{ user?: User; serverData: LoginServerResponse }> {
  const trimmedEmail = email.trim().toLowerCase();

  // Demo user bypass
  if (trimmedEmail === "demo@portai.com") {
    const serverData = await sendLoginToServer({
      email: trimmedEmail,
      password,
      remember,
      method: "demo",
    });
    return { serverData };
  }

  const auth = getAuth(app);
  try {
    const credential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
    const user = credential.user;
    const accessToken = await user.getIdToken();

    const serverData = await sendLoginToServer({
      email: user.email || trimmedEmail,
      accessToken,
      userId: user.uid,
      name: user.displayName || trimmedEmail.split("@")[0],
      photoURL: user.photoURL,
      remember,
      method: "email",
    });

    return { user, serverData };
  } catch (error) {
    console.error("Firebase email sign-in error:", error);
    throw error;
  }
}

/**
 * Sign in with Google OAuth popup.
 */
export async function loginWithGoogle(
  remember = true
): Promise<{ user: User; serverData: LoginServerResponse }> {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const accessToken = await user.getIdToken();

    const serverData = await sendLoginToServer({
      email: user.email || "",
      accessToken,
      userId: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "Google User",
      photoURL: user.photoURL,
      remember,
      method: "google",
    });

    return { user, serverData };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
}

/**
 * Sign in with GitHub OAuth popup.
 */
export async function loginWithGithub(
  remember = true
): Promise<{ user: User; serverData: LoginServerResponse }> {
  const auth = getAuth(app);
  const provider = new GithubAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const accessToken = await user.getIdToken();

    const serverData = await sendLoginToServer({
      email: user.email || "",
      accessToken,
      userId: user.uid,
      name: user.displayName || user.email?.split("@")[0] || "GitHub User",
      photoURL: user.photoURL,
      remember,
      method: "github",
    });

    return { user, serverData };
  } catch (error) {
    console.error("GitHub sign-in error:", error);
    throw error;
  }
}

/**
 * Request password reset via Firebase client Auth and server dispatch.
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const trimmedEmail = email.trim().toLowerCase();
  const auth = getAuth(app);

  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
  } catch (clientErr) {
    console.warn("Client-side sendPasswordResetEmail notice:", clientErr);
  }

  // Also notify server endpoint
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: trimmedEmail }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Unable to send password reset link.");
  }

  return data.message || `Password reset link dispatched to ${trimmedEmail}.`;
}

/**
 * Formats authentication errors into friendly, user-facing text.
 */
export function formatLoginError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  if (typeof error === "string") return error;

  const err = error as { code?: string; message?: string };

  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please verify your credentials.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/too-many-requests":
      return "Access temporarily locked due to many failed attempts. Please reset your password or try again later.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/popup-closed-by-user":
      return "Sign-in window closed before completing. Please try again.";
    case "auth/popup-blocked":
      return "Authentication popup was blocked by your browser. Please allow popups for this site.";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in provider.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    default:
      if (err.message) {
        const cleaned = err.message
          .replace(/^Firebase:\s*Error\s*\([^)]+\):?\s*/i, "")
          .replace(/^Firebase:\s*/i, "");
        return cleaned || "Sign-in failed. Please try again.";
      }
      return "Unable to sign in. Please verify your credentials.";
  }
}
