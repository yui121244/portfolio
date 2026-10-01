export const SCROLL_TO_PAGE_POSITION_EVENT = 'portfolio:scroll-to-page-position'

let pageScroller = null

export function registerPageScroller(scroller) {
  pageScroller = scroller
  return () => {
    if (pageScroller === scroller) pageScroller = null
  }
}

export function scrollToPagePosition(top, options = {}) {
  const safeTop = Math.max(0, Number(top) || 0)
  window.dispatchEvent(new CustomEvent(SCROLL_TO_PAGE_POSITION_EVENT, {
    detail: { top: safeTop },
  }))
  if (pageScroller) {
    pageScroller(safeTop, options)
    return
  }
  window.scrollTo({ top: safeTop, behavior: 'smooth' })
  window.setTimeout(() => options.onComplete?.(), 820)
}
