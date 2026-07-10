import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // VAPID 키를 함수 내부에서 초기화 (빌드 시가 아닌 런타임에만 실행)
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.error('VAPID keys not configured');
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 });
  }

  webpush.setVapidDetails(
    'mailto:ksp.claimworks@gmail.com',
    vapidPublicKey,
    vapidPrivateKey
  );

  try {
    const payload = await request.json();
    const notificationPayload = JSON.stringify({
      title: payload.title || '새로운 알림',
      body: payload.body || '내용이 없습니다.',
      url: payload.url || '/admin',
    });

    const { data: subscriptions, error } = await supabaseAdmin
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    const promises = subscriptions.map((sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      return webpush.sendNotification(pushSubscription, notificationPayload).catch(async (err) => {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error('Error sending push notification:', err);
        }
      });
    });

    await Promise.all(promises);
    return NextResponse.json({ success: true, sent: subscriptions.length });
  } catch (error) {
    console.error('Error in push notify:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
