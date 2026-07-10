import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  'mailto:ksp.claimworks@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
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
          // Subscription has expired or is no longer valid
          console.log('Subscription has expired or is no longer valid:', err);
          await supabaseAdmin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error('Error sending push notification:', err);
        }
      });
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, count: subscriptions.length });
  } catch (err) {
    console.error('Push notify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
