import { round } from "@/lib/color"

export type Decls = [string, string][]
export interface Keyframe {
  /** e.g. `from`, `50%`, `0%, 100%` */
  at: string
  decls: Decls
}

export const PRESET_IDS = [
  "fade-in",
  "fade-out",
  "slide-in-up",
  "slide-in-down",
  "slide-in-left",
  "slide-in-right",
  "zoom-in",
  "bounce",
  "pulse",
  "heartbeat",
  "shake",
  "float",
  "spin",
  "flip",
] as const
export type PresetId = (typeof PRESET_IDS)[number]

export const EASINGS = [
  { value: "ease", label: "ease" },
  { value: "linear", label: "linear" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "cubic-bezier(0.22, 1, 0.36, 1)", label: "Smooth out (expo)" },
  { value: "cubic-bezier(0.34, 1.56, 0.64, 1)", label: "Overshoot (back out)" },
  { value: "cubic-bezier(0.68, -0.6, 0.32, 1.6)", label: "Elastic (back in-out)" },
] as const
export type Easing = (typeof EASINGS)[number]["value"]

export const DIRECTIONS = ["normal", "reverse", "alternate", "alternate-reverse"] as const
export const FILLS = ["none", "forwards", "backwards", "both"] as const

export interface AnimationSettings {
  preset: PresetId
  /** Keyframes name in the output. */
  name: string
  className: string
  /** px, used by slide / bounce / shake / float. */
  distance: number
  /** Scale factor, used by zoom / pulse / heartbeat. */
  scale: number
  duration: number
  delay: number
  easing: Easing
  infinite: boolean
  iterations: number
  direction: (typeof DIRECTIONS)[number]
  fill: (typeof FILLS)[number]
  reducedMotion: boolean
}

type Param = "distance" | "scale"

interface PresetDef {
  label: string
  /** Which of the shared parameters this preset uses. */
  params: Param[]
  /** Sensible timing applied when the preset is picked. */
  timing: Pick<AnimationSettings, "duration" | "easing" | "infinite" | "direction" | "fill">
  frames: (s: Pick<AnimationSettings, "distance" | "scale">) => Keyframe[]
}

const once = (duration: number, easing: Easing): PresetDef["timing"] => ({ duration, easing, infinite: false, direction: "normal", fill: "both" })
const loop = (duration: number, easing: Easing, direction: AnimationSettings["direction"] = "normal"): PresetDef["timing"] => ({
  duration, easing, infinite: true, direction, fill: "none",
})

const n = (v: number) => String(round(v, 3))
const slide = (axis: "X" | "Y", sign: 1 | -1) => (s: { distance: number }): Keyframe[] => [
  { at: "from", decls: [["opacity", "0"], ["transform", `translate${axis}(${sign * s.distance}px)`]] },
  { at: "to", decls: [["opacity", "1"], ["transform", `translate${axis}(0)`]] },
]

