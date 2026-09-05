import { NextRequest, NextResponse } from "next/server";
import { db } from "../../lib/firebase-db";
import { DEFAULT_PORTFOLIO, createEmptyPortfolio, type PortfolioData } from "../../lib/portfolio-data";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    // Public lookup by slug
    if (slug) {
      try {
        const snapshot = await db.ref(`published/${slug}`).once("value");
        if (snapshot.exists()) {
          return NextResponse.json({
            success: true,
            portfolio: snapshot.val(),
          });
        }
      } catch (dbErr) {
        console.warn("Could not read published portfolio from DB:", dbErr);
      }

      return NextResponse.json(
        { error: "Portfolio not found", portfolio: null },
        { status: 404 }
      );
    }

    // Authenticated user portfolio lookup
    const sessionCookie = request.cookies.get("portai_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to access your portfolio." },
        { status: 401 }
      );
    }

    let session = null;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const snapshot = await db.ref(`portfolios/${session.userId}`).once("value");
      if (snapshot.exists()) {
        return NextResponse.json({
          success: true,
          portfolio: snapshot.val(),
          hasSavedData: true,
        });
      }
    } catch (dbErr) {
      console.warn("Could not read user portfolio from DB:", dbErr);
    }

    // If demo account, return sample portfolio
    if (session.role === "demo" || session.email === "demo@portai.com") {
      return NextResponse.json({
        success: true,
        portfolio: DEFAULT_PORTFOLIO,
        hasSavedData: true,
      });
    }

    // For newly registered users with no saved portfolio yet: return clean empty portfolio
    const emptyPortfolio = createEmptyPortfolio(session.name, session.email);

    return NextResponse.json({
      success: true,
      portfolio: emptyPortfolio,
      hasSavedData: false,
    });
  } catch (error) {
    console.error("Error in GET /api/portfolio:", error);
    return NextResponse.json(
      { error: "Failed to retrieve portfolio data." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("portai_session");
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to save your portfolio." },
        { status: 401 }
      );
    }

    let session = null;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    if (!session || !session.userId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid payload. Expected JSON portfolio object." },
        { status: 400 }
      );
    }

    const portfolioData: PortfolioData = body;

    // Validate required fields
    if (!portfolioData.fullName || typeof portfolioData.fullName !== "string") {
      return NextResponse.json(
        { error: "Portfolio must include a valid full name." },
        { status: 400 }
      );
    }

    // Normalize slug
    const cleanSlug = (portfolioData.slug || portfolioData.fullName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const finalPortfolio: PortfolioData = {
      ...portfolioData,
      slug: cleanSlug || "my-portfolio",
      lastParsedAt: portfolioData.lastParsedAt || new Date().toISOString(),
    };

    // Save user's portfolio and publish to public slug in Firebase Realtime Database
    try {
      await Promise.all([
        db.ref(`portfolios/${session.userId}`).set(finalPortfolio),
        db.ref(`published/${finalPortfolio.slug}`).set(finalPortfolio),
      ]);
    } catch (dbErr) {
      console.error("Error saving portfolio to Firebase Realtime Database:", dbErr);
      return NextResponse.json(
        { error: "Failed to persist portfolio to database. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Portfolio published and saved successfully.",
      portfolio: finalPortfolio,
      liveUrl: `/p/${finalPortfolio.slug}`,
    });
  } catch (error) {
    console.error("Error in POST /api/portfolio:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while saving portfolio." },
      { status: 500 }
    );
  }
}
