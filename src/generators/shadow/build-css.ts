import { color, toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export interface ShadowLayer {
  id: string
  enabled: boolean
  inset: boolean
  x: number
  y: number
  blur: number
  spread: number
  color: Color
}

export interface ShadowSettings {
  layers: ShadowLayer[]
  boxColor: Color
  radius: number
}

export function shadowValue(layers: ShadowLayer[]): string {
  const active = layers.filter((l) => l.enabled)
  if (active.length === 0) return "none"
  return active
    .map((l) => `${l.inset ? "inset " : ""}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${toCss(l.color)}`)
    .join(",\n    ")
}

export function buildShadow(s: ShadowSettings): Decl[] {
  return [["box-shadow", shadowValue(s.layers)]]
}

type PresetLayer = Omit<ShadowLayer, "id" | "enabled">
const layer = (x: number, y: number, blur: number, spread: number, a: number, inset = false): PresetLayer => ({
  x, y, blur, spread, inset, color: color("#0f172a", a),
})

export const SHADOW_PRESETS: { name: string; layers: PresetLayer[] }[] = [
  { name: "Subtle", layers: [layer(0, 1, 2, 0, 0.06), layer(0, 1, 3, 0, 0.1)] },
  { name: "Card", layers: [layer(0, 4, 6, -1, 0.1), layer(0, 2, 4, -2, 0.1)] },
  { name: "Raised", layers: [layer(0, 10, 15, -3, 0.1), layer(0, 4, 6, -4, 0.1)] },
  { name: "Floating", layers: [layer(0, 25, 50, -12, 0.25)] },
  { name: "Layered", layers: [layer(0, 1, 1, 0, 0.08), layer(0, 2, 2, 0, 0.08), layer(0, 4, 4, 0, 0.08), layer(0, 8, 8, 0, 0.08), layer(0, 16, 16, 0, 0.08)] },
  { name: "Outline", layers: [layer(0, 0, 0, 1, 0.12), layer(0, 2, 4, 0, 0.06)] },
  { name: "Pressed", layers: [layer(0, 2, 4, 0, 0.12, true)] },
]
