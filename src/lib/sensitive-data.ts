const rules = [
  { label: "전화번호", pattern: /(?:\+82|0)1[016789][\s-]?\d{3,4}[\s-]?\d{4}/ },
  { label: "이메일 주소", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { label: "주민등록번호", pattern: /\b\d{6}[\s-]?[1-4]\d{6}\b/ },
  { label: "카드번호", pattern: /\b(?:\d{4}[\s-]?){3}\d{4}\b/ },
];

export function findSensitiveIdentifier(text: string): string | null {
  return rules.find((rule) => rule.pattern.test(text))?.label ?? null;
}

export function assertNoSensitiveIdentifier(values: string[]): void {
  const detected = values.map(findSensitiveIdentifier).find(Boolean);
  if (detected) throw new Error(`SENSITIVE_IDENTIFIER_DETECTED:${detected}`);
}
