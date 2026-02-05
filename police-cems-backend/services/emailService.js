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
    return { ok: false, error: err.message };
  }
}

/* ================= EVENT → EMAIL ================= */
function buildEmailForEvent(eventType, data) {
  switch (eventType) {

    case "EVIDENCE_CREATED":
      return {
        to: data.email,
        subject: "New Evidence Logged",
        html: `
          <p>Evidence <b>${data.evidenceCode}</b> has been logged.</p>
          <p>Case Number: ${data.caseNumber}</p>
          <p>Station: ${data.station}</p>
        `,
        referenceId: data.evidenceId
      };

    case "EVIDENCE_TRANSFERRED":
      return {
        to: data.email,
        subject: "Evidence Custody Transferred",
        html: `
          <p>You have received custody of evidence <b>${data.evidenceCode}</b>.</p>
          <p>Case Number: ${data.caseNumber}</p>
          <p>Transfer ID: ${data.transferId}</p>
          <p>From: ${data.fromStation}</p>
          <p>To: ${data.toStation}</p>
        `,
        referenceId: data.transferId
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
