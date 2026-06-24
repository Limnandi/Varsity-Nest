import type { ReactNode } from "react"
import { StackProvider } from "@stackframe/stack"
import { getStackServerApp } from "@/lib/stack"

export default function StackAuthProvider({ children }: { children: ReactNode }) {
  return <StackProvider app={getStackServerApp() as any}>{children}</StackProvider>
}
