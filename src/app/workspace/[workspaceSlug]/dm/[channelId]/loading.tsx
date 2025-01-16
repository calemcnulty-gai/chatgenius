import { Skeleton } from '@/components/ui/Skeleton'

export default function DMChannelLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b border-gray-800 px-4 py-3">
        <div className="relative">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-800 bg-gray-500" />
        </div>
        <div className="flex flex-col gap-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="p-4 border-t border-gray-800">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
} 