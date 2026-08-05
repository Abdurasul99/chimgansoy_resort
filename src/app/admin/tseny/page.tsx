import { effectiveFields } from "@/lib/price-catalog";
import { readForEdit } from "@/lib/site-overrides";
import { AdminHeading } from "../AdminShell";
import { PriceForm } from "./PriceForm";

/**
 * Price editing.
 *
 * Reads uncached — an operator must never edit a copy that is up to five
 * minutes old, or their own previous save can be silently overwritten by the
 * form they are looking at.
 */
export default async function PricesPage() {
  const overrides = await readForEdit();
  const storeReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

  return (
    <>
      <AdminHeading
        title="Цены"
        hint="Тарифы дневного отдыха, бассейна, тюбинга и аренды. Меняются здесь и попадают на сайт сразу после сохранения."
      />
      <PriceForm fields={effectiveFields(overrides)} storeReady={storeReady} />
    </>
  );
}
