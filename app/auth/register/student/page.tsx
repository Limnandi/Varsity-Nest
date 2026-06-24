import StudentRegistrationClient from "./StudentRegistrationClient";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Student Sign Up",
  description: "Join Varsity Nest to find your ideal student accommodation. Sign up as a student today.",
  pathname: "/auth/register/student",
  noIndex: true,
});

export default function Page() {
  return <StudentRegistrationClient />;
}