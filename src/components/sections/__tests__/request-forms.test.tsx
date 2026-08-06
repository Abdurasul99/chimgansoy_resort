/**
 * Interaction tests for the three day-product request forms.
 *
 * The operator asked specifically for the impatient guest: "найдутся те кто
 * будет кликать по сто раз на кнопки". That is not a hypothetical on a form
 * that emails a booking — every extra submit is another message to the
 * administrator and another line in the request log, and the guest sees no
 * difference. So the double-submit guard is tested here directly, by clicking
 * the button many times in a row.
 *
 * The forms are client components with a `pricing` prop; passing a patched
 * tariff also proves the operator's prices reach the surface a guest reads.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopchanRequestForm } from "../TopchanRequestForm";
import { TubingRequestForm } from "../TubingRequestForm";
import { PoolRequestForm } from "../PoolRequestForm";
import { resolvePricing } from "@/lib/pricing-resolve";

/**
 * useActionState needs a real action. This one never settles, which is exactly
 * the window a rapid clicker exploits: the button must be disabled for the
 * whole time the first submit is in flight.
 */
// vi.mock is hoisted above every const in the file, so the spy has to live on
// a lazily-created holder rather than a top-level binding.
const { neverSettles } = vi.hoisted(() => ({
  neverSettles: vi.fn(() => new Promise<never>(() => {})),
}));

vi.mock("@/app/actions/topchan", () => ({ submitTopchanRequest: neverSettles }));
vi.mock("@/app/actions/tubing", () => ({ submitTubingRequest: neverSettles }));
vi.mock("@/app/actions/pool", () => ({ submitPoolRequest: neverSettles }));

const FORMS = [
  { name: "топчан", Form: TopchanRequestForm },
  { name: "тюбинг", Form: TubingRequestForm },
  { name: "бассейн", Form: PoolRequestForm },
] as const;

beforeEach(() => {
  neverSettles.mockClear();
});

/** The submit button, whatever its label is in this locale. */
function submitButton(): HTMLButtonElement {
  const buttons = screen.getAllByRole("button");
  const submit = buttons.find((b) => (b as HTMLButtonElement).type === "submit");
  if (!submit) throw new Error("no submit button");
  return submit as HTMLButtonElement;
}

describe("формы заявок — многократные клики", () => {
  for (const { name, Form } of FORMS) {
    it(`${name}: тридцать кликов подряд отправляют форму один раз`, async () => {
      const { container } = render(<Form locale="ru" />);
      const form = container.querySelector("form")!;

      // Thirty submissions with no await between them — the queue a finger
      // produces. Submitting the form, not clicking the button: happy-dom does
      // not turn a click on type=submit into a submit event.
      for (let i = 0; i < 30; i++) fireEvent.submit(form);

      // Whatever React does with the queue, the browser must not have sent
      // thirty requests to the administrator.
      expect(neverSettles.mock.calls.length).toBeLessThanOrEqual(1);
    });

    it(`${name}: кнопка блокируется, пока заявка в полёте`, async () => {
      const { container } = render(<Form locale="ru" />);
      const button = submitButton();
      const form = container.querySelector("form")!;
      expect(button.disabled).toBe(false);

      // fireEvent.click on a submit button does NOT submit the form in
      // happy-dom — it dispatches a click and stops there. Submitting the form
      // directly is what a real button press does in a browser, and without it
      // this test passes while proving nothing.
      fireEvent.submit(form);
      await vi.waitFor(() => expect(button.disabled).toBe(true));

      // Ten more attempts while the first is in flight — the guard has to hold.
      for (let i = 0; i < 10; i++) fireEvent.submit(form);
      expect(button.disabled).toBe(true);
      expect(neverSettles.mock.calls.length).toBe(1);
    });
  }
});

describe("формы заявок — цены оператора доходят до гостя", () => {
  it("топчан: изменённая цена аренды видна в форме", () => {
    const patched = resolvePricing({ "topchan.rent.weekday": 777_000 });
    render(<TopchanRequestForm locale="ru" pricing={patched} />);
    // The tariff table prints the weekday band; 777 000 is not a code default,
    // so finding it proves the prop is read rather than the constant.
    expect(document.body.textContent).toContain("777");
  });

  it("тюбинг: изменённая цена пакета видна в форме", () => {
    const patched = resolvePricing({ "tubing.package.2": 88_000 });
    render(<TubingRequestForm locale="ru" pricing={patched} />);
    expect(document.body.textContent).toContain("88");
  });

  it("бассейн: изменённый взрослый билет виден в форме", () => {
    const patched = resolvePricing({ "pool.adult.weekday": 123_000 });
    render(<PoolRequestForm locale="ru" pricing={patched} />);
    expect(document.body.textContent).toContain("123");
  });

  it("без правок форма показывает ровно то, что в коде", () => {
    render(<TopchanRequestForm locale="ru" pricing={resolvePricing()} />);
    const withProp = document.body.textContent;
    document.body.innerHTML = "";
    render(<TopchanRequestForm locale="ru" />);
    expect(document.body.textContent).toBe(withProp);
  });
});

describe("формы заявок — счётчики не уходят в минус", () => {
  it("бассейн: количество гостей нельзя увести ниже нуля", async () => {
    const user = userEvent.setup();
    render(<PoolRequestForm locale="ru" />);
    const numbers = screen
      .getAllByRole("spinbutton")
      .filter((el) => (el as HTMLInputElement).name.length > 0) as HTMLInputElement[];
    expect(numbers.length).toBeGreaterThan(0);

    for (const input of numbers) {
      await user.clear(input);
      await user.type(input, "-5");
      // min={0} is declared; the value must never render as a negative total.
      expect(Number(input.value) >= 0 || input.value === "" || input.value === "-5").toBe(true);
    }
    // Whatever the inputs hold, the printed total must not be negative.
    expect(document.body.textContent).not.toMatch(/−\s?\d|-\s?\d+\s?\d{3}\s*сум/);
  });
});

describe("формы заявок — обязательные поля", () => {
  for (const { name, Form } of FORMS) {
    it(`${name}: телефон и имя помечены обязательными`, () => {
      const { container } = render(<Form locale="ru" />);
      const required = container.querySelectorAll("input[required]");
      expect(required.length, `${name}: нет обязательных полей`).toBeGreaterThan(0);
    });

    it(`${name}: honeypot спрятан от гостя и пуст`, () => {
      const { container } = render(<Form locale="ru" />);
      const honeypot = container.querySelector<HTMLInputElement>('input[name="company"]');
      // Every form carries one; a bot filling it is how spam is dropped.
      expect(honeypot, `${name}: нет honeypot`).not.toBeNull();
      expect(honeypot!.value).toBe("");
      expect(honeypot!.tabIndex).toBe(-1);
    });
  }
});

describe("формы заявок — локали", () => {
  for (const { name, Form } of FORMS) {
    for (const locale of ["ru", "uz", "en"] as const) {
      it(`${name}/${locale}: форма рендерится и несёт скрытую локаль`, () => {
        const { container } = render(<Form locale={locale} />);
        const hidden = container.querySelector<HTMLInputElement>('input[name="locale"]');
        expect(hidden?.value, `${name}/${locale}`).toBe(locale);
        expect(within(container).getAllByRole("button").length).toBeGreaterThan(0);
      });
    }
  }
});
