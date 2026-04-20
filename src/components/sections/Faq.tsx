import { faqItems } from "@/content/faq";
import type { Locale } from "@/i18n/config";
import { text } from "@/lib/localize";
import { Icon } from "@/components/ui/Icon";

type FaqProps = {
  locale: Locale;
};

export function Faq({ locale }: FaqProps) {
  return (
    <div className="divide-y divide-[color:var(--line)] rounded-[8px] border border-[color:var(--line)] bg-white">
      {faqItems.map((item) => (
        <details key={text(item.question, locale)} className="group p-5 sm:p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-[var(--ink)]">
            <span>{text(item.question, locale)}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] transition group-open:rotate-45">
              <Icon name="arrow" className="h-4 w-4 rotate-90" />
            </span>
          </summary>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--muted)]">{text(item.answer, locale)}</p>
        </details>
      ))}
    </div>
  );
}
