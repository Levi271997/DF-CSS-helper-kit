import { toCss, type Color } from "@/lib/color"

export interface ScrollbarSettings {
  /** "page" styles the browser window's scrollbar; "element" a scrolling box with a class. */
  target: "page" | "element"
  className: string
  size: number
  radius: number
  /** Gap around the thumb, drawn as a border in the track colour (WebKit only). */
  padding: number
  track: Color
  thumb: Color
  thumbHover: Color
}

const cls = (name: string) => name.trim().replace(/^\./, "").replace(/[^\w-]/g, "-") || "scroll-area"

const rule = (selector: string, decls: [string, string][]) =>
  [`${selector} {`, ...decls.map(([p, v]) => `  ${p}: ${v};`), `}`].join("\n")

/**
 * WebKit pseudo-elements for Chrome, Edge and Safari, plus the standard properties for Firefox.
 * The standard ones sit inside @supports so newer Chrome (which ignores ::-webkit-scrollbar once
 * scrollbar-color is set) keeps the full custom styling.
 */
export function buildScrollbarCss(s: ScrollbarSettings, selectorOverride?: string): string {
  const el = selectorOverride ?? (s.target === "page" ? "" : `.${cls(s.className)}`)
  const root = el || "html"
  const pad = Math.max(0, Math.min(s.padding, Math.floor(s.size / 2) - 1))
  const ff = rule(root, [
    ["scrollbar-width", s.size <= 10 ? "thin" : "auto"],
    ["scrollbar-color", `${toCss(s.thumb)} ${toCss(s.track)}`],
  ])
  return [
    "/* Chrome, Edge, Safari */",
    rule(`${el}::-webkit-scrollbar`, [
      ["width", `${s.size}px`],
      ["height", `${s.size}px`],
    ]),
    rule(`${el}::-webkit-scrollbar-track`, [["background", toCss(s.track)]]),
    rule(`${el}::-webkit-scrollbar-thumb`, [
      ["background", toCss(s.thumb)],
      ["border-radius", `${s.radius}px`],
      ...(pad ? ([["border", `${pad}px solid ${toCss(s.track)}`]] as [string, string][]) : []),
    ]),
    rule(`${el}::-webkit-scrollbar-thumb:hover`, [["background", toCss(s.thumbHover)]]),
    `/* Firefox */\n@supports not selector(::-webkit-scrollbar) {\n${ff.replace(/^/gm, "  ")}\n}`,
  ].join("\n\n")
}
