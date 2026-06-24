"use client"

import type { ReactNode } from "react"
import { ReactQueryProvider } from "@/lib/query-client"

export default function PublicQueryBoundary({ children }: { children: ReactNode }) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>
}
