interface EmailParams {
  to: string;
  guestName: string;
  cafeName: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'CANCELLED';
}

export const sendReservationStatusEmail = async ({
  to,
  guestName,
  cafeName,
  date,
  time,
  status,
}: EmailParams): Promise<void> => {
  const isConfirmed = status === 'CONFIRMED';

  const subject = isConfirmed
    ? '【WorkSpot Hanoi】予約確定のお知らせ'
    : '【WorkSpot Hanoi】予約キャンセルのお知らせ';

  const accentColor = isConfirmed ? '#2e7d32' : '#c62828';
  const statusTextJa = isConfirmed ? '確定されました ✅' : 'キャンセルされました ❌';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background: #ffffff;">
      
      <!-- Header -->
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${accentColor};">
        <h1 style="font-size: 22px; color: ${accentColor}; margin: 0;">
          WorkSpot HaNoi
        </h1>
        <p style="color: #555; margin: 6px 0 0 0; font-size: 14px;">予約ステータス通知</p>
      </div>

      <!-- Greeting -->
      <div style="padding: 20px 0 10px;">
        <p style="font-size: 15px; color: #222;">こんにちは <strong>${guestName}</strong> 様,</p>
        <p style="color: #444; line-height: 1.6;">
          WorkSpot Hanoiをご利用いただきありがとうございます。<br/>
          お客様の予約ステータスに更新がありましたのでお知らせいたします。
        </p>
      </div>

      <!-- Status Banner -->
      <div style="background-color: ${isConfirmed ? '#e8f5e9' : '#ffebee'}; border-left: 4px solid ${accentColor}; padding: 14px 18px; border-radius: 6px; margin: 10px 0 20px;">
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${accentColor};">
          予約が${statusTextJa}
        </p>
      </div>

      <!-- Reservation Details -->
      <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
          予約詳細
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555; width: 40%;">🏠 店舗名:</td>
            <td style="padding: 7px 0; color: #111;">${cafeName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555;">📅 日付:</td>
            <td style="padding: 7px 0; color: #111;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555;">🕐 時間:</td>
            <td style="padding: 7px 0; color: #111;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555;">📋 状態:</td>
            <td style="padding: 7px 0; font-weight: bold; color: ${accentColor};">${status}</td>
          </tr>
        </table>
      </div>

      ${isConfirmed ? `
      <!-- CTA for confirmed -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #444; font-size: 14px;">ご来店を心よりお待ちしております！</p>
      </div>
      ` : `
      <!-- Message for cancelled -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #444; font-size: 14px;">
          またのご利用をお待ちしております。
        </p>
      </div>
      `}

      <!-- Footer -->
      <div style="border-top: 1px solid #e0e0e0; padding-top: 16px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">WorkSpot HaNoi</p>
        <p style="margin: 4px 0 0;">このメールは自動送信です。返信は受け付けておりません。</p>
      </div>
    </div>
  `;

  if (!process.env.BREVO_API_KEY) {
    console.warn('[Email] BREVO_API_KEY is not set. Skipping email send.');
    return;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.BREVO_SENDER_NAME || 'WorkSpot Hanoi',
          email: process.env.SMTP_USER || 'workspothanoi@gmail.com',
        },
        to: [
          {
            email: to,
            name: guestName,
          },
        ],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Email] Failed to send email via Brevo:', response.status, errorData);
      throw new Error(`Failed to send email via Brevo: ${response.status}`);
    }

    console.log(`[Email] Sent reservation ${status} email to: ${to}`);
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    // Don't throw to avoid breaking the reservation flow just because email failed
  }
};

