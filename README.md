# 맘무소 (Mammuso)

가상의 마음 행정기관에서 관계분쟁을 접수하고, 양측의 독립 진술을 바탕으로 조정 의견을 받는 Next.js 서비스입니다.

## 시작 전 설정

1. Supabase에서 새 프로젝트를 만들고 `supabase/schema.sql`을 SQL Editor에서 실행합니다.
2. 프로젝트 URL과 서버 전용 **secret** 키를 `.env.local`에 넣습니다. (기존 Supabase 프로젝트라면 legacy `service_role` 키도 호환됩니다.)
3. Groq에서 API 키를 발급해 `.env.local`에 넣습니다.
4. `supabase/privacy-upgrade.sql`을 SQL Editor에서 실행해 동의 기록 컬럼을 추가합니다.
5. `.env.local`에 `PRIVACY_CONTACT_EMAIL`, `CASE_RETENTION_DAYS=30`, `CRON_SECRET`도 설정합니다.
6. `npm install`, `npm run dev`를 실행합니다.

`.env.local`은 절대로 Git에 올리지 않습니다. 모든 DB/AI 호출은 Next.js 서버 Route Handler에서만 이루어집니다.

## 핵심 구조

- `src/lib/cases/repository.ts`: DB 교체 지점인 `CaseRepository`
- `src/lib/ai/provider.ts`: AI 교체 지점인 `AIProvider`
- `src/app/api/*`: 브라우저에 비밀값을 노출하지 않는 서버 API
- 신청인 관리 주소와 상대방 출석 주소는 각각 고난도 랜덤 토큰의 SHA-256 해시로 검증됩니다.

## 고지

맘무소는 실제 행정기관과 관련이 없는 AI 기반 콘텐츠 서비스입니다. 제공되는 결과는 법률적 판단이나 실제 행정처분이 아닌 참고용 조정 의견입니다.

## 개인정보·베타 운영 점검

- 접수와 상대방 진술 전에 개인정보 처리 및 AI 처리 동의를 각각 기록합니다.
- 사건 내용은 Supabase에 보관되고, 조정 의견 생성에 필요한 최소 내용은 서버를 통해 Groq로 전달될 수 있습니다. 키는 브라우저에 노출하지 않습니다.
- 신청인은 관리 링크에서 사건 전체를 즉시 삭제할 수 있습니다.
- `vercel.json`의 일 1회 작업이 `CASE_RETENTION_DAYS`(기본 30일) 동안 업데이트가 없는 사건을 정리합니다. Vercel에 `CRON_SECRET`을 반드시 설정해야 합니다.
- 운영자 이름/문의처, 실제 외부 서비스 계약·국외 이전 사항은 공개 전 법률 전문가와 검토해 개인정보처리방침을 확정해야 합니다.
