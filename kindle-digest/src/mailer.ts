import nodemailer from "nodemailer";
import { DigestConfig } from "./types";

export async function sendDigest(
  htmlContent: string,
  date: Date,
  config: DigestConfig
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: config.gmailUser,
      pass: config.gmailAppPassword,
    },
  });

  const dateStr = date.toISOString().split("T")[0];

  await transporter.sendMail({
    from: `"Rainier Daily Digest" <${config.gmailUser}>`,
    to: config.kindleEmail,
    subject: `Daily Digest — ${dateStr}`,
    text: "Your daily digest is attached. Open on your Kindle to read.",
    attachments: [
      {
        filename: `digest-${dateStr}.html`,
        content: htmlContent,
        contentType: "text/html",
      },
    ],
  });

  console.log(`Digest sent to ${config.kindleEmail}`);
}
