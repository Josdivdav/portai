import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("portai_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    let sessionPayload = null;
    try {
      sessionPayload = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    if (!sessionPayload || typeof sessionPayload !== "object" || !sessionPayload.authenticated) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionPayload,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      { error: "Failed to retrieve session." },
      { status: 500 }
    );
  }
}
