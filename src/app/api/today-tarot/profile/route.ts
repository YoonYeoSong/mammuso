import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMemberSession } from "@/lib/auth/session";
import { getMemberSajuProfile, saveMemberSajuProfile } from "@/lib/today-tarot/member-repository";

const profileSchema = z.object({ birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => { const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; }, "INVALID_BIRTH_DATE"), birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(), birthTimeUnknown: z.boolean(), gender: z.enum(["female", "male", "other"]) }).superRefine((value, ctx) => {
  if (value.birthTimeUnknown && value.birthTime !== null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "UNKNOWN_TIME_MUST_BE_NULL" });
  if (!value.birthTimeUnknown && value.birthTime === null) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BIRTH_TIME_REQUIRED" });
});

export async function GET() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try { return NextResponse.json({ profile: await getMemberSajuProfile(session.userId) }); }
  catch { return NextResponse.json({ error: "PROFILE_UNAVAILABLE" }, { status: 503 }); }
}

export async function POST(request: NextRequest) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const profile = profileSchema.parse(await request.json());
    return NextResponse.json({ profile: await saveMemberSajuProfile(session.userId, profile) });
  } catch { return NextResponse.json({ error: "INVALID_PROFILE" }, { status: 400 }); }
}
