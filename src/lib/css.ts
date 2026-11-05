import type { CSSProperties } from "react"

/** A single CSS declaration: [property, value]. */
export type Decl = [property: string, value: string]

/** Renders declarations as copy-ready CSS, one per line. */
export function declsToCss(decls: Decl[]): string {
  return decls.map(([p, v]) => `${p}: ${v};`).join("\n")
}

/** `-webkit-backdrop-filter` → `WebkitBackdropFilter`, `box-shadow` → `boxShadow`. */
export function toCamel(property: string): string {
  const stripped = property.startsWith("-") ? property.slice(1) : property
  const camel = stripped.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  return property.startsWith("-") ? camel.charAt(0).toUpperCase() + camel.slice(1) : camel
}

/** Converts the same declarations into a React style object for the live preview. */
export function declsToStyle(decls: Decl[]): CSSProperties {
  const style: Record<string, string> = {}
  for (const [p, v] of decls) style[toCamel(p)] = v
  return style as CSSProperties
}
