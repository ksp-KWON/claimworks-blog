import type { AppIconName } from '@/components/ui/AppIcon';

export interface PrecedentBadgeInfo {
  icon: AppIconName;
  label: string;
  badgeClass: string;
}

/**
 * 선례 메타데이터(caseNumber)를 분석하여 공식 표준 명칭에 따른 배지 정보를 반환합니다.
 * - 법원 판례: W3C scale 라인 SVG + '판례번호: [번호]'
 * - 금감원 분쟁조정: W3C shield-check 라인 SVG + '금감원 분쟁조정 결정번호: [번호]'
 * - 실무사례: W3C folder 라인 SVG + '실무사례 관리번호: [번호]'
 */
export function parsePrecedentBadge(caseNumber?: string | null): PrecedentBadgeInfo | null {
  if (!caseNumber || !caseNumber.trim()) return null;
  const raw = caseNumber.trim();

  // 1. 금융분쟁조정위원회 결정례 (금감원 분쟁조정)
  if (
    raw.includes('금융분쟁') ||
    raw.includes('분쟁조정') ||
    /제\s*\d{4}-\d+호/.test(raw) ||
    /조정\s*-\s*\d+/.test(raw)
  ) {
    const cleanNo = raw.replace(/^금융분쟁조정위원회\s*/, '').trim();
    return {
      icon: 'shield-check',
      label: `금감원 분쟁조정 결정번호: ${cleanNo}`,
      badgeClass: 'bg-[#e6f4ea] dark:bg-[#137333]/15 text-[#137333] dark:text-[#81c995] border border-[#81c995]/30'
    };
  }

  // 2. 실무사례 관리번호 (ClaimWorks CW 고유 코드)
  if (/^CW-\d{4}-/i.test(raw)) {
    return {
      icon: 'folder',
      label: `실무사례 관리번호: ${raw}`,
      badgeClass: 'bg-[#f1f3f4] dark:bg-[#303134] text-[#3c4043] dark:text-[#e8eaed] border border-gray-300 dark:border-gray-600'
    };
  }

  // 3. 법원 판례 (대법원, 고등법원, 지방법원 등 공통 공식 명칭)
  return {
    icon: 'scale',
    label: `판례번호: ${raw}`,
    badgeClass: 'bg-[#fce8e6] dark:bg-[#c5221f]/10 text-[#c5221f] dark:text-[#f28b82] border border-[#f28b82]/30'
  };
}
