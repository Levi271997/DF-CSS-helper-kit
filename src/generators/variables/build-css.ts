import { normalizeHex, round } from "@/lib/color"

export interface NamedValue {
  id: string
  name: string
  value: string
}

export const SPACE_SCALE = [
  { name: "2xs", factor: 0.25 },
  { name: "xs", factor: 0.5 },
  { name: "sm", factor: 1 },
  { name: "md", factor: 2 },
  { name: "lg", factor: 3 },
  { name: "xl", factor: 4 },
  { name: "2xl", factor: 6 },
  { name: "3xl", factor: 8 },
] as const

export interface VariablesSettings {
  prefix: string
  useClientColors: boolean
  /** Colours added here, on top of (or instead of) the client's. value = hex. */
  colors: NamedValue[]
  fonts: NamedValue[]
  includeSpacing: boolean
  /** px; the `sm` step. */
  spaceBase: number
  includeRadius: boolean
  radius: { sm: number; md: number; lg: number }
  unit: "rem" | "px"
}

export const slug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

/** Gives every entry a usable, unique variable name: blanks get a fallback, repeats get -2, -3… */
export function uniqueNames(names: string[], fallback: string): string[] {
  const seen = new Map<string, number>()
  return names.map((n, i) => {
    const base = slug(n) || `${fallback}-${i + 1}`
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base}-${count}`
  })
}

const len = (px: number, unit: VariablesSettings["unit"]) => (unit === "rem" ? `${round(px / 16, 4)}rem` : `${px}px`)

export interface Token {
  name: string
  value: string
}

export interface TokenGroups {
  colors: Token[]
  fonts: Token[]
  spacing: Token[]
  radius: Token[]
}

export function buildTokens(s: VariablesSettings, clientColors: { name: string; hex: string }[]): TokenGroups {
  const p = slug(s.prefix) || "brand"
  const allColors = [
    ...(s.useClientColors ? clientColors.map((c) => ({ name: c.name, value: c.hex })) : []),
    ...s.colors.map((c) => ({ name: c.name, value: c.value })),
  ]
  const colorNames = uniqueNames(allColors.map((c) => c.name), "color")
  const fontNames = uniqueNames(s.fonts.map((f) => f.name), "font")
  return {
    colors: allColors.map((c, i) => ({ name: `--${p}-${colorNames[i]}`, value: normalizeHex(c.value) })),
    fonts: s.fonts
      .map((f, i) => ({ name: `--${p}-font-${fontNames[i]}`, value: f.value.trim() }))
      .filter((f) => f.value),
    spacing: s.includeSpacing
      ? SPACE_SCALE.map((st) => ({ name: `--${p}-space-${st.name}`, value: len(s.spaceBase * st.factor, s.unit) }))
      : [],
    radius: s.includeRadius
      ? [
          { name: `--${p}-radius-sm`, value: len(s.radius.sm, s.unit) },
          { name: `--${p}-radius-md`, value: len(s.radius.md, s.unit) },
          { name: `--${p}-radius-lg`, value: len(s.radius.lg, s.unit) },
          { name: `--${p}-radius-full`, value: "9999px" },
        ]
      : [],
  }
}

export function buildVariablesCss(groups: TokenGroups): string {
  const sections: [string, Token[]][] = [
    ["Colours", groups.colors],
    ["Fonts", groups.fonts],
    ["Spacing", groups.spacing],
    ["Radius", groups.radius],
  ]
  const body = sections
    .filter(([, tokens]) => tokens.length)
    .map(([title, tokens]) => [`  /* ${title} */`, ...tokens.map((t) => `  ${t.name}: ${t.value};`)].join("\n"))
  if (!body.length) return ":root {\n  /* Add colours, fonts or spacing to see variables here */\n}"
  return [":root {", body.join("\n\n"), "}"].join("\n")
}
