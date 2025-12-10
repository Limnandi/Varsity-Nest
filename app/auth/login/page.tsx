import LoginClient from "./LoginClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign-In",
  description: "Access your Varsity Nest account dashboard to manage your student housing applications, property listings, or agent activity.",
  alternates: { canonical: "https://varsitynest.space/auth/login" },
};

export default function Page() {
  return <LoginClient />;
}