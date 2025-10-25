"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodedKey = void 0;
var env_1 = require("@/lib/env");
if (!env_1.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
}
exports.encodedKey = new TextEncoder().encode(env_1.env.NEXTAUTH_SECRET);
