import { toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export const BORDER_STYLES = ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset", "none"] as const
export type BorderStyle = (typeof BORDER_STYLES)[number]

export interface Side {
  width: number
  style: BorderStyle
  color: Color
}

export const SIDES = ["top", "right", "bottom", "left"] as const
export type SideName = (typeof SIDES)[number]

export interface BorderSettings {
  linked: boolean
  sides: Record<SideName, Side>
  outline: boolean
  outlineWidth: number
  outlineStyle: Exclude<BorderStyle, "none">
  outlineColor: Color
  outlineOffset: number
  /** Preview only. */
  radius: number
  fill: Color
}

const sideValue = (s: Side) => (s.style === "none" || s.width === 0 ? "none" : `${s.width}px ${s.style} ${toCss(s.color)}`)

/** One `border` shorthand when every side matches, otherwise a shorthand per side. */
export function buildBorder(s: BorderSettings): Decl[] {
  const values = SIDES.map((name) => sideValue(s.sides[name]))
  const decls: Decl[] = values.every((v) => v === values[0])
    ? [["border", values[0]]]
    : SIDES.map((name, i) => [`border-${name}`, values[i]] as Decl)
  if (s.outline) {
    decls.push(["outline", `${s.outlineWidth}px ${s.outlineStyle} ${toCss(s.outlineColor)}`])
    if (s.outlineOffset) decls.push(["outline-offset", `${s.outlineOffset}px`])
  }
  return decls
}
