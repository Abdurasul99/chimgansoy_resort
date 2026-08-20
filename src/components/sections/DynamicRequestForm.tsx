"use client";

import { useActionState, useState } from "react";
import { submitServiceRequest, type ServiceRequestState } from "@/app/actions/service-request";
import { CountInput } from "@/components/ui/CountInput";
import { Icon } from "@/components/ui/Icon";
import { LegalConsentFields } from "@/components/ui/LegalConsentFields";
import type { Locale } from "@/i18n/config";
import type { FormField } from "@/lib/site-overrides";
import { PageContextFields } from "@/components/ui/PageContextFields";

/**
 * Форма заявки, собранная по описанию из панели.
 *
 * Одна форма на все услуги оператора, а не по компоненту на каждую: набор полей
 * приходит данными, поэтому новая услуга с другими вопросами не требует ни
 * строчки кода. Проверка здесь — только чтобы гость увидел ошибку сразу;
 * настоящая живёт на сервере, в submitServiceRequest.
 */
const COPY: Record<Locale, Record<string, string>> = {
  ru: {
    title: "Оставить заявку",
    lead: "Ответим и подтвердим свободное время.",
    name: "Ваше имя",
    namePh: "Как к вам обращаться",
    phone: "Телефон",
    send: "Отправить заявку",
    sending: "Отправляем…",
    done: "Заявка принята",
    doneLead: "Мы свяжемся с вами, чтобы подтвердить время.",
    required: "обязательно",
    choose: "— выберите —",
  },
  uz: {
    title: "Ariza qoldirish",
    lead: "Javob beramiz va bo'sh vaqtni tasdiqlaymiz.",
    name: "Ismingiz",
    namePh: "Sizga qanday murojaat qilaylik",
    phone: "Telefon",
    send: "Ariza yuborish",
    sending: "Yuborilmoqda…",
    done: "Ariza qabul qilindi",
    doneLead: "Vaqtni tasdiqlash uchun siz bilan bog'lanamiz.",
    required: "majburiy",
    choose: "— tanlang —",
  },
  en: {
    title: "Send a request",
    lead: "We will reply and confirm availability.",
    name: "Your name",
    namePh: "What should we call you",
    phone: "Phone",
    send: "Send request",
    sending: "Sending…",
    done: "Request received",
    doneLead: "We will get in touch to confirm the time.",
    required: "required",
    choose: "— choose —",
  },
};

const field =
  "w-full rounded-xl border border-[color:var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]";

/**
 * Числовое поле держит своё состояние: CountInput управляемый, а полей в форме
 * заранее неизвестно сколько. Он же даёт то поведение, ради которого сделан —
 * ноль можно стереть, а не объезжать стрелками.
 */
function NumberField({ f, name }: { f: FormField; name: string }) {
  const [n, setN] = useState(f.min ?? 1);
  return <CountInput name={name} min={f.min ?? 0} max={f.max ?? 999} value={n} onValue={setN} className={field} />;
}

function Field({ f, t }: { f: FormField; t: Record<string, string> }) {
  const name = `f:${f.key}`;
  const common = { name, required: f.required, placeholder: f.placeholder, className: field };

  if (f.type === "checkbox") {
    return (
      <label className="flex items-center gap-3 sm:col-span-2">
        <input type="checkbox" name={name} className="h-5 w-5 accent-[var(--sun)]" />
        <span className="text-sm text-[var(--ink)]">{f.label}</span>
      </label>
    );
  }

  return (
    <label className={f.type === "textarea" ? "block sm:col-span-2" : "block"}>
      <span className={labelCls}>
        {f.label}
        {f.required ? <span className="ml-1 font-normal normal-case text-[var(--sun-dark)]">· {t.required}</span> : null}
      </span>

      {f.type === "textarea" ? (
        <textarea {...common} rows={3} className={`${field} resize-none`} />
      ) : f.type === "select" ? (
        <select name={name} required={f.required} className={field} defaultValue="">
          <option value="" disabled={f.required}>
            {t.choose}
          </option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : f.type === "number" ? (
        <NumberField f={f} name={name} />
      ) : f.type === "date" ? (
        <input {...common} type="date" />
      ) : f.type === "phone" ? (
        <input {...common} type="tel" inputMode="tel" />
      ) : (
        <input {...common} type="text" />
      )}
    </label>
  );
}

export function DynamicRequestForm({
  locale,
  slug,
  title,
  fields,
}: {
  locale: Locale;
  slug: string;
  title: string;
  fields: FormField[];
}) {
  const t = COPY[locale];
  const [state, action, pending] = useActionState<ServiceRequestState, FormData>(submitServiceRequest, {});

  if (state.ok) {
    return (
      <div className="rounded-3xl border border-[color:var(--line)] bg-[var(--surface-warm)] p-8 text-center">
        <Icon name="check" className="mx-auto h-10 w-10 text-[var(--accent-strong)]" />
        <p className="mt-4 font-serif text-2xl font-bold text-[var(--ink)]">{t.done}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{t.doneLead}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-3xl border border-[color:var(--line)] bg-[var(--paper)] p-6 sm:p-8">
      <h3 className="font-serif text-2xl font-bold text-[var(--ink)]">{t.title}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">{t.lead}</p>

      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <PageContextFields />
      <input type="hidden" name="serviceTitle" value={title} />
      {/* Ловушка для ботов: человек это поле не видит и не заполняет. */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <input type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Имя и телефон — всегда: без них заявка не заявка, и оператор не
            должен уметь их случайно выключить. */}
        <label className="block">
          <span className={labelCls}>{t.name}</span>
          <input name="name" required placeholder={t.namePh} autoComplete="name" className={field} />
        </label>
        <label className="block">
          <span className={labelCls}>{t.phone}</span>
          <input
            name="phone"
            required
            type="tel"
            inputMode="tel"
            placeholder="+998 __ ___ __ __"
            autoComplete="tel"
            className={field}
          />
        </label>

        {fields.map((f) => (
          <Field key={f.key} f={f} t={t} />
        ))}
      </div>

      {state.error ? (
        <p className="mt-4 text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</p>
      ) : null}

      <div className="mt-5">
        <LegalConsentFields locale={locale} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="btn-press mt-6 w-full rounded-full bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-3.5 text-base font-extrabold text-[var(--on-accent)] shadow-[0_12px_28px_-12px_rgba(220,140,0,0.9)] transition hover:brightness-[1.05] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? t.sending : t.send}
      </button>
    </form>
  );
}
