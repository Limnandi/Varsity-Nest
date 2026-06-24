import AppProviders from "@/components/AppProviders"
import Layout from "@/components/Layout"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <Layout>{children}</Layout>
    </AppProviders>
  )
}
