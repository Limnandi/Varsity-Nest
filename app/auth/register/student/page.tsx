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
  },
  twitter: {
    card: "summary",
    title: "Student Sign Up",
    description: "Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.",
  },
};

export default function Page() {
  return <StudentRegistrationClient />;
}