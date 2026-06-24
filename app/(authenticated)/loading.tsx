import LoadingSpinner from "@/components/LoadingSpinner"

export default function AuthenticatedLoading() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner />
    </div>
  )
}
