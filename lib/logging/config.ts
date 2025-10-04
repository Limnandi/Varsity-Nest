import * as Sentry from '@sentry/nextjs';

export const initializeLogging = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
      debug: false,
    });
  }
};

// Safely set tags/context for the current scope
export const setSentryContext = (context: Record<string, any>) => {
  try {
    const anySentry = Sentry as any;
    if (typeof anySentry.configureScope === 'function') {
      anySentry.configureScope((scope: any) => {
        Object.entries(context).forEach(([k, v]) => scope.setTag(k, String(v)));
      });
      return;
    }

    // Fallback to getCurrentHub
    const hub = anySentry.getCurrentHub?.();
    const scope = hub?.getScope?.();
    if (scope) {
      Object.entries(context).forEach(([k, v]) => scope.setTag?.(k, String(v)));
    }
  } catch (e) {
    // swallow errors - logging should not crash the app
    // eslint-disable-next-line no-console
    console.warn('Failed to set Sentry context', e);
  }
};

export const setUserContext = (user: { id: string; email: string; role: string }) => {
  try {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } catch (e) {
    // ignore
  }
};

export const clearUserContext = () => {
  try {
    Sentry.setUser(null);
  } catch (e) {
    // ignore
  }
};

export const setExtra = (key: string, value: any) => {
  try {
    Sentry.setExtra(key, value);
  } catch (e) {
    // ignore
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  try {
    if (context) {
      const anySentry = Sentry as any;
      anySentry.withScope((scope: any) => {
        Object.entries(context!).forEach(([key, value]) => scope.setExtra(key, value));
        anySentry.captureException(error);
      });
      return;
    }
    Sentry.captureException(error);
  } catch (e) {
    // ignore
  }
};

export const captureMessage = (message: string, context?: Record<string, any>) => {
  try {
    const anySentry = Sentry as any;
    if (context) {
      anySentry.withScope((scope: any) => {
        Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
        anySentry.captureMessage(message, context?.level || 'info');
      });
      return;
    }
    anySentry.captureMessage(message);
  } catch (e) {
    // ignore
  }
};

// Safe startTransaction wrapper — returns a transaction-like object with a finish method
export const startSentryTransaction = (name: string, op: string) => {
  try {
    const anySentry = Sentry as any;
    if (typeof anySentry.startTransaction === 'function') {
      return anySentry.startTransaction({ name, op });
    }
    // try hub API
    const hub = anySentry.getCurrentHub?.();
    if (hub && typeof hub.startTransaction === 'function') {
      return hub.startTransaction({ name, op });
    }
  } catch (e) {
    // ignore
  }

  // Fallback: return a no-op transaction
  return {
    setData: () => undefined,
    finish: () => undefined,
  };
};
