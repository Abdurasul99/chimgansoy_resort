import type { Locale } from "@/i18n/config";
import { localizePath } from "@/i18n/routing";
import { resortImages } from "@/content/images";
import { dayProducts } from "@/content/day-products";
import { topchanPricing, tubingPricing } from "@/content/pricing";
import { dictionaries } from "@/content/translations";
import { imageStyle } from "@/lib/images";
import { text } from "@/lib/localize";
import { money } from "@/lib/tariff";
import type { LivePricing } from "@/lib/pricing-resolve";
import { getRestaurantSettings } from "@/lib/restaurant/live";
import { pickText } from "@/lib/restaurant/rules";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { clock } from "@/components/ui/Clock";

/**
 * Ресторан, пикник-зона и тюбинг — под карточками глэмпинга и шале.
 *
 * Оператор, 30.09.2026: «на примере бронирования шале и глэмпинг — под ним
 * 3 упрощённые плашки с call-to-action». Пикник-зона и тюбинг повторяют
 * карточку домика: фото с заголовком, пара фактов, золотая цена, плашка в
 * духе «Включено в стоимость» и две кнопки — «Подробнее» и бронь, каждая на
 * свою страницу.
 *
 * Ресторан — отдельным крупным баннером: он зарабатывает сам, а не только
 * кормит проживающих, и гость должен с первого взгляда понять, что туда
 * можно приехать просто поесть. Отсюда «Открыт для всех» на фото, в
 * подзаголовке и первой плашкой.
 *
 * Все цены и часы — из тарифов (pricing.ts / админка), в тексте их нет.
 */

type L = Record<Locale, string>;
type LL = Record<Locale, string[]>;

