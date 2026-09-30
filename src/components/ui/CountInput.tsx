"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Числовое поле, из которого можно стереть ноль.
 *
 * ПОЧЕМУ ОНО ПОНАДОБИЛОСЬ
 * Все счётчики в формах заявок были написаны так:
 *
 *   value={towels} onChange={(e) => setTowels(+e.target.value || 0)}
 *
 * Гость выделяет «0», жмёт Backspace — в поле пусто, `+"" || 0` даёт 0, React
 * тут же возвращает «0» обратно. Стереть ноль невозможно: приходится сначала
 * напечатать цифру рядом, а потом удалять. На телефоне, где курсор ставится
 * пальцем, это отдельное мучение — а таких полей в одной форме бассейна шесть.
 *
 * КАК УСТРОЕНО
 * Внутри живёт СТРОКА, а не число: пустое поле — допустимое промежуточное
 * состояние, пока гость печатает. Наружу отдаётся число (пусто → 0), поэтому
 * счётчик в шапке формы и итоговая сумма считаются как раньше.
 *
 * На blur поле нормализуется: пустое становится «0», «007» — «7», значение
 * выше max прижимается к max. Именно на blur, а не на каждое нажатие, иначе
 * «1» на пути к «10» превратилась бы в max и гость не смог бы дописать ноль.
 *
 * Само поле остаётся обычным <input name=…>, так что форма и серверный экшен
 * ничего не замечают: пустая строка на сервере читается как 0, а настоящий
 * потолок всё равно проверяется там.
 */
export function CountInput({
  name,
  value,
  onValue,
  min = 0,
  max,
  className,
  id,
}: {
  name: string;
  value: number;
  onValue: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  id?: string;
}) {
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  // Родитель может поменять значение сам — например, прижать к остатку мест.
  // Пока поле в фокусе, не трогаем: иначе вырвем цифру из-под пальца.
  useEffect(() => {
    if (!focused.current && String(value) !== text.trim()) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const clamp = (n: number) => {
    const bottom = Math.max(n, min);
    return max === undefined ? bottom : Math.min(bottom, max);
  };

  const current = text === "" ? min : clamp(Number(text));
  const step = (d: number) => {
    const n = clamp(current + d);
    setText(String(n));
    onValue(n);
  };

  /*
   * Кнопки «−» и «+» внутри поля — на телефоне попасть в них пальцем проще,
   * чем набирать цифру на экранной клавиатуре (30.09.2026, аудит мобильной
   * вёрстки). Поле ввода стоит в разметке ПЕРВЫМ: формы оборачивают счётчик в
   * <label>, а подпись «нажимает» первый элемент внутри — окажись там «−»,
   * тап по слову «Гостей» уменьшал бы число. Кнопки вне порядка Tab и скрыты
   * от экранных чтецов: поле с клавиатуры и так меняется стрелками.
   */
  const btn =
    "absolute top-1/2 flex h-10 w-10 -translate-y-1/2 select-none items-center justify-center rounded-lg bg-[var(--ink)]/[0.06] text-lg font-bold leading-none text-[var(--ink)] transition active:scale-95 disabled:opacity-30";

  return (
    <span className="relative block">
      <input
        id={id}
        name={name}
        type="number"
        inputMode="numeric"
        step={1}
        min={min}
        max={max}
        className={`${className ?? ""} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        style={{ paddingLeft: "3.25rem", paddingRight: "3.25rem", textAlign: "center" }}
        value={text}
        onFocus={() => {
          focused.current = true;
        }}
        onChange={(e) => {
          // Цифры и пусто. Минус и запятая в счётчике гостей смысла не имеют, а
          // «e» браузер пускает в number-поле сам — и оно приходит сюда как "".
          const next = e.target.value.replace(/[^\d]/g, "");
          setText(next);
          onValue(next === "" ? 0 : clamp(Number(next)));
        }}
        onBlur={() => {
          focused.current = false;
          const n = text === "" ? min : clamp(Number(text));
          setText(String(n));
          onValue(n);
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={current <= min}
        onClick={() => step(-1)}
        className={`${btn} left-1.5`}
      >
        −
      </button>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        disabled={max !== undefined && current >= max}
        onClick={() => step(1)}
        className={`${btn} right-1.5`}
      >
        +
      </button>
    </span>
  );
}
