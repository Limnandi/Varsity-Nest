import ContactClient from "./ContactClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Varsity Nest",
  description: "Need assistance with student housing, listings, or technical support? Contact the Varsity Nest team for prompt help and information.",
  alternates: {
    canonical: "https://varsitynest.space/contact",
  },
};

export default function Page() {
  return <ContactClient />;
}
