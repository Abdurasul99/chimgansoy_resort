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
      {eyebrow ? <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--accent-strong)]">{eyebrow}</p> : null}
      <h2 className={`font-serif text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl${italic ? " italic" : ""}`}>
        {title}
      </h2>
      {text ? <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">{text}</p> : null}
    </div>
  );
}
