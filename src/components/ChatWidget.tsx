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
          className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 bg-blue-50"
          style={{ 
            boxShadow: '0 8px 30px rgba(26,115,232,0.25), inset 0 -3px 6px rgba(0,0,0,0.06), inset 0 3px 6px rgba(255,255,255,1)',
            border: '1px solid rgba(229,231,235,0.5)'
          }}
          aria-label="카카오톡 오픈채팅 상담하기"
        >
          {/* 파란색 말풍선 아이콘 (SVG) */}
          <svg className="w-7 h-7 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.58 2 11C2 13.56 3.42 15.86 5.6 17.26C5.4 18.06 4.8 19.86 4.8 19.86C4.8 19.86 6.8 19.56 8.6 18.36C9.6 18.76 10.8 19 12 19C17.52 19 22 15.42 22 11C22 6.58 17.52 3 12 3Z"/>
          </svg>

          {/* 은은한 빨간색 글로우(디머) 효과 */}
          <motion.div 
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{ 
              boxShadow: [
                '0 0 0px 0px rgba(239,68,68,0)', 
                '0 0 25px 8px rgba(239,68,68,0.4)', 
                '0 0 0px 0px rgba(239,68,68,0)'
              ] 
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.button>
      </AnimatePresence>
    </>
  );
}
