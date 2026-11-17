import { startTransition, type SyntheticEvent } from "react";

/**
 * Отправка формы заявки без автосброса полей.
 *
 * С `<form action={action}>` React 19 после КАЖДОГО ответа действия очищает
 * неуправляемые поля — и после ошибки тоже. Гость вписал имя, телефон,
 * комментарий, отметил согласия, но забыл дату (или на даты всё занято) —
 * подсказка появлялась над пустой формой, всё введённое пропадало (найдено
 * 17.11.2026 на «Забронировать в один клик»). Успех форма и так заменяет
 * карточкой «Заявка принята», так что сброс ей не нужен вовсе.
 *
 * Обязательные поля по-прежнему проверяет браузер: событие submit приходит
 * только для валидной формы. Кнопка-отправитель попадает в FormData, как при
 * обычной отправке.
 */
export function submitKeepingFields(dispatch: (formData: FormData) => void) {
  return (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
    event.preventDefault();
    const submitter = event.nativeEvent.submitter ?? null;
    const formData = submitter ? new FormData(event.currentTarget, submitter) : new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
