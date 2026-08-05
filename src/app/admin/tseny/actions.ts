"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { fields } from "@/lib/price-catalog";
import { readForEdit, saveOverrides } from "@/lib/site-overrides";

export type PriceFormState = { ok?: boolean; error?: string; saved?: number };

/**
 * Saves the price form.
 *
 * The whole form posts at once rather than a field at a time: the operator
 * adjusts a season's tariff in one sitting, and a save per input would be a
 * dozen writes and a dozen chances to half-finish.
 *
 * Only DIFFERENCES from the code value are stored. Typing the same number the
 * site already shows removes the override instead of freezing that number in
 * the store — otherwise a price corrected in a future deploy would be masked by
 * an operator edit that never actually changed anything.
 */
export async function savePrices(_prev: PriceFormState, form: FormData): Promise<PriceFormState> {
  // The layout gates the page; this gates the action. A server action is a
  // public endpoint — it is reachable without ever rendering the page.
  await requireAdmin();

  const current = await readForEdit();
  const next = { ...current, prices: { ...current.prices } };

  let changed = 0;
  const rejected: string[] = [];

  for (const field of fields()) {
    const raw = form.get(field.key);
    if (raw === null) continue;

    // Operators type "150 000" and "150000" and sometimes "150 000 сум".
    const cleaned = String(raw).replace(/[^\d]/g, "");
    if (cleaned === "") {
      // An emptied input means "back to the site's own price".
      if (field.key in next.prices) {
        delete next.prices[field.key];
        changed++;
      }
      continue;
    }

    const value = Number(cleaned);
    if (!Number.isFinite(value) || value < 0 || value > 1_000_000_000) {
      rejected.push(field.label);
      continue;
    }

    if (value === field.value) {
      // Same as the code: drop the override rather than pinning the number.
      if (field.key in next.prices) {
        delete next.prices[field.key];
        changed++;
      }
      continue;
    }

    if (next.prices[field.key] !== value) {
      next.prices[field.key] = value;
      changed++;
    }
  }

  if (rejected.length) {
    return { error: `Не похоже на цену: ${rejected.join(", ")}. Изменения не сохранены.` };
  }

  if (changed === 0) return { ok: true, saved: 0 };

  const res = await saveOverrides(next);
  if (!res.ok) return { error: res.error };

  return { ok: true, saved: changed };
}
