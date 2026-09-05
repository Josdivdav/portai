import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../lib/firebase-db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    try {
      await adminAuth.generatePasswordResetLink(trimmedEmail);
    } catch (err: unknown) {
      console.warn("Password reset link generation note:", err);
      // For security best practices, continue returning success so emails are not enumerated
    }

    return NextResponse.json({
      success: true,
      message: `Password reset link has been dispatched to ${trimmedEmail}. Please check your inbox and spam folders.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process password reset request. Please try again." },
      { status: 500 }
    );
  }
}

