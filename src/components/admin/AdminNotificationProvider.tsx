'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.warn('Audio play failed, possibly due to browser autoplay policy:', e);
      });
    }
  };

  useEffect(() => {
    const audio = new Audio('/notification.ogg');
    audio.preload = 'auto';
    audioRef.current = audio;

    // Listen for chat messages (only from visitor)
    const chatSub = supabase
      .channel('admin_audio_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        if (payload.new && payload.new.sender === 'visitor') {
          playAudio();
        }
      })
      .subscribe();

    // Listen for consultations
    const consultSub = supabase
      .channel('admin_audio_consult')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultations' }, payload => {
        if (payload.new) {
          playAudio();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSub);
      supabase.removeChannel(consultSub);
    };
  }, []);



  // Browser requires user interaction to play audio. 
  // We capture the first click anywhere in the admin panel to initialize audio.
  const handleInteraction = () => {
    if (!isAudioInitialized && audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current!.pause();
        audioRef.current!.currentTime = 0;
        setIsAudioInitialized(true);
      }).catch(() => {
        // Ignore
      });
    }
  };

  return (
    <div onClick={handleInteraction} className="contents">
      {children}
    </div>
  );
}
