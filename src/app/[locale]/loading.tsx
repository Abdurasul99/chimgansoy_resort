/**
 * Route-level loading skeleton. Shows instantly on navigation while the next
 * page's server component streams in — avoids a blank flash.
 */
export default function Loading() {
  return (
    <div className="min-h-[80vh] bg-[var(--paper)]" aria-busy="true" aria-label="Загрузка">
      {/* Hero placeholder */}
      <div className="skeleton h-[60vh] w-full" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="skeleton h-8 w-2/3 max-w-md rounded-lg" />
        <div className="skeleton mt-4 h-4 w-1/2 max-w-sm rounded" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
