'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWidget() {
  const KAKAO_OPEN_CHAT_URL = 'https://open.kakao.com/o/sWeszp7';

  const handleOpenKakaoChat = () => {
    window.open(KAKAO_OPEN_CHAT_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* 3D 스타일(원형) 플로팅 버튼 - 카카오톡 오픈채팅 연결 */}
      <AnimatePresence>
        <motion.button
          key="chat-floating-btn"
          id="chat-floating-btn"
          onClick={handleOpenKakaoChat}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-yellow-300 bg-[#FEE500]"
          style={{ 
            boxShadow: '0 8px 30px rgba(0,0,0,0.15), inset 0 -3px 6px rgba(0,0,0,0.06), inset 0 3px 6px rgba(255,255,255,0.5)',
            border: '1px solid rgba(229,231,235,0.5)'
          }}
          aria-label="카카오톡 오픈채팅 상담하기"
        >
          {/* 카카오톡 아이콘 (SVG) */}
          <svg className="w-8 h-8 text-[#371D1E]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4C6.48 4 2 7.58 2 12C2 14.56 3.42 16.86 5.6 18.26C5.4 19.06 4.8 20.86 4.8 20.86C4.8 20.86 6.8 20.56 8.6 19.36C9.6 19.76 10.8 20 12 20C17.52 20 22 16.42 22 12C22 7.58 17.52 4 12 4Z"/>
          </svg>
        </motion.button>
      </AnimatePresence>
    </>
  );
}
