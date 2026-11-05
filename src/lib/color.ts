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
