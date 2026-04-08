import nodemailer from 'nodemailer';

// nodemailer v8 uses the same createTransport API but the deprecated warning
// was from passing config properties incorrectly. This is the correct v8 setup.
const createTransporter = () => nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// sendEmail(to, subject, html)
// All three arguments are plain strings — no object wrapping
const sendEmail = async (to, subject, html) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[Email] EMAIL_USER or EMAIL_PASS not set in .env — skipping email send.');
        return;
    }

    if (!to || !subject || !html) {
        console.warn('[Email] Missing required argument (to, subject, or html) — skipping.');
        return;
    }

    const transporter = createTransporter();

    const mailOptions = {
        from: `"CivicEye 🏙️" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] ✅ Sent to ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
    } catch (err) {
        console.error(`[Email] ❌ Failed to send to ${to}:`, err.message);
        // Don't rethrow — email failures should never crash the main request
    }
};

export default sendEmail;