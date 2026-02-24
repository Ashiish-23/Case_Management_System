const nodemailer = require("nodemailer");

/* ================= ENV SAFETY ================= */
if (!process.env.SYSTEM_EMAIL || !process.env.SYSTEM_EMAIL_APP_PASSWORD) {
  console.error("❌ SYSTEM EMAIL ENV MISSING");
}

/* ================= HTML ESCAPE ================= */
function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ================= EMAIL VALIDATOR ================= */
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

/* ================= TRANSPORT ================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SYSTEM_EMAIL,
    pass: process.env.SYSTEM_EMAIL_APP_PASSWORD
  }
});

/* ================= LOW LEVEL SEND ================= */
async function sendEmail({ to, subject, html }) {
  if (!validEmail(to)) {
    throw new Error("Invalid recipient email");
  }

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
    console.error("SMTP ERROR:", err.message);
    return { ok: false, error: err.message };
  }
}

/* ================= EVENT BUILDER ================= */
function buildEmailForEvent(eventType, data) {
  switch (eventType) {

    case "EVIDENCE_CREATED":
      return {
        to: data.email,
        subject: `[Police CEMS] Evidence Logged – ${escapeHTML(data.evidenceCode)}`,
        html: `
          <div style="font-family: Arial; padding:24px;">
            <h2>Evidence Logged</h2>
            <p>Evidence: ${escapeHTML(data.evidenceCode)}</p>
            <p>Case: ${escapeHTML(data.caseNumber)}</p>
            <p>Station: ${escapeHTML(data.station)}</p>
          </div>
        `,
        referenceId: data.evidenceId
      };

    case "USER_APPROVED":
      return {
        to: data.email,
        subject: `[Police CEMS] Account Approved`,
        html: `
          <div style="font-family: Arial; padding:24px;">
            <h2>Account Approved</h2>
            <p>Hello ${escapeHTML(data.fullName)}</p>
            <p>Your account is now active.</p>
          </div>
        `,
        referenceId: data.userId
      };

    case "USER_BLOCKED":
      return {
        to: data.email,
        subject: `[Police CEMS] Account Blocked`,
        html: `
          <div style="font-family: Arial; padding:24px;">
            <h2>Account Blocked</h2>
            <p>Hello ${escapeHTML(data.fullName)}</p>
            <p>Your account has been blocked.</p>
          </div>
        `,
        referenceId: data.userId
      };

    case "USER_REGISTERED_NOTIFICATION":
      return {
        to: process.env.SYSTEM_EMAIL,
        subject: `[Police CEMS] New Registration – ${escapeHTML(data.loginId)}`,
        html: `
          <div style="font-family: Arial; padding:24px;">
            <h2>New Officer Registration</h2>
            <p>Name: ${escapeHTML(data.fullName)}</p>
            <p>Login ID: ${escapeHTML(data.loginId)}</p>
            <p>Email: ${escapeHTML(data.email)}</p>
          </div>
        `,
        referenceId: data.userId
      };

    case "STATION_STATUS_CHANGED":
      return {
        to: data.email,
        subject: `[Police CEMS] Station Status Updated`,
        html: `
          <div style="font-family: Arial; padding:24px;">
            <h2>Station Status Changed</h2>
            <p>Hello ${escapeHTML(data.fullName)}</p>
            <p>Station: ${escapeHTML(data.stationName)}</p>
            <p>Status: ${escapeHTML(data.status)}</p>
          </div>
        `,
        referenceId: data.stationName
      };

    default:
      throw new Error(`Unknown email event: ${eventType}`);
  }
}

/* ================= GUARANTEED LEDGER ================= */
async function sendEventEmail({ eventType, data, db }) {

  let to = null;
  let subject = null;
  let html = null;
  let referenceId = null;
  let result = { ok: false, error: null };

  try {
    const built = buildEmailForEvent(eventType, data);

    to = built.to;
    subject = built.subject;
    html = built.html;
    referenceId = built.referenceId;

    result = await safeSendEmail({ to, subject, html });

  } catch (err) {
    console.error("Email build/send failure:", err.message);
    result = { ok: false, error: err.message };
  }

  try {
    await db.query(`
      INSERT INTO email_ledger
      (event_type, recipient_email, subject, reference_id, delivery_status, error_message, attempted_at)
      VALUES ($1,$2,$3,$4,$5,$6,NOW())
    `, [
      eventType,
      to,
      subject,
      referenceId,
      result.ok ? "SENT" : "FAILED",
      result.ok ? null : result.error
    ]);
  } catch (ledgerErr) {
    console.error("Ledger insert failed:", ledgerErr.message);
  }

  return result;
}

module.exports = { sendEventEmail };