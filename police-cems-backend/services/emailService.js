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

/* ================= SAFE SEND ================= */
async function safeSendEmail(options) {
  try {
    if (!validEmail(options.to))
      throw new Error("Invalid recipient email");

    await transporter.sendMail({
      from: `"Police CEMS" <${process.env.SYSTEM_EMAIL}>`,
      ...options
    });

    return { ok: true };

  } catch (err) {
    console.error("SMTP ERROR:", err.message);
    return { ok: false, error: err.message };
  }
}

/* ================= EVENT BUILDER ================= */
function buildEmailForEvent(eventType, data) {

  switch (eventType) {

    /* ================= USER EVENTS ================= */

    case "USER_REGISTERED_NOTIFICATION":
      return {
        to: process.env.SYSTEM_EMAIL,
        subject: `[Police CEMS] New Officer Registration – ${escapeHTML(data.loginId)}`,
        html: `
          <h2>New Officer Registration</h2>
          <p>Name: ${escapeHTML(data.fullName)}</p>
          <p>Email: ${escapeHTML(data.email)}</p>
          <p>Role: ${escapeHTML(data.role)}</p>
        `,
        referenceId: data.userId
      };

    case "USER_APPROVED":
      return {
        to: data.email,
        subject: `[Police CEMS] Account Approved`,
        html: `
          <h2>Account Approved</h2>
          <p>Hello ${escapeHTML(data.fullName)}</p>
          <p>Your account has been approved.</p>
        `,
        referenceId: data.userId
      };

    case "USER_BLOCKED":
      return {
        to: data.email,
        subject: `[Police CEMS] Account Blocked`,
        html: `
          <h2>Account Blocked</h2>
          <p>Hello ${escapeHTML(data.fullName)}</p>
          <p>Your account has been blocked.</p>
        `,
        referenceId: data.userId
      };

    case "USER_ROLE_CHANGED":
      return {
        to: data.email,
        subject: `[Police CEMS] Role Updated`,
        html: `
          <h2>Role Updated</h2>
          <p>Hello ${escapeHTML(data.fullName)}</p>
          <p>Your role has been updated to: <b>${escapeHTML(data.newRole)}</b></p>
        `,
        referenceId: data.userId
      };

    /* ================= STATION EVENTS ================= */

    case "STATION_ASSIGNED":
      return {
        to: data.email,
        subject: `[Police CEMS] Station Assignment`,
        html: `
          <h2>Station Assigned</h2>
          <p>Hello ${escapeHTML(data.fullName)}</p>
          <p>You have been assigned to: <b>${escapeHTML(data.stationName)}</b></p>
        `,
        referenceId: data.userId
      };

    case "STATION_STATUS_CHANGED":
      return {
        to: data.email,
        subject: `[Police CEMS] Station Status Updated`,
        html: `
          <h2>Station Status Changed</h2>
          <p>Station: ${escapeHTML(data.stationName)}</p>
          <p>New Status: <b>${escapeHTML(data.status)}</b></p>
        `,
        referenceId: data.stationName
      };

    /* ================= CASE / EVIDENCE EVENTS ================= */

    case "CASE_CREATED":
      return {
        to: data.email,
        subject: `[Police CEMS] New Case Created – ${escapeHTML(data.caseNumber)}`,
        html: `
          <h2>Case Created</h2>
          <p>Case Number: ${escapeHTML(data.caseNumber)}</p>
          <p>Station: ${escapeHTML(data.station)}</p>
        `,
        referenceId: data.caseId
      };

    case "EVIDENCE_CREATED":
      return {
        to: data.email,
        subject: `[Police CEMS] Evidence Logged – ${escapeHTML(data.evidenceCode)}`,
        html: `
          <h2>Evidence Logged</h2>
          <p>Evidence: ${escapeHTML(data.evidenceCode)}</p>
          <p>Case: ${escapeHTML(data.caseNumber)}</p>
        `,
        referenceId: data.evidenceId
      };

    case "EVIDENCE_TRANSFERRED":
      return {
        to: data.email,
        subject: `[Police CEMS] Evidence Transfer – ${escapeHTML(data.evidenceCode)}`,
        html: `
          <h2>Evidence Transferred</h2>
          <p>Evidence: ${escapeHTML(data.evidenceCode)}</p>
          <p>From: ${escapeHTML(data.fromStation)}</p>
          <p>To: ${escapeHTML(data.toStation)}</p>
        `,
        referenceId: data.transferId
      };

    /* ================= PASSWORD EVENTS ================= */

    case "PASSWORD_RESET_REQUESTED":
      return {
        to: data.email,
        subject: `[Police CEMS] Password Reset`,
        html: `
          <h2>Password Reset Requested</h2>
          <p>Hello ${escapeHTML(data.fullName)}</p>
          <a href="${escapeHTML(data.resetLink)}">Reset Password</a>
        `,
        referenceId: data.userId
      };

    case "PASSWORD_CHANGED":
      return {
        to: data.email,
        subject: `[Police CEMS] Password Updated`,
        html: `
          <h2>Password Changed</h2>
          <p>Your password was successfully updated.</p>
        `,
        referenceId: data.userId
      };

    default:
      throw new Error(`Unknown email event: ${eventType}`);
  }
}

/* ================= LEDGER GUARANTEED ================= */
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
    result = { ok: false, error: err.message };
  }

  await db.query(`
    INSERT INTO email_ledger
    (event_type, recipient_email, subject, reference_id, delivery_status, error_message, attempted_at)
    VALUES ($1,$2,$3,$4,$5,$6,NOW())
  `, [
    eventType,
    to || "system@unknown.local",
    subject || "UNKNOWN_EVENT",
    referenceId,
    result.ok ? "SENT" : "FAILED",
    result.ok ? null : result.error
  ]);

  return result;
}

module.exports = { sendEventEmail };