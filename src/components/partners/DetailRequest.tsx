"use client";

import { PartnerRequestForm } from "@/components/sections/PartnerRequestForm";
import type { Locale } from "@/i18n/config";
import { useWorkbench } from "./Workbench";
import { summaryText } from "./rows";

/** Заявка с рабочей панели: к сообщению прикладывается сводка расчёта. */
export function DetailRequest({ locale }: { locale: Locale }) {
  const { state, result } = useWorkbench();
  return <PartnerRequestForm locale={locale} calcSummary={summaryText(state, result)} hideProgram />;
}
