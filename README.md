# 맘무소 (Mammuso)

가상의 마음 행정기관에서 관계분쟁을 접수하고, 양측의 독립 진술을 바탕으로 조정 의견을 받는 Next.js 서비스입니다.

## 시작 전 설정

1. Supabase에서 새 프로젝트를 만들고 `supabase/schema.sql`을 SQL Editor에서 실행합니다.
2. 프로젝트 URL과 서버 전용 **secret** 키를 `.env.local`에 넣습니다. (기존 Supabase 프로젝트라면 legacy `service_role` 키도 호환됩니다.)
3. Groq에서 API 키를 발급해 `.env.local`에 넣습니다.
4. `npm install`, `npm run dev`를 실행합니다.

`.env.local`은 절대로 Git에 올리지 않습니다. 모든 DB/AI 호출은 Next.js 서버 Route Handler에서만 이루어집니다.

## 핵심 구조

- `src/lib/cases/repository.ts`: DB 교체 지점인 `CaseRepository`
- `src/lib/ai/provider.ts`: AI 교체 지점인 `AIProvider`
- `src/app/api/*`: 브라우저에 비밀값을 노출하지 않는 서버 API
- 신청인 관리 주소와 상대방 출석 주소는 각각 고난도 랜덤 토큰의 SHA-256 해시로 검증됩니다.

## 고지

맘무소는 실제 행정기관과 관련이 없는 AI 기반 콘텐츠 서비스입니다. 제공되는 결과는 법률적 판단이나 실제 행정처분이 아닌 참고용 조정 의견입니다.