const COPY = {
  heading: {
    eyebrow: { ru: "Без ночёвки", uz: "Tunamasdan", en: "No overnight stay needed" } as L,
    title: { ru: "Ресторан и отдых на день", uz: "Restoran va kunlik dam", en: "Restaurant and day visits" } as L,
  },
  restaurant: {
    badge: { ru: "Открыт для всех", uz: "Hamma uchun ochiq", en: "Open to everyone" } as L,
    eyebrow: { ru: "Ресторан · открыт для всех", uz: "Restoran · hamma uchun ochiq", en: "Restaurant · open to everyone" } as L,
    text: {
      ru: "Приезжайте просто пообедать или поужинать: ресторан открыт для всех гостей, а не только для тех, кто живёт в комплексе. Плов, шашлык и блюда на огне — с видом на горы Чимгана.",
      uz: "Shunchaki tushlik yoki kechki ovqat uchun keling: restoran majmuada yashovchilar uchungina emas, barcha mehmonlar uchun ochiq. Palov, shashlik va olovda pishgan taomlar — Chimgon tog'lari manzarasi bilan.",
      en: "Come just for lunch or dinner: the restaurant is open to everyone, not only to guests staying with us. Plov, kebabs and dishes cooked over fire — with a view of the Chimgan mountains.",
    } as L,
    plaque: { ru: "Для всех гостей", uz: "Barcha mehmonlar uchun", en: "For every guest" } as L,
    open: {
      ru: "Не только для проживающих",
      uz: "Faqat yashovchilar uchun emas",
      en: "Not only for staying guests",
    } as L,
    facts: {
      ru: ["Плов и шашлык", "Блюда на мангале", "Вид на горы Чимгана"],
      uz: ["Palov va shashlik", "Mangalda pishgan taomlar", "Chimgon tog'lari manzarasi"],
      en: ["Plov and kebabs", "Dishes from the grill", "Chimgan mountain views"],
    } as LL,
    hours: { ru: "Ежедневно", uz: "Har kuni", en: "Daily" } as L,
    table: { ru: "Бронь стола", uz: "Stol bandi", en: "Table booking" } as L,
    modes: {
      takeaway: { ru: "С собой", uz: "Olib ketish", en: "Takeaway" } as L,
      delivery: { ru: "Доставка", uz: "Yetkazib berish", en: "Delivery" } as L,
      room: { ru: "Ужин в домик", uz: "Uychaga ovqat", en: "Dinner to your cabin" } as L,
    },
    menu: { ru: "Смотреть меню", uz: "Menyuni ko'rish", en: "See the menu" } as L,
    book: { ru: "Забронировать стол", uz: "Stol band qilish", en: "Book a table" } as L,
  },
  picnic: {
    eyebrow: { ru: "Отдых на день · без ночёвки", uz: "Bir kunlik dam · tunamasdan", en: "A day out · no overnight stay" } as L,
    title: { ru: "Пикник-зона", uz: "Piknik zonasi", en: "Picnic area" } as L,
    guests: {
      ru: `до ${topchanPricing.capacity} гостей на топчан`,
      uz: `topchanga ${topchanPricing.capacity} kishigacha`,
      en: `up to ${topchanPricing.capacity} guests per topchan`,
    } as L,
    plaque: { ru: "Что есть на месте", uz: "Joyida nimalar bor", en: "On site" } as L,
    facts: {
      ru: ["Топчан с курпачами", "Мангал и казан в аренду", "Дрова и уголь на месте", "Можно со своими продуктами", "Блюда из ресторана"],
      uz: ["Kurpachali topchan", "Mangal va qozon ijaraga", "O'tin va ko'mir joyida", "O'z mahsulotlaringiz bilan mumkin", "Restoran taomlari"],
      en: ["Topchan with kurpacha cushions", "Mangal and kazan to rent", "Firewood and charcoal on site", "Bring your own food", "Dishes from the restaurant"],
    } as LL,
    book: { ru: "Забронировать топчан", uz: "Topchan bron qilish", en: "Book a topchan" } as L,
  },
  tubing: {
    eyebrow: { ru: "Активности · круглый год", uz: "Faollik · yil davomida", en: "Activities · all year" } as L,
    title: { ru: "Тюбинг-горка", uz: "Tubing gorkasi", en: "Tubing hill" } as L,
    plaque: { ru: "Главное", uz: "Asosiysi", en: "Key facts" } as L,
    // Проживающим — один спуск на гостя (оператор, 17.08.2026): то же, что
    // «Тюбинг: спуск каждому гостю» в плашке домиков.
    guests: { ru: "Гостям домиков — спуск бесплатно", uz: "Yashovchilarga bir marta bepul", en: "Cabin guests ride once free" } as L,
    facts: {
      ru: ["Трасса 160 м", "Автоматический подъём", "Подсветка вечером", "Ватрушка выдаётся на месте", "Детям — с 5 лет и от 110 см"],
      uz: ["160 m trassa", "Avtomatik ko'targich", "Kechqurun yoritiladi", "Tubing joyida beriladi", "Bolalar — 5 yoshdan va 110 sm dan"],
      en: ["160 m track", "Powered lift", "Lit in the evening", "Tube provided on site", "Children from age 5 and 110 cm"],
    } as LL,
    book: { ru: "Купить билет", uz: "Chipta sotib olish", en: "Buy a ticket" } as L,
  },
  daily: { ru: "Ежедневно", uz: "Har kuni", en: "Daily" } as L,
};

const CUR: L = { ru: "сум", uz: "so'm", en: "UZS" };
const FROM: L = { ru: "от", uz: "", en: "from" };

/** «от 300 000 сум / топчан» / «300 000 so'mdan / topchan» — как в карточках домиков. */
function fromPrice(amount: number, locale: Locale, unit?: L): string {
  const tail = unit ? ` / ${unit[locale]}` : "";
  return locale === "uz" ? `${money(amount)} ${CUR.uz}dan${tail}` : `${FROM[locale]} ${money(amount)} ${CUR[locale]}${tail}`;
}

