"use client";

import { startTransition, useActionState, useState, type ChangeEvent } from "react";
import {
  offerAction,
  removeOfferLogo,
  saveOffer,
  signInPartners,
  uploadOfferLogo,
  type AdminState,
} from "./actions";
import type { Offer, OfferStatus } from "@/lib/partners/model";
import { MAX_PACKAGES, OFFER_STATUSES, STATUS_LABEL } from "@/lib/partners/model";

export const field =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-base text-[var(--ink)] outline-none focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const label = "mb-1 block text-sm font-semibold text-[var(--ink)]";
const btn = "rounded-full bg-[var(--sun)] px-5 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--sun-dark)] disabled:opacity-60";
const ghost = "rounded-full border border-[var(--line-strong)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface)] disabled:opacity-60";

function Result({ state }: { state: AdminState }) {
  if (state.error) return <p role="alert" className="text-sm font-semibold text-red-700">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-semibold text-[var(--accent)]">{state.ok}</p>;
  return null;
}

// ─── Вход ──────────────────────────────────────────────────────────────────

export function LoginForm() {
  const [state, action, pending] = useActionState(signInPartners, {});
  return (
    <form action={action} className="mx-auto mt-6 max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h1 className="text-2xl font-bold text-[var(--ink)]">Партнёры — вход</h1>
      <label className="block">
        <span className={label}>Пароль</span>
        <input name="password" type="password" required autoComplete="current-password" className={field} />
      </label>
      <Result state={state} />
      <button type="submit" disabled={pending} className={`${btn} w-full py-3`}>
        {pending ? "Проверяем…" : "Войти"}
      </button>
    </form>
  );
}

// ─── Копировать ссылку ─────────────────────────────────────────────────────

export function CopyLink({ url, label: text = "Копировать" }: { url: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={ghost}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          window.prompt("Скопируйте ссылку", url);
        }
      }}
    >
      {done ? "Скопировано ✓" : text}
    </button>
  );
}

// ─── Форма предложения ─────────────────────────────────────────────────────

type ProgramOption = { id: string; title: string };

