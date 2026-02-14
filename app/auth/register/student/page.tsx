import StudentRegistrationClient from "./StudentRegistrationClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Sign Up",
  description: "Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.",
  alternates: { canonical: "https://varsitynest.space/auth/register/student" },
  openGraph: {
    title: "Student Sign Up",
    description: "Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.",
    url: "https://varsitynest.space/auth/register/student",
    siteName: "Varsity Nest",
    type: "website",
    images: ["/images/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Sign Up",
    description: "Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.",
    images: ["/images/logo.png"],
  },
};

export default function Page() {
  return <StudentRegistrationClient />;
}