import { ReactNode } from 'react';

interface BlogBlockWrapperProps {
  children: ReactNode;
  className?: string;
}

export default function BlogBlockWrapper({ children, className = 'my-12' }: BlogBlockWrapperProps) {
  return (
    <div className={`${className} rounded-none overflow-hidden bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_6px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] relative`}>
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
      {children}
    </div>
  );
}
