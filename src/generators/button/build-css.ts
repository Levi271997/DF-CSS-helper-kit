import { color, toCss, type Color } from "@/lib/color"

export interface ButtonColors {
  background: Color
  text: Color
  border: Color
}

export interface ButtonSettings {
  label: string
  className: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  /** em, e.g. 0.05 */
  letterSpacing: number
  uppercase: boolean
  paddingY: number
  paddingX: number
  radius: number
  borderWidth: number
  normal: ButtonColors
  hover: ButtonColors
  shadow: boolean
  shadowY: number
  shadowBlur: number
  shadowColor: Color
  /** px the button rises on hover; 0 = no movement. */
  lift: number
  press: boolean
  focusColor: Color
  /** ms */
  duration: number
}

/** Selectors for each state; the preview adds forced-state classes to these. */
export interface StateSelectors {
  base: string
  hover: string
  focus: string
  active: string
}

const cls = (name: string) => name.trim().replace(/[^\w-]/g, "-") || "btn"

export function selectorsFor(className: string): StateSelectors {
  const base = `.${cls(className)}`
  return { base, hover: `${base}:hover`, focus: `${base}:focus-visible`, active: `${base}:active` }
}

const rule = (selector: string, decls: [string, string][]) =>
  [`${selector} {`, ...decls.map(([p, v]) => `  ${p}: ${v};`), `}`].join("\n")

const shadow = (s: ButtonSettings, y: number, blur: number) => `0 ${y}px ${blur}px ${toCss(s.shadowColor)}`

export function buildButtonCss(s: ButtonSettings, sel: StateSelectors = selectorsFor(s.className)): string {
  const family = s.fontFamily.trim()
  const base: [string, string][] = [
    ["display", "inline-flex"],
    ["align-items", "center"],
    ["justify-content", "center"],
    ["gap", "0.5em"],
    ["padding", s.paddingY === s.paddingX ? `${s.paddingY}px` : `${s.paddingY}px ${s.paddingX}px`],
  ]
  if (family && family !== "inherit") base.push(["font-family", family])
  base.push(["font-size", `${s.fontSize}px`], ["font-weight", String(s.fontWeight)], ["line-height", "1.2"])
  if (s.letterSpacing) base.push(["letter-spacing", `${s.letterSpacing}em`])
  if (s.uppercase) base.push(["text-transform", "uppercase"])
  base.push(
    ["color", toCss(s.normal.text)],
    ["background-color", toCss(s.normal.background)],
    ["border", s.borderWidth ? `${s.borderWidth}px solid ${toCss(s.normal.border)}` : "none"],
    ["border-radius", `${s.radius}px`],
  )
  if (s.shadow) base.push(["box-shadow", shadow(s, s.shadowY, s.shadowBlur)])
  base.push(["cursor", "pointer"], ["text-decoration", "none"])
  if (s.duration) {
    const props = ["color", "background-color", "border-color", "box-shadow", "transform"]
    base.push(["transition", props.map((p) => `${p} ${s.duration}ms ease`).join(",\n    ")])
  }

  const hover: [string, string][] = [
    ["color", toCss(s.hover.text)],
    ["background-color", toCss(s.hover.background)],
  ]
  if (s.borderWidth) hover.push(["border-color", toCss(s.hover.border)])
  if (s.lift) {
    hover.push(["transform", `translateY(-${s.lift}px)`])
    if (s.shadow) hover.push(["box-shadow", shadow(s, s.shadowY + s.lift, s.shadowBlur + s.lift * 2)])
  }

  const rules = [
    rule(sel.base, base),
    rule(sel.hover, hover),
    rule(sel.focus, [
      ["outline", `2px solid ${toCss(s.focusColor)}`],
      ["outline-offset", "2px"],
    ]),
  ]
  if (s.press) rules.push(rule(sel.active, [["transform", "translateY(0) scale(0.98)"]]))
  return rules.join("\n\n")
}

export function buildButtonHtml(s: ButtonSettings): string {
  const label = s.label.replace(/&/g, "&amp;").replace(/</g, "&lt;") || "Button"
  return `<a href="#" class="${cls(s.className)}">${label}</a>`
}

const navy = "#1e1242"
const orange = "#f8a02d"
const orangeDark = "#f37920"

type Preset = Pick<ButtonSettings, "uppercase" | "letterSpacing" | "radius" | "borderWidth" | "normal" | "hover" | "shadow" | "lift" | "fontWeight">

const colors = (background: string, text: string, border = background, bgAlpha = 1): ButtonColors => ({
  background: color(background, bgAlpha),
  text: color(text),
  border: color(border),
})

export const BUTTON_PRESETS: { name: string; settings: Preset }[] = [
  {
    name: "Primary",
    settings: { uppercase: false, letterSpacing: 0, radius: 8, borderWidth: 0, fontWeight: 600, shadow: true, lift: 2,
      normal: colors(orange, navy), hover: colors(orangeDark, navy) },
  },
  {
    name: "Secondary",
    settings: { uppercase: false, letterSpacing: 0, radius: 8, borderWidth: 0, fontWeight: 600, shadow: true, lift: 2,
      normal: colors(navy, "#ffffff"), hover: colors("#4b3b8c", "#ffffff") },
  },
  {
    name: "Outline",
    settings: { uppercase: false, letterSpacing: 0, radius: 8, borderWidth: 2, fontWeight: 600, shadow: false, lift: 0,
      normal: colors(navy, navy, navy, 0), hover: colors(navy, "#ffffff", navy) },
  },
  {
    name: "Pill",
    settings: { uppercase: false, letterSpacing: 0, radius: 999, borderWidth: 0, fontWeight: 600, shadow: true, lift: 2,
      normal: colors(orange, navy), hover: colors(navy, "#ffffff") },
  },
  {
    name: "Uppercase",
    settings: { uppercase: true, letterSpacing: 0.08, radius: 0, borderWidth: 2, fontWeight: 700, shadow: false, lift: 0,
      normal: colors(navy, "#ffffff", navy), hover: colors(orange, navy, orange) },
  },
  {
    name: "Ghost",
    settings: { uppercase: false, letterSpacing: 0, radius: 8, borderWidth: 0, fontWeight: 600, shadow: false, lift: 0,
      normal: colors(navy, navy, navy, 0), hover: colors(navy, navy, navy, 0.08) },
  },
]
