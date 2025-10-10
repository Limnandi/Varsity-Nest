import { jsonLog } from '@/lib/json-logger';

// Helper: best-effort verification send for provider signups. Exposed for tests
// and accepts optional deps so tests can inject mocks.
export async function sendVerificationForProvider(
  opts: { email: string, firstName: string, lastName: string, userId: string, providerId: string },
  deps?: { app?: any, sendVerificationEmailResend?: (email: string, callbackUrl: string, name?: string) => Promise<any> }
) {
  const { email, firstName, lastName, userId } = opts;

  try {
    let app: any = deps?.app;
    let sendResend = deps?.sendVerificationEmailResend;
    if (!app) {
      const { getStackServerApp } = await import('@/lib/stack');
      app = getStackServerApp();
      jsonLog('debug', '[sendVerificationForProvider] Loaded Stack app', { hasSendEmail: typeof app.sendEmail === 'function' });
    }
    if (!sendResend) {
      const mod = await import('@/lib/email-resend');
      sendResend = (mod as any).sendVerificationEmailResend;
      jsonLog('debug', '[sendVerificationForProvider] Loaded Resend module', { hasSendResend: typeof sendResend === 'function' });
    }

    const callbackBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${callbackBase.replace(/\/$/, '')}/auth/check-email`;

    if (typeof (app as any).sendEmail === 'function') {
      try {
        const subject = 'Verify your Varsity Nest email';
        const html = (await import('@/lib/email-template')).renderVerificationEmail(callbackUrl);

        const sendResult = await (app as any).sendEmail({ userIds: [userId], subject, html, callbackUrl });
        jsonLog('info', '[provider-register] app.sendEmail (html) result', { result: sendResult });

        if (sendResult && (sendResult as any).status === 'error' && (sendResult as any).error?.code === 'REQUIRES_CUSTOM_EMAIL_SERVER') {
          jsonLog('debug', '[sendVerificationForProvider] app.sendEmail returned REQUIRES_CUSTOM_EMAIL_SERVER', { sendResult });
          if (process.env.RESEND_API_KEY && sendResend) {
            const rr = await sendResend(email, callbackUrl, `${firstName} ${lastName}`);
            jsonLog('info', '[provider-register] resend fallback result', { result: rr });
            if (!rr.ok && rr.validation) {
              jsonLog('error', '[provider-register] Resend validation error (domain not verified?)', { rr });
            }
          }
        } else {
          jsonLog('info', '[provider-register] verification email sent via app.sendEmail (html)', { email });
        }
      } catch (fbErr: any) {
        jsonLog('error', '[provider-register] app.sendEmail (html) failed', { error: fbErr });
        const payload = { to: email, userId, templateId: 'email_verification', variables: { url: callbackUrl }, callbackUrl };
        try {
          const tmpl = await (app as any).sendEmail(payload);
          jsonLog('info', '[provider-register] verification email sent via app.sendEmail (template)', { email, result: tmpl });
        } catch (te2: any) {
          jsonLog('error', '[provider-register] app.sendEmail (template) failed', { error: te2 });
          if (process.env.RESEND_API_KEY && sendResend) {
            const rr5 = await sendResend(email, callbackUrl, `${firstName} ${lastName}`);
            jsonLog('info', '[provider-register] resend fallback result', { result: rr5 });
          }
        }
      }
    } else {
      jsonLog('debug', '[sendVerificationForProvider] app.sendEmail is not a function', {});
      if (process.env.RESEND_API_KEY && sendResend) {
        const rrx = await sendResend(email, callbackUrl, `${firstName} ${lastName}`);
        jsonLog('info', '[provider-register] resend fallback (no app.sendEmail)', { result: rrx });
      }
    }
  } catch (e) {
    const errorDetails = {
      message: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined,
      raw: e,
    };
    jsonLog('error', '[provider-register] verification send attempt failed', { error: errorDetails });
  }
}
