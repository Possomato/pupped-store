import { db } from "@/lib/db";
import { loginAttempts } from "@/lib/db/schema";
import { and, gte, eq } from "drizzle-orm";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

export async function checkRateLimit(ipAddress: string): Promise<{
  allowed: boolean;
  remainingAttempts: number;
}> {
  const cutoffTime = new Date(Date.now() - LOCKOUT_DURATION);

  const recentAttempts = await db
    .select()
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.ipAddress, ipAddress),
        eq(loginAttempts.success, false),
        gte(loginAttempts.createdAt, cutoffTime)
      )
    );

  const failedCount = recentAttempts.length;
  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedCount);

  return {
    allowed: failedCount < MAX_ATTEMPTS,
    remainingAttempts,
  };
}

export async function recordLoginAttempt(
  ipAddress: string,
  success: boolean
): Promise<void> {
  await db.insert(loginAttempts).values({
    ipAddress,
    success,
  });
}
