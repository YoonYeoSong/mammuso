import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCaseRepository } from "@/lib/cases/repository";
import { apiError } from "@/lib/http";

const schema = z.object({ token: z.string().min(30) });

export async function POST(request: NextRequest) {
  try {
    const { token } = schema.parse(await request.json());
    const repository = getCaseRepository();
    const item = await repository.getByApplicantToken(token);
    if (!item) throw new Error("CASE_NOT_FOUND");
    await repository.deleteByApplicantToken(token);
    return NextResponse.json({ deleted: true });
  } catch (error) { return apiError(error); }
}
