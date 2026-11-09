/** A color with alpha. `hex` is always normalized to `#rrggbb`; `a` is 0–1. */
export interface Color {
  hex: string
  a: number
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export const round = (v: number, digits = 2) => {
  const f = 10 ** digits
  return Math.round(v * f) / f
}

export function isValidHex(input: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.trim())
}

/** Normalizes `#abc`, `abc`, `#AABBCC` to `#aabbcc`. Invalid input becomes `#000000`. */
export function normalizeHex(input: string): string {
  if (!isValidHex(input)) return "#000000"
  let h = input.trim().replace(/^#/, "").toLowerCase()
  if (h.length === 3) h = h.split("").map((c) => c + c).join("")
  return `#${h}`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).slice(1)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export const color = (hex: string, a = 1): Color => ({ hex: normalizeHex(hex), a: clamp(a, 0, 1) })

/** CSS output: hex when fully opaque, `rgba()` otherwise. */
export function toCss(c: Color): string {
  const a = clamp(c.a, 0, 1)
  if (a >= 1) return normalizeHex(c.hex)
  const { r, g, b } = hexToRgb(c.hex)
  return `rgba(${r}, ${g}, ${b}, ${round(a, 2)})`
}

/** Hue 0–360, saturation and lightness 0–100. */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r, g, b } = hexToRgb(hex)
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0) : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
  h *= 60
  return { h, s: s * 100, l: l * 100 }
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = clamp(s, 0, 100) / 100
  const ln = clamp(l, 0, 100) / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sn * Math.min(ln, 1 - ln)
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0")
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`
}

/** WCAG relative luminance, 0 (black) to 1 (white). */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

/** WCAG contrast ratio between two colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
