/**
 * Full URL to a client-side route (uses Vite `base`, e.g. `/dixit/` on GitHub Pages).
 * Use for copy/share links — not needed for React Router `navigate()` or `<Link to="...">`.
 */
export function absoluteAppUrl(routePath: string): string {
  const path = routePath.replace(/^\/+/, '')
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`
  return `${window.location.origin}${base}${path}`
}
