import { NextRequest, NextResponse } from "next/server";
import { db, adminAuth } from "../../../lib/firebase-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 }
      );
    }

    const { email, password, accessToken, remember, userId, method, name, photoURL: bodyPhoto } = body;

    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const isDemo = trimmedEmail === "demo@portai.com";

    let finalUserId = typeof userId === "string" && userId.trim() ? userId.trim() : "";
    let resolvedName = isDemo
      ? "Demo User"
      : typeof name === "string" && name.trim()
      ? name.trim()
      : trimmedEmail
      ? trimmedEmail.split("@")[0]
      : "User";
    let photoURL: string | null =
      typeof bodyPhoto === "string" && bodyPhoto ? bodyPhoto : null;
    let resolvedEmail = trimmedEmail;

    if (accessToken && typeof accessToken === "string") {
      // 1. Verify token with Firebase Admin
      try {
        const decodedToken = await adminAuth.verifyIdToken(accessToken);
        finalUserId = decodedToken.uid;
        resolvedEmail = decodedToken.email || trimmedEmail;
        resolvedName =
          decodedToken.name ||
          (typeof name === "string" && name.trim() ? name.trim() : resolvedName);
        photoURL = decodedToken.picture || photoURL;
      } catch (tokenErr) {
        console.error("Token verification failed in /api/auth/login:", tokenErr);
        return NextResponse.json(
          { error: "Invalid or expired session token. Please try signing in again." },
          { status: 401 }
        );
      }
    } else if (isDemo) {
      // 2. Demo bypass
      finalUserId = "demo-user-id";
      resolvedName = "Demo User";
      resolvedEmail = "demo@portai.com";
    } else {
      // 3. Fallback direct credentials verification via Firebase Identity Toolkit
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        return NextResponse.json(
          { error: "Please enter a valid email address." },
          { status: 400 }
        );
      }

      if (!password || typeof password !== "string" || password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }

      const apiKey =
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
        process.env.FIREBASE_API_KEY ||
        "AIzaSyBtaCMH97NYXFuUMd5OjGjEEs7DhLOlVek";

      try {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: trimmedEmail,
              password,
              returnSecureToken: true,
            }),
          }
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.error) {
          const errMsg = data.error?.message || "";
          if (
            errMsg === "INVALID_LOGIN_CREDENTIALS" ||
            errMsg === "INVALID_PASSWORD" ||
            errMsg === "EMAIL_NOT_FOUND"
          ) {
            return NextResponse.json(
              { error: "Incorrect email or password. Please verify your credentials." },
              { status: 401 }
            );
          }
          if (errMsg === "USER_DISABLED") {
            return NextResponse.json(
              { error: "This account has been disabled. Please contact support." },
              { status: 403 }
            );
          }
          if (errMsg === "TOO_MANY_ATTEMPTS_TRY_LATER") {
            return NextResponse.json(
              {
                error:
                  "Access temporarily locked due to many failed attempts. Please try again later.",
              },
              { status: 429 }
            );
          }
          return NextResponse.json(
            { error: "Authentication failed. Please check your credentials." },
            { status: 401 }
          );
        }

        finalUserId = data.localId;
        resolvedEmail = data.email || trimmedEmail;
        resolvedName =
          data.displayName ||
          (typeof name === "string" && name.trim() ? name.trim() : resolvedName);
      } catch (authErr) {
        console.error("Direct auth verification error:", authErr);
        return NextResponse.json(
          { error: "Unable to verify credentials with authentication server." },
          { status: 500 }
        );
      }
    }

    if (!finalUserId) {
      finalUserId = `user_${Date.now()}`;
    }

    // 4. Update or initialize user profile in Firebase Realtime Database
    try {
      const userRef = db.ref(`users/${finalUserId}`);
      const snapshot = await userRef.once("value");
      if (snapshot.exists()) {
        const existing = snapshot.val();
        resolvedName = existing.displayName || resolvedName;
        photoURL = photoURL || existing.photoURL || null;
        await userRef.update({
          lastLoginAt: new Date().toISOString(),
          displayName: resolvedName,
          photoURL: photoURL,
        });
      } else {
        await userRef.set({
          uid: finalUserId,
          displayName: resolvedName,
          email: resolvedEmail,
          method: method || (accessToken ? "token" : "password"),
          photoURL: photoURL,
          role: isDemo ? "demo" : "user",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("Notice: Realtime Database user sync skipped or errored:", dbErr);
    }

    const sessionPayload = {
      userId: finalUserId,
      email: resolvedEmail,
      name: resolvedName,
      authenticated: true,
      role: isDemo ? "demo" : "user",
      photoURL: photoURL,
      method: method || (accessToken ? "token" : "password"),
      loginAt: new Date().toISOString(),
    };

    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 days or 7 days

    const response = NextResponse.json({
      success: true,
      message: "Successfully signed in",
      user: sessionPayload,
    });

    response.cookies.set({
      name: "portai_session",
      value: JSON.stringify(sessionPayload),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Sign-in server error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in. Please try again." },
      { status: 500 }
    );
  }
}

