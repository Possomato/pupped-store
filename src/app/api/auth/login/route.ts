import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, recordLoginAttempt } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
             request.headers.get("x-real-ip") ||
             "unknown";

  const { allowed, remainingAttempts } = await checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    const isValid = password === process.env.ADMIN_PASSWORD;

    await recordLoginAttempt(ip, isValid);

    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid password",
          remainingAttempts: remainingAttempts - 1
        },
        { status: 401 }
      );
    }

    const session = await getSession();
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
