import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { recordAttempt } from "@/lib/progress";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function asNumber(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(`attempt:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please slow down." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const levelId = typeof body.levelId === "string" ? body.levelId : "";
  const wpm = asNumber(body.wpm);
  const accuracy = asNumber(body.accuracy);
  const mistakes = asNumber(body.mistakes);
  const durationSeconds = asNumber(body.durationSeconds);

  if (!levelId || wpm === null || accuracy === null || mistakes === null || durationSeconds === null) {
    return NextResponse.json({ error: "Invalid attempt payload" }, { status: 400 });
  }

  try {
    const result = recordAttempt({
      userId: user.id,
      levelId,
      wpm: Math.max(0, Math.min(300, wpm)),
      accuracy: Math.max(0, Math.min(100, accuracy)),
      mistakes: Math.max(0, Math.round(mistakes)),
      durationSeconds: Math.max(1, Math.round(durationSeconds)),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save attempt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
