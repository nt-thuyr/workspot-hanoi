const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

console.log("Testing SMTP with:", process.env.SMTP_HOST, process.env.BREVO_LOGIN);

async function testSMTP() {
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_LOGIN || process.env.SMTP_USER, 
      pass: process.env.SMTP_PASS || process.env.BREVO_PASS, 
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    let info = await transporter.sendMail({
      from: `"WorkSpotHanoi" <${process.env.SMTP_USER}>`,
      to: "hoangvanbinh14122005@gmail.com",
      subject: "Test SMTP Email",
      text: "This is a test from Nodemailer SMTP",
      html: "<b>This is a test from Nodemailer SMTP</b>",
    });
    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error("SMTP Test Failed:", err.message);
  }
}

testSMTP();
