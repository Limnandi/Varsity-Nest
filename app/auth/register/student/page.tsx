import StudentRegistrationClient from "./StudentRegistrationClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Sign Up",
  description: "Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.",
};

export default function Page() {
  return <StudentRegistrationClient />;
}