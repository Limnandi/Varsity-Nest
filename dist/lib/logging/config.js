"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSentryTransaction = exports.captureMessage = exports.captureException = exports.setExtra = exports.clearUserContext = exports.setUserContext = exports.setSentryContext = exports.initializeLogging = void 0;
var Sentry = __importStar(require("@sentry/nextjs"));
var initializeLogging = function () {
    if (process.env.NODE_ENV === 'production') {
        Sentry.init({
            dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
            tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
            debug: false,
        });
    }
};
exports.initializeLogging = initializeLogging;
// Safely set tags/context for the current scope
var setSentryContext = function (context) {
    var _a, _b;
    try {
        var anySentry = Sentry;
        if (typeof anySentry.configureScope === 'function') {
            anySentry.configureScope(function (scope) {
                Object.entries(context).forEach(function (_a) {
                    var k = _a[0], v = _a[1];
                    return scope.setTag(k, String(v));
                });
            });
            return;
        }
        // Fallback to getCurrentHub
        var hub = (_a = anySentry.getCurrentHub) === null || _a === void 0 ? void 0 : _a.call(anySentry);
        var scope_1 = (_b = hub === null || hub === void 0 ? void 0 : hub.getScope) === null || _b === void 0 ? void 0 : _b.call(hub);
        if (scope_1) {
            Object.entries(context).forEach(function (_a) {
                var _b;
                var k = _a[0], v = _a[1];
                return (_b = scope_1.setTag) === null || _b === void 0 ? void 0 : _b.call(scope_1, k, String(v));
            });
        }
    }
    catch (e) {
        // swallow errors - logging should not crash the app
        // eslint-disable-next-line no-console
        console.warn('Failed to set Sentry context', e);
    }
};
exports.setSentryContext = setSentryContext;
var setUserContext = function (user) {
    try {
        Sentry.setUser({
            id: user.id,
            email: user.email,
            role: user.role,
        });
    }
    catch (e) {
        // ignore
    }
};
exports.setUserContext = setUserContext;
var clearUserContext = function () {
    try {
        Sentry.setUser(null);
    }
    catch (e) {
        // ignore
    }
};
exports.clearUserContext = clearUserContext;
var setExtra = function (key, value) {
    try {
        Sentry.setExtra(key, value);
    }
    catch (e) {
        // ignore
    }
};
exports.setExtra = setExtra;
var captureException = function (error, context) {
    try {
        if (context) {
            var anySentry_1 = Sentry;
            anySentry_1.withScope(function (scope) {
                Object.entries(context).forEach(function (_a) {
                    var key = _a[0], value = _a[1];
                    return scope.setExtra(key, value);
                });
                anySentry_1.captureException(error);
            });
            return;
        }
        Sentry.captureException(error);
    }
    catch (e) {
        // ignore
    }
};
exports.captureException = captureException;
var captureMessage = function (message, context) {
    try {
        var anySentry_2 = Sentry;
        if (context) {
            anySentry_2.withScope(function (scope) {
                Object.entries(context).forEach(function (_a) {
                    var k = _a[0], v = _a[1];
                    return scope.setExtra(k, v);
                });
                anySentry_2.captureMessage(message, (context === null || context === void 0 ? void 0 : context.level) || 'info');
            });
            return;
        }
        anySentry_2.captureMessage(message);
    }
    catch (e) {
        // ignore
    }
};
exports.captureMessage = captureMessage;
// Safe startTransaction wrapper — returns a transaction-like object with a finish method
var startSentryTransaction = function (name, op) {
    var _a;
    try {
        var anySentry = Sentry;
        if (typeof anySentry.startTransaction === 'function') {
            return anySentry.startTransaction({ name: name, op: op });
        }
        // try hub API
        var hub = (_a = anySentry.getCurrentHub) === null || _a === void 0 ? void 0 : _a.call(anySentry);
        if (hub && typeof hub.startTransaction === 'function') {
            return hub.startTransaction({ name: name, op: op });
        }
    }
    catch (e) {
        // ignore
    }
    // Fallback: return a no-op transaction
    return {
        setData: function () { return undefined; },
        finish: function () { return undefined; },
    };
};
exports.startSentryTransaction = startSentryTransaction;
