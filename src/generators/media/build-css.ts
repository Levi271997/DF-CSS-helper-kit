export interface Device {
  id: string
  name: string
  /** Largest screen width (px) this device covers. */
  max: number
}

export const BREAKPOINT_PRESETS = {
  elementor: { label: "Elementor (default)", devices: [["Mobile", 767], ["Tablet", 1024]] },
  "elementor-all": {
    label: "Elementor (all breakpoints)",
    devices: [["Mobile", 767], ["Mobile extra", 880], ["Tablet", 1024], ["Tablet extra", 1200], ["Laptop", 1366]],
  },
  bootstrap: { label: "Bootstrap 5", devices: [["xs", 575], ["sm", 767], ["md", 991], ["lg", 1199], ["xl", 1399]] },
  tailwind: { label: "Tailwind CSS", devices: [["base", 639], ["sm", 767], ["md", 1023], ["lg", 1279], ["xl", 1535]] },
} as const
export type PresetKey = keyof typeof BREAKPOINT_PRESETS

export const EXTRAS = {
  reducedMotion: { label: "Reduced motion", query: "(prefers-reduced-motion: reduce)" },
  dark: { label: "Dark mode", query: "(prefers-color-scheme: dark)" },
  hover: { label: "Devices that can hover", query: "(hover: hover) and (pointer: fine)" },
  landscape: { label: "Landscape orientation", query: "(orientation: landscape)" },
  print: { label: "Print", query: "print" },
} as const
export type ExtraKey = keyof typeof EXTRAS

export interface MediaSettings {
  preset: PresetKey | "custom"
  devices: Device[]
  /** Name for the screens above the largest breakpoint. */
  topName: string
  approach: "desktop-first" | "mobile-first"
  /** Each block targets only its own range, instead of cascading. */
  exact: boolean
  syntax: "classic" | "range"
  selector: string
  extras: Record<ExtraKey, boolean>
}

export interface Block {
  label: string
  /** null = base styles, no media query. */
  query: string | null
  min: number | null
  max: number | null
}

const sorted = (devices: Device[]) => [...devices].filter((d) => d.max > 0).sort((a, b) => a.max - b.max)

function condition(min: number | null, max: number | null, syntax: MediaSettings["syntax"]): string {
  if (syntax === "range") {
    if (min !== null && max !== null) return `(${min}px <= width <= ${max}px)`
    if (min !== null) return `(width >= ${min}px)`
    return `(width <= ${max}px)`
  }
  const parts = []
  if (min !== null) parts.push(`(min-width: ${min}px)`)
  if (max !== null) parts.push(`(max-width: ${max}px)`)
  return parts.join(" and ")
}

/** Screen ranges for each device, smallest first: [min, max], with null for open ends. */
export function ranges(s: MediaSettings): { name: string; min: number | null; max: number | null }[] {
  const ds = sorted(s.devices)
  const list = ds.map((d, i) => ({ name: d.name || `Breakpoint ${i + 1}`, min: i === 0 ? null : ds[i - 1].max + 1, max: d.max as number | null }))
  list.push({ name: s.topName || "Desktop", min: ds.length ? ds[ds.length - 1].max + 1 : null, max: null })
  return list
}

export function buildBlocks(s: MediaSettings): Block[] {
  const r = ranges(s)
  const range = (x: (typeof r)[number]) => (x.min !== null ? `${x.min}px` : "0") + (x.max !== null ? `–${x.max}px` : " and up")
  if (s.approach === "desktop-first") {
    const [top, ...rest] = [...r].reverse()
    return [
      { label: `${top.name} (base styles)`, query: null, min: top.min, max: null },
      ...rest.map((x) => {
        const min = s.exact ? x.min : null
        return {
          label: s.exact ? `${x.name}: ${range(x)}` : `${x.name}: ${x.max}px and below`,
          query: condition(min, x.max, s.syntax),
          min,
          max: x.max,
        }
      }),
    ]
  }
  const [bottom, ...rest] = r
  return [
    { label: `${bottom.name} (base styles)`, query: null, min: null, max: bottom.max },
    ...rest.map((x) => {
      const max = s.exact ? x.max : null
      return {
        label: s.exact ? `${x.name}: ${range(x)}` : `${x.name}: ${x.min}px and up`,
        query: condition(x.min, max, s.syntax),
        min: x.min,
        max,
      }
    }),
  ]
}

/** Whether a block's styles apply at a given screen width. */
export function appliesAt(b: Block, width: number): boolean {
  if (b.query === null) return true
  return (b.min === null || width >= b.min) && (b.max === null || width <= b.max)
}

const body = (selector: string, indent: string) => {
  const sel = selector.trim()
  return sel ? `${indent}${sel} {\n${indent}  \n${indent}}` : `${indent}/* your styles */`
}

export function buildMediaCss(s: MediaSettings): string {
  const out = buildBlocks(s).map((b) =>
    b.query === null
      ? `/* ${b.label} */\n${body(s.selector, "")}`
      : `/* ${b.label} */\n@media ${b.query} {\n${body(s.selector, "  ")}\n}`,
  )
  for (const key of Object.keys(EXTRAS) as ExtraKey[]) {
    if (s.extras[key]) out.push(`/* ${EXTRAS[key].label} */\n@media ${EXTRAS[key].query} {\n${body(s.selector, "  ")}\n}`)
  }
  return out.join("\n\n")
}
