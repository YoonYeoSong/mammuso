import { NextResponse } from "next/server";

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
  if (message === "DB_NOT_CONFIGURED") return NextResponse.json({ error: "DB_NOT_CONFIGURED", message: "데이터베이스 설정이 아직 완료되지 않았습니다." }, { status: 503 });
  if (message === "AI_NOT_CONFIGURED") return NextResponse.json({ error: "AI_NOT_CONFIGURED", message: "AI 제공자 설정이 아직 완료되지 않았습니다." }, { status: 503 });
  if (message === "CASE_NOT_FOUND") return NextResponse.json({ error: "NOT_FOUND", message: "사건을 찾을 수 없거나 접근 주소가 올바르지 않습니다." }, { status: 404 });
  if (message === "APPEAL_ALREADY_FILED") return NextResponse.json({ error: message, message: "이 사건은 이미 이의신청이 접수되었습니다." }, { status: 409 });
  console.error(error);
  return NextResponse.json({ error: "REQUEST_FAILED", message: "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
}
