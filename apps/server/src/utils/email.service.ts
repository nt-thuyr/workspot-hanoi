import nodemailer from 'nodemailer';

interface EmailParams {
  to: string;
  guestName: string;
  cafeName: string;
  date: string;
  time: string;
  status: 'CONFIRMED' | 'CANCELLED';
}

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

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
    ? '【WorkSpot Hanoi】予約確定のお知らせ / Thông báo xác nhận đặt chỗ'
    : '【WorkSpot Hanoi】予約キャンセルのお知らせ / Thông báo hủy đặt chỗ';

  const accentColor = isConfirmed ? '#2e7d32' : '#c62828';
  const statusTextJa = isConfirmed ? '確定されました ✅' : 'キャンセルされました ❌';
  const statusTextVi = isConfirmed ? 'đã được xác nhận ✅' : 'đã bị hủy ❌';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 10px; background: #ffffff;">
      
      <!-- Header -->
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid ${accentColor};">
        <h1 style="font-size: 22px; color: ${accentColor}; margin: 0;">
          WorkSpot HaNoi
        </h1>
        <p style="color: #555; margin: 6px 0 0 0; font-size: 14px;">予約ステータス通知 / Thông báo trạng thái đặt chỗ</p>
      </div>

      <!-- Greeting -->
      <div style="padding: 20px 0 10px;">
        <p style="font-size: 15px; color: #222;">こんにちは <strong>${guestName}</strong> 様,</p>
        <p style="color: #444; line-height: 1.6;">
          WorkSpot Hanoiをご利用いただきありがとうございます。<br/>
          お客様の予約ステータスに更新がありましたのでお知らせいたします。
        </p>
        <p style="font-style: italic; color: #666; font-size: 13px;">
          Cảm ơn bạn đã sử dụng WorkSpot Hanoi.<br/>
          Chúng tôi xin thông báo về thay đổi trạng thái đặt chỗ của bạn.
        </p>
      </div>

      <!-- Status Banner -->
      <div style="background-color: ${isConfirmed ? '#e8f5e9' : '#ffebee'}; border-left: 4px solid ${accentColor}; padding: 14px 18px; border-radius: 6px; margin: 10px 0 20px;">
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: ${accentColor};">
          予約が${statusTextJa}
        </p>
        <p style="margin: 4px 0 0; font-size: 14px; color: ${accentColor};">
          Đặt chỗ của bạn ${statusTextVi}
        </p>
      </div>

      <!-- Reservation Details -->
      <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
          予約詳細 / Chi tiết đặt chỗ
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555; width: 40%;">🏠 店舗名 / Tên quán:</td>
            <td style="padding: 7px 0; color: #111;">${cafeName}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555;">📅 日付 / Ngày:</td>
            <td style="padding: 7px 0; color: #111;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555;">🕐 時間 / Giờ:</td>
            <td style="padding: 7px 0; color: #111;">${time}</td>
          </tr>
          <tr>
            <td style="padding: 7px 0; font-weight: 600; color: #555;">📋 状態 / Trạng thái:</td>
            <td style="padding: 7px 0; font-weight: bold; color: ${accentColor};">${status}</td>
          </tr>
        </table>
      </div>

      ${isConfirmed ? `
      <!-- CTA for confirmed -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #444; font-size: 14px;">ご来店を心よりお待ちしております！<br/>
        <span style="font-style: italic; color: #666;">Chúng tôi rất mong được chào đón bạn!</span></p>
      </div>
      ` : `
      <!-- Message for cancelled -->
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #444; font-size: 14px;">
          またのご利用をお待ちしております。<br/>
          <span style="font-style: italic; color: #666;">Chúng tôi hy vọng sẽ phục vụ bạn lần sau.</span>
        </p>
      </div>
      `}

      <!-- Footer -->
      <div style="border-top: 1px solid #e0e0e0; padding-top: 16px; text-align: center; color: #999; font-size: 12px;">
        <p style="margin: 0;">WorkSpot HaNoi — Không gian làm việc dành cho bạn</p>
        <p style="margin: 4px 0 0;">このメールは自動送信です。返信は受け付けておりません。</p>
      </div>
    </div>
  `;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"WorkSpot HaNoi 🏢" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: htmlContent,
  });

  console.log(`[Email] Sent reservation ${status} email to: ${to}`);
};
