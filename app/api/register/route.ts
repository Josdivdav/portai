import { NextRequest, NextResponse } from "next/server";

import { db } from "../../lib/firebase-db";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, method, userId } = body;

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

    if (!method || typeof method !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid sign-up method." },
        { status: 400 }
      );
    }

    if(body.accessToken && typeof body.accessToken !== "string") {
      return NextResponse.json(
        { error: "Invalid access token." },
        { status: 400 }
      );
    }

    // Here, you would typically handle the registration logic, such as saving the user to a database or performing additional checks.
    
    const verifiedToken = await getAuth().verifyIdToken(body.accessToken);

    const sessionPayload = {
      email,
      name: fullName.trim(),
      authenticated: true,
      role: "user",
      registeredAt: new Date().toISOString(),
      userId: userId,
      verified: verifiedToken ? true : false,
    };
    //

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
