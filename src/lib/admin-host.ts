/**
 * Which hostname serves the admin panel.
 *
 * The panel lives at /admin inside the same Next.js app as the public site, so
 * adding a second domain to the Vercel project makes BOTH the site and the
 * panel answer on both hostnames. Left alone that means the whole resort site
 * is duplicated on a second domain — the classic way to split your own search
 * ranking between two addresses — and the panel stays reachable at the old
 * address anyway, so moving it achieves nothing.
 *
 * So the split is done here, by host, rather than by deploying twice.
 *
 * WHY AN ENV VAR AND NOT A CONSTANT
 * ---------------------------------
 * Switching this on is a two-sided change: the code has to know the new host,
 * and DNS has to actually point at us. If the constant shipped in a deploy, the
 * window between "deployed" and "DNS propagated" is a window with no working
 * admin panel at all. With a variable, the code goes out inert, and the switch
 * is flipped in Vercel once the new address is confirmed working — no deploy,
 * and reversible in a minute if something is wrong.
 */

/** Configured admin hostname, lower-cased and without a port. */
export function adminHost(): string | null {
  const raw = process.env.ADMIN_HOST?.trim().toLowerCase();
  if (!raw) return null;
  return raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

/** The host of this request, comparable with adminHost(). */
export function requestHost(header: string | null): string {
  return (header ?? "").toLowerCase().replace(/:\d+$/, "");
}

/**
 * Is this request on the host that serves the panel?
 *
 * When ADMIN_HOST is unset every host is treated as the admin host — that is
 * today's behaviour, and it is what keeps the panel working before the move.
 */
export function isAdminHost(header: string | null): boolean {
  const configured = adminHost();
  if (!configured) return true;
  const host = requestHost(header);
  // A bare www on the admin domain should work too; nobody types it, but
  // somebody's browser will add it.
  return host === configured || host === `www.${configured}`;
}
