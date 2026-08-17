import type { ReactNode } from "react";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";

type Copy = {
  title: string;
  offer: (link: ReactNode) => ReactNode;
  privacy: (link: ReactNode) => ReactNode;
  tubingRules: (link: ReactNode) => ReactNode;
  poolRules: (link: ReactNode) => ReactNode;
  refund: (link: ReactNode) => ReactNode;
  offerLink: string;
  privacyLink: string;
  tubingRulesLink: string;
  poolRulesLink: string;
  refundLink: string;
};

const COPY: Record<Locale, Copy> = {
  ru: {
    title: "Обязательные согласия",
    offer: (link) => <>Я ознакомился(ась) с {link} и принимаю её условия.</>,
    privacy: (link) => <>Я даю согласие на обработку персональных данных в соответствии с {link}.</>,
    tubingRules: (link) => <>Я ознакомился(ась) с {link} и обязуюсь их соблюдать.</>,
    poolRules: (link) => <>Я ознакомился(ась) с {link} и обязуюсь их соблюдать.</>,
    refund: (link) => <>Я ознакомился(ась) с {link} и принимаю их.</>,
    offerLink: "публичной офертой",
    privacyLink: "Политикой конфиденциальности",
    tubingRulesLink: "правилами тюбинговой горки",
    poolRulesLink: "правилами посещения бассейна",
    refundLink: "правилами отмены и возврата",
  },
  uz: {
    title: "Majburiy roziliklar",
    offer: (link) => <>{link} bilan tanishdim va uning shartlarini qabul qilaman.</>,
    privacy: (link) => <>Shaxsiy ma’lumotlarimni {link}ga muvofiq qayta ishlashga roziman.</>,
    tubingRules: (link) => <>{link} bilan tanishdim va ularga rioya qilishga roziman.</>,
    poolRules: (link) => <>{link} bilan tanishdim va ularga rioya qilishga roziman.</>,
    refund: (link) => <>{link} bilan tanishdim va ularni qabul qilaman.</>,
    offerLink: "Ommaviy oferta",
    privacyLink: "Maxfiylik siyosati",
    tubingRulesLink: "Tubing gorkasidan foydalanish qoidalari",
    poolRulesLink: "Basseynga tashrif qoidalari",
    refundLink: "Bekor qilish va qaytarish qoidalari",
  },
  en: {
    title: "Required consents",
    offer: (link) => <>I have read and accept the {link}.</>,
    privacy: (link) => <>I consent to the processing of my personal data under the {link}.</>,
    tubingRules: (link) => <>I have read the {link} and agree to follow them.</>,
    poolRules: (link) => <>I have read the {link} and agree to follow them.</>,
    refund: (link) => <>I have read and accept the {link}.</>,
    offerLink: "Public Offer",
    privacyLink: "Privacy Policy",
    tubingRulesLink: "Tubing Hill Rules",
    poolRulesLink: "Pool Rules",
    refundLink: "Cancellation and Refund Rules",
  },
};

type ConsentRowProps = {
  name: "offerConsent" | "privacyConsent" | "rulesConsent" | "poolRulesConsent" | "refundConsent";
  children: ReactNode;
  tone: "light" | "dark";
};

function ConsentRow({ name, children, tone }: ConsentRowProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        name={name}
        required
        className={`mt-0.5 h-5 w-5 shrink-0 rounded border accent-[var(--sun)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sun)] focus-visible:ring-offset-2 ${
          tone === "dark" ? "focus-visible:ring-offset-[var(--ink)]" : "focus-visible:ring-offset-[var(--paper)]"
        }`}
      />
      <span className={`text-xs leading-5 sm:text-sm sm:leading-6 ${tone === "dark" ? "text-white/70" : "text-[var(--muted)]"}`}>
        {children}
      </span>
    </label>
  );
}

export function LegalConsentFields({
  locale,
  includeTubingRules = false,
  includePoolRules = false,
  includeRefund = false,
  tone = "light",
}: {
  locale: Locale;
  includeTubingRules?: boolean;
  includePoolRules?: boolean;
  includeRefund?: boolean;
  tone?: "light" | "dark";
}) {
  const t = COPY[locale];
  const linkClass =
    tone === "dark"
      ? "font-semibold text-[#f0c26a] underline decoration-[#f0c26a]/45 underline-offset-2 transition-colors hover:text-white"
      : "font-semibold text-[var(--accent-strong)] underline decoration-[var(--accent-strong)]/35 underline-offset-2 transition-colors hover:text-[var(--sun-dark)]";
  const link = (href: string, label: string) => (
    <a
      href={localizePath(locale, href)}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClass}
    >
      {label}
    </a>
  );

  return (
    <fieldset
      className={`space-y-3 rounded-2xl border px-4 py-4 ${
        tone === "dark" ? "border-white/14 bg-white/[0.04]" : "border-[color:var(--line)] bg-[var(--paper)]"
      }`}
    >
      <legend
        className={`px-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
          tone === "dark" ? "text-white/55" : "text-[var(--muted)]"
        }`}
      >
        {t.title}
      </legend>

      {includeTubingRules ? (
        <ConsentRow name="rulesConsent" tone={tone}>
          {t.tubingRules(link("/legal/tubing-rules", t.tubingRulesLink))}
        </ConsentRow>
      ) : null}

      {/* Правила бассейна — первой строкой, как и правила горки: это то, из-за
          чего гостя могут не пустить в воду, а не общие условия договора. */}
      {includePoolRules ? (
        <ConsentRow name="poolRulesConsent" tone={tone}>
          {t.poolRules(link("/legal/pool-rules", t.poolRulesLink))}
        </ConsentRow>
      ) : null}

      <ConsentRow name="offerConsent" tone={tone}>
        {t.offer(link("/legal/public-offer", t.offerLink))}
      </ConsentRow>

      {includeRefund ? (
        <ConsentRow name="refundConsent" tone={tone}>
          {t.refund(link("/legal/payment-refund", t.refundLink))}
        </ConsentRow>
      ) : null}

      <ConsentRow name="privacyConsent" tone={tone}>
        {t.privacy(link("/legal/privacy-policy", t.privacyLink))}
      </ConsentRow>
    </fieldset>
  );
}
