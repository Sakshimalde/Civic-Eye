import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

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
        console.error(`[Email] Failed to send to ${to}:`, err.message);
    }
};

export default sendEmail;