import { clamp, round } from "@/lib/color"

export type Bezier = [x1: number, y1: number, x2: number, y2: number]

export interface EasingSettings {
  curve: Bezier
  duration: number
  compare: "none" | "linear" | "ease"
  output: "property" | "variable" | "value"
  variableName: string
}

/** Y is allowed past 0–1 for overshoot; X must stay in 0–1 for a valid curve. */
export const Y_MIN = -1
export const Y_MAX = 2

export const EASING_PRESETS: { name: string; curve: Bezier }[] = [
  { name: "ease", curve: [0.25, 0.1, 0.25, 1] },
  { name: "linear", curve: [0, 0, 1, 1] },
  { name: "ease-in", curve: [0.42, 0, 1, 1] },
  { name: "ease-out", curve: [0, 0, 0.58, 1] },
  { name: "ease-in-out", curve: [0.42, 0, 0.58, 1] },
  { name: "In sine", curve: [0.12, 0, 0.39, 0] },
  { name: "Out sine", curve: [0.61, 1, 0.88, 1] },
  { name: "In-out sine", curve: [0.37, 0, 0.63, 1] },
  { name: "In cubic", curve: [0.32, 0, 0.67, 0] },
  { name: "Out cubic", curve: [0.33, 1, 0.68, 1] },
  { name: "In-out cubic", curve: [0.65, 0, 0.35, 1] },
  { name: "In expo", curve: [0.7, 0, 0.84, 0] },
  { name: "Out expo", curve: [0.16, 1, 0.3, 1] },
  { name: "In-out expo", curve: [0.87, 0, 0.13, 1] },
  { name: "In back", curve: [0.36, 0, 0.66, -0.56] },
  { name: "Out back", curve: [0.34, 1.56, 0.64, 1] },
  { name: "In-out back", curve: [0.68, -0.6, 0.32, 1.6] },
]

export const normalizeCurve = ([x1, y1, x2, y2]: Bezier): Bezier => [
  round(clamp(x1, 0, 1), 2),
  round(clamp(y1, Y_MIN, Y_MAX), 2),
  round(clamp(x2, 0, 1), 2),
  round(clamp(y2, Y_MIN, Y_MAX), 2),
]

export const bezierValue = (c: Bezier) => `cubic-bezier(${c.join(", ")})`

/** Reads `cubic-bezier(a, b, c, d)` or just `a, b, c, d`; returns null if it isn't four numbers. */
export function parseBezier(input: string): Bezier | null {
  const inner = input.trim().replace(/^cubic-bezier\s*\(/i, "").replace(/\)\s*;?$/, "")
  const nums = inner.split(/[\s,]+/).filter(Boolean).map(Number)
  if (nums.length !== 4 || nums.some((v) => !Number.isFinite(v))) return null
  return normalizeCurve(nums as Bezier)
}

const varName = (name: string) => name.trim().replace(/^-+/, "").replace(/[^\w-]/g, "-") || "ease-custom"

export function buildEasingCss(s: EasingSettings): string {
  const v = bezierValue(s.curve)
  if (s.output === "value") return v
  if (s.output === "variable") return `:root {\n  --${varName(s.variableName)}: ${v};\n}`
  return `transition-timing-function: ${v};\nanimation-timing-function: ${v};`
}
