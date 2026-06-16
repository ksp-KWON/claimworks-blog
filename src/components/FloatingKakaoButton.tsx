'use client';

import { motion } from 'framer-motion';

export default function FloatingKakaoButton() {
  const kakaoOpenChatUrl = "https://open.kakao.com/o/sWeszp7";

  return (
    <motion.a
      href={kakaoOpenChatUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 260, 
        damping: 20,
        delay: 0.5 
      }}
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#FEE500] text-[#000000] shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-shadow border border-[#FEE500] dark:border-black/10 group cursor-pointer"
      aria-label="카카오톡 실시간 상담"
    >
      <svg className="w-8 h-8 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3C6.477 3 2 6.541 2 10.908c0 2.502 1.432 4.745 3.659 6.13-.314 1.157-1.14 4.183-1.182 4.341-.053.197.075.18.156.126.104-.07 3.324-2.222 4.606-3.084.887.24 1.821.366 2.761.366 5.523 0 10-3.541 10-7.908C22 6.541 17.523 3 12 3z"/>
      </svg>
      {/* 알림 배지 (펄스 효과) */}
      <span className="absolute top-0 right-0 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-[#FEE500]"></span>
      </span>
    </motion.a>
  );
}
