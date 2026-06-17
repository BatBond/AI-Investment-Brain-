/**
 * Email sending wrapper.
 * ---------------------------------------------------------------
 * If SMTP env vars are set, use real transport; otherwise use a
 * file-based stub that writes to /home/z/my-project/download/email-log.txt
 * and returns a `stub: true` flag.
 */

import nodemailer from "nodemailer";
import { promises as fs } from "node:fs";
import path from "node:path";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "AI Investment Brain <ai-brain@localhost>";

const STUB_LOG_PATH = "/home/z/my-project/download/email-log.txt";

interface SendMailResult {
  messageId: string;
  stub?: boolean;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  } else {
    // Stub transport
    transporter = {
      async sendMail(opts: {
        to?: string | string[];
        subject?: string;
        text?: string;
        html?: string;
        from?: string;
      }): Promise<SendMailResult> {
        const to = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to || "";
        const log =
          `[${new Date().toISOString()}] STUB EMAIL\n` +
          `From: ${opts.from || EMAIL_FROM}\n` +
          `To: ${to}\n` +
          `Subject: ${opts.subject || ""}\n` +
          `---\n${opts.text || opts.html || "(empty body)"}\n` +
          `---\n\n`;
        try {
          await fs.mkdir(path.dirname(STUB_LOG_PATH), { recursive: true });
          await fs.appendFile(STUB_LOG_PATH, log, "utf8");
        } catch (e) {
          console.error("[email] failed to write stub log:", e instanceof Error ? e.message : String(e));
        }
        return { messageId: `stub-${Date.now()}`, stub: true };
      },
    } as unknown as nodemailer.Transporter;
  }
  return transporter;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<SendMailResult> {
  const t = getTransporter();
  const info = (await t.sendMail({
    from: EMAIL_FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })) as SendMailResult;
  return info;
}

export function isStubMode(): boolean {
  return !(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

export function getStubLogPath(): string {
  return STUB_LOG_PATH;
}
