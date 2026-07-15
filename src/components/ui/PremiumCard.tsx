import React from 'react';

type BorderColor = 'red' | 'rose' | 'blue' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'default';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  borderColor?: BorderColor;
  hoverEffect?: boolean;
}

export default function PremiumCard({
  children,
  className = '',
  borderColor = 'default',
  hoverEffect = false,
  ...props
}: PremiumCardProps) {
  let baseClass = 'bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 relative overflow-hidden rounded-none';
  
  if (hoverEffect) {
    // Add vertical lift to make it pop visually
    baseClass += ' hover:-translate-y-1 group/card';
  }

  // Handle colored border on hover if specified
  if (borderColor !== 'default') {
    if (hoverEffect) {
      // Overwrite the generic hover border color with the specific theme color
      baseClass = baseClass.replace('hover:border-[var(--google-blue)]', `hover:border-${borderColor}-500`);
      
      // Update shadow color based on theme (using more saturated/contrasting colors for stronger pop)
      if (borderColor === 'red') baseClass += ' hover:shadow-[0_20px_60px_rgba(239,68,68,0.35)] dark:hover:shadow-[0_20px_60px_rgba(239,68,68,0.5)]';
      if (borderColor === 'green') baseClass += ' hover:shadow-[0_20px_60px_rgba(19,115,51,0.35)] dark:hover:shadow-[0_20px_60px_rgba(19,115,51,0.5)]';
      if (borderColor === 'teal') baseClass += ' hover:shadow-[0_20px_60px_rgba(20,184,166,0.35)] dark:hover:shadow-[0_20px_60px_rgba(20,184,166,0.5)]';
      if (borderColor === 'blue') baseClass += ' hover:shadow-[0_20px_60px_rgba(26,115,232,0.35)] dark:hover:shadow-[0_20px_60px_rgba(26,115,232,0.5)]';
    }
  } else {
    if (hoverEffect) {
      // Default blue hover shadow with strong contrast
      baseClass += ' hover:shadow-[0_20px_60px_rgba(26,115,232,0.35)] dark:hover:shadow-[0_20px_60px_rgba(26,115,232,0.5)] hover:border-[var(--google-blue)]';
    }
  }

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {children}
    </div>
  );
}
