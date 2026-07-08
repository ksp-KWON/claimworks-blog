import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ─── 환경변수 ─────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ─── 타입 정의 ────────────────────────────────────────────────────────
export interface ChatSession {
  id: string;
  visitor_id: string;
  visitor_nickname?: string;
  created_at: string;
  last_message_at: string;
  unread_count: number;
  customer_memo?: string;
  status?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'visitor' | 'admin';
  content: string;
  created_at: string;
}

export interface Consultation {
  id: string;
  name: string;
  phone: string;
  birth_date?: string;
  accident_type: string;
  accident_date: string;
  accident_location: string;
  diagnosis: string;
  content: string;
  inquiry?: string;
  status: '대기' | '상담완료' | '보류';
  created_at: string;
}

export interface AdminCalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content?: string;
  created_at: string;
}

// ─── 방문자용 클라이언트 싱글턴 ───────────────────────────────────────
// Next.js HMR(Hot Module Replacement) 환경에서 "Multiple GoTrueClient instances" 경고를
// 방지하기 위해 globalThis에 캐싱합니다. (Next.js 공식 권장 패턴)
const GLOBAL_KEY = '__supabase_client__';

type GlobalWithSupabase = typeof globalThis & {
  [GLOBAL_KEY]?: SupabaseClient; // eslint-disable-line @typescript-eslint/no-explicit-any
};

function getSupabaseClient(): SupabaseClient { // eslint-disable-line @typescript-eslint/no-explicit-any
  const g = globalThis as GlobalWithSupabase;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,    // 익명 채팅 — 로그인 세션 불필요
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    });
  }
  return g[GLOBAL_KEY]!;
}

export const supabase = getSupabaseClient();

// ─── 서버 전용 관리자 클라이언트 ────────────────────────────────────
// ⚠️ 반드시 API Route / Server Action 에서만 사용하세요.
export function createServerSupabaseClient(): SupabaseClient { // eslint-disable-line @typescript-eslint/no-explicit-any
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
