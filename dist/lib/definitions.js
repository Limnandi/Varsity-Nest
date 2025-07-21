"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentRegisterFormSchema = exports.ProviderRegisterFormSchema = exports.LoginFormSchema = void 0;
var zod_1 = require("zod");
exports.LoginFormSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8)
});
exports.ProviderRegisterFormSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    businessName: zod_1.z.string().min(2),
    contactPerson: zod_1.z.string().min(2),
    contactPhone: zod_1.z.string().min(10)
});
exports.StudentRegisterFormSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    studentNumber: zod_1.z.string().min(5),
    university: zod_1.z.enum(["UFS", "CUT"])
});
