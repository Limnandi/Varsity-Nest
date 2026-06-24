import ContactClient from "./ContactClient";
import { createPageMetadata } from "@/lib/site-metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description:
    "Need assistance with student housing, listings, or technical support? Contact the Varsity Nest team for prompt help and information.",
  pathname: "/contact",
});

export default function Page() {
  return <ContactClient />;
}
