import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { ActionState } from "./actions";

export type FormAction = (prev: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Отправка длинной формы без автосброса React.
 *
 * `<form action={…}>` в React 19 очищает поля после КАЖДОЙ отправки, в том
 * числе неудачной: менеджер вставил меню на сорок строк, получил ошибку — и
 * поле пустое. Здесь форма уходит из onSubmit, введённое остаётся, а сброс —
 * только когда `resetWhen` скажет, что ответ его заслуживает.
 *
 * Только для клиентских компонентов.
 */
export function useKeptForm(action: FormAction, resetWhen?: (state: ActionState) => boolean) {
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);
  // Сбрасываем один раз на ответ, а не на каждую перерисовку с тем же ответом.
  const handled = useRef<ActionState>(state);

  useEffect(() => {
    if (handled.current === state) return;
    handled.current = state;
    if (resetWhen?.(state)) ref.current?.reset();
  }, [state, resetWhen]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(data));
  }

  return { state, pending, onSubmit, ref };
}

export const resetOnOk = (s: ActionState) => Boolean(s.ok);

/**
 * onSubmit для короткой формы с useActionState: отправляет так же, как
 * `action={dispatch}`, но без автосброса React 19 — после «Цена — только
 * цифры» в поле остаётся то, что человек ввёл, а не старая цена.
 * `guard` — вопрос «точно отменить?»: false — ничего не отправляем.
 */
export function submitKeeping(dispatch: (data: FormData) => void, guard?: (e: FormEvent<HTMLFormElement>) => boolean) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (guard && !guard(e)) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(data));
  };
}
