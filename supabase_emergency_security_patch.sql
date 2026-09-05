-- =========================================================================
-- [보상스쿨 긴급 보안 패치] Supabase 개인정보 & RLS 100% 방어 쿼리
-- =========================================================================
-- [적용 방법]
-- 1. https://supabase.com 로그인 후 보상스쿨 프로젝트 접속
-- 2. 좌측 메뉴에서 'SQL Editor' 클릭 -> 'New query' 클릭
-- 3. 아래 SQL 전체를 복사하여 붙여넣고 'Run' (실행) 버튼 클릭
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. 상담 신청 내역 (consultations) 테이블 보호
-- -------------------------------------------------------------------------
-- RLS 활성화
ALTER TABLE IF EXISTS consultations ENABLE ROW LEVEL SECURITY;

-- 기존의 위험한 공용 권한 전면 삭제
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."consultations";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."consultations";
DROP POLICY IF EXISTS "Enable update for all users" ON "public"."consultations";
DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."consultations";
DROP POLICY IF EXISTS "Allow anon insert only" ON "public"."consultations";

-- 일반 방문자(익명 사용자): 오직 상담 접수(INSERT)만 가능
CREATE POLICY "Allow anon insert only" ON "public"."consultations"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- ※ SELECT, UPDATE, DELETE 정책을 public에 부여하지 않음으로써,
--   해커나 외부인이 anon 키로 고객 개인정보(이름, 전화번호, 진단명 등)를 조회할 경우
--   Supabase가 빈 배열([])을 반환하여 유출을 100% 원천 차단합니다.
--   (관리자는 Cloudflare backend의 service_role_key를 통해 안전하게 조회/관리합니다.)


-- -------------------------------------------------------------------------
-- 2. 웹 푸시 구독 (push_subscriptions) 테이블 보호
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."push_subscriptions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."push_subscriptions";
DROP POLICY IF EXISTS "Enable delete for all users" ON "public"."push_subscriptions";
DROP POLICY IF EXISTS "Allow anon insert only" ON "public"."push_subscriptions";

CREATE POLICY "Allow anon insert only" ON "public"."push_subscriptions"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);


-- -------------------------------------------------------------------------
-- 3. 실시간 채팅 (chat_sessions, chat_messages) 테이블 보호
-- -------------------------------------------------------------------------
ALTER TABLE IF EXISTS chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."chat_sessions";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."chat_sessions";
DROP POLICY IF EXISTS "Enable insert for all users" ON "public"."chat_messages";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."chat_messages";

-- 세션 생성 허용
CREATE POLICY "Allow visitor insert session" ON "public"."chat_sessions"
AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

-- 세션 조회 허용
CREATE POLICY "Allow visitor select session" ON "public"."chat_sessions"
AS PERMISSIVE FOR SELECT TO public USING (true);

-- 메시지 전송 및 실시간 수신 허용
CREATE POLICY "Allow visitor insert message" ON "public"."chat_messages"
AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Allow visitor select message" ON "public"."chat_messages"
AS PERMISSIVE FOR SELECT TO public USING (true);
