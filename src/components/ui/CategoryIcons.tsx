/**
 * CategoryIcons.tsx
 * 보상스쿨 카테고리 & 진료과목 전용 도메인 심볼 어댑터
 * - 공통 AppIcon 레지스트리를 기반으로 카테고리/진료과목별 의미론적 심볼을 매핑
 * - 이모지 완전 배제, W3C 표준 단색 SVG 라인 심볼 100% 통일
 */
import React from 'react';
import AppIcon, { type AppIconName } from './AppIcon';

// ── 개별 카테고리 아이콘 래퍼 (기존 외부 컴포넌트 100% 호환) ──
export const IconScale = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="scale" className={className} />;
export const IconRose = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="rose" className={className} />;
export const IconHeart = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="heart" className={className} />;
export const IconCar = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="car" className={className} />;
export const IconShield = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="shield" className={className} />;
export const IconHardHat = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="hardhat" className={className} />;
export const IconActivity = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="crutches" className={className} />;
export const IconLightbulb = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="lightbulb" className={className} />;

// ── 진료과목별 아이콘 래퍼 ──
export const IconBone = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="bone" className={className} />;
export const IconBrain = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="brain" className={className} />;
export const IconPill = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="pill" className={className} />;
export const IconScissors = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="scissors" className={className} />;
export const IconHeartPulse = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="heart" className={className} />;
export const IconEye = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="eye" className={className} />;
export const IconSkin = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="skin" className={className} />;
export const IconDna = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="dna" className={className} />;
export const IconTooth = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="tooth" className={className} />;
export const IconLeaf = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="leaf" className={className} />;

// ── 기타 섹션 헤더 심볼 ──
export const IconBooks = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="book" className={className} />;
export const IconStethoscope = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="stethoscope" className={className} />;
export const IconMap = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="compass" className={className} />;
export const IconWarning = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="warning" className={className} />;
export const IconClipboard = ({ className = 'w-6 h-6' }: { className?: string }) => <AppIcon name="file-text" className={className} />;

// ── 카테고리 slug → AppIcon 키 룩업 맵 ──
export const CATEGORY_ICON_NAMES: Record<string, AppIconName> = {
  '판례-법률-해석': 'scale',
  '사망-자살-보험금': 'rose',
  '질병진단-실손': 'heart',
  '교통사고-보상': 'car',
  '배상책임-의료': 'shield',
  '근재-산재-사고': 'hardhat',
  '장해평가-면책': 'crutches',
  '보상가이드': 'lightbulb',
  // 진료과목
  '정형외과': 'bone',
  '신경외과': 'brain',
  '내과': 'pill',
  '외과': 'scissors',
  '산부인과': 'heart',
  '안과': 'eye',
  '피부-성형외과': 'skin',
  '비뇨의학과': 'dna',
  '치과': 'tooth',
  '한방의학과': 'leaf',
};

export const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  '판례-법률-해석': IconScale,
  '사망-자살-보험금': IconRose,
  '질병진단-실손': IconHeart,
  '교통사고-보상': IconCar,
  '배상책임-의료': IconShield,
  '근재-산재-사고': IconHardHat,
  '장해평가-면책': IconActivity,
  '보상가이드': IconLightbulb,
  // 진료과목
  '정형외과': IconBone,
  '신경외과': IconBrain,
  '내과': IconPill,
  '외과': IconScissors,
  '산부인과': IconHeartPulse,
  '안과': IconEye,
  '피부-성형외과': IconSkin,
  '비뇨의학과': IconDna,
  '치과': IconTooth,
  '한방의학과': IconLeaf,
};

export function CategoryIcon({ slug, className = 'w-6 h-6' }: { slug: string; className?: string }) {
  const iconName = CATEGORY_ICON_NAMES[slug];
  if (!iconName) return null;
  return <AppIcon name={iconName} className={className} />;
}
