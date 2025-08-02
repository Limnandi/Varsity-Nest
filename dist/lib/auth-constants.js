"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodedKey = void 0;
var secretKey = process.env.NEXTAUTH_SECRET;
if (!secretKey) {
    throw new Error('NEXTAUTH_SECRET environment variable is required');
}
exports.encodedKey = new TextEncoder().encode(secretKey);
