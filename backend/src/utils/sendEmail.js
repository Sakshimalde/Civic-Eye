import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmail(to, subject, html)
 * Sends email via Resend API (works on Render free tier)
 */
const sendEmail = async (to, subject, html) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'CivicEye <onboarding@resend.dev>', // works without domain verification
            to,
            subject,
            html,
        });

        if (error) {
            console.error(`[Email] Resend error to ${to}:`, error.message);
            return;
        }

        console.log(`[Email] Sent to ${to}: ${subject} (id: ${data.id})`);
    } catch (err) {
        console.error(`[Email] Failed to send to ${to}:`, err.message);
    }
};

export default sendEmail;