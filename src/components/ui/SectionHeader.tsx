type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} max-w-3xl ${className}`}>
      {eyebrow ? <p className="mb-3 text-xs font-bold uppercase text-[var(--accent-strong)]">{eyebrow}</p> : null}
      <h2 className="font-serif text-4xl font-semibold leading-tight text-[var(--ink)] sm:text-5xl">
        {title}
      </h2>
      {text ? <p className="mt-4 text-base leading-7 text-[var(--muted)] sm:text-lg">{text}</p> : null}
    </div>
  );
}
