import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// 구글 앱 비밀번호 및 발신/수신 이메일 주소
// (보안을 위해 환경변수로 관리하는 것이 좋으나, 빠른 적용을 위해 직접 삽입)
const EMAIL_ADDRESS = 'ksp.claimworks@gmail.com';
const APP_PASSWORD = 'hzpf tslb rman rqle'; // 대표님이 제공해주신 앱 비밀번호

// Nodemailer 트랜스포터 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_ADDRESS,
    pass: APP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Supabase Webhook payload 구조
    // { type: 'INSERT', table: 'consultations', record: { ... } }
    
    if (payload.type !== 'INSERT') {
      return NextResponse.json({ message: 'Only INSERT events are supported.' }, { status: 200 });
    }

    let subject = '';
    let htmlContent = '';

    if (payload.table === 'consultations') {
      const { name, phone, accident_type, accident_date, diagnosis } = payload.record;
      subject = `[보상스쿨] 새로운 상담 접수: ${name}님`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #1a73e8;">📋 새로운 상담이 접수되었습니다!</h2>
          <hr style="border: 1px solid #f0f0f0; margin: 15px 0;" />
          <ul style="list-style: none; padding: 0; font-size: 16px; line-height: 1.6;">
            <li><strong>👤 이름:</strong> ${name || '미상'}</li>
            <li><strong>📞 연락처:</strong> ${phone || '미상'}</li>
            <li><strong>🚨 사고유형:</strong> ${accident_type || '미상'}</li>
            <li><strong>📅 사고일자:</strong> ${accident_date || '미상'}</li>
            <li><strong>🩺 진단명:</strong> ${diagnosis || '미상'}</li>
          </ul>
          <hr style="border: 1px solid #f0f0f0; margin: 15px 0;" />
          <p style="font-size: 14px; color: #555;">관리자 페이지에 접속하여 자세한 내용을 확인해주세요.</p>
          <a href="https://claim-works.com/admin" style="display: inline-block; padding: 10px 20px; background-color: #1a73e8; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">관리자 페이지로 이동</a>
        </div>
      `;
    } else if (payload.table === 'chat_messages') {
      // 채팅은 방문자가 보낸 메시지만 알림
      if (payload.record.sender !== 'visitor') {
        return NextResponse.json({ message: 'Ignored non-visitor message.' }, { status: 200 });
      }
      const { content } = payload.record;
      subject = `[보상스쿨] 새로운 채팅 메시지 도착`;
      htmlContent = `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #34a853;">💬 새로운 채팅 메시지가 왔습니다!</h2>
          <hr style="border: 1px solid #f0f0f0; margin: 15px 0;" />
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; font-size: 16px; margin: 15px 0;">
            "${content}"
          </div>
          <p style="font-size: 14px; color: #555;">관리자 페이지에 접속하여 답장을 보내주세요.</p>
          <a href="https://claim-works.com/admin" style="display: inline-block; padding: 10px 20px; background-color: #34a853; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">채팅방 바로가기</a>
        </div>
      `;
    } else {
      return NextResponse.json({ message: 'Unknown table.' }, { status: 200 });
    }

    const mailOptions = {
      from: `"보상스쿨 알리미" <${EMAIL_ADDRESS}>`,
      to: EMAIL_ADDRESS, // 대표님 이메일로 전송
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Email sent successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Email Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
