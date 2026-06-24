import ProviderRegistrationClient from "./ProviderRegistrationClient";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Provider Sign Up",
  description:
    "Are you a housing provider or landlord? Sign up to list your accommodations directly and reach thousands of students seeking housing on Varsity Nest.",
  pathname: "/auth/register/provider",
  noIndex: true,
});

export default function Page() {
  return <ProviderRegistrationClient />;
}