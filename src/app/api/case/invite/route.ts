import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/lib/cases/repository";
import { createAccessToken, hashToken } from "@/lib/security";
import { apiError } from "@/lib/http";
const schema = z.object({ token: z.string().min(30) });
export async function POST(request: NextRequest) { try { const { token } = schema.parse(await request.json()); const inviteToken = createAccessToken(); const item = await getCaseRepository().issueRespondentInvite(token, hashToken(inviteToken)); const baseUrl = process.env.APP_URL || request.nextUrl.origin; return NextResponse.json({ case: item, inviteUrl: `${baseUrl}/attend/${inviteToken}` }); } catch (error) { return apiError(error); } }
