/**
 * ContactForm: footer enquiry form. Uses useActionState + the submitContact
 * server action. We mock submitContact at the module level since RTL can't
 * invoke real server actions.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "../ContactForm";

const submitContactMock = vi.fn();
vi.mock("@/app/actions/contact", () => ({
  submitContact: (...args: unknown[]) => submitContactMock(...args),
}));

const dict = {
  name: "Имя",
  phone: "Телефон",
  message: "Сообщение",
  messagePh: "О чём вопрос?",
  errorMessage: "Напишите, о чём вопрос",
  send: "Отправить",
  sending: "Отправляем…",
  success: "Спасибо! Свяжемся скоро.",
  errorRequired: "Заполните обязательные поля",
};

describe("ContactForm", () => {
  beforeEach(() => {
    submitContactMock.mockReset();
    submitContactMock.mockResolvedValue({ ok: true });
  });

  it("renders all 3 fields with aria-label", () => {
    render(<ContactForm dict={dict} locale="ru" />);
    expect(screen.getByLabelText("Имя")).toBeInTheDocument();
    expect(screen.getByLabelText("Телефон")).toBeInTheDocument();
    expect(screen.getByLabelText("Сообщение")).toBeInTheDocument();
  });

  it("renders submit button with the send label", () => {
    render(<ContactForm dict={dict} locale="ru" />);
    expect(screen.getByRole("button", { name: /Отправить/ })).toBeInTheDocument();
  });

  it("name and phone inputs are required (HTML validation)", () => {
    render(<ContactForm dict={dict} locale="ru" />);
    expect(screen.getByLabelText("Имя")).toHaveAttribute("required");
    expect(screen.getByLabelText("Телефон")).toHaveAttribute("required");
    // Вопрос обязателен с 19.08.2026: оператор получал «Новый вопрос» без
    // единого слова о деле и звонил гостю выяснять, что тому нужно.
    expect(screen.getByLabelText("Сообщение")).toHaveAttribute("required");
  });

  it("requires separate public-offer and personal-data consents", () => {
    const { container } = render(<ContactForm dict={dict} locale="ru" />);
    const offer = container.querySelector<HTMLInputElement>('input[name="offerConsent"]');
    const privacy = container.querySelector<HTMLInputElement>('input[name="privacyConsent"]');

    expect(offer).not.toBeNull();
    expect(privacy).not.toBeNull();
    expect(offer?.required).toBe(true);
    expect(privacy?.required).toBe(true);
    expect(container.querySelector('a[href="/ru/legal/public-offer"]')).not.toBeNull();
    expect(container.querySelector('a[href="/ru/legal/privacy-policy"]')).not.toBeNull();
  });

  it("phone input uses type=tel for mobile keyboards", () => {
    render(<ContactForm dict={dict} locale="ru" />);
    expect(screen.getByLabelText("Телефон")).toHaveAttribute("type", "tel");
  });

  it("name input has autoComplete=name for browser fill", () => {
    render(<ContactForm dict={dict} locale="ru" />);
    expect(screen.getByLabelText("Имя")).toHaveAttribute("autocomplete", "name");
  });

  it("submits form data to submitContact action", async () => {
    const user = userEvent.setup();
    render(<ContactForm dict={dict} locale="ru" />);

    await user.type(screen.getByLabelText("Имя"), "Алексей");
    await user.type(screen.getByLabelText("Телефон"), "+998 90 123 45 67");
    await user.type(screen.getByLabelText("Сообщение"), "Хотел бы забронировать");
    await user.click(document.querySelector<HTMLInputElement>('input[name="offerConsent"]')!);
    await user.click(document.querySelector<HTMLInputElement>('input[name="privacyConsent"]')!);
    await user.click(screen.getByRole("button", { name: /Отправить/ }));

    await waitFor(() => expect(submitContactMock).toHaveBeenCalledTimes(1));
    const formData = submitContactMock.mock.calls[0][0] as FormData;
    expect(formData.get("name")).toBe("Алексей");
    expect(formData.get("phone")).toBe("+998 90 123 45 67");
    expect(formData.get("message")).toBe("Хотел бы забронировать");
  });

  it("includes hidden formType=inquiry for routing on the server side", async () => {
    const user = userEvent.setup();
    render(<ContactForm dict={dict} locale="ru" />);
    await user.type(screen.getByLabelText("Имя"), "X");
    await user.type(screen.getByLabelText("Телефон"), "Y");
    await user.type(screen.getByLabelText("Сообщение"), "Свободно ли шале?");
    await user.click(document.querySelector<HTMLInputElement>('input[name="offerConsent"]')!);
    await user.click(document.querySelector<HTMLInputElement>('input[name="privacyConsent"]')!);
    await user.click(screen.getByRole("button", { name: /Отправить/ }));

    await waitFor(() => expect(submitContactMock).toHaveBeenCalledTimes(1));
    const formData = submitContactMock.mock.calls[0][0] as FormData;
    expect(formData.get("formType")).toBe("inquiry");
  });

  it("shows success message after server action returns ok=true", async () => {
    const user = userEvent.setup();
    render(<ContactForm dict={dict} locale="ru" />);
    await user.type(screen.getByLabelText("Имя"), "X");
    await user.type(screen.getByLabelText("Телефон"), "Y");
    await user.type(screen.getByLabelText("Сообщение"), "Свободно ли шале?");
    await user.click(document.querySelector<HTMLInputElement>('input[name="offerConsent"]')!);
    await user.click(document.querySelector<HTMLInputElement>('input[name="privacyConsent"]')!);
    await user.click(screen.getByRole("button", { name: /Отправить/ }));

    await waitFor(() => {
      expect(screen.getByText(/Спасибо! Свяжемся скоро/)).toBeInTheDocument();
    });
  });

  it("shows error message when server action returns ok=false", async () => {
    submitContactMock.mockResolvedValue({ ok: false, error: "Bad request" });
    const user = userEvent.setup();
    render(<ContactForm dict={dict} locale="ru" />);
    await user.type(screen.getByLabelText("Имя"), "X");
    await user.type(screen.getByLabelText("Телефон"), "Y");
    await user.type(screen.getByLabelText("Сообщение"), "Свободно ли шале?");
    await user.click(document.querySelector<HTMLInputElement>('input[name="offerConsent"]')!);
    await user.click(document.querySelector<HTMLInputElement>('input[name="privacyConsent"]')!);
    await user.click(screen.getByRole("button", { name: /Отправить/ }));

    await waitFor(() => {
      expect(screen.getByText(/Bad request/)).toBeInTheDocument();
    });
  });
});
