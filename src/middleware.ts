import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";

interface SessionData {
  isAdmin: boolean;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (except login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const response = NextResponse.next();

    const session = await getIronSession<SessionData>(request, response, {
      password: process.env.SESSION_SECRET!,
      cookieName: "pupped-admin-session",
    });

    if (!session.isAdmin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
