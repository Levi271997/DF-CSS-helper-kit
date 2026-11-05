import { round } from "@/lib/color"
import type { Decl } from "@/lib/css"

export interface ClipPoint {
  id: string
  x: number
  y: number
}

export interface ClipSettings {
  points: ClipPoint[]
}

export const MIN_POINTS = 3

export function polygonValue(points: ClipPoint[]): string {
  return `polygon(${points.map((p) => `${round(p.x, 1)}% ${round(p.y, 1)}%`).join(", ")})`
}

export function buildClip(s: ClipSettings): Decl[] {
  return [["clip-path", polygonValue(s.points)]]
}

function distToSegmentSq(px: number, py: number, a: ClipPoint, b: ClipPoint): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / lenSq))
  const cx = a.x + dx * t
  const cy = a.y + dy * t
  return (px - cx) ** 2 + (py - cy) ** 2
}

/** Index after which a new point at (x, y) should be inserted: the closest edge. */
export function insertIndex(points: ClipPoint[], x: number, y: number): number {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < points.length; i++) {
    const d = distToSegmentSq(x, y, points[i], points[(i + 1) % points.length])
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best + 1
}

export const CLIP_PRESETS: { name: string; coords: [number, number][] }[] = [
  { name: "Triangle", coords: [[50, 0], [100, 100], [0, 100]] },
  { name: "Trapezoid", coords: [[20, 0], [80, 0], [100, 100], [0, 100]] },
  { name: "Parallelogram", coords: [[25, 0], [100, 0], [75, 100], [0, 100]] },
  { name: "Rhombus", coords: [[50, 0], [100, 50], [50, 100], [0, 50]] },
  { name: "Pentagon", coords: [[50, 0], [100, 38], [82, 100], [18, 100], [0, 38]] },
  { name: "Hexagon", coords: [[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]] },
  { name: "Chevron", coords: [[0, 0], [75, 0], [100, 50], [75, 100], [0, 100], [25, 50]] },
  { name: "Slant", coords: [[0, 0], [100, 0], [100, 85], [0, 100]] },
  { name: "Notch", coords: [[0, 0], [100, 0], [100, 100], [50, 85], [0, 100]] },
  { name: "Message", coords: [[0, 0], [100, 0], [100, 75], [75, 75], [75, 100], [50, 75], [0, 75]] },
]
