// ─────────────────────────────────────────────────────────────────────────────
//  CivicEye Email Templates
//  One function per lifecycle event, each returns a complete HTML string.
// ─────────────────────────────────────────────────────────────────────────────

// Shared wrapper for all emails
const wrap = (title, color, body) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: ${color}; padding: 28px 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 13px; }
    .body { padding: 28px 32px; }
    .body h2 { color: #1a1a2e; font-size: 18px; margin: 0 0 16px; }
    .body p { color: #555; font-size: 14px; line-height: 1.7; margin: 0 0 12px; }
    .info-box { background: #f8f9fc; border-left: 4px solid ${color}; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
    .info-box table { width: 100%; border-collapse: collapse; }
    .info-box td { padding: 6px 0; font-size: 13px; vertical-align: top; }
    .info-box td:first-child { color: #888; width: 38%; font-weight: 600; }
    .info-box td:last-child { color: #333; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; background: ${color}20; color: ${color}; border: 1px solid ${color}40; }
    .footer { background: #f8f9fc; padding: 20px 32px; text-align: center; }
    .footer p { color: #aaa; font-size: 12px; margin: 0; }
    .footer a { color: #2E75B6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏙️ CivicEye</h1>
      <p>${title}</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>This is an automated notification from <a href="#">CivicEye Civic Platform</a>.<br/>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// ── 1. Complaint Registered ───────────────────────────────────────────────────
export const complaintRegisteredEmail = ({ citizenName, title, description, category, address, complaintId, createdAt }) => ({
    subject: `✅ Complaint Registered — "${title}"`,
    html: wrap(
        'Civic Issue Reporting Platform',
        '#2E75B6',
        `
        <h2>Your complaint has been registered!</h2>
        <p>Hi <strong>${citizenName}</strong>,</p>
        <p>Thank you for reporting a civic issue. Your complaint has been successfully submitted and is now under review by the concerned department.</p>

        <div class="info-box">
          <table>
            <tr><td>Complaint ID</td><td><strong>#${complaintId}</strong></td></tr>
            <tr><td>Title</td><td>${title}</td></tr>
            <tr><td>Category</td><td>${category}</td></tr>
            <tr><td>Description</td><td>${description}</td></tr>
            <tr><td>Location</td><td>${address}</td></tr>
            <tr><td>Submitted On</td><td>${createdAt}</td></tr>
            <tr><td>Status</td><td><span class="status-badge">Received</span></td></tr>
          </table>
        </div>

        <p>You will receive email updates at every stage — when a volunteer is assigned, when work begins, and when the issue is resolved.</p>
        <p>Thank you for helping improve your community! 🌍</p>
        `
    )
});

// ── 2. Volunteer Assigned ─────────────────────────────────────────────────────
export const volunteerAssignedEmail = ({ citizenName, title, volunteerName, complaintId, assignedAt }) => ({
    subject: `👷 Volunteer Assigned — "${title}"`,
    html: wrap(
        'Issue Update Notification',
        '#f39c12',
        `
        <h2>A volunteer has been assigned to your complaint</h2>
        <p>Hi <strong>${citizenName}</strong>,</p>
        <p>Good news! Your reported civic issue has been reviewed and a volunteer has been assigned to work on it.</p>

        <div class="info-box">
          <table>
            <tr><td>Complaint ID</td><td><strong>#${complaintId}</strong></td></tr>
            <tr><td>Issue Title</td><td>${title}</td></tr>
            <tr><td>Assigned To</td><td><strong>${volunteerName}</strong></td></tr>
            <tr><td>Assigned On</td><td>${assignedAt}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background:#f39c1220;color:#f39c12;border-color:#f39c1240;">Assigned</span></td></tr>
          </table>
        </div>

        <p>The volunteer will begin working on this issue shortly. You will receive another update when work actually begins.</p>
        <p>Thank you for your patience! 🙏</p>
        `
    )
});

// ── 3. Work Started (In Review) ───────────────────────────────────────────────
export const workStartedEmail = ({ citizenName, title, volunteerName, workNotes, complaintId, updatedAt }) => ({
    subject: `🔧 Work Started — "${title}"`,
    html: wrap(
        'Issue Update Notification',
        '#8e44ad',
        `
        <h2>Work has begun on your complaint</h2>
        <p>Hi <strong>${citizenName}</strong>,</p>
        <p>Your reported civic issue is now actively being worked on by the assigned volunteer.</p>

        <div class="info-box">
          <table>
            <tr><td>Complaint ID</td><td><strong>#${complaintId}</strong></td></tr>
            <tr><td>Issue Title</td><td>${title}</td></tr>
            <tr><td>Volunteer</td><td><strong>${volunteerName}</strong></td></tr>
            <tr><td>Work Started</td><td>${updatedAt}</td></tr>
            <tr><td>Volunteer Notes</td><td>${workNotes || 'Work in progress'}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background:#8e44ad20;color:#8e44ad;border-color:#8e44ad40;">In Review</span></td></tr>
          </table>
        </div>

        <p>Once the work is completed, it will go through an admin review before being marked as Resolved. We will notify you immediately after final approval.</p>
        `
    )
});

// ── 4. Resolved — Admin Approved ─────────────────────────────────────────────
export const issueResolvedEmail = ({ citizenName, title, volunteerName, workNotes, complaintId, resolvedAt }) => ({
    subject: `🎉 Issue Resolved — "${title}"`,
    html: wrap(
        'Issue Resolved Successfully',
        '#27ae60',
        `
        <h2>Great news — your issue has been resolved!</h2>
        <p>Hi <strong>${citizenName}</strong>,</p>
        <p>We are happy to inform you that your reported civic issue has been <strong>successfully resolved</strong> and approved by our admin team.</p>

        <div class="info-box">
          <table>
            <tr><td>Complaint ID</td><td><strong>#${complaintId}</strong></td></tr>
            <tr><td>Issue Title</td><td>${title}</td></tr>
            <tr><td>Resolved By</td><td><strong>${volunteerName}</strong></td></tr>
            <tr><td>Resolved On</td><td>${resolvedAt}</td></tr>
            <tr><td>Volunteer Notes</td><td>${workNotes || 'Issue addressed and resolved'}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background:#27ae6020;color:#27ae60;border-color:#27ae6040;">✅ Resolved</span></td></tr>
          </table>
        </div>

        <p>Thank you for taking the time to report this issue. Your contribution helps make our community a better place. 🌟</p>
        <p>If you feel the issue has not been fully addressed, you can report it again through the CivicEye platform.</p>
        `
    )
});

// ── 5. Resolution Rejected by Admin ──────────────────────────────────────────
export const resolutionRejectedEmail = ({ citizenName, title, volunteerName, rejectionNote, complaintId }) => ({
    subject: `⚠️ Resolution Under Re-Review — "${title}"`,
    html: wrap(
        'Issue Update Notification',
        '#e74c3c',
        `
        <h2>Your issue resolution is being re-reviewed</h2>
        <p>Hi <strong>${citizenName}</strong>,</p>
        <p>The admin has reviewed the resolution submitted by the volunteer for your complaint and has determined that <strong>further work is needed</strong>.</p>

        <div class="info-box">
          <table>
            <tr><td>Complaint ID</td><td><strong>#${complaintId}</strong></td></tr>
            <tr><td>Issue Title</td><td>${title}</td></tr>
            <tr><td>Volunteer</td><td>${volunteerName}</td></tr>
            <tr><td>Admin Note</td><td>${rejectionNote || 'Additional work required'}</td></tr>
            <tr><td>Status</td><td><span class="status-badge" style="background:#e74c3c20;color:#e74c3c;border-color:#e74c3c40;">Back In Progress</span></td></tr>
          </table>
        </div>

        <p>The volunteer has been asked to continue working on this issue. You will be notified again once the issue is resolved and approved.</p>
        <p>We apologize for the delay and appreciate your patience. 🙏</p>
        `
    )
});
