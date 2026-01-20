import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for the Details page
 * Shows animated placeholder while recipe details are loading
 */
export function DetailsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button skeleton */}
      <Skeleton className="h-10 w-24 mb-6" />
      
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-video rounded-lg mb-6" />
      
      {/* Title and badges */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-10 rounded-md" />
      </div>
      
      {/* Ingredients */}
      <div className="mb-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      </div>
      
      {/* Instructions */}
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
