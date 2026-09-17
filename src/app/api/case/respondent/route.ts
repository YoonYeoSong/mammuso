import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { getCaseRepository } from "@/lib/cases/repository";
import { apiError } from "@/lib/http";
import { classifySafety } from "@/lib/safety";
import { assertNoSensitiveIdentifier } from "@/lib/sensitive-data";
import { SPICY_MODE_CONSENT_KEY } from "@/lib/cases/types";
const policyVersion = "2026-09-15";
const schema = z.object({ token: z.string().min(30), statement: z.string().min(20).max(5000), answers: z.record(z.string().max(1500)).optional().default({}), privacyPolicyAgreed: z.literal(true), aiProcessingAgreed: z.literal(true), spicyModeAgreed: z.boolean().optional().default(false) });
export async function POST(request: NextRequest) { try { const { token, statement, answers, spicyModeAgreed } = schema.parse(await request.json()); assertNoSensitiveIdentifier([statement, ...Object.values(answers)]); const repo = getCaseRepository(); const item = await repo.getByRespondentToken(token); if (!item) throw new Error("CASE_NOT_FOUND"); const spicyMode = item.complainantAnswers[SPICY_MODE_CONSENT_KEY] === "동의" && spicyModeAgreed; const savedAnswers = { ...answers, [SPICY_MODE_CONSENT_KEY]: spicyMode ? "동의" : "미동의" }; if (classifySafety(`${statement} ${Object.values(answers).join(" ")}`) === "urgent") return NextResponse.json({ case: await repo.markRespondentSafety(token, statement, savedAnswers) }); const result = await getAIProvider().generateJointDecision({ applicantStatement: item.complainantStatement, incidentDate: item.incidentDate, applicantAnswers: item.complainantAnswers, respondentStatement: statement, respondentAnswers: savedAnswers, spicyMode }); return NextResponse.json({ case: await repo.saveRespondentStatement(token, statement, savedAnswers, result, policyVersion) }); } catch (error) { return apiError(error); } }
