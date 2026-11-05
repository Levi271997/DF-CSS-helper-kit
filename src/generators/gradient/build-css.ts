import { toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export interface GradientStop {
  id: string
  color: Color
  pos: number
}

export interface GradientSettings {
  type: "linear" | "radial" | "conic"
  angle: number
  shape: "circle" | "ellipse"
  posX: number
  posY: number
  repeating: boolean
  stops: GradientStop[]
}

export const sortStops = (stops: GradientStop[]) => [...stops].sort((a, b) => a.pos - b.pos)

export function gradientValue(s: GradientSettings): string {
  const stops = sortStops(s.stops).map((st) => `${toCss(st.color)} ${st.pos}%`).join(", ")
  const prefix = s.repeating ? "repeating-" : ""
  const at = `at ${s.posX}% ${s.posY}%`
  switch (s.type) {
    case "linear":
      return `${prefix}linear-gradient(${s.angle}deg, ${stops})`
    case "radial":
      return `${prefix}radial-gradient(${s.shape} ${at}, ${stops})`
    case "conic":
      return `${prefix}conic-gradient(from ${s.angle}deg ${at}, ${stops})`
  }
}

export function buildGradient(s: GradientSettings): Decl[] {
  return [["background", gradientValue(s)]]
}

/** Position for a new stop: the middle of the largest gap between existing stops. */
export function nextStopPos(stops: GradientStop[]): number {
  const positions = [0, ...sortStops(stops).map((s) => s.pos), 100]
  let best = 50
  let bestGap = -1
  for (let i = 0; i < positions.length - 1; i++) {
    const gap = positions[i + 1] - positions[i]
    if (gap > bestGap) {
      bestGap = gap
      best = Math.round((positions[i] + positions[i + 1]) / 2)
    }
  }
  return best
}
