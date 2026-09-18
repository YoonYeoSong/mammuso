import { z } from "zod";

export const dreamStatusSchema = z.enum(["SUFFICIENT", "NEEDS_FOLLOWUP"]);
export const dreamClaritySchema = z.enum(["평범함", "선명함", "상징이 강함", "반복됨", "강하게 기억남", "UNKNOWN"]);

export const dreamExtractedSchema = z.object({
  symbols: z.array(z.string().min(1).max(24)).max(8),
  actions: z.array(z.string().min(1).max(32)).max(8),
  setting: z.array(z.string().min(1).max(24)).max(4),
  ending: z.string().min(1).max(48).nullable(),
  emotion: z.string().min(1).max(24).nullable(),
  fortuneDomains: z.array(z.string().min(1).max(20)).max(5),
  notableDetails: z.array(z.string().min(1).max(70)).max(5),
  clarity: dreamClaritySchema,
  sensitive: z.boolean(),
});

export const dreamAnalysisSchema = z.object({
  status: dreamStatusSchema,
  extracted: dreamExtractedSchema,
  missingInformation: z.array(z.string().min(1).max(35)).max(3),
  followup: z.object({
    question: z.string().min(5).max(90).nullable(),
    options: z.array(z.string().min(1).max(30)).max(6),
  }),
});

export const dreamReadingSchema = z.object({
  summary: z.string().min(10).max(150),
  valueExplanation: z.string().min(30).max(330),
  interpretation: z.string().min(50).max(560),
  oneLiner: z.string().min(7).max(90),
});

export type DreamExtracted = z.infer<typeof dreamExtractedSchema>;
export type DreamAnalysis = z.infer<typeof dreamAnalysisSchema>;
export type DreamReading = z.infer<typeof dreamReadingSchema>;

export type DreamTurn = { question: string; answer: string };
export type DreamValue = { score: number; amount: number; label: string; factors: string[] };
