import ProviderRegistrationClient from "./ProviderRegistrationClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Provider Sign Up | Property Management",
  description: "Are you a housing provider or landlord? Sign up to list your accommodations directly and reach thousands of students seeking housing on Varsity Nest.",
  alternates: { canonical: "https://varsitynest.space/auth/register/provider" },
  openGraph: {
    title: "Provider Sign Up | Property Management",
    description: "Are you a housing provider or landlord? Sign up to list your accommodations directly and reach thousands of students seeking housing on Varsity Nest.",
    url: "https://varsitynest.space/auth/register/provider",
    siteName: "Varsity Nest",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Provider Sign Up | Property Management",
    description: "Are you a housing provider or landlord? Sign up to list your accommodations directly and reach thousands of students seeking housing on Varsity Nest.",
  },
};

export default function Page() {
  return <ProviderRegistrationClient />;
}