import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, remember } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
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

    // Standard demo account or any valid credential format
    const isDemo = email.toLowerCase() === "demo@portai.com";
    const userName = isDemo ? "Demo User" : email.split("@")[0];

    const sessionPayload = {
      email,
      name: userName,
      authenticated: true,
      role: isDemo ? "demo" : "user",
      loginAt: new Date().toISOString(),
    };

    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 1 day

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
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in. Please try again." },
      { status: 500 }
    );
  }
}
