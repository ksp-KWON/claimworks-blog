import React from 'react';
import AppIcon from './AppIcon';
import { getCategoryMeta } from '@/lib/constants/categories';

/**
 * CategoryIcon
 * 카테고리/진료과목명 또는 슬러그를 기반으로 표준 AppIcon을 반환하는 컴팩트 어댑터
 */
export default function CategoryIcon({ 
  name, 
  size = 20, 
  className = '' 
}: { 
  name: string; 
  size?: number | string; 
  className?: string 
}) {
  const meta = getCategoryMeta(name);
  return <AppIcon name={meta.iconName} size={size} className={className} />;
}
