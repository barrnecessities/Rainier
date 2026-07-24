import nodemailer from "nodemailer";
import epub from "epub-gen-memory";
import { env, splitList } from "./config.js";

// epub-gen-memory downloads every <img> in chapter HTML to embed it. Publisher
// CDNs often 403 those fetches (bot protection), which must never kill the run.
function stripImages(html) {
  return String(html || "")
    .replace(/<picture[\s\S]*?<\/picture>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<source[^>]*>/gi, "");
}

export async function buildEpubBuffer({ title, chapters }) {
  // epub-gen-memory default export: (optionsOrTitle, content) => Promise<Buffer>
  const fn = epub.default || epub;
  const options = {
    title,
    author: "Marketing Brief",
    lang: "en",
    tocTitle: "Contents",
    ignoreFailedDownloads: true, // blocked image -> warn, don't throw
    fetchTimeout: 10000,
  };
  try {
    return await fn(options, chapters);
  } catch (e) {
    console.warn(`  ! EPUB build failed (${e.message}); retrying without images`);
    const textOnly = chapters.map((c) => ({ ...c, content: stripImages(c.content) }));
    return await fn(options, textOnly);
  }
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
