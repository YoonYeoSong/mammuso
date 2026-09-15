import { NextRequest, NextResponse } from "next/server";
import { getCaseRepository } from "@/lib/cases/repository";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const retentionDays = Number(process.env.CASE_RETENTION_DAYS ?? "30");
  const safeDays = Number.isFinite(retentionDays) && retentionDays >= 1 ? retentionDays : 30;
  const before = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const deleted = await getCaseRepository().deleteExpiredCases(before);
  return NextResponse.json({ deleted });
}
