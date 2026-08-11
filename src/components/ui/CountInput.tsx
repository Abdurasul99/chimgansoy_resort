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

  return (
    <input
      id={id}
      name={name}
      type="number"
      inputMode="numeric"
      step={1}
      min={min}
      max={max}
      className={className}
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
  );
}
