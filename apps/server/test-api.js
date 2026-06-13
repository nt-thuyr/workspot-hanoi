const dotenv = require('dotenv');
dotenv.config();

console.log("Testing Brevo API Key:", process.env.BREVO_API_KEY ? "Loaded" : "Not Loaded");

async function testAPI() {
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
          name: "WorkSpotHanoi Test",
          email: process.env.BREVO_USER || "hoangvanbinh14122005@gmail.com",
        },
        to: [
          {
            email: "hoangvanbinh14122005@gmail.com",
            name: "Test User",
          },
        ],
        subject: "Test API Key from Server",
        htmlContent: "<b>This is a test</b>",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("API Test Failed:", response.status, err);
    } else {
      console.log("API Test Success:", await response.text());
    }
  } catch (err) {
    console.error("API Fetch Failed:", err);
  }
}

testAPI();
