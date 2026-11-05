import type { Decl } from "@/lib/css"

export interface RadiusSettings {
  mode: "corners" | "blob"
  unit: "px" | "%"
  linked: boolean
  corners: { tl: number; tr: number; br: number; bl: number }
  /** Blob control points, each 0–100: where the curve meets each edge. */
  blob: { top: number; right: number; bottom: number; left: number }
}

export function cornersValue(s: RadiusSettings): string {
  const { tl, tr, br, bl } = s.corners
  const u = s.unit
  if (tl === tr && tr === br && br === bl) return `${tl}${u}`
  if (tl === br && tr === bl) return `${tl}${u} ${tr}${u}`
  return `${tl}${u} ${tr}${u} ${br}${u} ${bl}${u}`
}

/**
 * Organic blob: each edge is split at one point, so opposite radii on an edge
 * always sum to 100% and the shape stays smooth.
 */
export function blobValue(b: RadiusSettings["blob"]): string {
  const h = [b.top, 100 - b.top, 100 - b.bottom, b.bottom]
  const v = [b.left, b.right, 100 - b.right, 100 - b.left]
  return `${h.map((n) => `${n}%`).join(" ")} / ${v.map((n) => `${n}%`).join(" ")}`
}

export function buildRadius(s: RadiusSettings): Decl[] {
  return [["border-radius", s.mode === "blob" ? blobValue(s.blob) : cornersValue(s)]]
}

export function randomBlob(rand: () => number = Math.random): RadiusSettings["blob"] {
  const r = () => 20 + Math.round(rand() * 60)
  return { top: r(), right: r(), bottom: r(), left: r() }
}
