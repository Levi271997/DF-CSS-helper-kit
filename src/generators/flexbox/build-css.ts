export const DIRECTIONS = ["row", "row-reverse", "column", "column-reverse"] as const
export const WRAPS = ["nowrap", "wrap", "wrap-reverse"] as const
export const JUSTIFY = ["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"] as const
export const ALIGN_ITEMS = ["stretch", "flex-start", "center", "flex-end", "baseline"] as const
export const ALIGN_CONTENT = ["normal", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly", "stretch"] as const
export const ALIGN_SELF = ["auto", "stretch", "flex-start", "center", "flex-end", "baseline"] as const

export interface FlexItem {
  id: string
  grow: number
  shrink: number
  /** Any CSS length, e.g. `auto`, `120px`, `30%`. */
  basis: string
  alignSelf: (typeof ALIGN_SELF)[number]
  order: number
}

export interface FlexSettings {
  direction: (typeof DIRECTIONS)[number]
  wrap: (typeof WRAPS)[number]
  justify: (typeof JUSTIFY)[number]
  alignItems: (typeof ALIGN_ITEMS)[number]
  alignContent: (typeof ALIGN_CONTENT)[number]
  rowGap: number
  columnGap: number
  parentClass: string
  itemPrefix: string
  items: FlexItem[]
}

export const newFlexItem = (id: string): FlexItem => ({ id, grow: 0, shrink: 1, basis: "auto", alignSelf: "auto", order: 0 })

const cls = (name: string, fallback: string) => name.trim().replace(/[^\w-]/g, "-") || fallback

/** Container declarations, leaving out values that match the browser default. */
export function containerDecls(s: FlexSettings): [string, string][] {
  const d: [string, string][] = [["display", "flex"]]
  if (s.direction !== "row") d.push(["flex-direction", s.direction])
  if (s.wrap !== "nowrap") d.push(["flex-wrap", s.wrap])
  if (s.justify !== "flex-start") d.push(["justify-content", s.justify])
  if (s.alignItems !== "stretch") d.push(["align-items", s.alignItems])
  // align-content only does anything when lines can wrap.
  if (s.wrap !== "nowrap" && s.alignContent !== "normal") d.push(["align-content", s.alignContent])
  if (s.rowGap || s.columnGap) d.push(["gap", s.rowGap === s.columnGap ? `${s.rowGap}px` : `${s.rowGap}px ${s.columnGap}px`])
  return d
}

export function itemDecls(it: FlexItem): [string, string][] {
  const d: [string, string][] = []
  const basis = it.basis.trim() || "auto"
  if (it.grow !== 0 || it.shrink !== 1 || basis !== "auto") d.push(["flex", `${it.grow} ${it.shrink} ${basis}`])
  if (it.alignSelf !== "auto") d.push(["align-self", it.alignSelf])
  if (it.order !== 0) d.push(["order", String(it.order)])
  return d
}

const rule = (selector: string, decls: [string, string][]) =>
  [`${selector} {`, ...decls.map(([p, v]) => `  ${p}: ${v};`), `}`].join("\n")

export function buildFlexCss(s: FlexSettings): string {
  const prefix = cls(s.itemPrefix, "child")
  const rules = [rule(`.${cls(s.parentClass, "parent")}`, containerDecls(s))]
  s.items.forEach((it, i) => {
    const decls = itemDecls(it)
    if (decls.length) rules.push(rule(`.${prefix}${i + 1}`, decls))
  })
  return rules.join("\n\n")
}

export function buildFlexHtml(s: FlexSettings): string {
  const prefix = cls(s.itemPrefix, "child")
  const children = s.items.map((_, i) => `  <div class="${prefix}${i + 1}">${i + 1}</div>`)
  return [`<div class="${cls(s.parentClass, "parent")}">`, ...children, `</div>`].join("\n")
}
