import { resortImages } from "@/content/images";
import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { ButtonLink } from "@/components/ui/ButtonLink";

/**
 * MasterPlan — honestly-framed "what we're building" section. It's the ONLY
 * place the CGI renders (aerial master plan, cottages, lagoon pool, padel/sport)
 * are allowed to appear, so they never masquerade as real photography elsewhere.
 * Every card carries a "rendering · coming soon" badge and the sole CTA is a soft
 * "get notified" to /contact — deliberately NOT an Exely booking link, since these
 * amenities aren't built yet.
 */

type Item = {
  image: keyof typeof resortImages;
  title: { ru: string; uz: string; en: string };
  desc: { ru: string; uz: string; en: string };
};

const COPY: Record<Locale, { eyebrow: string; title: string; lead: string; badge: string; cta: string }> = {
  ru: {
    eyebrow: "Мастер-план развития",
    title: "Что мы строим",
    lead: "Курорт растёт. Эти объекты пока в проекте — изображения ниже это визуализации, а не фотографии. Оставьте заявку, и мы сообщим, как только они откроются.",
    badge: "Визуализация · скоро",
    cta: "Оставить заявку",
  },
  uz: {
    eyebrow: "Rivojlanish master-rejasi",
    title: "Biz nima quramiz",
    lead: "Kurort o'smoqda. Bu obyektlar hozircha loyihada — quyidagi tasvirlar vizualizatsiya, foto emas. So'rov qoldiring, ochilishi bilan xabar beramiz.",
    badge: "Vizualizatsiya · tez orada",
    cta: "So'rov qoldirish",
  },
  en: {
    eyebrow: "Development master plan",
    title: "What we're building",
    lead: "The resort is growing. These are planned amenities — the images below are renderings, not photos. Leave a request and we'll let you know the moment they open.",
    badge: "Rendering · coming soon",
    cta: "Get notified",
  },
};

const ITEMS: Item[] = [
  {
    image: "hero", // 01-aerial-masterplan-day render
    title: { ru: "Полный мастер-план", uz: "To'liq master-reja", en: "Full master plan" },
    desc: { ru: "6 гектаров: коттеджи, бассейн, спорт и парковка.", uz: "6 gektar: kottejlar, basseyn, sport va parking.", en: "Six hectares: cottages, pool, sport and parking." },
  },
  {
    image: "cottageDay",
    title: { ru: "Коттеджи", uz: "Kottejlar", en: "Cottages" },
    desc: { ru: "Просторные дома для семьи и компании.", uz: "Oila va do'stlar uchun keng uylar.", en: "Spacious houses for families and groups." },
  },
  {
    image: "pool",
    title: { ru: "Бассейн-лагуна", uz: "Laguna-basseyn", en: "Lagoon pool" },
    desc: { ru: "Бар у воды, шезлонги и вид на Чимган.", uz: "Suv yonida bar, shezlonglar va Chimgon manzarasi.", en: "Swim-up bar, loungers and Chimgan views." },
  },
  {
    image: "workoutPadel",
    title: { ru: "Спорт: падел и мини-футбол", uz: "Sport: padel va mini-futbol", en: "Sport: padel & mini-football" },
    desc: { ru: "Корты и зона воркаута на свежем воздухе.", uz: "Kortlar va ochiq havodagi vorkaut zonasi.", en: "Courts and an open-air workout zone." },
  },
];

export function MasterPlan({ locale }: { locale: Locale }) {
  const t = COPY[locale];

  return (
    <section className="bg-[var(--ink)] px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8" aria-labelledby="masterplan-title">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl motion-reveal">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--sun)]">{t.eyebrow}</p>
          <h2 id="masterplan-title" className="mt-4 font-serif text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.05]">
            {t.title}
          </h2>
          <p className="mt-5 text-base leading-7 text-white/60">{t.lead}</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item) => {
            const img = resortImages[item.image];
            return (
              <figure
                key={item.image}
                className="relative overflow-hidden rounded-2xl border border-white/10 motion-reveal"
              >
                <div
                  className="min-h-[240px] bg-cover bg-center"
                  style={imageStyle(img)}
                  role="img"
                  aria-label={text(img.alt, locale)}
                />
                <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.94)_0%,rgba(12,18,14,0.28)_55%,transparent_100%)]" />
                {/* Honest rendering badge — this is a visualization, not a photo */}
                <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/85 backdrop-blur-sm">
                  {t.badge}
                </span>
                <figcaption className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif text-2xl font-semibold leading-tight">{text(item.title, locale)}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-white/70">{text(item.desc, locale)}</p>
                </figcaption>
              </figure>
            );
          })}
        </div>

        <div className="mt-10 motion-reveal">
          <ButtonLink href={localizePath(locale, "/contact")} variant="primary" className="btn-press">
            {t.cta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
