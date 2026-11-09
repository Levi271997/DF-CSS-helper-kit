import { toCss, type Color } from "@/lib/color"

export const DIRECTIONS = ["up", "down", "left", "right", "up-left", "up-right", "down-left", "down-right"] as const
export type Direction = (typeof DIRECTIONS)[number]

export const ARROW_SIDES = ["bottom", "top", "left", "right"] as const
export type ArrowSide = (typeof ARROW_SIDES)[number]

export interface ShapesSettings {
  mode: "triangle" | "bubble"
  className: string
  // Triangle
  direction: Direction
  method: "border" | "clip-path"
  width: number
  height: number
  color: Color
  // Speech bubble / tooltip
  side: ArrowSide
  /** Where along its side the arrow sits, 0–100%. */
  position: number
  arrowSize: number
  background: Color
  textColor: Color
  radius: number
  padding: number
  text: string
}

type Decls = [string, string][]

const cls = (name: string, fallback: string) => name.trim().replace(/^\./, "").replace(/[^\w-]/g, "-") || fallback

const rule = (selector: string, decls: Decls) => [`${selector} {`, ...decls.map(([p, v]) => `  ${p}: ${v};`), `}`].join("\n")

/** Classic zero-size box where one coloured border forms the triangle. */
export function borderTriangle(dir: Direction, w: number, h: number, c: string): Decls {
  const t = "transparent"
  const half = (n: number) => `${n / 2}px`
  const solid = (n: number, col: string) => `${n}px solid ${col}`
  const base: Decls = [["width", "0"], ["height", "0"]]
  switch (dir) {
    case "up":
      return [...base, ["border-left", `${half(w)} solid ${t}`], ["border-right", `${half(w)} solid ${t}`], ["border-bottom", solid(h, c)]]
    case "down":
      return [...base, ["border-left", `${half(w)} solid ${t}`], ["border-right", `${half(w)} solid ${t}`], ["border-top", solid(h, c)]]
    case "left":
      return [...base, ["border-top", `${half(h)} solid ${t}`], ["border-bottom", `${half(h)} solid ${t}`], ["border-right", solid(w, c)]]
    case "right":
      return [...base, ["border-top", `${half(h)} solid ${t}`], ["border-bottom", `${half(h)} solid ${t}`], ["border-left", solid(w, c)]]
    case "up-left":
      return [...base, ["border-top", solid(h, c)], ["border-right", solid(w, t)]]
    case "up-right":
      return [...base, ["border-top", solid(h, c)], ["border-left", solid(w, t)]]
    case "down-left":
      return [...base, ["border-bottom", solid(h, c)], ["border-right", solid(w, t)]]
    case "down-right":
      return [...base, ["border-bottom", solid(h, c)], ["border-left", solid(w, t)]]
  }
}

const POLYGONS: Record<Direction, string> = {
  up: "50% 0, 100% 100%, 0 100%",
  down: "0 0, 100% 0, 50% 100%",
  left: "100% 0, 100% 100%, 0 50%",
  right: "0 0, 100% 50%, 0 100%",
  "up-left": "0 0, 100% 0, 0 100%",
  "up-right": "0 0, 100% 0, 100% 100%",
  "down-left": "0 0, 0 100%, 100% 100%",
  "down-right": "100% 0, 100% 100%, 0 100%",
}

export function clipTriangle(dir: Direction, w: number, h: number, c: string): Decls {
  return [["width", `${w}px`], ["height", `${h}px`], ["background", c], ["clip-path", `polygon(${POLYGONS[dir]})`]]
}

/** Arrow drawn by ::after: a transparent-bordered box with only the side facing the bubble coloured. */
export function arrowDecls(side: ArrowSide, position: number, size: number, bg: string): Decls {
  const along: Decls =
    side === "top" || side === "bottom"
      ? [["left", `${position}%`], ["transform", "translateX(-50%)"]]
      : [["top", `${position}%`], ["transform", "translateY(-50%)"]]
  const outside = { bottom: "top", top: "bottom", left: "right", right: "left" }[side]
  return [
    ["content", '""'],
    ["position", "absolute"],
    [outside, "100%"],
    ...along,
    ["border", `${size}px solid transparent`],
    [`border-${outside}-color`, bg],
  ]
}

export function buildShapesCss(s: ShapesSettings, selector?: string): string {
  if (s.mode === "triangle") {
    const sel = selector ?? `.${cls(s.className, "triangle")}`
    const c = toCss(s.color)
    return rule(sel, s.method === "border" ? borderTriangle(s.direction, s.width, s.height, c) : clipTriangle(s.direction, s.width, s.height, c))
  }
  const sel = selector ?? `.${cls(s.className, "tooltip")}`
  const bg = toCss(s.background)
  return [
    rule(sel, [
      ["position", "relative"],
      ["display", "inline-block"],
      ["padding", `${s.padding}px ${Math.round(s.padding * 1.5)}px`],
      ["background", bg],
      ["color", toCss(s.textColor)],
      ["border-radius", `${s.radius}px`],
    ]),
    rule(`${sel}::after`, arrowDecls(s.side, s.position, s.arrowSize, bg)),
  ].join("\n\n")
}

export function buildShapesHtml(s: ShapesSettings): string {
  if (s.mode === "triangle") return `<div class="${cls(s.className, "triangle")}"></div>`
  const text = s.text.replace(/&/g, "&amp;").replace(/</g, "&lt;") || "Tooltip"
  return `<div class="${cls(s.className, "tooltip")}">${text}</div>`
}
