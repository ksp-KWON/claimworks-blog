import React from 'react';

interface SharedOGImageProps {
  title?: string;
  category?: string;
  label?: string;
  logoBase64?: string;
}

// 8대 분야별 W3C 톤온톤 뱃지 스타일 맵
const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  '사망·자살 보험금': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
  '질병진단·실손': { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  '교통사고 보상': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  '배상책임·의료': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  '근재·산재 사고': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  '장해평가·면책': { bg: '#fdf4ff', text: '#a21caf', border: '#f5d0fe' },
  '보상가이드': { bg: '#f8fafc', text: '#334155', border: '#cbd5e1' },
  '판례·분쟁조정': { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

export default function SharedOGImage({
  title,
  category = '보상가이드',
  label = '보상스쿨 전문 손해사정 칼럼',
  logoBase64,
}: SharedOGImageProps) {
  const catStyle = CATEGORY_STYLES[category] || CATEGORY_STYLES['보상가이드'];
  const isHomeOrBrand = !title || title === '보상스쿨 전문 손해사정 그룹' || title === '보상스쿨';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: '50px 60px',
        border: '14px solid #f1f5f9',
        fontFamily: 'sans-serif',
      }}
    >
      {/* ── 1. 상단 바 (브랜드 로고 & 카테고리 뱃지) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingBottom: '24px',
          borderBottom: '2px solid #e2e8f0',
        }}
      >
        {logoBase64 ? (
          <img
            src={logoBase64}
            alt="보상스쿨"
            width={240}
            height={68}
            style={{
              objectFit: 'contain',
            }}
          />
        ) : (
          <div
            style={{
              fontSize: '32px',
              fontWeight: '900',
              color: '#0f172a',
              letterSpacing: '-0.03em',
            }}
          >
            보상스쿨tv
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: catStyle.bg,
            color: catStyle.text,
            border: `1.5px solid ${catStyle.border}`,
            padding: '8px 18px',
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
          }}
        >
          {category || label}
        </div>
      </div>

      {/* ── 2. 중앙 메인 콘텐츠 ── */}
      {isHomeOrBrand ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            textAlign: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              fontSize: '64px',
              fontWeight: '900',
              color: '#0f172a',
              letterSpacing: '-0.04em',
              lineHeight: 1.2,
            }}
          >
            정도와 신뢰의 손해사정 실무 전문 그룹
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: '600',
              color: '#64748b',
              letterSpacing: '-0.02em',
            }}
          >
            보험 분쟁 무료 상담 · 판례 법리 분석 · 전국 의료기관 연계
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '20px 0',
          }}
        >
          <div
            style={{
              fontSize: title && title.length > 38 ? '48px' : '56px',
              fontWeight: '900',
              color: '#0f172a',
              lineHeight: 1.3,
              letterSpacing: '-0.03em',
              wordBreak: 'keep-all',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            {title}
          </div>
        </div>
      )}

      {/* ── 3. 하단 푸터 바 ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          paddingTop: '20px',
          borderTop: '2px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '22px',
            fontWeight: '800',
            color: '#2563eb',
            letterSpacing: '-0.01em',
          }}
        >
          <span>claim-works.com</span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ color: '#475569', fontWeight: '700' }}>보상스쿨 전문 손해사정 그룹</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '18px',
            fontWeight: '700',
            color: '#64748b',
          }}
        >
          손해사정 실무 전문가 1:1 권익 수호
        </div>
      </div>
    </div>
  );
}
