import nodemailer from "nodemailer";
import epub from "epub-gen-memory";
import { env, splitList } from "./config.js";

export async function buildEpubBuffer({ title, chapters }) {
  // epub-gen-memory default export: (optionsOrTitle, content) => Promise<Buffer>
  const fn = epub.default || epub;
  return await fn(
    { title, author: "Marketing Brief", lang: "en", tocTitle: "Contents" },
    chapters
  );
}

function transport() {
  if (!env.smtpUser || !env.smtpPass) throw new Error("SMTP_USER / SMTP_PASS not set");
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
}

export async function deliver({ subject, emailHtml, epubBuffer, epubFilename, dryRun }) {
  const kindle = splitList(env.kindleEmail);
  const inbox = splitList(env.emailTo);

  if (dryRun) {
    console.log(`  [dry-run] would email brief to: ${inbox.join(", ") || "(none)"}`);
    console.log(`  [dry-run] would send EPUB to Kindle: ${kindle.join(", ") || "(none)"}`);
    return;
  }

  const tx = transport();

  if (inbox.length) {
    await tx.sendMail({
      from: env.fromEmail,
      to: inbox,
      subject,
      html: emailHtml,
    });
    console.log(`  emailed brief -> ${inbox.join(", ")}`);
  }

  if (kindle.length && epubBuffer) {
    // Send-to-Kindle: the FROM address must be on your Amazon "Approved Personal
    // Document E-mail List". Subject/body are ignored; the EPUB attachment is converted.
    await tx.sendMail({
      from: env.fromEmail,
      to: kindle,
      subject: "convert",
      text: "Daily marketing brief attached.",
      attachments: [
        { filename: epubFilename, content: epubBuffer, contentType: "application/epub+zip" },
      ],
    });
    console.log(`  sent EPUB to Kindle -> ${kindle.join(", ")}`);
  }
}
