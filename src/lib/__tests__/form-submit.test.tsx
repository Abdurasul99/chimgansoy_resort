import { useActionState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { submitKeepingFields } from "@/lib/form-submit";

/**
 * Гость не теряет введённое, когда сервер вернул ошибку (17.11.2026: на
 * «Забронировать в один клик» после «выберите дату заезда» пропадали имя,
 * телефон и галочки согласий).
 */
type State = { error?: string; got?: string };
async function act(_: State, fd: FormData): Promise<State> {
  return { error: "Kirish sanasini tanlang", got: String(fd.get("name")) };
}

function Demo() {
  const [state, action, pending] = useActionState(act, {});
  return (
    <form onSubmit={submitKeepingFields(action)}>
      <input name="name" defaultValue="" aria-label="name" />
      <input type="checkbox" name="consent" aria-label="consent" />
      <button type="submit" name="intent" value="send">send</button>
      {pending ? <p>…</p> : null}
      {state.error ? <p role="alert">{state.error}</p> : null}
      {state.got ? <p data-testid="got">{state.got}</p> : null}
    </form>
  );
}

describe("submitKeepingFields", () => {
  it("отдаёт действию данные формы и не стирает поля после ошибки", async () => {
    render(<Demo />);
    const name = screen.getByLabelText("name") as HTMLInputElement;
    const consent = screen.getByLabelText("consent") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "Aziz" } });
    fireEvent.click(consent);
    fireEvent.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Kirish sanasini tanlang"));
    expect(screen.getByTestId("got").textContent).toBe("Aziz");
    expect(name.value).toBe("Aziz");
    expect(consent.checked).toBe(true);
  });
});
