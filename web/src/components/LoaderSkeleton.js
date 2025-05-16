export default function LoaderSkeleton() {
  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="h-7 rounded bg-zinc-700 animate-pulse w-1/3" />
      <div className="h-4 rounded bg-zinc-700 animate-pulse w-1/2" />
      <div className="h-4 rounded bg-zinc-700 animate-pulse w-full" />
      <div className="h-4 rounded bg-zinc-700 animate-pulse w-3/4" />
    </div>
  )
}
