"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicEnv = void 0;
var zod_1 = require("zod");
/**
  Centralized, validated client-side (public) environment configuration.
  Only expose NEXT_PUBLIC_* variables. Validation happens at runtime in the browser and at build time.
 */
var publicSchema = zod_1.z.object({
    NEXT_PUBLIC_STACK_PROJECT_ID: zod_1.z.string().min(1, "NEXT_PUBLIC_STACK_PROJECT_ID is required"),
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: zod_1.z.string().min(1, "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is required"),
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: zod_1.z.string().min(1, "NEXT_PUBLIC_RECAPTCHA_SITE_KEY is required"),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: zod_1.z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),
    NEXT_PUBLIC_CLOUDINARY_API_KEY: zod_1.z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_API_KEY is required"),
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: zod_1.z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is required"),
    NEXT_PUBLIC_GA_ID: zod_1.z.string().optional(),
});
var parsedPublic = publicSchema.safeParse({
    NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
});
if (!parsedPublic.success) {
    var formatted = parsedPublic.error.issues
        .map(function (i) { return "".concat(i.path.join("."), ": ").concat(i.message); })
        .join("\n");
    throw new Error("Invalid public environment configuration:\n".concat(formatted));
}
exports.publicEnv = {
    STACK_PROJECT_ID: parsedPublic.data.NEXT_PUBLIC_STACK_PROJECT_ID,
    STACK_PUBLISHABLE_CLIENT_KEY: parsedPublic.data.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
    RECAPTCHA_SITE_KEY: parsedPublic.data.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    CLOUDINARY_CLOUD_NAME: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    CLOUDINARY_UPLOAD_PRESET: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    GA_ID: parsedPublic.data.NEXT_PUBLIC_GA_ID,
};
