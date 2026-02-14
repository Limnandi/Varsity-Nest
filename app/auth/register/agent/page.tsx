import AgentRegistrationClient from "./AgentRegistrationClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Sign Up | List Student Properties",
  description: "Register as an agent on Varsity Nest to list, manage, and connect students with your available rental properties. Start growing your portfolio today.",
  alternates: { canonical: "https://varsitynest.space/auth/register/agent" },
  openGraph: {
    title: "Agent Sign Up | List Student Properties",
    description: "Register as an agent on Varsity Nest to list, manage, and connect students with your available rental properties. Start growing your portfolio today.",
    url: "https://varsitynest.space/auth/register/agent",
    siteName: "Varsity Nest",
    type: "website",
    images: ["/images/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Sign Up | List Student Properties",
    description: "Register as an agent on Varsity Nest to list, manage, and connect students with your available rental properties. Start growing your portfolio today.",
    images: ["/images/logo.png"],
  },
};

export default function Page() {
  return <AgentRegistrationClient />;
}