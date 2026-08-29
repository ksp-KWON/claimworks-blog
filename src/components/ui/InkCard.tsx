import React from 'react';
import PremiumCard, { type PremiumCardProps } from './PremiumCard';

export interface InkCardProps extends Omit<PremiumCardProps, 'borderColor'> {
  borderColor?: 'charcoal' | 'ink';
}

/**
 * InkCard: 의정부 사이트 및 한국적 수묵화(Ink-Wash) 럭셔리 룩 전용 공통 UI 컴포넌트
 * 보상스쿨 PremiumCard 아키텍처를 100% 벤치마킹하여 무결 일체화
 */
export default function InkCard({
  children,
  className = '',
  borderColor = 'charcoal',
  hoverEffect = true,
  watermarkIcon,
  ...props
}: InkCardProps) {
  return (
    <PremiumCard
      borderColor={borderColor}
      hoverEffect={hoverEffect}
      watermarkIcon={watermarkIcon}
      className={className}
      {...props}
    >
      {children}
    </PremiumCard>
  );
}
