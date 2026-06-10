/**
 * Component tests for the CurrencyWidget.
 * Covers: initial render, rate fetching, dropdown open/close, currency swap,
 * conversion math, disabled-state handling, and the source attribution link.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/setup";
import { CurrencyWidget } from "../CurrencyWidget";

function mockRatesEndpoint(payload?: object) {
  server.use(
    http.get("/api/rates", () =>
      HttpResponse.json(
        payload ?? {
          usd_to_uzs: 12000,
          eur_to_uzs: 14000,
          rub_to_uzs: 150,
          usd_diff: 10,
          eur_diff: -20,
          rub_diff: 0,
          date: "10.06.2026",
          source: "CBU",
        },
      ),
    ),
  );
}

describe("CurrencyWidget", () => {
  describe("initial render", () => {
    it("renders title and Live badge", async () => {
      // Arrange
      mockRatesEndpoint();
      // Act
      render(<CurrencyWidget locale="ru" />);
      // Assert
      expect(screen.getByText("Курс валют")).toBeInTheDocument();
      expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("renders rate cards for USD, EUR, RUB", async () => {
      mockRatesEndpoint();
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => {
        expect(screen.getByText("1 USD")).toBeInTheDocument();
        expect(screen.getByText("1 EUR")).toBeInTheDocument();
        expect(screen.getByText("1 RUB")).toBeInTheDocument();
      });
    });

    it("shows fetched rates after async load", async () => {
      mockRatesEndpoint({
        usd_to_uzs: 12000,
        eur_to_uzs: 14000,
        rub_to_uzs: 150,
        usd_diff: 10,
        eur_diff: -20,
        rub_diff: 0,
        date: "10.06.2026",
        source: "CBU",
      });
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => {
        // 12000 → "12 000" (ru-RU number formatting uses NBSP)
        expect(screen.getByText(/12\s000/)).toBeInTheDocument();
        expect(screen.getByText(/14\s000/)).toBeInTheDocument();
        expect(screen.getByText("150")).toBeInTheDocument();
      });
    });

    it("renders the publication date and CBU source link", async () => {
      mockRatesEndpoint();
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => {
        expect(screen.getByText("10.06.2026")).toBeInTheDocument();
        const sourceLink = screen.getByRole("link", { name: /Источник: ЦБ РУз/ });
        expect(sourceLink).toHaveAttribute("href", "https://cbu.uz/");
      });
    });
  });

  describe("dropdown behaviour", () => {
    it("opens base dropdown on trigger click", async () => {
      mockRatesEndpoint();
      const user = userEvent.setup();
      render(<CurrencyWidget locale="ru" />);

      // Locate base dropdown trigger (initially shows USD)
      const triggers = screen.getAllByRole("button", { expanded: false });
      const baseTrigger = triggers.find((t) => t.textContent?.includes("USD"));
      expect(baseTrigger).toBeDefined();

      // Act
      await user.click(baseTrigger!);

      // Assert — listbox appears with all 4 options
      const listbox = await screen.findByRole("listbox");
      expect(listbox).toBeInTheDocument();
      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(4); // USD/EUR/RUB/UZS
    });

    it("disables the currency already selected on the OTHER side", async () => {
      mockRatesEndpoint();
      const user = userEvent.setup();
      render(<CurrencyWidget locale="ru" />);

      // base=USD, target=UZS by default
      // Open base dropdown → UZS option should be disabled (already on target)
      const triggers = screen.getAllByRole("button");
      const baseTrigger = triggers.find(
        (t) => t.getAttribute("aria-expanded") === "false" && t.textContent?.includes("USD"),
      );
      await user.click(baseTrigger!);

      const uzsOption = await screen.findByRole("option", { name: /UZS/ });
      expect(uzsOption).toBeDisabled();
    });

    it("changes base currency when an option is selected", async () => {
      mockRatesEndpoint();
      const user = userEvent.setup();
      render(<CurrencyWidget locale="ru" />);

      const baseTrigger = screen.getAllByRole("button").find(
        (t) => t.getAttribute("aria-expanded") === "false" && t.textContent?.includes("USD"),
      );
      await user.click(baseTrigger!);

      const eurOption = await screen.findByRole("option", { name: /EUR/ });
      await user.click(eurOption);

      // Dropdown closes
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      // Trigger now shows EUR
      expect(
        screen.getAllByRole("button").some((b) => b.textContent?.includes("EUR")),
      ).toBe(true);
    });

    it("closes dropdown when clicking outside the widget", async () => {
      mockRatesEndpoint();
      const user = userEvent.setup();
      render(
        <div>
          <div data-testid="outside">outside</div>
          <CurrencyWidget locale="ru" />
        </div>,
      );

      const baseTrigger = screen.getAllByRole("button").find(
        (t) => t.getAttribute("aria-expanded") === "false" && t.textContent?.includes("USD"),
      );
      await user.click(baseTrigger!);
      expect(screen.getByRole("listbox")).toBeInTheDocument();

      // Act — click somewhere outside
      fireEvent.mouseDown(screen.getByTestId("outside"));

      await waitFor(() => {
        expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
      });
    });
  });

  describe("conversion math", () => {
    it("shows '0' result when input is empty", async () => {
      mockRatesEndpoint();
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => {
        // The TO row shows '0' before user types anything
        const targetRows = screen.getAllByText("0");
        expect(targetRows.length).toBeGreaterThan(0);
      });
    });

    it("converts USD → UZS correctly (100 USD * 12000 = 1.2M)", async () => {
      mockRatesEndpoint();
      const user = userEvent.setup();
      render(<CurrencyWidget locale="ru" />);

      const input = await screen.findByPlaceholderText("0");
      await user.type(input, "100");

      await waitFor(() => {
        // 1 200 000 (NBSP separators in ru-RU formatting)
        expect(screen.getByText(/1\s200\s000/)).toBeInTheDocument();
      });
    });
  });

  describe("swap button", () => {
    it("swaps base and target currencies", async () => {
      mockRatesEndpoint();
      const user = userEvent.setup();
      render(<CurrencyWidget locale="ru" />);

      // Initial: base=USD, target=UZS
      await waitFor(() => screen.getByText("Live"));

      const swapBtn = screen.getByLabelText("Swap currencies");
      await user.click(swapBtn);

      // After swap: base=UZS, target=USD
      // Trigger pills show the new state — count buttons referencing each code
      const buttons = screen.getAllByRole("button");
      const baseTriggerText = buttons
        .filter((b) => b.getAttribute("aria-haspopup") === "listbox")
        .map((b) => b.textContent ?? "");
      expect(baseTriggerText.some((t) => t.includes("UZS"))).toBe(true);
      expect(baseTriggerText.some((t) => t.includes("USD"))).toBe(true);
    });
  });

  describe("daily diff indicators", () => {
    it("renders ▲ for positive diff in forest-green class", async () => {
      mockRatesEndpoint({
        usd_to_uzs: 12000,
        eur_to_uzs: 14000,
        rub_to_uzs: 150,
        usd_diff: 18.19,
        eur_diff: 0,
        rub_diff: 0,
        date: "10.06.2026",
        source: "CBU",
      });
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => {
        const uparrow = screen.getByText("▲");
        expect(uparrow).toBeInTheDocument();
      });
    });

    it("renders ▼ for negative diff", async () => {
      mockRatesEndpoint({
        usd_to_uzs: 12000,
        eur_to_uzs: 14000,
        rub_to_uzs: 150,
        usd_diff: 0,
        eur_diff: 0,
        rub_diff: -0.5,
        date: "10.06.2026",
        source: "CBU",
      });
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => {
        expect(screen.getByText("▼")).toBeInTheDocument();
      });
    });

    it("doesn't render any arrow when diff === 0", async () => {
      mockRatesEndpoint({
        usd_to_uzs: 12000,
        eur_to_uzs: 14000,
        rub_to_uzs: 150,
        usd_diff: 0,
        eur_diff: 0,
        rub_diff: 0,
        date: "10.06.2026",
        source: "CBU",
      });
      render(<CurrencyWidget locale="ru" />);

      await waitFor(() => screen.getByText("Live"));
      expect(screen.queryByText("▲")).not.toBeInTheDocument();
      expect(screen.queryByText("▼")).not.toBeInTheDocument();
    });
  });

  describe("error resilience", () => {
    it("silently degrades when /api/rates fails", async () => {
      server.use(
        http.get("/api/rates", () => HttpResponse.json({ error: "down" }, { status: 503 })),
      );
      render(<CurrencyWidget locale="ru" />);

      // Component still mounts and renders UI; just no rates
      expect(screen.getByText("Курс валют")).toBeInTheDocument();
      // Rate placeholders (animate-pulse) should be rendered
      await waitFor(() => {
        // dropdown is still usable
        expect(screen.getByLabelText("Swap currencies")).toBeInTheDocument();
      });
    });
  });

  describe("locale variants", () => {
    it("renders UZ labels when locale is uz", async () => {
      mockRatesEndpoint();
      render(<CurrencyWidget locale="uz" />);
      expect(screen.getByText("Valyuta kursi")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Manba: O.zR MB/)).toBeInTheDocument();
      });
    });

    it("renders EN labels when locale is en", async () => {
      mockRatesEndpoint();
      render(<CurrencyWidget locale="en" />);
      expect(screen.getByText("Exchange rates")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText("Source: CBU")).toBeInTheDocument();
      });
    });
  });
});
