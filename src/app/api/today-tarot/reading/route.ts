import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMemberSession } from "@/lib/auth/session";
import { saveMemberReading } from "@/lib/today-tarot/member-repository";

const inputSchema = z.object({ sessionId: z.string().min(8).max(120), dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), mainCardId: z.string().min(3).max(40), orientation: z.enum(["upright", "reversed"]), clarifierCardId: z.string().min(3).max(40).optional() });

export async function POST(request: NextRequest) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try { await saveMemberReading(session.userId, inputSchema.parse(await request.json())); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "READING_SAVE_FAILED" }, { status: 400 }); }
}
