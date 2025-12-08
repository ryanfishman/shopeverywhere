import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromOverride?: string;
};

const emailDeliveryDisabled = process.env.EMAIL_DISABLE_DELIVERY === "true";

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP credentials are not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

type ActiveTransporter = ReturnType<typeof getTransporter>;

let transporter: ActiveTransporter | null = null;

const ensureTransporter = () => {
  if (!transporter) {
    transporter = getTransporter();
  }
  return transporter;
};

export const sendEmail = async ({ to, subject, html, text, fromOverride }: SendEmailArgs) => {
  const from = fromOverride || process.env.EMAIL_FROM || "ShopEverywhere <no-reply@shopeverywhere.com>";
  const body = html || text || "";
  const isHtml = Boolean(html);

  if (emailDeliveryDisabled) {
    console.info(`[email] Delivery disabled. Recording email only for "${subject}" to ${to}.`);
    await prisma.email.create({
      data: {
        to,
        from,
        subject,
        body,
        isHtml,
      },
    });
    return;
  }

  const activeTransporter = ensureTransporter();

  await activeTransporter.sendMail({
    from,
    to,
    subject,
    html,
    text,
  });

  await prisma.email.create({
    data: {
      to,
      from,
      subject,
      body,
      isHtml,
    },
  });
};



