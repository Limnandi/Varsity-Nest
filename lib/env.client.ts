import { z } from "zod"

/**
  Centralized, validated client-side (public) environment configuration.
  Only expose NEXT_PUBLIC_* variables. Validation happens at runtime in the browser and at build time.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_STACK_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_STACK_PROJECT_ID is required"),
  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: z.string().min(1, "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY is required"),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().min(1, "NEXT_PUBLIC_RECAPTCHA_SITE_KEY is required"),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is required"),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_API_KEY is required"),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is required"),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
})

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_STACK_PROJECT_ID: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
})

if (!parsedPublic.success) {
  const formatted = parsedPublic.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("\n")
  throw new Error(`Invalid public environment configuration:\n${formatted}`)
}

export const publicEnv = {
  STACK_PROJECT_ID: parsedPublic.data.NEXT_PUBLIC_STACK_PROJECT_ID,
  STACK_PUBLISHABLE_CLIENT_KEY: parsedPublic.data.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  RECAPTCHA_SITE_KEY: parsedPublic.data.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  CLOUDINARY_CLOUD_NAME: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  CLOUDINARY_UPLOAD_PRESET: parsedPublic.data.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
  GA_ID: parsedPublic.data.NEXT_PUBLIC_GA_ID,
} as const


