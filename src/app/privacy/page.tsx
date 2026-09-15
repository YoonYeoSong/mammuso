import { Disclaimer, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata = { title: "개인정보처리방침 | 맘무소" };

const policyVersion = "2026-09-15";
const configured = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export default function PrivacyPage() {
  const operator = configured(process.env.OPERATOR_NAME, "맘무소 베타 운영자");
  const officer = configured(process.env.PRIVACY_OFFICER_NAME, operator);
  const contact = configured(process.env.PRIVACY_CONTACT_EMAIL, "운영자 문의처 설정 필요");
  const supabaseRegion = configured(process.env.SUPABASE_DATA_REGION, "Supabase 프로젝트 설정 리전");
  const retentionDays = configured(process.env.CASE_RETENTION_DAYS, "30");

  return <main><SiteHeader /><article className="paper policy"><p className="eyebrow">MAMMUSO BETA · 버전 {policyVersion}</p><h1>개인정보처리방침</h1><p>맘무소는 관계 갈등을 정리하는 AI 기반 콘텐츠 서비스입니다. 실제 행정기관·법원·법률기관이 아니며, 이 방침은 사건 기록을 처리하는 방식과 이용자의 권리를 설명합니다.</p>

    <h2>1. 개인정보처리자와 문의처</h2><dl><dt>개인정보처리자</dt><dd>{operator}</dd><dt>개인정보 보호책임자</dt><dd>{officer}</dd><dt>개인정보 문의·열람·삭제 요청</dt><dd>{contact}</dd></dl><p>이용자는 아래 문의처로 개인정보 처리 관련 문의, 열람·정정·삭제·처리정지 요청과 불만 처리를 요청할 수 있습니다.</p>

    <h2>2. 수집 항목·목적·보유 기간</h2><div className="policy-table"><div><b>수집 항목</b><b>처리 목적</b><b>보유 기간</b></div><div><span>관계 유형, 사건 진술, 추가답변, 상대방 진술, 이의신청 내용</span><span>사건 연결, 중립 쟁점 정리, 조정 의견 생성</span><span>마지막 사건 업데이트 후 {retentionDays}일 또는 이용자의 삭제 요청 시까지</span></div><div><span>접근용 토큰의 해시값, 사건 상태, 동의 버전·시각</span><span>안전한 사건 접근, 동의 증빙, 서비스 운영</span><span>동일</span></div></div><p>이름, 전화번호, 주소, 주민등록번호, 비밀번호, 금융정보는 서비스 제공에 필요하지 않으며 입력을 금지합니다. 서버는 전화번호·이메일·주민등록번호·카드번호 형식을 감지하면 접수를 제한합니다.</p>

    <h2>3. 수집·이용 및 AI 처리 동의</h2><p>사건 접수와 상대방 진술 제출 전에 (a) 사건 기록의 수집·이용과 (b) AI 분석을 위한 국외 전송 가능성에 대해 각각 동의를 받습니다. 동의하지 않으면 해당 진술을 접수할 수 없습니다. 동의는 서비스 제공에 필요한 최소 범위에서만 받으며, 동의 버전과 시각을 기록합니다.</p>

    <h2>4. 외부 처리 서비스와 국외 전송 가능성</h2><p>맘무소는 서비스 제공을 위해 아래 사업자를 사용합니다. 사건 원문을 상대방에게 공개하지 않지만, AI 조정 의견 생성에 필요한 사건 진술·추가답변은 서버를 거쳐 AI 제공업체에 전송될 수 있습니다.</p><div className="policy-table"><div><b>수탁·이전 가능 업체</b><b>처리 목적·항목</b><b>처리 위치·보관</b></div><div><span>Vercel</span><span>웹사이트와 서버 요청 처리. 서비스 요청 데이터가 일시적으로 처리될 수 있음</span><span>서비스 인프라 운영 위치. 운영자가 계약·리전을 정기 검토</span></div><div><span>Supabase</span><span>사건 기록·동의 기록·접근 토큰 해시 보관</span><span>{supabaseRegion}</span></div><div><span>Groq</span><span>AI 질문·중립 요약·조정 의견 생성에 필요한 사건 진술과 답변</span><span>국외 서비스 인프라에서 처리될 수 있음</span></div></div><p>외부 사업자와 처리 국가·리전, 계약·약관은 서비스 설정에 따라 달라질 수 있습니다. 운영자는 공개 운영 전 실제 선택한 리전과 이전·위탁 법적 근거를 확인하고, 변경 시 이 방침과 접수 화면을 갱신합니다.</p>

    <h2>5. 파기와 자동 정리</h2><p>신청인은 자신의 사건 관리 링크에서 사건 전체를 즉시 삭제할 수 있습니다. 삭제 요청이 완료되면 해당 사건의 진술·답변·결과·이의신청 기록을 복구할 수 없습니다. 서비스는 마지막 업데이트 후 {retentionDays}일 동안 활동이 없는 사건을 일 1회 정리하도록 구성되어 있습니다. 법령상 별도 보관 의무가 발생하는 경우에는 해당 근거와 기간에 따라 보관할 수 있습니다.</p>

    <h2>6. 상대방 보호와 안전 조치</h2><p>상대방에게는 신청인의 감정적 원문 대신 중립화한 접수 사유와 쟁점을 제공합니다. 신청인·상대방 링크는 서로 다른 임의 토큰을 사용하며 DB에는 토큰 원문 대신 해시값만 보관합니다. DB·AI 비밀키는 브라우저에 전달하지 않고 서버에서만 사용합니다.</p>

    <h2>7. 방침 변경</h2><p>이 방침은 {policyVersion}부터 적용합니다. 처리 목적·외부 처리 서비스·보유 기간 등 중요한 내용이 바뀌면 접수 화면에서 알리고, 변경된 방침과 적용일을 공개합니다.</p>
  </article><Disclaimer /><SiteFooter /></main>;
}
