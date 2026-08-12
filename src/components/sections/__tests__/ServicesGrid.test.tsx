/**
 * ServicesGrid: filter pills + service cards. Tests the filter button behavior
 * and that cards reflect the active filter.
 *
 * Карточки приходят пропом: сетка больше не читает список услуг из кода, иначе
 * услуга, созданная оператором в панели, на сайте не появлялась бы — ровно это
 * и происходило. Здесь список задан прямо в тесте, включая «свою» услугу.
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ServicesGrid } from "../ServicesGrid";
import { serviceCategories } from "@/content/services";
import type { ServiceCard } from "@/lib/service-cards";

const card = (slug: string, category: ServiceCard["category"], extra: Partial<ServiceCard> = {}): ServiceCard => ({
  slug,
  href: `/services/${slug}`,
  title: slug,
  shortDescription: `описание ${slug}`,
  category,
  frame: { src: `/images/${slug}.jpg` },
  alt: slug,
  ...extra,
});

const ITEMS: ServiceCard[] = [
  card("kitchen", "food"),
  card("picnic", "relax"),
  card("walks", "activity"),
  // Услуга оператора выглядит для сетки ровно так же, как услуга из кода.
  card("sauna", "relax", { priceNote: "от 600 000 сум" }),
];

describe("ServicesGrid", () => {
  it("renders one filter button per category when showFilters=true", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} />);
    const filterButtons = screen.getAllByRole("button");
    expect(filterButtons.length).toBeGreaterThanOrEqual(serviceCategories.length);
  });

  it("first filter button (all) is active by default with dark bg", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} />);
    const buttons = screen.getAllByRole("button");
    const active = buttons.find((b) => b.className.includes("bg-[var(--mountain)]"));
    expect(active).toBeDefined();
  });

  it("does NOT render filter pills when showFilters=false", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} showFilters={false} />);
    const buttons = screen.queryAllByRole("button");
    expect(buttons).toHaveLength(0);
  });

  it("clicking a category filter changes the active pill", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} />);
    const buttons = screen.getAllByRole("button");
    const inactive = buttons.find((b) => !b.className.includes("bg-[var(--mountain)]"));
    if (!inactive) return;

    fireEvent.click(inactive);
    expect(inactive.className).toContain("bg-[var(--mountain)]");
  });

  it("limit prop caps the number of rendered cards", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} limit={2} showFilters={false} />);
    const detailLinks = screen.queryAllByRole("link");
    expect(detailLinks.length).toBeLessThanOrEqual(2);
  });

  it("услуга оператора рисуется наравне с услугами из кода", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} showFilters={false} />);
    expect(screen.getByText("sauna")).toBeInTheDocument();
    expect(screen.getByText("от 600 000 сум")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(ITEMS.length);
  });

  it("фильтр по разделу учитывает и свои услуги", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} />);
    const relax = screen.getAllByRole("button").find((b) => b.textContent?.includes("Отдых"));
    fireEvent.click(relax!);
    expect(screen.getByText("sauna")).toBeInTheDocument();
    expect(screen.queryByText("kitchen")).not.toBeInTheDocument();
  });

  it("подмножество по слагам — для блока связанных услуг", () => {
    render(<ServicesGrid locale="ru" items={ITEMS} slugs={["sauna"]} showFilters={false} />);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByText("sauna")).toBeInTheDocument();
  });
});
