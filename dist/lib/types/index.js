"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
var zod_1 = require("zod");
// User Types
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    role: zod_1.z.enum(['ADMIN', 'PROVIDER', 'STUDENT']),
    createdAt: zod_1.z.date(),
    updatedAt: zod_1.z.date()
});