export async function HomeDayCards({ locale, pricing }: { locale: Locale; pricing: LivePricing }) {
  const dict = dictionaries[locale];
  const settings = await getRestaurantSettings();
  const name = pickText(settings.name, locale);
  const topchan = dayProducts.find((p) => p.slug === "topchan");
  const tubing = dayProducts.find((p) => p.slug === "tubing");
  const r = COPY.restaurant;

  // Плашки ресторана — только правда о нём сейчас: часы, если заданы в
  // настройках; способы заказа — только когда приём открыт.
  const hours = settings.hoursOpen && settings.hoursClose ? `${r.hours[locale]} ${settings.hoursOpen}–${settings.hoursClose}` : "";
  const modes =
    settings.state === "open"
      ? (["takeaway", "delivery", "room"] as const).filter((m) => settings.modes[m]).map((m) => r.modes[m][locale])
      : [];
  const restaurantChips = [...r.facts[locale], ...(hours ? [hours] : []), ...modes, ...(settings.tables ? [r.table[locale]] : [])];

  const minRide = Math.min(...pricing.tubing.packages.map((p) => p.price));
  const rides = pricing.tubing.packages.map((p) => p.rides).join(locale === "en" ? " or " : locale === "uz" ? " yoki " : " или ");
  const ridesLabel: L = { ru: `${rides} спуска`, uz: `${rides} marta`, en: `${rides} rides` };

  return (
    <div className="mt-14 sm:mt-20">
      <div className="motion-reveal mb-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        <span>{COPY.heading.eyebrow[locale]}</span>
        <span className="h-px w-10 bg-[var(--accent-strong)]/40" />
      </div>
      <h3 className="motion-reveal-mask -mt-4 mb-8 font-serif text-[clamp(2rem,4.5vw,3.2rem)] font-semibold leading-[1.05] text-[var(--ink)]">
        {COPY.heading.title[locale]}
      </h3>

      {/* ── Ресторан — крупно, как самостоятельное место ── */}
      <article className="motion-reveal grid overflow-hidden rounded-3xl bg-[var(--mountain)] text-white shadow-[var(--shadow-card)] lg:grid-cols-[1.1fr_1fr]">
        <figure className="group relative min-h-[280px] overflow-hidden sm:min-h-[380px] lg:min-h-[520px]">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
            style={imageStyle(resortImages.galFoodServing)}
            role="img"
            aria-label={text(resortImages.galFoodServing.alt, locale)}
          />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,0.55)_0%,transparent_45%)]" />
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-[var(--sun)] px-4 py-2 text-sm font-extrabold text-[var(--on-accent)] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5)]">
            <Icon name="check" className="h-4 w-4" />
            {r.badge[locale]}
          </span>
        </figure>

        <div className="p-7 sm:p-10 lg:self-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--sun)]">{r.eyebrow[locale]}</p>
          <h4 className="mt-3 font-serif text-4xl font-bold leading-tight sm:text-5xl">«{name}»</h4>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/75">{r.text[locale]}</p>

          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">{r.plaque[locale]}</p>
            <ul className="mt-2.5 flex flex-wrap gap-1.5">
              <li className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sun)]/60 bg-[var(--sun)]/20 px-3 py-1.5 text-[13px] font-bold text-[var(--sun)]">
                <Icon name="check" className="h-3.5 w-3.5 shrink-0" />
                {r.open[locale]}
              </li>
              {restaurantChips.map((c) => (
                <li key={c} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold text-white/90">
                  <Icon name="check" className="h-3 w-3 shrink-0 text-[var(--sun)]" />
                  {clock(c, "dark")}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={localizePath(locale, "/restaurant")}
              className="btn-press inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-8 py-4 text-base font-extrabold text-[var(--on-accent)] shadow-[0_14px_34px_-10px_rgba(220,140,0,0.75)] transition-all duration-300 hover:brightness-[1.04] sm:text-lg"
            >
              {r.menu[locale]}
              <span aria-hidden className="text-xl leading-none">→</span>
            </a>
            <a
              href={localizePath(locale, "/restaurant/tables")}
              className="btn-press inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              {r.book[locale]}
            </a>
          </div>
        </div>
      </article>

      {/* ── Пикник-зона и тюбинг — упрощённые карточки в стиле домиков ── */}
      <div className="mt-5 grid gap-5 sm:mt-8 sm:gap-8 lg:grid-cols-2">
        <DayCard
          locale={locale}
          image={resortImages.galTerritoryPanorama}
          eyebrow={COPY.picnic.eyebrow[locale]}
          title={COPY.picnic.title[locale]}
          lead={topchan ? text(topchan.lead, locale) : ""}
          chips={[COPY.picnic.guests[locale], `${COPY.daily[locale]} ${topchanPricing.hours}`]}
          price={fromPrice(pricing.topchan.weekday, locale, { ru: "топчан", uz: "topchan", en: "topchan" })}
          plaque={COPY.picnic.plaque[locale]}
          facts={COPY.picnic.facts[locale]}
          detailsHref={localizePath(locale, "/services/picnic-zone")}
          detailsLabel={dict.details}
          bookHref={localizePath(locale, "/topchan#request")}
          bookLabel={COPY.picnic.book[locale]}
        />
        <DayCard
          locale={locale}
          image={resortImages.tubingTubesTrack}
          eyebrow={COPY.tubing.eyebrow[locale]}
          title={COPY.tubing.title[locale]}
          lead={tubing ? text(tubing.lead, locale) : ""}
          chips={[ridesLabel[locale], `${COPY.daily[locale]} ${tubingPricing.hours}`]}
          price={fromPrice(minRide, locale)}
          plaque={COPY.tubing.plaque[locale]}
          highlight={COPY.tubing.guests[locale]}
          facts={COPY.tubing.facts[locale]}
          detailsHref={localizePath(locale, "/tubing")}
          detailsLabel={dict.details}
          bookHref={localizePath(locale, "/tubing#request")}
          bookLabel={COPY.tubing.book[locale]}
        />
      </div>
    </div>
  );
}

function DayCard({
  locale,
  image,
  eyebrow,
  title,
  lead,
  chips,
  price,
  plaque,
  highlight,
  facts,
  detailsHref,
  detailsLabel,
  bookHref,
  bookLabel,
}: {
  locale: Locale;
  image: (typeof resortImages)[keyof typeof resortImages];
  eyebrow: string;
  title: string;
  lead: string;
  chips: string[];
  price: string;
  plaque: string;
  highlight?: string;
  facts: string[];
  detailsHref: string;
  detailsLabel: string;
  bookHref: string;
  bookLabel: string;
}) {
  return (
    <article className="editorial-card group relative flex flex-col overflow-hidden rounded-3xl bg-[var(--ink)] shadow-[var(--shadow-card)]">
      <div className="relative h-[56vw] max-h-[340px] min-h-[220px] overflow-hidden sm:min-h-[280px]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
          style={imageStyle(image)}
          role="img"
          aria-label={text(image.alt, locale)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(12,18,14,1.0)_0%,rgba(12,18,14,0.5)_45%,rgba(12,18,14,0.05)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{eyebrow}</p>
          <h4 className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-4xl">{title}</h4>
        </div>
      </div>

      <div className="room-info-block flex flex-1 flex-col bg-[var(--paper)] px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
        {lead && <p className="text-sm leading-7 text-[var(--muted)]">{lead}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-[var(--mist)] px-4 py-2 text-sm font-bold text-[var(--ink)]">
              {clock(c)}
            </span>
          ))}
          <span className="rounded-full bg-[var(--sun)]/15 px-4 py-2 text-sm font-bold text-[var(--sun-dark)]">{price}</span>
        </div>

        {/* Плашка — в той же рамке, что «Включено в стоимость» у домиков. */}
        <div className="mt-6 rounded-2xl border border-[color:var(--line)] bg-[var(--surface-warm)] px-4 py-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{plaque}</p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {highlight && (
              <li className="perk-chip perk-chip--hero max-w-full" style={{ whiteSpace: "normal" }}>
                <Icon name="snowflake" className="h-3.5 w-3.5 shrink-0" />
                {highlight}
              </li>
            )}
            {facts.map((f, i) => (
              <li key={f} className="perk-chip max-w-full" style={{ animationDelay: `${i * 70}ms`, whiteSpace: "normal" }}>
                <Icon name="check" className="h-3 w-3 shrink-0 text-[var(--green)]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row">
          <ButtonLink href={detailsHref} variant="secondary" className="btn-press">
            {detailsLabel}
          </ButtonLink>
          <ButtonLink href={bookHref} variant="ghost" className="btn-press">
            {bookLabel}
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
