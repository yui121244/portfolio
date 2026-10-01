export const SITE_BASE = import.meta.env.BASE_URL

export function projectHref(id) {
  return `${SITE_BASE}projects/${id}/`
}

export function sitePath(pathname) {
  return pathname.startsWith(SITE_BASE)
    ? `/${pathname.slice(SITE_BASE.length)}`
    : pathname
}
