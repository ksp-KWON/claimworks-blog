CREATE TABLE push_subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  endpoint text UNIQUE NOT NULL,
  p256dh text,
  auth text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS 비활성화 (서버 측에서 service_role을 사용하여 안전하게 제어)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for all users" ON "public"."push_subscriptions"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."push_subscriptions"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable delete for all users" ON "public"."push_subscriptions"
AS PERMISSIVE FOR DELETE
TO public
USING (true);
