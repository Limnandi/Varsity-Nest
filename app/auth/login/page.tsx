import LoginClient from "./LoginClient";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Sign In",
  description:
    "Access your Varsity Nest account dashboard to manage your student housing applications, property listings, or agent activity.",
  pathname: "/auth/login",
  noIndex: true,
});

export default function Page() {
  return <LoginClient />;
}