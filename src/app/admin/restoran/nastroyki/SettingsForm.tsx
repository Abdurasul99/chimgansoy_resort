"use client";

import { useActionState, type ReactNode } from "react";
import type { AdminRole } from "@/lib/admin-auth";
import type { RestaurantSettings } from "@/lib/restaurant/model";
import { previewLink, saveRestaurantSettings, uploadHeroImage, type ActionState } from "../actions";
import { useKeptForm } from "../form-hooks";
import { PhotoInput } from "../PhotoInput";
import { Result, field, labelText, lineBtn, linkBtn, saveBtn } from "../ui";

const LANGS = [
  ["ru", "RU"],
  ["uz", "UZ"],
  ["en", "EN"],
] as const;

const STATES: { value: RestaurantSettings["state"]; title: string; text: string }[] = [
  {
    value: "hidden",
    title: "Скрыт",
    text: "Ресторана нет в меню сайта и в поиске. Страница открывается только по прямой ссылке chimgandarbaza.uz/restaurant — для рекламы и QR.",
  },
  {
    value: "open",
    title: "Виден на сайте",
    text: "Пункт «Ресторан» есть в меню сайта, меню и фото видны всем.",
  },
];

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[color:var(--line)] bg-[var(--paper)] p-5">
      <h2 className="font-serif text-xl font-semibold text-[var(--ink)]">{title}</h2>
      {hint && <p className="mt-1 text-sm text-[var(--muted)]">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Одно текстовое поле на трёх языках. RU обязателен, UZ и EN без перевода берут RU. */
function Localized({
  name,
  label,
  value,
  area = false,
  required = false,
}: {
  name: string;
  label: string;
  value: RestaurantSettings["name"];
  area?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <span className={labelText}>{label}</span>
      <div className="grid gap-2 md:grid-cols-3">
        {LANGS.map(([l, tag]) => (
          <label key={l} className="block">
            <span className="mb-0.5 block text-[10px] font-bold text-[var(--muted)]">
              {tag}
              {!value[l].trim() && l !== "ru" ? " · нет перевода" : ""}
            </span>
            {area ? (
              <textarea name={`${name}_${l}`} defaultValue={value[l]} rows={4} required={required && l === "ru"} className={field} />
            ) : (
              <input name={`${name}_${l}`} defaultValue={value[l]} required={required && l === "ru"} className={field} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

/**
 * Настройки ресторана — всё, что меняется без программиста: видимость,
 * название, тексты, часы, контакты и строка-объявление.
 */
export function SettingsForm({ settings, role }: { settings: RestaurantSettings; role: AdminRole }) {
  const { state, pending, onSubmit, ref } = useKeptForm(saveRestaurantSettings);
  const owner = role === "owner";

  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-5">
      <Section
        title="Видимость раздела"
        hint={owner ? "Показывать ли ресторан гостям сайта." : "Открывает раздел для гостей администратор сайта."}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {STATES.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer gap-3 rounded-2xl border p-4 transition has-[:checked]:border-[var(--sun)] has-[:checked]:bg-[var(--sun)]/10 ${
                owner ? "border-[color:var(--line)]" : "cursor-not-allowed border-[color:var(--line)] opacity-70"
              }`}
            >
              <input
                type="radio"
                name="state"
                value={s.value}
                defaultChecked={settings.state === s.value}
                disabled={!owner}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--sun)]"
              />
              <span>
                <span className="block font-bold text-[var(--ink)]">{s.title}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{s.text}</span>
              </span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Название и тексты" hint="Публичное название утверждают обе стороны. Строка-объявление — для «Открытие 10 октября», «Сегодня кухня до 20:00».">
        <Localized name="name" label="Название ресторана" value={settings.name} required />
        <Localized name="tagline" label="Подзаголовок" value={settings.tagline} />
        <Localized name="about" label="О ресторане" value={settings.about} area />
        <Localized name="announcement" label="Строка-объявление над меню" value={settings.announcement} />
      </Section>

      <Section title="Часы и контакты">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Открытие</span>
            <input type="time" name="hoursOpen" defaultValue={settings.hoursOpen} className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Закрытие</span>
            <input type="time" name="hoursClose" defaultValue={settings.hoursClose} className={field} />
          </label>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Без часов сайт не пишет «открыто сейчас». Кухня за полночь — закрытие меньше открытия, например 12:00–02:00.
        </p>
        <label className="block">
          <span className={labelText}>Телефоны ресторана (через запятую)</span>
          <input name="phones" defaultValue={settings.phones.join(", ")} placeholder="+998 __ ___ __ __" className={field} />
          <span className="mt-1 block text-xs text-[var(--muted)]">
            Пусто — гостям показывается общий номер комплекса. Номера +998 95 521 00 14 и 15 из переговоров
            вписывайте только после подтверждения владельцем номеров.
          </span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelText}>Instagram</span>
            <input name="instagram" type="url" defaultValue={settings.instagram} placeholder="https://instagram.com/…" className={field} />
          </label>
          <label className="block">
            <span className={labelText}>Telegram</span>
            <input name="telegram" type="url" defaultValue={settings.telegram} placeholder="https://t.me/…" className={field} />
          </label>
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-5 flex flex-wrap items-center gap-4 border-t border-[color:var(--line)] bg-[var(--surface)]/95 px-5 py-4 backdrop-blur">
        <button type="submit" disabled={pending} className={saveBtn}>
          {pending ? "Сохраняем…" : "Сохранить настройки"}
        </button>
        <Result state={state} pending={pending} className="" />
      </div>
    </form>
  );
}

/** Фото первого экрана — отдельной формой, чтобы не перегружать основную. */
export function HeroPhoto({ url }: { url: string }) {
  const [rm, remove, removing] = useActionState<ActionState, FormData>(uploadHeroImage, {});
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url || "/images/resort/stock/plov-lyagan.jpg"}
        alt=""
        className="h-28 w-44 rounded-xl border border-[color:var(--line)] object-cover"
      />
      <div className="space-y-2">
        <p className="text-sm text-[var(--muted)]">
          {url ? "Своё фото ресторана." : "Сейчас стоит кадр с пловом — до съёмки ресторана."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <PhotoInput action={uploadHeroImage} label={url ? "Заменить фото" : "Загрузить фото"} />
          {url && (
            <form action={remove}>
              <input type="hidden" name="remove" value="1" />
              <button type="submit" disabled={removing} className={linkBtn}>
                {removing ? "Убираем…" : "вернуть кадр по умолчанию"}
              </button>
            </form>
          )}
          <Result state={rm} pending={removing} className="" />
        </div>
      </div>
    </div>
  );
}

export function PreviewTools() {
  const [st, make, making] = useActionState<ActionState>(previewLink, {});
  return (
    <form action={make} className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={making} className={lineBtn}>
          {making ? "Готовим…" : "Получить ссылку предпросмотра"}
        </button>
        <Result state={st} pending={making} className="" />
      </div>
      {st.url && (
        <a href={st.url} target="_blank" rel="noopener noreferrer" className="block break-all text-sm font-semibold text-[var(--accent-strong)] underline underline-offset-2">
          {st.url}
        </a>
      )}
    </form>
  );
}
