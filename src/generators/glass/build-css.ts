import { toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export interface GlassSettings {
  tint: Color
  blur: number
  saturate: number
  radius: number
  borderWidth: number
  borderColor: Color
  shadow: boolean
  shadowY: number
  shadowBlur: number
  shadowColor: Color
}

export function buildGlass(s: GlassSettings): Decl[] {
  const backdrop = s.saturate === 100 ? `blur(${s.blur}px)` : `blur(${s.blur}px) saturate(${s.saturate}%)`
  const decls: Decl[] = [
    ["background", toCss(s.tint)],
    ["backdrop-filter", backdrop],
    ["-webkit-backdrop-filter", backdrop],
    ["border-radius", `${s.radius}px`],
  ]
  if (s.borderWidth > 0) decls.push(["border", `${s.borderWidth}px solid ${toCss(s.borderColor)}`])
  if (s.shadow) decls.push(["box-shadow", `0 ${s.shadowY}px ${s.shadowBlur}px ${toCss(s.shadowColor)}`])
  return decls
}
