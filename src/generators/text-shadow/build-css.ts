import { color, toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export interface TextShadowLayer {
  id: string
  enabled: boolean
  x: number
  y: number
  blur: number
  color: Color
}

export interface TextShadowSettings {
  layers: TextShadowLayer[]
  text: string
  fontSize: number
  fontWeight: number
  textColor: Color
  background: Color
}

export function textShadowValue(layers: TextShadowLayer[]): string {
  const active = layers.filter((l) => l.enabled)
  if (active.length === 0) return "none"
  return active.map((l) => `${l.x}px ${l.y}px ${l.blur}px ${toCss(l.color)}`).join(",\n    ")
}

export function buildTextShadow(s: TextShadowSettings): Decl[] {
  return [["text-shadow", textShadowValue(s.layers)]]
}

export type PresetLayer = Omit<TextShadowLayer, "id" | "enabled">

export interface TextShadowPreset {
  name: string
  layers: PresetLayer[]
  /** Preview colours that suit the effect; applied along with the layers. */
  textColor: Color
  background: Color
}

const l = (x: number, y: number, blur: number, hex: string, a = 1): PresetLayer => ({ x, y, blur, color: color(hex, a) })

/** One hard-edged layer per pixel, so the shadow reads as a solid diagonal block. */
export function longShadow(length: number, hex: string, a = 1): PresetLayer[] {
  return Array.from({ length }, (_, i) => l(i + 1, i + 1, 0, hex, a))
}

const navy = "#1e1242"
const orange = "#f8a02d"

export const TEXT_SHADOW_PRESETS: TextShadowPreset[] = [
  { name: "Soft", layers: [l(0, 2, 4, navy, 0.25)], textColor: color(navy), background: color("#f1f5f9") },
  { name: "Hard", layers: [l(3, 3, 0, navy, 0.35)], textColor: color(orange), background: color("#ffffff") },
  {
    name: "Glow",
    layers: [l(0, 0, 8, orange, 0.8), l(0, 0, 24, orange, 0.5)],
    textColor: color("#ffffff"),
    background: color(navy),
  },
  {
    name: "Neon",
    layers: [l(0, 0, 4, "#ffffff"), l(0, 0, 10, "#ff2fd6"), l(0, 0, 22, "#ff2fd6"), l(0, 0, 44, "#ff2fd6"), l(0, 0, 80, "#ff2fd6")],
    textColor: color("#ffffff"),
    background: color("#0b0716"),
  },
  {
    name: "Outline",
    layers: [l(-2, -2, 0, navy), l(2, -2, 0, navy), l(-2, 2, 0, navy), l(2, 2, 0, navy)],
    textColor: color("#ffffff"),
    background: color("#f1f5f9"),
  },
  { name: "Retro 3D", layers: [l(3, 3, 0, orange), l(6, 6, 0, navy)], textColor: color("#ffffff"), background: color("#ffe7c4") },
  { name: "Long shadow", layers: longShadow(24, navy, 0.25), textColor: color(orange), background: color("#fdf3e6") },
  {
    name: "Letterpress",
    layers: [l(0, 1, 0, "#ffffff", 0.6)],
    textColor: color("#64748b"),
    background: color("#cbd5e1"),
  },
]
