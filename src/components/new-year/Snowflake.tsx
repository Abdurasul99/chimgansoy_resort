/** Снежинка из шести лучей с веточками — для кнопки «Новый год» и экрана праздника. */
export function Snowflake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round">
      <g>
        {[0, 60, 120].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 12 12)`}>
            <path d="M12 2.5v19" />
            <path d="M9.4 4.6 12 6.6l2.6-2M9.4 19.4l2.6-2 2.6 2" />
          </g>
        ))}
      </g>
    </svg>
  );
}