export const PRESETS: Record<PresetId, PresetDef> = {
  "fade-in": {
    label: "Fade in", params: [], timing: once(600, "ease-out"),
    frames: () => [{ at: "from", decls: [["opacity", "0"]] }, { at: "to", decls: [["opacity", "1"]] }],
  },
  "fade-out": {
    label: "Fade out", params: [], timing: once(600, "ease-in"),
    frames: () => [{ at: "from", decls: [["opacity", "1"]] }, { at: "to", decls: [["opacity", "0"]] }],
  },
  "slide-in-up": { label: "Slide in up", params: ["distance"], timing: once(700, "cubic-bezier(0.22, 1, 0.36, 1)"), frames: slide("Y", 1) },
  "slide-in-down": { label: "Slide in down", params: ["distance"], timing: once(700, "cubic-bezier(0.22, 1, 0.36, 1)"), frames: slide("Y", -1) },
  "slide-in-left": { label: "Slide in from left", params: ["distance"], timing: once(700, "cubic-bezier(0.22, 1, 0.36, 1)"), frames: slide("X", -1) },
  "slide-in-right": { label: "Slide in from right", params: ["distance"], timing: once(700, "cubic-bezier(0.22, 1, 0.36, 1)"), frames: slide("X", 1) },
  "zoom-in": {
    label: "Zoom in", params: ["scale"], timing: once(500, "cubic-bezier(0.34, 1.56, 0.64, 1)"),
    frames: (s) => [
      { at: "from", decls: [["opacity", "0"], ["transform", `scale(${n(s.scale)})`]] },
      { at: "to", decls: [["opacity", "1"], ["transform", "scale(1)"]] },
    ],
  },
  bounce: {
    label: "Bounce", params: ["distance"], timing: loop(1200, "ease-in-out"),
    frames: (s) => [
      { at: "0%, 20%, 50%, 80%, 100%", decls: [["transform", "translateY(0)"]] },
      { at: "40%", decls: [["transform", `translateY(-${s.distance}px)`]] },
      { at: "60%", decls: [["transform", `translateY(-${n(s.distance / 2)}px)`]] },
    ],
  },
  pulse: {
    label: "Pulse", params: ["scale"], timing: loop(1500, "ease-in-out"),
    frames: (s) => [
      { at: "0%, 100%", decls: [["transform", "scale(1)"]] },
      { at: "50%", decls: [["transform", `scale(${n(s.scale)})`]] },
    ],
  },
  heartbeat: {
    label: "Heartbeat", params: ["scale"], timing: loop(1300, "ease-in-out"),
    frames: (s) => [
      { at: "0%, 28%, 70%, 100%", decls: [["transform", "scale(1)"]] },
      { at: "14%, 42%", decls: [["transform", `scale(${n(s.scale)})`]] },
    ],
  },
  shake: {
    label: "Shake", params: ["distance"], timing: once(600, "ease-in-out"),
    frames: (s) => [
      { at: "0%, 100%", decls: [["transform", "translateX(0)"]] },
      { at: "10%, 30%, 50%, 70%, 90%", decls: [["transform", `translateX(-${s.distance}px)`]] },
      { at: "20%, 40%, 60%, 80%", decls: [["transform", `translateX(${s.distance}px)`]] },
    ],
  },
  float: {
    label: "Float", params: ["distance"], timing: loop(3000, "ease-in-out"),
    frames: (s) => [
      { at: "0%, 100%", decls: [["transform", "translateY(0)"]] },
      { at: "50%", decls: [["transform", `translateY(-${s.distance}px)`]] },
    ],
  },
  spin: {
    label: "Spin", params: [], timing: loop(1000, "linear"),
    frames: () => [{ at: "from", decls: [["transform", "rotate(0deg)"]] }, { at: "to", decls: [["transform", "rotate(360deg)"]] }],
  },
  flip: {
    label: "Flip", params: [], timing: once(900, "ease-in-out"),
    frames: () => [
      { at: "from", decls: [["transform", "perspective(400px) rotateY(0deg)"]] },
      { at: "to", decls: [["transform", "perspective(400px) rotateY(360deg)"]] },
    ],
  },
}

/** Default distance/scale per preset when it's picked. */
export const PARAM_DEFAULTS: Partial<Record<PresetId, Partial<Pick<AnimationSettings, "distance" | "scale">>>> = {
  "slide-in-up": { distance: 40 },
  "slide-in-down": { distance: 40 },
  "slide-in-left": { distance: 60 },
  "slide-in-right": { distance: 60 },
  "zoom-in": { scale: 0.6 },
  bounce: { distance: 30 },
  pulse: { scale: 1.08 },
  heartbeat: { scale: 1.2 },
  shake: { distance: 8 },
  float: { distance: 12 },
}

export const cls = (name: string, fallback: string) => name.trim().replace(/[^\w-]/g, "-") || fallback

export function keyframesCss(name: string, frames: Keyframe[]): string {
  const body = frames.map((f) => [`  ${f.at} {`, ...f.decls.map(([p, v]) => `    ${p}: ${v};`), `  }`].join("\n"))
  return [`@keyframes ${name} {`, ...body, `}`].join("\n")
}

/** Shorthand, leaving out parts that match the defaults (delay 0, 1 iteration, normal, none). */
export function animationValue(s: AnimationSettings, name: string): string {
  const parts = [name, `${s.duration}ms`, s.easing]
  if (s.delay) parts.push(`${s.delay}ms`)
  if (s.infinite) parts.push("infinite")
  else if (s.iterations !== 1) parts.push(String(s.iterations))
  if (s.direction !== "normal") parts.push(s.direction)
  if (s.fill !== "none") parts.push(s.fill)
  return parts.join(" ")
}

export function buildAnimationCss(s: AnimationSettings, nameOverride?: string): string {
  const name = nameOverride ?? cls(s.name, s.preset)
  const selector = `.${cls(s.className, "animate")}`
  const blocks = [
    keyframesCss(name, PRESETS[s.preset].frames(s)),
    [`${selector} {`, `  animation: ${animationValue(s, name)};`, `}`].join("\n"),
  ]
  if (s.reducedMotion) {
    blocks.push(
      [`@media (prefers-reduced-motion: reduce) {`, `  ${selector} {`, `    animation: none;`, `  }`, `}`].join("\n"),
    )
  }
  return blocks.join("\n\n")
}
