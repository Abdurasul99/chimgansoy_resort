import type { Locale } from "@/i18n/config";

type ConsentRequirements = {
  tubingRules?: boolean;
  refund?: boolean;
};

const ERRORS: Record<
  Locale,
  { offer: string; privacy: string; tubingRules: string; refund: string }
> = {
  ru: {
    offer: "Подтвердите согласие с публичной офертой",
    privacy: "Подтвердите согласие на обработку персональных данных",
    tubingRules: "Подтвердите согласие с правилами тюбинговой горки",
    refund: "Подтвердите согласие с правилами отмены и возврата",
  },
  uz: {
    offer: "Ommaviy oferta shartlariga roziligingizni tasdiqlang",
    privacy: "Shaxsiy ma’lumotlarni qayta ishlashga roziligingizni tasdiqlang",
    tubingRules: "Tubing gorkasi qoidalariga roziligingizni tasdiqlang",
    refund: "Bekor qilish va qaytarish qoidalariga roziligingizni tasdiqlang",
  },
  en: {
    offer: "Please confirm that you accept the Public Offer",
    privacy: "Please consent to the processing of your personal data",
    tubingRules: "Please confirm that you accept the Tubing Hill Rules",
    refund: "Please confirm that you accept the cancellation and refund rules",
  },
};

const checked = (formData: FormData, name: string) => formData.get(name) === "on";

/**
 * Server-side counterpart to the required checkboxes in LegalConsentFields.
 * HTML validation improves the form experience, but it can be removed in the
 * browser, so every action rejects a request that lacks explicit consent.
 */
export function validateLegalConsents(
  formData: FormData,
  locale: Locale,
  requirements: ConsentRequirements = {},
): string | null {
  const error = ERRORS[locale];

  if (requirements.tubingRules && !checked(formData, "rulesConsent")) return error.tubingRules;
  if (!checked(formData, "offerConsent")) return error.offer;
  if (requirements.refund && !checked(formData, "refundConsent")) return error.refund;
  if (!checked(formData, "privacyConsent")) return error.privacy;

  return null;
}
