import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945]">
      <div className="max-w-md w-full text-center">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8">
          <div className="w-16 h-16 border border-red-500/50 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-red-400">🚫</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-2xl tracking-tight">Access Denied</h1>
          <p className="text-neutral-300 text-lg mb-8">You don&apos;t have permission to access this page.</p>
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-6 py-3 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-[0.98]"
          >
            <span className="relative z-10">Go Home</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </div>
    </div>
  )
}
