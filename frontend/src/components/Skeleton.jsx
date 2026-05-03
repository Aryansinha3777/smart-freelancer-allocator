const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
    <div className="flex justify-between">
      <div className="space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    <div className="grid grid-cols-3 gap-3 pt-1">
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
    </div>
    <Skeleton className="h-9 w-full" />
  </div>
);

export const StatSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
    <Skeleton className="h-3 w-20" />
    <Skeleton className="h-8 w-12" />
  </div>
);

export default Skeleton;