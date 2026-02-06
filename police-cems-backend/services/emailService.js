const nodemailer = require("nodemailer");

/* ================= TRANSPORT ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SYSTEM_EMAIL,
    pass: process.env.SYSTEM_EMAIL_APP_PASSWORD
  }
});

/* ================= LOW LEVEL SEND ================= */
async function sendEmail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"Police CEMS" <${process.env.SYSTEM_EMAIL}>`,
    to,
    subject,
    html
  });
}

/* ================= SAFE SEND ================= */
async function safeSendEmail(options) {
  try {
    await sendEmail(options);
    return { ok: true };
  } catch (err) {
    console.error("Email send error:", err);
    return { ok: false, error: err.message };
  }
}

/* ================= EVENT → EMAIL ================= */
function buildEmailForEvent(eventType, data) {
  switch (eventType) {
    
    case "EVIDENCE_CREATED":
      return {
        to: data.email,
        subject: `[Police CEMS] Evidence Logged – ${data.evidenceCode}`,
        html: `
        <div style="font-family: Arial, sans-serif; background:#0f172a; color:#e5e7eb; padding:24px;">
        <h2 style="color:#60a5fa; margin-bottom:8px;">
          Evidence Successfully Logged
        </h2>

        <p>
          This is an official system notification confirming that a new
          evidence item has been recorded in the Police Case & Evidence
          Management System (CEMS).
        </p>

        <table style="margin-top:16px; border-collapse:collapse;">
          <tr><td><b>Evidence Code</b></td><td>${data.evidenceCode}</td></tr>
          <tr><td><b>Case Number</b></td><td>${data.caseNumber}</td></tr>
          <tr><td><b>Seized At Station</b></td><td>${data.station}</td></tr>
        </table>

        <p style="margin-top:24px; font-size:12px; color:#9ca3af;">
          This message was generated automatically by Police CEMS.
          Do not reply. All actions are logged and audited.
        </p>
      </div>
    `,
    referenceId: data.evidenceId
  };

    case "EVIDENCE_TRANSFERRED":
  return {
    to: data.email,
    subject: `[Police CEMS] Custody Transfer – ${data.evidenceCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#020617; color:#e5e7eb; padding:24px;">
        <h2 style="color:#38bdf8;">
          Evidence Custody Assigned to You
        </h2>

        <p>
          You are hereby notified that custody of the following evidence
          has been formally transferred to you within the Police CEMS.
        </p>

        <table style="margin-top:16px; border-collapse:collapse;">
          <tr><td><b>Evidence Code</b></td><td>${data.evidenceCode}</td></tr>
          <tr><td><b>Case Number</b></td><td>${data.caseNumber}</td></tr>
          <tr><td><b>Transfer ID</b></td><td>${data.transferId}</td></tr>
          <tr><td><b>From Station</b></td><td>${data.fromStation}</td></tr>
          <tr><td><b>To Station</b></td><td>${data.toStation}</td></tr>
        </table>

        <p style="margin-top:24px; font-size:12px; color:#94a3b8;">
          This is a system-generated custody notice.
          Custody acceptance is implicit and logged by the system.
        </p>
      </div>
    `,
    referenceId: data.transferId
  };

  case "PASSWORD_CHANGED":
  return {
    to: data.email,
    subject: "Your CEMS password was changed",
    html: `
      <p>Hello ${data.fullName},</p>

      <p>This is a confirmation that your account password was successfully changed.</p>

      <p><b>Login ID:</b> ${data.loginId}</p>
      <p><b>Date & Time:</b> ${new Date().toLocaleString()}</p>

      <p>If you did not perform this action, contact your system administrator immediately.</p>

      <br/>
      <p>— Police CEMS Security System</p>
    `,
    referenceId: data.userId
  };

    default:
      throw new Error(`Unknown email event: ${eventType}`);
  }
}

/* ================= LEDGER-GUARANTEED SEND ================= */
async function sendEventEmail({ eventType, data, db }) {
  const { to, subject, html, referenceId } =
    buildEmailForEvent(eventType, data);

  const result = await safeSendEmail({ to, subject, html });

  // 🔒 ALWAYS WRITE LEDGER ENTRY
  await db.query(
    `
    INSERT INTO email_ledger (
      event_type,
      recipient_email,
      subject,
      reference_id,
      delivery_status,
      error_message,
      attempted_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,NOW())
    `,
    [
      eventType,
      to,
      subject,
      referenceId,
      result.ok ? "SENT" : "FAILED",
      result.ok ? null : result.error
    ]
  );

  return result;
}

module.exports = { sendEventEmail };
