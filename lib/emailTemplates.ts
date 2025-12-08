type TemplateArgs = {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryText?: string;
};

const baseStyles = {
  body: "font-family:'Segoe UI',Arial,sans-serif;background:#f4f6fb;margin:0;padding:32px;color:#1f2933;",
  card: "max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 10px 40px rgba(15,23,42,0.1);",
  badge: "display:inline-block;margin-bottom:16px;padding:8px 16px;border-radius:999px;background:#eef2ff;color:#4f46e5;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;",
  title: "font-size:24px;margin:0 0 12px 0;color:#111827;",
  body: "font-size:15px;line-height:1.6;color:#374151;margin-bottom:24px;",
  cta: "display:inline-block;padding:12px 24px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;",
  footer: "margin-top:32px;font-size:12px;color:#9ca3af;text-align:center;",
};

export const renderEmailTemplate = ({ title, body, ctaLabel, ctaUrl, secondaryText }: TemplateArgs) => {
  const cta = ctaLabel && ctaUrl ? `<a href="${ctaUrl}" style="${baseStyles.cta}" target="_blank" rel="noopener noreferrer">${ctaLabel}</a>` : "";
  const secondary = secondaryText ? `<p style="font-size:13px;color:#6b7280;margin-top:16px;">${secondaryText}</p>` : "";

  return `<!DOCTYPE html>
<html>
  <body style="${baseStyles.body}">
    <div style="${baseStyles.card}">
      <div style="${baseStyles.badge}">ShopEverywhere</div>
      <h1 style="${baseStyles.title}">${title}</h1>
      <p style="${baseStyles.body}">${body}</p>
      ${cta}
      ${secondary}
      <div style="${baseStyles.footer}">
        © ${new Date().getFullYear()} ShopEverywhere. All rights reserved.
      </div>
    </div>
  </body>
</html>`;
};

export const buildVerificationEmail = (opts: { firstName: string; url: string }) =>
  renderEmailTemplate({
    title: `Welcome to ShopEverywhere, ${opts.firstName}!`,
    body: `We’re excited to have you. Please confirm your email address to activate your account and start shopping everywhere.`,
    ctaLabel: "Confirm my email",
    ctaUrl: opts.url,
    secondaryText: `If the button doesn’t work, copy and paste this link into your browser: ${opts.url}`,
  });

export const buildResetEmail = (opts: { firstName: string; url: string; code: string }) =>
  renderEmailTemplate({
    title: `Reset your ShopEverywhere password`,
    body: `We received a request to reset the password for your account. Use the security code <strong>${opts.code}</strong> and the button below to finish updating your password.`,
    ctaLabel: "Reset password",
    ctaUrl: opts.url,
    secondaryText: `If you didn’t request this change, you can safely ignore this message.`,
  });

export const buildPasswordChangedEmail = (opts: { firstName: string }) =>
  renderEmailTemplate({
    title: `Your ShopEverywhere password was updated`,
    body: `This is a confirmation that your password was changed successfully. If you did not make this change, please reset your password immediately or contact support.`,
  });







