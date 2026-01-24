import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  isAdmin: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "pupped-admin-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}
