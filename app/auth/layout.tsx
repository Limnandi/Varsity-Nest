import AppProviders from "@/components/AppProviders"
import AuthLayoutShell from "@/components/AuthLayoutShell"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <AuthLayoutShell>{children}</AuthLayoutShell>
    </AppProviders>
  )
}
