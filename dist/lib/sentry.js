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
exports.Sentry = void 0;
var Sentry = __importStar(require("@sentry/nextjs"));
exports.Sentry = Sentry;
// Initialize Sentry without importing server-only env into client bundles.
// - Server: reads from process.env.SENTRY_DSN (already validated by lib/env at startup elsewhere)
// - Client: reads from process.env.NEXT_PUBLIC_SENTRY_DSN (optional; Sentry disabled if not set)
var isServer = typeof window === "undefined";
var environment = process.env.NODE_ENV || "development";
var dsn = isServer ? process.env.SENTRY_DSN : process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
    dsn: dsn,
    environment: environment,
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    debug: environment === "development",
});
