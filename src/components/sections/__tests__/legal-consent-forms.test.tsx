import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DynamicRequestForm } from "../DynamicRequestForm";
import { StayRequestForm } from "../StayRequestForm";

vi.mock("@/app/actions/stay-request", () => ({
  submitStayRequest: vi.fn(async () => ({})),
}));

vi.mock("@/app/actions/service-request", () => ({
  submitServiceRequest: vi.fn(async () => ({})),
}));

function expectCoreConsents(container: HTMLElement, locale: "ru" | "uz" | "en") {
  const offer = container.querySelector<HTMLInputElement>('input[name="offerConsent"]');
  const privacy = container.querySelector<HTMLInputElement>('input[name="privacyConsent"]');

  expect(offer).not.toBeNull();
  expect(privacy).not.toBeNull();
  expect(offer?.required).toBe(true);
  expect(privacy?.required).toBe(true);
  expect(container.querySelector(`a[href="/${locale}/legal/public-offer"]`)).not.toBeNull();
  expect(container.querySelector(`a[href="/${locale}/legal/privacy-policy"]`)).not.toBeNull();
}

describe("stay request legal consents", () => {
  for (const room of ["glamping", "cottage"] as const) {
    it(`${room}: requires offer, privacy and cancellation consents`, () => {
      const { container } = render(<StayRequestForm locale="ru" room={room} maxGuests={8} />);

      expectCoreConsents(container, "ru");
      const refund = container.querySelector<HTMLInputElement>('input[name="refundConsent"]');
      expect(refund).not.toBeNull();
      expect(refund?.required).toBe(true);
      expect(container.querySelector('a[href="/ru/legal/payment-refund"]')).not.toBeNull();
    });
  }
});

describe("dynamic service request legal consents", () => {
  it("requires offer and privacy consent", () => {
    const { container } = render(
      <DynamicRequestForm locale="uz" slug="test-service" title="Test" fields={[]} />,
    );

    expectCoreConsents(container, "uz");
  });
});
