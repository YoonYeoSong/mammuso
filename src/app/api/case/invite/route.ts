import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/lib/cases/repository";
import { createAccessToken, hashToken } from "@/lib/security";
import { apiError } from "@/lib/http";
const schema = z.object({ token: z.string().min(30) });
function inviteExpiry() {
  const configuredDays = Number(process.env.RESPONDENT_INVITE_TTL_DAYS ?? "7");
  const days = Number.isFinite(configuredDays) ? Math.min(Math.max(Math.floor(configuredDays), 1), 30) : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
export async function POST(request: NextRequest) { try { const { token } = schema.parse(await request.json()); const inviteToken = createAccessToken(); const item = await getCaseRepository().issueRespondentInvite(token, hashToken(inviteToken), inviteExpiry()); const baseUrl = process.env.APP_URL || request.nextUrl.origin; return NextResponse.json({ case: item, inviteUrl: `${baseUrl}/attend/${inviteToken}` }); } catch (error) { return apiError(error); } }
export async function DELETE(request: NextRequest) { try { const { token } = schema.parse(await request.json()); return NextResponse.json({ case: await getCaseRepository().revokeRespondentInvite(token) }); } catch (error) { return apiError(error); } }
