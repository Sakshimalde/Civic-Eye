import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * sendEmail(to, subject, html)
 * Sends a branded HTML email from CivicEye
 */
const sendEmail = async (to, subject, html) => {
    const mailOptions = {
        from: `"CivicEye 🏙️" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[Email] Sent to ${to}: ${subject}`);
    } catch (err) {
        // Log but never crash the main flow
        console.error(`[Email] Failed to send to ${to}:`, err.message);
    }
};

export default sendEmail;
