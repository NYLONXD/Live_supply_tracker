const axios = require('axios');
const logger = require('./logger.utils');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const brevo = axios.create({
  baseURL: 'https://api.brevo.com/v3',
  headers: {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json',
  },
});

// ─── Generate a 6-digit OTP ───────────────────────────────────────────────────
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── Shared HTML wrapper ──────────────────────────────────────────────────────
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border:1px solid #e4e7eb;border-radius:8px;overflow:hidden;">
    <div style="background:#000;padding:20px 32px;">
      <span style="color:#fff;font-weight:800;font-size:15px;letter-spacing:0.08em;">🚚 SUPPLY TRACKER</span>
    </div>
    <div style="padding:36px 32px;">
      ${content}
    </div>
    <div style="background:#f9fafb;border-top:1px solid #e4e7eb;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#a1a1aa;font-size:11px;">© 2025 Supply Tracker Systems · Secure Encrypted Connection</p>
    </div>
  </div>
</body>
</html>`;

// ─── Send OTP verification email ──────────────────────────────────────────────
const sendOTPEmail = async ({ to, name, otp }) => {
  const content = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111;letter-spacing:-0.02em;">Verify your email</h1>
    <p style="margin:0 0 28px;color:#71717a;font-size:14px;line-height:1.6;">
      Hi <strong style="color:#111;">${name}</strong>, enter the code below to activate your account.
      Do not share this code with anyone.
    </p>
    <div style="background:#f4f4f5;border-radius:10px;padding:28px 24px;text-align:center;margin-bottom:28px;">
      <div style="font-size:44px;font-weight:900;letter-spacing:0.35em;color:#000;font-family:'Courier New',Courier,monospace;">${otp}</div>
      <p style="margin:10px 0 0;color:#71717a;font-size:12px;font-weight:600;">
        ⏱ Expires in <strong>10 minutes</strong>
      </p>
    </div>
    <p style="margin:0;color:#a1a1aa;font-size:12px;line-height:1.6;">
      If you didn't create an account with Supply Tracker, you can safely ignore this email.
    </p>`;

  try {
    await brevo.post('/smtp/email', {
      sender: { name: 'Supply Tracker', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject: `${otp} — Your Supply Tracker verification code`,
      htmlContent: emailWrapper(content),
    });
    logger.info(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Brevo OTP email failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

// ─── Send password reset email ────────────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const content = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111;">Reset your password</h1>
    <p style="margin:0 0 28px;color:#71717a;font-size:14px;line-height:1.6;">
      Hi <strong style="color:#111;">${name}</strong>, we received a request to reset your password.
      Click the button below — this link expires in <strong>30 minutes</strong>.
    </p>
    <a href="${resetUrl}"
       style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em;">
      Reset Password →
    </a>
    <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;line-height:1.6;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>`;

  try {
    await brevo.post('/smtp/email', {
      sender: { name: 'Supply Tracker', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject: 'Password Reset Request — Supply Tracker',
      htmlContent: emailWrapper(content),
    });
    logger.info(`Password reset email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Brevo password reset email failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

// ─── Send invite email ────────────────────────────────────────────────────────
const sendInviteEmail = async ({ to, inviterName, orgName, role, inviteUrl }) => {
  const content = `
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111;">You're invited!</h1>
    <p style="margin:0 0 28px;color:#71717a;font-size:14px;line-height:1.6;">
      <strong style="color:#111;">${inviterName}</strong> has invited you to join
      <strong style="color:#111;">${orgName}</strong> on Supply Tracker as a
      <strong style="color:#111;">${role}</strong>.
    </p>
    <a href="${inviteUrl}"
       style="display:inline-block;background:#000;color:#fff;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:14px;">
      Accept Invitation →
    </a>
    <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;">
      This invite link expires in 7 days. If you didn't expect this email, ignore it.
    </p>`;

  try {
    await brevo.post('/smtp/email', {
      sender: { name: 'Supply Tracker', email: process.env.BREVO_SENDER_EMAIL },
      to: [{ email: to }],
      subject: `You've been invited to join ${orgName} on Supply Tracker`,
      htmlContent: emailWrapper(content),
    });
    logger.info(`Invite email sent to ${to}`);
    return true;
  } catch (error) {
    logger.error(`Brevo invite email failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail, sendInviteEmail };