/**
 * admin-utils.ts
 * 관리자 패널 공통 유틸리티 모듈
 * 
 * [원칙: 표준, 범용, 콤팩트, 통합, 공유, 공통]
 * - 상담관리, 채팅관리, 일정관리, 원고관리 전반에서 사용하는 날짜/시간 포매터 및 헬퍼
 */

/**
 * 관리자 패널 공통 날짜/시간 포매터
 * ISO 날짜 문자열을 "MM.DD HH:mm" (예: "08.26 10:12") 형태로 반환
 */
export function formatAdminDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${MM}.${DD} ${HH}:${mm}`;
  } catch {
    return '-';
  }
}

/**
 * 관리자 패널 공통 날짜 포매터 (YYYY.MM.DD.)
 */
export function formatAdminDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return dateString.replace(/-/g, '.') + (dateString.endsWith('.') ? '' : '.');
}
