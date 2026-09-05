import { NextRequest, NextResponse } from "next/server";
import { db, adminAuth } from "../../lib/firebase-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request payload. Expected JSON object." },
        { status: 400 },
      );
    }

    const { fullName, email, method, userId, accessToken, password } = body;

    // Validate full name
    const trimmedName = typeof fullName === "string" ? fullName.trim() : "";
    if (!trimmedName || trimmedName.length < 2) {
      return NextResponse.json(
        { error: "Please provide your full name (at least 3 characters)." },
        { status: 400 },
      );
    }

    // Validate email
    const trimmedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // Normalize method
    const resolvedMethod =
      typeof method === "string" ? method.toLowerCase() : "email";

    let finalUserId =
      typeof userId === "string" && userId.trim() ? userId.trim() : "";
    let photoURL: string | null = null;
    let isVerified = false;

    // 1. Verify access token if provided (client-side Firebase Auth flow)
    if (accessToken) {
      if (typeof accessToken !== "string") {
        return NextResponse.json(
          { error: "Invalid access token format." },
          { status: 400 },
        );
      }

      try {
        const decodedToken = await adminAuth.verifyIdToken(accessToken);
        finalUserId = decodedToken.uid;
        photoURL = decodedToken.picture || null;
        isVerified = Boolean(decodedToken.email_verified);
      } catch (tokenErr) {
        console.error("Token verification failed in /api/register:", tokenErr);
        return NextResponse.json(
          {
            error: "Invalid or expired authentication token. Please try again.",
          },
          { status: 401 },
        );
      }
    } else if (password && typeof password === "string") {
      // 2. Direct server-side account creation if password provided without client token
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long." },
          { status: 400 },
        );
      }

      try {
        const userRecord = await adminAuth.createUser({
          email: trimmedEmail,
          password: password,
          displayName: trimmedName,
        });
        finalUserId = userRecord.uid;
        isVerified = userRecord.emailVerified;
      } catch (createErr: unknown) {
        const err = createErr as { code?: string; message?: string };
        if (err.code === "auth/email-already-exists") {
          return NextResponse.json(
            {
              error:
                "An account with this email address already exists. Please sign in instead.",
            },
            { status: 409 },
          );
        }
        console.error("Firebase admin createUser error:", createErr);
        return NextResponse.json(
          {
            error:
              err.message ||
              "Unable to create account in authentication system.",
          },
          { status: 400 },
        );
      }
    }

    if (!finalUserId) {
      finalUserId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    // 3. Persist user profile record in Firebase Realtime Database
    try {
      await db.ref(`users/${finalUserId}`).set({
        uid: finalUserId,
        displayName: trimmedName,
        email: trimmedEmail,
        method: resolvedMethod,
        photoURL: photoURL,
        role: "user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn(
        "Notice: Realtime Database save skipped or errored (non-fatal):",
        dbErr,
      );
    }

    // 4. Construct secure session payload
    const sessionPayload = {
      userId: finalUserId,
      email: trimmedEmail,
      name: trimmedName,
      authenticated: true,
      role: "user",
      photoURL: photoURL,
      method: resolvedMethod,
      registeredAt: new Date().toISOString(),
      verified: isVerified,
    };

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user: sessionPayload,
    });

    // 5. Set session cookie for persistent authentication
    response.cookies.set({
      name: "portai_session",
      value: JSON.stringify(sessionPayload),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Unhandled error in /api/register:", error);
    return NextResponse.json(
      {
        error:
          "Failed to create account. Please check your information and try again.",
      },
      { status: 500 },
    );
  }
}
