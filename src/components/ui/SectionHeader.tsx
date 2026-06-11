type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
  italic?: boolean;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
  italic = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow ? (
        align === "center" ? (
          <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.24em] text-[var(--accent-strong)]">{eyebrow}</p>
        ) : (
          <p className="kicker-rule mb-4">{eyebrow}</p>
        )
      ) : null}
      <h2 className={`font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight text-[var(--ink)]${italic ? " italic" : ""}`}>
        {title}
      </h2>
      {text ? <p className="mt-5 text-base leading-7 text-[var(--muted)] sm:text-lg">{text}</p> : null}
    </div>
  );
}
