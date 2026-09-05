CREATE TABLE push_subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  endpoint text UNIQUE NOT NULL,
  p256dh text,
  auth text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- [보상스쿨 보안 패치] push_subscriptions 테이블 RLS 보안 정책 강화
-- =========================================================================

-- 1. RLS (Row Level Security) 활성화
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. 기존 취약한 공용 정책 제거 (모든 사용자의 조회/삭제 차단)
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."push_subscriptions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."push_subscriptions";
DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."push_subscriptions";
DROP POLICY IF EXISTS "Allow anon insert only" ON "public"."push_subscriptions";

-- 3. 방문자(익명 사용자): 오직 웹 푸시 구독 등록(INSERT)만 허용
CREATE POLICY "Allow anon insert only" ON "public"."push_subscriptions"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- ※ SELECT, UPDATE, DELETE 정책은 public에 일체 부여하지 않습니다.
--   푸시 발송 및 구독 목록 관리는 서버(service_role_key)에서만 안전하게 수행됩니다.
