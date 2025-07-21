export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-300"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
        <div className="flex items-center mb-2">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="ml-2 h-4 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-300 rounded w-24"></div>
          <div className="h-10 bg-gray-300 rounded w-28"></div>
        </div>
      </div>
    </div>
  )
}