export function OfferForm({ offer, programs }: { offer: Offer | null; programs: ProgramOption[] }) {
  const [state, action, pending] = useActionState(saveOffer, {});
  const pkgs = Array.from({ length: MAX_PACKAGES }, (_, i) => offer?.packages[i]);
  return (
    <form action={action} className="space-y-6">
      {offer && <input type="hidden" name="id" value={offer.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Компания *</span>
          <input name="company" required maxLength={80} defaultValue={offer?.company} className={field} placeholder="Uzum" />
        </label>
        <label className="block">
          <span className={label}>Контакт в компании (видно только здесь)</span>
          <input name="contact" maxLength={160} defaultValue={offer?.contact} className={field} placeholder="Имя, должность, телефон" />
        </label>
      </div>

      <label className="block">
        <span className={label}>Вступление — что видит компания вверху страницы</span>
        <textarea name="lead" rows={4} maxLength={1500} defaultValue={offer?.lead} className={field}
          placeholder="Подготовили предложение по итогам встречи 12 ноября: …" />
      </label>

      <fieldset>
        <legend className={label}>Программы на странице</legend>
        <div className="flex flex-wrap gap-3">
          {programs.map((p) => (
            <label key={p.id} className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3.5 py-2 text-sm">
              <input type="checkbox" name="programs" value={p.id} defaultChecked={offer?.programs.includes(p.id)} className="h-4 w-4 accent-[var(--sun)]" />
              {p.title}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-4">
        <p className={label}>Пакеты (до {MAX_PACKAGES}; пустой — не показывается)</p>
        {pkgs.map((p, i) => (
          <div key={i} className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--line)] p-4 sm:grid-cols-2">
            <label className="block">
              <span className={label}>Пакет {i + 1} — название</span>
              <input name={`pkg${i}_title`} maxLength={80} defaultValue={p?.title} className={field} placeholder="Зима · Оплата" />
            </label>
            <label className="block">
              <span className={label}>Цена, сум без НДС (пусто — «по запросу»)</span>
              <input name={`pkg${i}_price`} inputMode="numeric" maxLength={30} defaultValue={p?.price ? String(p.price) : ""} className={field} placeholder="150 000 000" />
            </label>
            <label className="block sm:col-span-2">
              <span className={label}>Что входит — строка на пункт</span>
              <textarea name={`pkg${i}_items`} rows={4} maxLength={2000} defaultValue={p?.items.join("\n")} className={field}
                placeholder={"Брендированные кассы на тюбинге\nКешбэк 10 % для держателей карт\nДекабрь — февраль"} />
            </label>
            <label className="block sm:col-span-2">
              <span className={label}>Примечание под ценой</span>
              <input name={`pkg${i}_note`} maxLength={200} defaultValue={p?.note} className={field} placeholder="Производство и монтаж — за счёт партнёра" />
            </label>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Действует до (включительно)</span>
          <input name="validUntil" type="date" defaultValue={offer?.validUntil ?? ""} className={field} />
        </label>
        <label className="block">
          <span className={label}>Статус сделки</span>
          <select name="status" defaultValue={offer?.status ?? "draft"} className={field}>
            {OFFER_STATUSES.map((s: OfferStatus) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className={label}>Заметка для себя (компании не видна)</span>
        <textarea name="note" rows={3} maxLength={1000} defaultValue={offer?.note} className={field} />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={btn}>
          {pending ? "Сохраняем…" : offer ? "Сохранить" : "Создать ссылку"}
        </button>
        <Result state={state} />
      </div>
    </form>
  );
}

// ─── Логотип ───────────────────────────────────────────────────────────────

/**
 * Логотип уменьшается в браузере до 600 px с прозрачностью (WebP, иначе PNG):
 * nginx на chimgandarbaza.uz пропускает запросы до 1 МБ, а файл от дизайнера
 * бывает в разы больше. Сервер всё равно пережимает его в WebP.
 */
async function shrinkLogo(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.92));
    if (!blob) return file;
    const type = blob.type === "image/webp" ? "image/webp" : "image/png";
    return new File([blob], `logo.${type === "image/webp" ? "webp" : "png"}`, { type });
  } catch {
    return file;
  }
}

export function LogoForm({ offer }: { offer: Offer }) {
  const [state, action, pending] = useActionState(uploadOfferLogo, {});
  const [rmState, rmAction, rmPending] = useActionState(removeOfferLogo, {});
  const [busy, setBusy] = useState(false);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const small = await shrinkLogo(file);
    setBusy(false);
    const fd = new FormData();
    fd.set("id", String(offer.id));
    fd.set("logo", small);
    startTransition(() => action(fd));
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {offer.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={offer.logo} alt={`Логотип ${offer.company}`} className="max-h-20 w-auto rounded-lg bg-[var(--ink)] p-3" />
      ) : (
        <p className="text-sm text-[var(--ink)]/60">Логотипа нет — на странице будет название компании.</p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${ghost} cursor-pointer`}>
          {busy || pending ? "Загружаем…" : offer.logo ? "Заменить логотип" : "Загрузить логотип"}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} className="hidden" disabled={busy || pending} />
        </label>
        {offer.logo && (
          <form action={rmAction}>
            <input type="hidden" name="id" value={offer.id} />
            <button type="submit" disabled={rmPending} className={ghost}>Убрать</button>
          </form>
        )}
      </div>
      <p className="text-xs text-[var(--ink)]/55">PNG, JPEG или WebP. Лучше с прозрачным фоном — на странице он ляжет на тёмную подложку.</p>
      <Result state={state.error || state.ok ? state : rmState} />
    </div>
  );
}

// ─── Отозвать, новый адрес, удалить ────────────────────────────────────────

export function OfferButtons({ offer }: { offer: Offer }) {
  const [state, action, pending] = useActionState(offerAction, {});
  const ask = (msg: string) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(msg)) e.preventDefault();
  };
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={offer.id} />
      <div className="flex flex-wrap gap-3">
        {offer.revoked ? (
          <button name="op" value="restore" disabled={pending} className={ghost}>Вернуть ссылку</button>
        ) : (
          <button name="op" value="revoke" disabled={pending} className={ghost}
            onClick={ask(`Отозвать ссылку ${offer.company}? Страница перестанет открываться.`)}>
            Отозвать ссылку
          </button>
        )}
        <button name="op" value="rekey" disabled={pending} className={ghost}
          onClick={ask("Выдать новый адрес? Старая ссылка перестанет открываться — новую нужно будет отправить заново.")}>
          Новый адрес
        </button>
        <button name="op" value="delete" disabled={pending} className={`${ghost} border-red-300 text-red-700`}
          onClick={ask(`Удалить предложение ${offer.company} совсем? Это не отменить.`)}>
          Удалить
        </button>
      </div>
      <Result state={state} />
    </form>
  );
}
