import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide your full name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const sessionPayload = {
      email,
      name: fullName.trim(),
      authenticated: true,
      role: "user",
      registeredAt: new Date().toISOString(),
    };

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully.",
      user: sessionPayload,
    });

    response.cookies.set({
      name: "portai_session",
      value: JSON.stringify(sessionPayload),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Failed to create account. Please check your information and try again." },
      { status: 500 }
    );
  }
}
