import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { CountInput } from "../CountInput";

/**
 * Из счётчика должно стираться содержимое.
 *
 * Оператор: «я не могу стереть ноль, для этого нужно сначала написать какое-то
 * число и потом стереть». Так вело себя каждое числовое поле в формах заявок:
 * `+"" || 0` возвращало 0, React перерисовывал «0», и пустого состояния не
 * существовало. На телефоне, где курсор ставится пальцем, это отдельная мука.
 */

function Harness({ initial = 0, max }: { initial?: number; max?: number }) {
  const [n, setN] = useState(initial);
  return (
    <>
      <CountInput name="qty" value={n} onValue={setN} max={max} />
      <output data-testid="value">{n}</output>
    </>
  );
}

const field = () => screen.getByRole("spinbutton") as HTMLInputElement;

describe("CountInput", () => {
  it("ноль стирается, поле остаётся пустым", () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: "" } });
    expect(field().value).toBe("");
  });

  it("пустое поле снаружи читается как 0", () => {
    render(<Harness initial={3} />);
    fireEvent.change(field(), { target: { value: "" } });
    expect(screen.getByTestId("value").textContent).toBe("0");
  });

  it("можно набрать многозначное число по цифре", () => {
    render(<Harness />);
    // Именно так это и печатают: сначала «1», потом «12». Если бы обрезка по
    // максимуму срабатывала на каждое нажатие, «1» на пути к «12» превратилась
    // бы в максимум и дописать вторую цифру стало бы нельзя.
    fireEvent.change(field(), { target: { value: "1" } });
    fireEvent.change(field(), { target: { value: "12" } });
    expect(screen.getByTestId("value").textContent).toBe("12");
  });

  it("на выходе из поля пустое становится нулём", () => {
    render(<Harness initial={5} />);
    fireEvent.change(field(), { target: { value: "" } });
    fireEvent.blur(field());
    expect(field().value).toBe("0");
  });

  it("больше максимума ввести нельзя", () => {
    render(<Harness max={8} />);
    fireEvent.change(field(), { target: { value: "99" } });
    expect(screen.getByTestId("value").textContent).toBe("8");
  });

  it("буквы и минус в счётчик не попадают", () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: "-5" } });
    expect(screen.getByTestId("value").textContent).toBe("5");
  });

  it("ведущие нули убираются при выходе из поля", () => {
    render(<Harness />);
    fireEvent.change(field(), { target: { value: "007" } });
    fireEvent.blur(field());
    expect(field().value).toBe("7");
  });
});
