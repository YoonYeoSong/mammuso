import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getMemberSession();
  return NextResponse.json({ user: session ? { id: session.userId, email: session.email } : null });
}
