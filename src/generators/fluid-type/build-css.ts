import { clamp, round } from "@/lib/color"

export const RATIOS = [
  { value: "1.067", label: "1.067 – Minor second" },
  { value: "1.125", label: "1.125 – Major second" },
  { value: "1.2", label: "1.2 – Minor third" },
  { value: "1.25", label: "1.25 – Major third" },
  { value: "1.333", label: "1.333 – Perfect fourth" },
  { value: "1.414", label: "1.414 – Augmented fourth" },
  { value: "1.5", label: "1.5 – Perfect fifth" },
  { value: "1.618", label: "1.618 – Golden ratio" },
] as const

export type Ratio = (typeof RATIOS)[number]["value"]

export interface FluidSettings {
  mode: "single" | "scale"
  unit: "rem" | "px"
  /** Root font size in px, used to convert to rem. */
  root: number
  /** Viewport widths (px) where the size stops growing / shrinking. */
  minVw: number
  maxVw: number
  /** Single mode: font size (px) at minVw and at maxVw. */
  minSize: number
  maxSize: number
  /** Scale mode: base step sizes and ratios at each end. */
  baseMin: number
  baseMax: number
  ratioMin: Ratio
  ratioMax: Ratio
  stepsDown: number
  stepsUp: number
  prefix: string
  /** Preview only: simulated viewport width. */
  previewVw: number
  text: string
}

/** Trims to 4 decimals and drops trailing zeros: 1.1250 → 1.125, 2.0 → 2. */
export const num = (v: number) => String(round(v, 4))

/** Size (px) a fluid value resolves to at a given viewport width. */
export function sizeAt(minSize: number, maxSize: number, minVw: number, maxVw: number, vw: number): number {
  if (maxVw <= minVw) return minSize
  const slope = (maxSize - minSize) / (maxVw - minVw)
  const lo = Math.min(minSize, maxSize)
  const hi = Math.max(minSize, maxSize)
  return clamp(minSize + slope * (vw - minVw), lo, hi)
}

/** `clamp(min, intercept + slope·vw, max)` that hits minSize at minVw and maxSize at maxVw. */
export function clampValue(minSize: number, maxSize: number, minVw: number, maxVw: number, unit: FluidSettings["unit"], root: number): string {
  const u = (px: number) => (unit === "rem" ? `${num(px / root)}rem` : `${num(px)}px`)
  if (maxVw <= minVw || minSize === maxSize) return u(minSize)
  const slope = (maxSize - minSize) / (maxVw - minVw)
  const intercept = minSize - slope * minVw
  const vw = `${num(Math.abs(slope) * 100)}vw`
  const preferred =
    Math.abs(intercept) < 1e-6 ? (slope < 0 ? `-${vw}` : vw) : `${u(intercept)} ${slope < 0 ? "-" : "+"} ${vw}`
  return `clamp(${u(Math.min(minSize, maxSize))}, ${preferred}, ${u(Math.max(minSize, maxSize))})`
}

export interface ScaleStep {
  step: number
  name: string
  min: number
  max: number
}

const cls = (name: string, fallback: string) => name.trim().replace(/[^\w-]/g, "-") || fallback

export function scaleSteps(s: FluidSettings): ScaleStep[] {
  const prefix = cls(s.prefix, "step")
  const steps: ScaleStep[] = []
  for (let n = s.stepsUp; n >= -s.stepsDown; n--) {
    steps.push({
      step: n,
      name: `--${prefix}-${n}`,
      min: s.baseMin * Number(s.ratioMin) ** n,
      max: s.baseMax * Number(s.ratioMax) ** n,
    })
  }
  return steps
}

export function buildFluidCss(s: FluidSettings): string {
  if (s.mode === "single") {
    return `font-size: ${clampValue(s.minSize, s.maxSize, s.minVw, s.maxVw, s.unit, s.root)};`
  }
  const lines = scaleSteps(s).map((st) => `  ${st.name}: ${clampValue(st.min, st.max, s.minVw, s.maxVw, s.unit, s.root)};`)
  return [`/* Fluid type scale: ${s.minVw}px → ${s.maxVw}px */`, `:root {`, ...lines, `}`].join("\n")
}
