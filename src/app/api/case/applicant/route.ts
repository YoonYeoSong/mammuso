import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { apiError } from "@/lib/http";
import { classifySafety } from "@/lib/safety";
import { assertNoSensitiveIdentifier } from "@/lib/sensitive-data";
const schema = z.object({ token: z.string().min(30), answers: z.record(z.string().max(1500)) });
const tokenSchema = z.string().min(30);
export async function GET(request: NextRequest) { try { const token = tokenSchema.parse(request.nextUrl.searchParams.get("token")); const item = await getCaseRepository().getByApplicantToken(token); if (!item) throw new Error("CASE_NOT_FOUND"); return NextResponse.json({ case: item }); } catch (error) { return apiError(error); } }
export async function POST(request: NextRequest) { try { const { token, answers } = schema.parse(await request.json()); assertNoSensitiveIdentifier(Object.values(answers)); const repo = getCaseRepository(); const item = await repo.getByApplicantToken(token); if (!item) throw new Error("CASE_NOT_FOUND"); if (classifySafety(Object.values(answers).join(" ")) === "urgent") return NextResponse.json({ case: await repo.markApplicantSafety(token, answers) }); const result = await getAIProvider().generatePreliminaryOpinion({ statement: item.complainantStatement, incidentDate: item.incidentDate ?? "날짜 미상", answers }); return NextResponse.json({ case: await repo.saveApplicantReview(token, answers, result, []) }); } catch (error) { return apiError(error); } }
