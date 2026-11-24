/**
 * Тонкая линия гор — тот же знак, что золотом стоит под заголовками в
 * Instagram ресторана. Декоративная: скрыта от экранного диктора.
 */
export function MountainLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 16" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <path
        d="M0 15h34l14-9 7 4 15-9 11 7 6-3 9 5 9-4 8 9h47"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
