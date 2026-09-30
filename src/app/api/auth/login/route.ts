import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encodeMemberSession, memberSessionCookie } from "@/lib/auth/session";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/supabase-auth";

const inputSchema = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128), mode: z.enum(["signin", "signup"]) });

export async function POST(request: NextRequest) {
  try {
    const input = inputSchema.parse(await request.json());
    const account = input.mode === "signup" ? await signUpWithPassword(input.email, input.password) : await signInWithPassword(input.email, input.password);
    const response = NextResponse.json({ user: { id: account.userId, email: account.email } });
    response.cookies.set(memberSessionCookie(encodeMemberSession(account)));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "LOGIN_FAILED";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
