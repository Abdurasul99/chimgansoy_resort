/**
 * Exely search form host. The head loader (see [locale]/layout.tsx) embeds the
 * real Exely search widget into #be-search-form on page load. We render only
 * the container markup + the Exely-provided wrapper. There can be only ONE
 * #be-search-form per page.
 *
 * `main` switches to the translucent hero variant (for overlaying the hero);
 * default is the white bordered card for inner pages / below-hero placement.
 */
export function ExelySearchForm({ main = false, className = "" }: { main?: boolean; className?: string }) {
  return (
    <div className={className}>
      <div id="block-search" className={main ? "block-search block-search--main" : "block-search"}>
        <div id="be-search-form" className="be-container" suppressHydrationWarning>
          <a href="https://exely.com/" rel="nofollow" target="_blank">
            Hotel management software
          </a>
        </div>
      </div>
    </div>
  );
}
