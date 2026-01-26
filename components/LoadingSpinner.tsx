export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-hidden="true"></div>
    </div>
  )
}
