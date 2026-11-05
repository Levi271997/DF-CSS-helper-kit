import { toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export interface FilterDef {
  key: string
  label: string
  min: number
  max: number
  step: number
  unit: string
  neutral: number
}

export const FILTER_DEFS: FilterDef[] = [
  { key: "blur", label: "Blur", min: 0, max: 20, step: 0.5, unit: "px", neutral: 0 },
  { key: "brightness", label: "Brightness", min: 0, max: 200, step: 1, unit: "%", neutral: 100 },
  { key: "contrast", label: "Contrast", min: 0, max: 200, step: 1, unit: "%", neutral: 100 },
  { key: "saturate", label: "Saturate", min: 0, max: 300, step: 1, unit: "%", neutral: 100 },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
  { key: "sepia", label: "Sepia", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
  { key: "hue-rotate", label: "Hue rotate", min: 0, max: 360, step: 1, unit: "deg", neutral: 0 },
  { key: "invert", label: "Invert", min: 0, max: 100, step: 1, unit: "%", neutral: 0 },
  { key: "opacity", label: "Opacity", min: 0, max: 100, step: 1, unit: "%", neutral: 100 },
]

export interface FilterItem {
  key: string
  enabled: boolean
  value: number
}

export interface FiltersSettings {
  target: "filter" | "backdrop-filter"
  items: FilterItem[]
  dropShadow: { enabled: boolean; x: number; y: number; blur: number; color: Color }
}

export function filterValue(s: FiltersSettings): string {
  const parts = s.items
    .filter((i) => i.enabled)
    .map((i) => {
      const def = FILTER_DEFS.find((d) => d.key === i.key)
      return def ? `${def.key}(${i.value}${def.unit})` : null
    })
    .filter((p): p is string => p !== null)
  const ds = s.dropShadow
  if (s.target === "filter" && ds.enabled) {
    parts.push(`drop-shadow(${ds.x}px ${ds.y}px ${ds.blur}px ${toCss(ds.color)})`)
  }
  return parts.length ? parts.join(" ") : "none"
}

export function buildFilters(s: FiltersSettings): Decl[] {
  const v = filterValue(s)
  if (s.target === "backdrop-filter") {
    return [["backdrop-filter", v], ["-webkit-backdrop-filter", v]]
  }
  return [["filter", v]]
}
