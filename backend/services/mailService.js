const nodemailer = require('nodemailer');
const env = require('../config/env');
function buildTransport() {
  if (!env.mailUsername || !env.mailHost) {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: env.mailHost,
    port: env.mailPort,
    secure: env.mailPort === 465,
    auth: { user: env.mailUsername, pass: env.mailPassword }
  });
}
let transporter = null;
function getTransport() {
  if (!transporter) transporter = buildTransport();
  return transporter;
}
function otpHtml(code, minutes, purposeLabel) {
  return `
<body style="margin:0;padding:24px;background:#ECFDF5;color:#111827;font-family:Arial,Helvetica,sans-serif">
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:14px;overflow:hidden;color:#111827">
<div style="background:#047857;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold">TruthLens AI</div>
<div style="padding:24px;background:#FFFFFF;color:#111827">
<p style="margin:0 0 12px;color:#111827">Hello,</p>
<p style="margin:0 0 12px;color:#111827">Use the one-time code below to complete ${purposeLabel}. This code expires in ${minutes} minutes and can only be used once.</p>
<div style="background:#ECFDF5;border:1px dashed #10B981;border-radius:10px;padding:16px;text-align:center;font-size:28px;letter-spacing:8px;color:#047857;font-weight:bold">${code}</div>
<p style="margin:16px 0 0;color:#64748B;font-size:13px">If you did not request this code, you can safely ignore this email. Never share this code with anyone.</p>
<p style="margin:16px 0 0;color:#64748B;font-size:12px">TruthLens AI &middot; Analyze. Verify. Understand the Truth.</p>
</div>
</div>`;
}
function securityHtml(message) {
  return `
<body style="margin:0;padding:24px;background:#ECFDF5;color:#111827;font-family:Arial,Helvetica,sans-serif">
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:14px;overflow:hidden;color:#111827">
<div style="background:#047857;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold">TruthLens AI</div>
<div style="padding:24px;background:#FFFFFF;color:#111827">
<p style="margin:0;color:#111827">${message}</p>
<p style="margin:16px 0 0;color:#64748B;font-size:13px">If this was not you, secure your account immediately and contact support.</p>
</div>
</div>`;
}
function analysisCompleteHtml({ title, score, verdict }) {
  return `
<body style="margin:0;padding:24px;background:#ECFDF5;color:#111827;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:520px;margin:0 auto;background:#F0FDF4;border:1px solid #A7F3D0;border-radius:14px;overflow:hidden;color:#111827">
<div style="background:#047857;padding:18px 24px;color:#ffffff;font-size:18px;font-weight:bold">TruthLens AI</div>
<div style="padding:24px;background:#FFFFFF;color:#111827">
<p style="margin:0 0 12px;color:#111827">Your article analysis is complete.</p>
<p style="margin:0 0 16px;color:#111827;font-weight:bold">${title}</p>
<div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:16px;text-align:center">
<div style="font-size:13px;color:#64748B">Overall credibility score</div>
<div style="font-size:32px;line-height:1.2;color:#047857;font-weight:bold">${score}/100</div>
<div style="font-size:14px;color:#065F46;font-weight:bold">${verdict}</div>
</div>
<p style="margin:18px 0 0;color:#64748B;font-size:13px">Your full credibility report is attached as a PDF.</p>
<p style="margin:16px 0 0;color:#64748B;font-size:12px">TruthLens AI &middot; Analyze. Verify. Understand the Truth.</p>
</div>
</div>
</body>`;
}
async function sendMail(to, subject, html, attachments = []) {
  const transport = getTransport();
  const info = await transport.sendMail({ from: env.mailFrom, to, subject, html, attachments });
  if (!env.mailUsername || env.nodeEnv === 'development') {
    console.log(`[MAIL DEV PREVIEW] to=${to} subject="${subject}"`);
    console.log(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500));
  }
  return info;
}
async function sendOtpEmail(to, name, code, purpose) {
  const label = purpose === 'reset' ? 'the password reset process' : 'signing in to your account';
  return sendMail(to, 'Your TruthLens AI one-time code', otpHtml(code, env.otpTtlMinutes, label));
}
async function sendSecurityEmail(to, name, message) {
  return sendMail(to, 'Security alert from TruthLens AI', securityHtml(message));
}
async function sendAnalysisCompleteEmail(to, { title, score, verdict, pdf }) {
  return sendMail(to, 'Your TruthLens AI analysis is ready', analysisCompleteHtml({ title, score, verdict }), [
    { filename: 'truthlens-analysis.pdf', content: pdf, contentType: 'application/pdf' }
  ]);
}
module.exports = { sendOtpEmail, sendSecurityEmail, sendAnalysisCompleteEmail, sendMail };
