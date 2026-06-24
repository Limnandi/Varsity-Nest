import AgentRegistrationClient from "./AgentRegistrationClient";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Agent Sign Up",
  description:
    "Register as an agent on Varsity Nest to list, manage, and connect students with your available rental properties. Start growing your portfolio today.",
  pathname: "/auth/register/agent",
  noIndex: true,
});

export default function Page() {
  return <AgentRegistrationClient />;
}