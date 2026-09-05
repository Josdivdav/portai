import { app } from "../lib/firebase";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  type User,
} from "firebase/auth";

export interface RegisterUserParams {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterServerResponse {
  success: boolean;
  message: string;
  user: {
    userId: string;
    email: string;
    name: string;
    authenticated: boolean;
    role: string;
    photoURL?: string | null;
    method: string;
    registeredAt: string;
    verified: boolean;
  };
}

export interface SendDataToServerParams {
  fullName: string;
  email: string;
  accessToken?: string;
  method: "email" | "google" | "github" | "password";
  userId: string;
  password?: string;
}

/**
 * Send user registration and token payload to the server-side API to establish
 * session cookies and store profile record in the database.
 */
export async function sendDataToServer(data: SendDataToServerParams): Promise<RegisterServerResponse> {
  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(responseData.error || "Failed to complete account registration on server.");
    }

    return responseData as RegisterServerResponse;
  } catch (error) {
    console.error("Error sending registration data to server:", error);
    throw error;
  }
}

/**
 * Registers a new user with email and password via Firebase Auth,
 * updates display name, and syncs session with server API.
 */
export async function registerUser({
  fullName,
  email,
  password,
}: RegisterUserParams): Promise<{ user: User; serverData: RegisterServerResponse }> {
  const auth = getAuth(app);
  const trimmedName = fullName.trim();
  const trimmedEmail = email.trim();

  try {
    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
    const user = credential.user;

    // Update profile display name
    if (trimmedName) {
      try {
        await updateProfile(user, { displayName: trimmedName });
      } catch (profileErr) {
        console.warn("Could not set displayName on user profile:", profileErr);
      }
    }

    // Retrieve fresh ID token for server verification
    const accessToken = await user.getIdToken(true);

    // Sync session and persist user record with server API
    const serverData = await sendDataToServer({
      fullName: trimmedName,
      email: trimmedEmail,
      accessToken,
      method: "email",
      userId: user.uid,
    });

    return { user, serverData };
  } catch (error) {
    console.error("Error registering user with email/password:", error);
    throw error;
  }
}

/**
 * Signs in or registers a user using Google OAuth popup,
 * retrieves ID token, and creates a verified server session.
 */
export async function continueWithGoogle(): Promise<{ user: User; serverData: RegisterServerResponse }> {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const accessToken = await user.getIdToken();

    const serverData = await sendDataToServer({
      fullName: user.displayName || user.email?.split("@")[0] || "Google User",
      email: user.email || "",
      accessToken,
      method: "google",
      userId: user.uid,
    });

    return { user, serverData };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

/**
 * Signs in or registers a user using GitHub OAuth popup,
 * retrieves ID token, and creates a verified server session.
 */
export async function continueWithGithub(): Promise<{ user: User; serverData: RegisterServerResponse }> {
  const auth = getAuth(app);
  const provider = new GithubAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const accessToken = await user.getIdToken();

    const serverData = await sendDataToServer({
      fullName: user.displayName || user.email?.split("@")[0] || "GitHub User",
      email: user.email || "",
      accessToken,
      method: "github",
      userId: user.uid,
    });

    return { user, serverData };
  } catch (error) {
    console.error("Error signing in with GitHub:", error);
    throw error;
  }
}

/**
 * Converts Firebase and API error codes into user-friendly error messages.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  if (typeof error === "string") return error;

  const err = error as { code?: string; message?: string };

  switch (err.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Please sign in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/operation-not-allowed":
      return "This sign-up method is not currently enabled. Please try another method.";
    case "auth/weak-password":
      return "Password should be at least 8 characters long.";
    case "auth/popup-closed-by-user":
      return "The sign-in popup was closed before completing. Please try again.";
    case "auth/popup-blocked":
      return "The popup was blocked by your browser. Please allow popups for this site.";
    case "auth/cancelled-popup-request":
      return "Sign-in request was cancelled. Please try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with the same email under a different login method. Please sign in with that provider.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/invalid-credential":
      return "Invalid credentials provided. Please check your details.";
    default:
      if (err.message) {
        // Strip common "Firebase: Error (auth/code)." prefixes if present
        const cleaned = err.message
          .replace(/^Firebase:\s*Error\s*\([^)]+\):?\s*/i, "")
          .replace(/^Firebase:\s*/i, "");
        return cleaned || "Unable to complete registration. Please try again.";
      }
      return "Unable to complete registration. Please check your information and try again.";
  }
}