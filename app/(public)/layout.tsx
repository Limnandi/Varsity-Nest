import type { ReactNode } from "react"
import NavbarPublic from "@/components/NavbarPublic"
import Footer from "@/components/Footer"
import FloatingActionButton from "@/components/FloatingActionButton"
import PublicDeferredWidgets from "@/components/PublicDeferredWidgets"

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicDeferredWidgets />
      <div className="min-h-screen flex flex-col relative overflow-x-hidden w-full max-w-full">
        <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-[#040945] to-[#02042b]" />
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
          </div>
        </div>

        <div className="relative z-10 flex flex-col min-h-screen overflow-x-hidden w-full max-w-full">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-black/80 focus:px-4 focus:py-2 focus:text-white focus:ring-2 focus:ring-blue-500"
          >
            Skip to content
          </a>
          <NavbarPublic />
          <main id="main-content" className="flex-1 overflow-x-hidden w-full max-w-full">
            {children}
          </main>
          <Footer />
        </div>

        <FloatingActionButton />
      </div>
    </>
  )
}
