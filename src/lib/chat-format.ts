/**
 * Markdown the model was told not to emit, flattened into plain lines.
 *
 * The prompt forbids tables, headings and bold (see ФОРМАТ in ai-context.ts),
 * but a 20B model asked for two prices in a row reaches for a pipe table
 * anyway, and the guest then reads "|---|---------|" in the chat bubble
 * (operator, 2026-08-05). Instructions reduce the rate; they do not make it
 * zero, so the renderer has to cope on its own.
 *
 * Flattening rather than rendering: a real table cannot fit a ~40-character
 * bubble on a phone at any font size, so turning "| Chalet | 3 000 000 sum |"
 * into "Chalet — 3 000 000 sum" is not a fallback, it is the better layout.
 */
export function flattenMarkdown(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line)) // separator row
    .map((line) => {
      const t = line.trim();
      if (t.startsWith("|")) {
        const cells = t.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length === 0) return "";
        // A single-column row is a heading, not a row of data.
        return cells.length === 1 ? cells[0] : `• ${cells.join(" — ")}`;
      }
      return line
        .replace(/^\s*#{1,6}\s+/, "") // headings
        .replace(/^(\s*)[-*+]\s+/, "$1• "); // bullets the panel does not style
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

