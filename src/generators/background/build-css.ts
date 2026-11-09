import { toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export const SIZES = ["cover", "contain", "auto", "custom"] as const
export const REPEATS = ["no-repeat", "repeat", "repeat-x", "repeat-y", "space", "round"] as const
export const ATTACHMENTS = ["scroll", "fixed", "local"] as const

export interface BackgroundSettings {
  color: Color
  image: boolean
  imageUrl: string
  size: (typeof SIZES)[number]
  /** Width in % when size is "custom". */
  sizePercent: number
  posX: number
  posY: number
  repeat: (typeof REPEATS)[number]
  attachment: (typeof ATTACHMENTS)[number]
  overlay: boolean
  overlayColor: Color
}

const axis = (v: number, start: string, end: string) =>
  v === 0 ? start : v === 50 ? "center" : v === 100 ? end : `${v}%`

/** `0 0` → `left top`, `50 50` → `center`, otherwise percentages. */
export function positionValue(x: number, y: number): string {
  if (x === 50 && y === 50) return "center"
  return `${axis(x, "left", "right")} ${axis(y, "top", "bottom")}`
}

/** `imageUrl` overrides the setting, e.g. so the preview can show an uploaded image. */
export function buildBackground(s: BackgroundSettings, imageUrl = s.imageUrl): Decl[] {
  const decls: Decl[] = [["background-color", toCss(s.color)]]
  const url = imageUrl.trim()
  if (!s.image || !url) return decls

  const layers = [`url("${url.replace(/"/g, '\\"')}")`]
  if (s.overlay) {
    const c = toCss(s.overlayColor)
    layers.unshift(`linear-gradient(${c}, ${c})`)
  }
  decls.push(
    ["background-image", layers.join(", ")],
    ["background-size", s.size === "custom" ? `${s.sizePercent}%` : s.size],
    ["background-position", positionValue(s.posX, s.posY)],
    ["background-repeat", s.repeat],
  )
  if (s.attachment !== "scroll") decls.push(["background-attachment", s.attachment])
  return decls
}
