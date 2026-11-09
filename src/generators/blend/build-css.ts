import { toCss, type Color } from "@/lib/color"
import type { Decl } from "@/lib/css"

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "darken",
  "lighten",
  "color-dodge",
  "color-burn",
  "hard-light",
  "soft-light",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
] as const
export type BlendMode = (typeof BLEND_MODES)[number]

export interface BlendSettings {
  /** mix: a separate element blends with what's behind it. background: an element's colour blends with its own image. */
  type: "mix" | "background"
  /** For mix: blend a block of colour, or text. */
  layer: "shape" | "text"
  mode: BlendMode
  color: Color
  text: string
  imageUrl: string
  className: string
}

const cls = (name: string, fallback: string) => name.trim().replace(/^\./, "").replace(/[^\w-]/g, "-") || fallback

export function defaultClass(s: Pick<BlendSettings, "type">) {
  return s.type === "mix" ? "blend-layer" : "blend-bg"
}

/** `previewImage` replaces the URL in the live preview. */
export function blendDecls(s: BlendSettings, previewImage?: string): Decl[] {
  const c = toCss(s.color)
  if (s.type === "background") {
    const url = (previewImage ?? s.imageUrl.trim()) || "image.jpg"
    return [
      ["background-color", c],
      ["background-image", `url("${url}")`],
      ["background-size", "cover"],
      ["background-position", "center"],
      ["background-blend-mode", s.mode],
    ]
  }
  return [s.layer === "text" ? ["color", c] : ["background-color", c], ["mix-blend-mode", s.mode]]
}

export function buildBlendCss(s: BlendSettings): string {
  const sel = `.${cls(s.className, defaultClass(s))}`
  const decls = blendDecls(s)
  const main = [`${sel} {`, ...decls.map(([p, v]) => `  ${p}: ${v};`), `}`].join("\n")
  if (s.type === "background") return main
  // Without isolation the layer can also blend with things further back than the intended image.
  return `${main}\n\n/* On the element that holds the image and the layer */\n.blend-wrap {\n  position: relative;\n  isolation: isolate;\n}`
}

export const MODE_HELP: Partial<Record<BlendMode, string>> = {
  multiply: "Darkens: white disappears, colours tint the image. Great for brand-colour photo overlays.",
  screen: "Lightens: black disappears. Good for glows and light leaks.",
  overlay: "Boosts contrast, darkening darks and lightening lights.",
  "soft-light": "A gentler overlay, like shining a diffused light.",
  difference: "Inverts where colours are bright. Text stays readable on any background.",
  color: "Keeps the image's light and shade but uses your colour's hue. A one-colour duotone.",
  luminosity: "Uses the image's colours with your layer's brightness.",
}
