export const FITS = ["cover", "contain", "fill", "none", "scale-down"] as const
export type Fit = (typeof FITS)[number]

export const RATIOS = [
  { value: "16/9", label: "16:9 – video, hero" },
  { value: "4/3", label: "4:3 – classic photo" },
  { value: "3/2", label: "3:2 – camera photo" },
  { value: "1/1", label: "1:1 – square" },
  { value: "4/5", label: "4:5 – portrait post" },
  { value: "9/16", label: "9:16 – story, reel" },
  { value: "21/9", label: "21:9 – ultrawide banner" },
  { value: "custom", label: "Custom" },
] as const
export type RatioPreset = (typeof RATIOS)[number]["value"]

export interface AspectSettings {
  ratio: RatioPreset
  customW: number
  customH: number
  fit: Fit
  posX: number
  posY: number
  className: string
}

const cls = (name: string) => name.trim().replace(/^\./, "").replace(/[^\w-]/g, "-") || "media"

export function ratioParts(s: AspectSettings): [number, number] {
  if (s.ratio === "custom") return [Math.max(1, s.customW), Math.max(1, s.customH)]
  const [w, h] = s.ratio.split("/").map(Number)
  return [w, h]
}

const KEYWORDS: Record<number, [string, string]> = { 0: ["left", "top"], 50: ["center", "center"], 100: ["right", "bottom"] }

/** `center`, `left top`, `right 30%`… keywords where they exist, percentages otherwise. */
export function positionValue(x: number, y: number): string {
  if (x === 50 && y === 50) return "center"
  const px = KEYWORDS[x]?.[0] ?? `${x}%`
  const py = KEYWORDS[y]?.[1] ?? `${y}%`
  return `${px} ${py}`
}

export function buildAspectCss(s: AspectSettings): string {
  const [w, h] = ratioParts(s)
  const sel = `.${cls(s.className)}`
  const img: [string, string][] = [
    ["display", "block"],
    ["width", "100%"],
    ["height", "100%"],
    ["object-fit", s.fit],
  ]
  // object-position does nothing with fill, which always stretches to the box.
  if (s.fit !== "fill") img.push(["object-position", positionValue(s.posX, s.posY)])
  const rule = (selector: string, decls: [string, string][]) =>
    [`${selector} {`, ...decls.map(([p, v]) => `  ${p}: ${v};`), `}`].join("\n")
  return [
    rule(sel, [
      ["aspect-ratio", `${w} / ${h}`],
      ["overflow", "hidden"],
    ]),
    rule(`${sel} img,\n${sel} video`, img),
  ].join("\n\n")
}

export function buildAspectHtml(s: AspectSettings): string {
  return `<div class="${cls(s.className)}">\n  <img src="image.jpg" alt="Describe the image">\n</div>`
}

export const FIT_HELP: Record<Fit, string> = {
  cover: "Fills the box and crops the overflow. The usual choice for hero and card images.",
  contain: "Shows the whole image, leaving empty bands where the shapes differ.",
  fill: "Stretches the image to the box. Distorts unless the ratios already match.",
  none: "Original size, no scaling. Anything bigger than the box is cropped.",
  "scale-down": "Like contain, but never enlarges a small image.",
}
