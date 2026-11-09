import { clamp, contrastRatio, hexToHsl, hslToHex, normalizeHex, round } from "@/lib/color"

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

/** Typical lightness for each step; the base colour is pinned to whichever step it's closest to. */
const TARGET_L = [97, 94, 86, 77, 66, 55, 45, 36, 27, 19, 12]
const LIGHTEST = 97
const DARKEST = 10

export interface PaletteSettings {
  base: string
  name: string
  format: "hex" | "hsl"
  text: string
  background: string
}

export interface Shade {
  step: number
  hex: string
  isBase: boolean
}

export function anchorIndex(l: number): number {
  let best = 0
  TARGET_L.forEach((t, i) => {
    if (Math.abs(t - l) < Math.abs(TARGET_L[best] - l)) best = i
  })
  return best
}

/** 11 shades from very light to very dark, keeping the hue and passing exactly through the base colour. */
export function buildShades(base: string): Shade[] {
  const hex = normalizeHex(base)
  const { h, s, l } = hexToHsl(hex)
  const k = anchorIndex(l)
  const last = STEPS.length - 1
  return STEPS.map((step, i) => {
    if (i === k) return { step, hex, isBase: true }
    const lightness = i < k ? LIGHTEST + (l - LIGHTEST) * (i / k) : l + (DARKEST - l) * ((i - k) / (last - k))
    // Ease saturation off a little towards the extremes so tints don't look neon.
    const sat = clamp(s * (1 - 0.15 * (Math.abs(i - k) / last)), 0, 100)
    return { step, hex: hslToHex(h, sat, lightness), isBase: false }
  })
}

const varPrefix = (name: string) => name.trim().replace(/^-+/, "").replace(/[^\w-]/g, "-") || "brand"

export function formatColor(hex: string, format: PaletteSettings["format"]): string {
  if (format === "hex") return hex
  const { h, s, l } = hexToHsl(hex)
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`
}

export function buildPaletteCss(s: PaletteSettings): string {
  const p = varPrefix(s.name)
  const lines = buildShades(s.base).map((sh) => `  --${p}-${sh.step}: ${formatColor(sh.hex, s.format)};`)
  return [":root {", ...lines, "}"].join("\n")
}

export interface ContrastResult {
  ratio: number
  aaNormal: boolean
  aaLarge: boolean
  aaaNormal: boolean
  aaaLarge: boolean
}

export function checkContrast(text: string, background: string): ContrastResult {
  const ratio = round(contrastRatio(text, background), 2)
  return { ratio, aaNormal: ratio >= 4.5, aaLarge: ratio >= 3, aaaNormal: ratio >= 7, aaaLarge: ratio >= 4.5 }
}

/** Black or white, whichever reads better on the given background. */
export const bestTextOn = (bg: string) => (contrastRatio("#ffffff", bg) >= contrastRatio("#000000", bg) ? "#ffffff" : "#000000")
