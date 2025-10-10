export function renderVerificationEmail(callbackUrl: string) {
  return `\n<div style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial;">\n  <h2 style="color:#0ea5e9">Verify your email</h2>\n  <p>Click the button to verify your email for Varsity Nest.</p>\n  <p><a href="${callbackUrl}" style="background:#0ea5e9;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Verify email</a></p>\n  <p>If the button doesn't work, copy/paste: ${callbackUrl}</p>\n</div>\n`
}
