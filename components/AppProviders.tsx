import type { ReactNode } from "react"
import StackAuthProvider from "@/components/StackAuthProvider"
import AppProvidersClient from "@/components/AppProvidersClient"

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <StackAuthProvider>
      <AppProvidersClient>{children}</AppProvidersClient>
    </StackAuthProvider>
  )
}
