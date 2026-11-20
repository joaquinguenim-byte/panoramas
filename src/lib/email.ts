/**
 * Transactional email.
 *
 * With RESEND_API_KEY set, mail goes through Resend (https://resend.com).
 * Without it (local development) the message is printed to the server log and
 * appended to ./storage/outbox.log, so links can be clicked while testing.
 */
import { appendFile, mkdir } from "fs/promises";
import path from "path";

export type Mail = { to: string; subject: string; text: string; html?: string };

export function appUrl(p = "/") {
  const base = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${p}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Simple branded layout: a paragraph list and one call-to-action button. */
export function layout(opts: { paragraphs: string[]; cta?: { label: string; url: string }; footer: string }) {
  const p = opts.paragraphs.map((x) => `<p style="margin:0 0 14px">${esc(x)}</p>`).join("");
  const btn = opts.cta
    ? `<p style="margin:22px 0"><a href="${esc(opts.cta.url)}" style="background:#e85d3a;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700">${esc(opts.cta.label)}</a></p><p style="font-size:12px;color:#777;word-break:break-all">${esc(opts.cta.url)}</p>`
    : "";
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:auto;padding:24px;color:#222;line-height:1.5"><p style="font-size:20px;font-weight:800;margin:0 0 18px">Panoramas</p>${p}${btn}<p style="font-size:12px;color:#777;margin-top:28px">${esc(opts.footer)}</p></div>`;
}

export async function sendEmail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is required in production");
    const entry = `\n--- ${new Date().toISOString()} to=${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`;
    console.log(`[email:dev]${entry}`);
    const dir = path.join(process.cwd(), "storage");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "outbox.log"), entry);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || "Panoramas <hola@panoramas.cl>",
      to: [mail.to],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });
  if (!r.ok) throw new Error(`Email send failed: ${r.status} ${await r.text()}`);
}
