"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStackClientApp = getStackClientApp;
exports.getStackServerApp = getStackServerApp;
var stack_1 = require("@stackframe/stack");
var env_client_1 = require("@/lib/env.client");
// Singletons for client and server apps
var clientApp = null;
var serverApp = null;
//Design pattern: Singleton
function getStackClientApp() {
    if (!clientApp) {
        clientApp = new stack_1.StackClientApp({
            projectId: env_client_1.publicEnv.STACK_PROJECT_ID,
            publishableClientKey: env_client_1.publicEnv.STACK_PUBLISHABLE_CLIENT_KEY,
            tokenStore: "cookie",
            redirectMethod: "nextjs",
        });
    }
    return clientApp;
}
//Design pattern: Singleton
function getStackServerApp() {
    if (!serverApp) {
        // Only import server env on server side
        if (typeof window === 'undefined') {
            var env = require("@/lib/env").env;
            serverApp = new stack_1.StackServerApp({
                projectId: env_client_1.publicEnv.STACK_PROJECT_ID,
                secretServerKey: env.STACK_SECRET_SERVER_KEY,
                tokenStore: "nextjs-cookie",
                oauthScopesOnSignIn: {
                    // Request basic profile/email scopes so Google identity can be linked seamlessly
                    google: ["openid", "email", "profile"],
                },
                urls: {
                    oauthCallback: "/handler/oauth-callback",
                    error: "/handler/error",
                    signIn: "/auth/login",
                    signUp: "/auth/register",
                    afterSignIn: "/auth/redirect",
                    afterSignUp: "/auth/check-email",
                    // After email verification, redirect to dedicated success page
                    emailVerification: "/auth/email-verified",
                },
            });
        }
        else {
            throw new Error("getStackServerApp() can only be called on the server side");
        }
    }
    return serverApp;
}
