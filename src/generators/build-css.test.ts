import { describe, expect, it } from "vitest"
import { color, hexToHsl } from "@/lib/color"
import { buildShadow, type ShadowLayer } from "./shadow/build-css"
import { buildGlass, type GlassSettings } from "./glass/build-css"
import { buildFilters, type FiltersSettings } from "./filters/build-css"
import { buildGradient, nextStopPos, type GradientSettings } from "./gradient/build-css"
import { buildClip, insertIndex } from "./clip-path/build-css"
import { buildTransform, TRANSFORM_DEFAULTS } from "./transform/build-css"
import { buildGridCss, buildGridHtml, collides, fitItems, rectFromCells, type GridSettings } from "./grid/build-css"
import { buildFlexCss, buildFlexHtml, newFlexItem, type FlexSettings } from "./flexbox/build-css"
import { buildBackground, positionValue, type BackgroundSettings } from "./background/build-css"
import { buildTextShadow, longShadow, type TextShadowLayer, type TextShadowSettings } from "./text-shadow/build-css"
import { buildFluidCss, clampValue, scaleSteps, sizeAt } from "./fluid-type/build-css"
import { buildButtonCss, buildButtonHtml, type ButtonSettings } from "./button/build-css"
import { PRESET_IDS, animationValue, buildAnimationCss, type AnimationSettings } from "./animation/build-css"
import { buildEasingCss, parseBezier, type EasingSettings } from "./easing/build-css"
import { buildPaletteCss, buildShades, checkContrast } from "./palette/build-css"
import { buildTokens, buildVariablesCss, uniqueNames, type VariablesSettings } from "./variables/build-css"
import { buildBorder, type BorderSettings, type Side as BorderSide } from "./border/build-css"
import { buildScrollbarCss, type ScrollbarSettings } from "./scrollbar/build-css"
import { arrowDecls, borderTriangle, clipTriangle } from "./shapes/build-css"
import { buildAspectCss, positionValue as aspectPosition, type AspectSettings } from "./aspect/build-css"
import { blobValue, buildRadius, randomBlob, type RadiusSettings } from "./radius/build-css"

const layer = (p: Partial<ShadowLayer>): ShadowLayer => ({
  id: "1", enabled: true, inset: false, x: 0, y: 4, blur: 6, spread: 0, color: color("#000", 0.1), ...p,
})

describe("shadow", () => {
  it("outputs none with no enabled layers", () => {
    expect(buildShadow({ layers: [layer({ enabled: false })], boxColor: color("#fff"), radius: 0 })).toEqual([
      ["box-shadow", "none"],
    ])
  })

  it("keeps alpha and inset", () => {
    const [[, v]] = buildShadow({
      layers: [layer({}), layer({ id: "2", inset: true, color: color("#ff0000") })],
      boxColor: color("#fff"),
      radius: 0,
    })
    expect(v).toBe("0px 4px 6px 0px rgba(0, 0, 0, 0.1),\n    inset 0px 4px 6px 0px #ff0000")
  })
})

describe("glass", () => {
  const base: GlassSettings = {
    tint: color("#ffffff", 0.2), blur: 12, saturate: 160, radius: 16, borderWidth: 1,
    borderColor: color("#ffffff", 0.3), shadow: true, shadowY: 8, shadowBlur: 32, shadowColor: color("#000", 0.15),
  }

  it("includes the webkit prefix and all parts", () => {
    expect(buildGlass(base)).toEqual([
      ["background", "rgba(255, 255, 255, 0.2)"],
      ["backdrop-filter", "blur(12px) saturate(160%)"],
      ["-webkit-backdrop-filter", "blur(12px) saturate(160%)"],
      ["border-radius", "16px"],
      ["border", "1px solid rgba(255, 255, 255, 0.3)"],
      ["box-shadow", "0 8px 32px rgba(0, 0, 0, 0.15)"],
    ])
  })

  it("drops border and shadow when off, and neutral saturate", () => {
    const decls = buildGlass({ ...base, borderWidth: 0, shadow: false, saturate: 100 })
    expect(decls.map(([p]) => p)).toEqual(["background", "backdrop-filter", "-webkit-backdrop-filter", "border-radius"])
    expect(decls[1][1]).toBe("blur(12px)")
  })
})

describe("filters", () => {
  const base: FiltersSettings = {
    target: "filter",
    items: [{ key: "blur", enabled: true, value: 2 }, { key: "sepia", enabled: false, value: 50 }, { key: "hue-rotate", enabled: true, value: 90 }],
    dropShadow: { enabled: true, x: 0, y: 4, blur: 8, color: color("#000", 0.3) },
  }

  it("builds a filter chain with drop-shadow", () => {
    expect(buildFilters(base)).toEqual([["filter", "blur(2px) hue-rotate(90deg) drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))"]])
  })

  it("builds backdrop-filter without drop-shadow", () => {
    expect(buildFilters({ ...base, target: "backdrop-filter" })).toEqual([
      ["backdrop-filter", "blur(2px) hue-rotate(90deg)"],
      ["-webkit-backdrop-filter", "blur(2px) hue-rotate(90deg)"],
    ])
  })
})

describe("gradient", () => {
  const base: GradientSettings = {
    type: "linear", angle: 90, shape: "circle", posX: 50, posY: 50, repeating: false,
    stops: [{ id: "b", color: color("#ffffff"), pos: 100 }, { id: "a", color: color("#000000", 0.5), pos: 0 }],
  }

  it("sorts stops and builds linear", () => {
    expect(buildGradient(base)[0][1]).toBe("linear-gradient(90deg, rgba(0, 0, 0, 0.5) 0%, #ffffff 100%)")
  })

  it("builds radial and repeating conic", () => {
    expect(buildGradient({ ...base, type: "radial", posX: 20 })[0][1]).toMatch(/^radial-gradient\(circle at 20% 50%, /)
    expect(buildGradient({ ...base, type: "conic", repeating: true })[0][1]).toMatch(/^repeating-conic-gradient\(from 90deg at 50% 50%, /)
  })

  it("places a new stop in the largest gap", () => {
    expect(nextStopPos([{ id: "a", color: color("#000"), pos: 0 }, { id: "b", color: color("#000"), pos: 20 }])).toBe(60)
  })
})

describe("clip-path", () => {
  const square = [
    { id: "1", x: 0, y: 0 }, { id: "2", x: 100, y: 0 }, { id: "3", x: 100, y: 100 }, { id: "4", x: 0, y: 100 },
  ]

  it("builds a polygon with rounded values", () => {
    expect(buildClip({ points: [{ id: "a", x: 12.345, y: 0 }, ...square.slice(1)] })[0][1]).toBe(
      "polygon(12.3% 0%, 100% 0%, 100% 100%, 0% 100%)",
    )
  })

  it("inserts a point on the nearest edge", () => {
    expect(insertIndex(square, 50, 2)).toBe(1) // top edge, after point 0
    expect(insertIndex(square, 98, 50)).toBe(2) // right edge
    expect(insertIndex(square, 2, 50)).toBe(4) // left edge (closing segment)
  })
})

describe("transform", () => {
  it("outputs none for defaults and omits default origin", () => {
    expect(buildTransform(TRANSFORM_DEFAULTS)).toEqual([["transform", "none"]])
  })

  it("orders functions and uses translate3d when z is set", () => {
    const decls = buildTransform({
      ...TRANSFORM_DEFAULTS, perspective: 800, translateX: 10, translateZ: 20, rotateY: 30, rotateZ: 45,
      skewX: 5, scaleX: 1.2, scaleY: 1.2, originX: 0,
    })
    expect(decls).toEqual([
      ["transform", "perspective(800px) translate3d(10px, 0px, 20px) rotateY(30deg) rotate(45deg) skew(5deg, 0deg) scale(1.2)"],
      ["transform-origin", "0% 50%"],
    ])
  })
})

describe("radius", () => {
  const base: RadiusSettings = {
    mode: "corners", unit: "px", linked: false,
    corners: { tl: 8, tr: 8, br: 8, bl: 8 }, blob: { top: 30, right: 40, bottom: 60, left: 70 },
  }

  it("uses shorthand for equal corners", () => {
    expect(buildRadius(base)[0][1]).toBe("8px")
    expect(buildRadius({ ...base, corners: { tl: 8, tr: 0, br: 8, bl: 0 } })[0][1]).toBe("8px 0px")
    expect(buildRadius({ ...base, unit: "%", corners: { tl: 1, tr: 2, br: 3, bl: 4 } })[0][1]).toBe("1% 2% 3% 4%")
  })

  it("builds a blob whose edge radii sum to 100%", () => {
    expect(blobValue(base.blob)).toBe("30% 70% 40% 60% / 70% 40% 60% 30%")
  })

  it("random blobs stay within 20–80", () => {
    expect(randomBlob(() => 0)).toEqual({ top: 20, right: 20, bottom: 20, left: 20 })
    expect(randomBlob(() => 1)).toEqual({ top: 80, right: 80, bottom: 80, left: 80 })
  })
})

describe("grid", () => {
  const base: GridSettings = {
    columns: 4, rows: 3, columnGap: 8, rowGap: 8, columnSize: "1fr", rowSize: "1fr",
    parentClass: "parent", itemPrefix: "div",
    items: [{ id: "a", col: 2, row: 1, colSpan: 2, rowSpan: 2 }],
  }

  it("writes container and item rules", () => {
    const css = buildGridCss(base)
    expect(css).toContain("grid-template-columns: repeat(4, 1fr);")
    expect(css).toContain("gap: 8px;")
    expect(css).toContain(".div1 {\n  grid-area: 1 / 2 / 3 / 4;\n}")
    expect(buildGridCss({ ...base, rowGap: 4 })).toContain("gap: 4px 8px;")
    expect(buildGridHtml(base)).toBe('<div class="parent">\n  <div class="div1">1</div>\n</div>')
  })

  it("normalises drags and detects collisions", () => {
    const r = rectFromCells({ col: 3, row: 3 }, { col: 1, row: 2 })
    expect(r).toEqual({ col: 1, row: 2, colSpan: 3, rowSpan: 2 })
    expect(collides(r, base.items)).toBe(true)
    expect(collides({ col: 1, row: 3, colSpan: 1, rowSpan: 1 }, base.items)).toBe(false)
  })

  it("trims items when the grid shrinks", () => {
    expect(fitItems(base.items, 2, 1)).toEqual([{ id: "a", col: 2, row: 1, colSpan: 1, rowSpan: 1 }])
    expect(fitItems(base.items, 1, 3)).toEqual([])
  })
})

describe("flexbox", () => {
  const base: FlexSettings = {
    direction: "row", wrap: "nowrap", justify: "flex-start", alignItems: "stretch", alignContent: "center",
    rowGap: 0, columnGap: 0, parentClass: "parent", itemPrefix: "child",
    items: [newFlexItem("a"), { ...newFlexItem("b"), grow: 1, basis: "120px", alignSelf: "center", order: 2 }],
  }

  it("omits defaults and align-content without wrap", () => {
    expect(buildFlexCss(base)).toBe(
      ".parent {\n  display: flex;\n}\n\n.child2 {\n  flex: 1 1 120px;\n  align-self: center;\n  order: 2;\n}",
    )
  })

  it("writes container settings", () => {
    const css = buildFlexCss({ ...base, direction: "column", wrap: "wrap", justify: "space-between", rowGap: 8, columnGap: 16 })
    expect(css).toContain("flex-direction: column;")
    expect(css).toContain("align-content: center;")
    expect(css).toContain("gap: 8px 16px;")
    expect(buildFlexHtml(base)).toBe('<div class="parent">\n  <div class="child1">1</div>\n  <div class="child2">2</div>\n</div>')
  })
})

describe("background", () => {
  const base: BackgroundSettings = {
    color: color("#1e1242"), image: true, imageUrl: "/img/hero.jpg", size: "cover", sizePercent: 50,
    posX: 50, posY: 50, repeat: "no-repeat", attachment: "scroll", overlay: false, overlayColor: color("#000", 0.5),
  }

  it("outputs only the color when the image is off or empty", () => {
    expect(buildBackground({ ...base, image: false })).toEqual([["background-color", "#1e1242"]])
    expect(buildBackground({ ...base, imageUrl: "  " })).toEqual([["background-color", "#1e1242"]])
  })

  it("builds image layers with overlay, custom size and fixed attachment", () => {
    expect(buildBackground({ ...base, overlay: true, size: "custom", sizePercent: 40, posX: 0, posY: 100, attachment: "fixed" })).toEqual([
      ["background-color", "#1e1242"],
      ["background-image", 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/img/hero.jpg")'],
      ["background-size", "40%"],
      ["background-position", "left bottom"],
      ["background-repeat", "no-repeat"],
      ["background-attachment", "fixed"],
    ])
  })

  it("formats positions", () => {
    expect(positionValue(50, 50)).toBe("center")
    expect(positionValue(25, 50)).toBe("25% center")
  })
})

describe("text shadow", () => {
  const base: TextShadowSettings = {
    layers: [], text: "Hi", fontSize: 48, fontWeight: 700, textColor: color("#000"), background: color("#fff"),
  }
  const tl = (p: Partial<TextShadowLayer>): TextShadowLayer => ({ id: "1", enabled: true, x: 1, y: 2, blur: 3, color: color("#000"), ...p })

  it("outputs none with no enabled layers", () => {
    expect(buildTextShadow({ ...base, layers: [tl({ enabled: false })] })).toEqual([["text-shadow", "none"]])
  })

  it("joins enabled layers in order", () => {
    const [[, v]] = buildTextShadow({ ...base, layers: [tl({}), tl({ id: "2", enabled: false }), tl({ id: "3", x: 0, color: color("#ff0000", 0.5) })] })
    expect(v).toBe("1px 2px 3px #000000,\n    0px 2px 3px rgba(255, 0, 0, 0.5)")
  })

  it("builds a stepped long shadow", () => {
    const layers = longShadow(3, "#000")
    expect(layers.map((l) => [l.x, l.y, l.blur])).toEqual([[1, 1, 0], [2, 2, 0], [3, 3, 0]])
  })
})

describe("fluid type", () => {
  it("builds a clamp that hits both sizes", () => {
    expect(clampValue(16, 24, 320, 1280, "rem", 16)).toBe("clamp(1rem, 0.8333rem + 0.8333vw, 1.5rem)")
    expect(clampValue(16, 24, 320, 1280, "px", 16)).toBe("clamp(16px, 13.3333px + 0.8333vw, 24px)")
    expect(sizeAt(16, 24, 320, 1280, 800)).toBeCloseTo(20)
    expect(sizeAt(16, 24, 320, 1280, 100)).toBe(16)
    expect(sizeAt(16, 24, 320, 1280, 2000)).toBe(24)
  })

  it("handles shrinking sizes and bad ranges", () => {
    expect(clampValue(24, 16, 320, 1280, "px", 16)).toBe("clamp(16px, 26.6667px - 0.8333vw, 24px)")
    expect(clampValue(16, 24, 800, 800, "rem", 16)).toBe("1rem")
  })

  it("names scale steps from largest to smallest", () => {
    const s = { mode: "scale", unit: "rem", root: 16, minVw: 320, maxVw: 1280, minSize: 16, maxSize: 24, baseMin: 16, baseMax: 18,
      ratioMin: "1.2", ratioMax: "1.25", stepsDown: 1, stepsUp: 1, prefix: "step", previewVw: 800, text: "" } as const
    expect(scaleSteps(s).map((st) => st.name)).toEqual(["--step-1", "--step-0", "--step--1"])
    expect(buildFluidCss(s)).toContain("  --step-0: clamp(1rem, 0.9583rem + 0.2083vw, 1.125rem);")
  })
})

describe("button", () => {
  const base: ButtonSettings = {
    label: "Go & <win>", className: "btn primary", fontFamily: "inherit", fontSize: 16, fontWeight: 600, letterSpacing: 0,
    uppercase: false, paddingY: 12, paddingX: 24, radius: 8, borderWidth: 0,
    normal: { background: color("#f8a02d"), text: color("#1e1242"), border: color("#f8a02d") },
    hover: { background: color("#f37920"), text: color("#1e1242"), border: color("#f37920") },
    shadow: false, shadowY: 4, shadowBlur: 12, shadowColor: color("#000", 0.2), lift: 0, press: false,
    focusColor: color("#4b3b8c"), duration: 0,
  }

  it("writes base, hover and focus rules with a safe class name", () => {
    const css = buildButtonCss(base)
    expect(css).toContain(".btn-primary {\n  display: inline-flex;")
    expect(css).toContain("  padding: 12px 24px;")
    expect(css).toContain("  border: none;")
    expect(css).toContain(".btn-primary:hover {\n  color: #1e1242;\n  background-color: #f37920;\n}")
    expect(css).toContain(".btn-primary:focus-visible {\n  outline: 2px solid #4b3b8c;")
    expect(css).not.toContain("transition")
    expect(css).not.toContain(":active")
  })

  it("adds lift, shadow, press and transition when enabled", () => {
    const css = buildButtonCss({ ...base, borderWidth: 2, shadow: true, lift: 2, press: true, duration: 200, uppercase: true })
    expect(css).toContain("  border: 2px solid #f8a02d;")
    expect(css).toContain("  transform: translateY(-2px);\n  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);")
    expect(css).toContain(".btn-primary:active {")
    expect(css).toContain("  text-transform: uppercase;")
    expect(css).toContain("transition: color 200ms ease,")
  })

  it("escapes the label in HTML", () => {
    expect(buildButtonHtml(base)).toBe('<a href="#" class="btn-primary">Go &amp; &lt;win></a>')
  })
})

describe("animation", () => {
  const base: AnimationSettings = {
    preset: "slide-in-up", name: "slide-in-up", className: "animate", distance: 40, scale: 1.1, duration: 700, delay: 0,
    easing: "ease-out", infinite: false, iterations: 1, direction: "normal", fill: "both", reducedMotion: false,
  }

  it("writes keyframes and a compact shorthand", () => {
    expect(buildAnimationCss(base)).toBe(
      "@keyframes slide-in-up {\n  from {\n    opacity: 0;\n    transform: translateY(40px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n" +
        ".animate {\n  animation: slide-in-up 700ms ease-out both;\n}",
    )
  })

  it("includes delay, repeats and direction only when set", () => {
    expect(animationValue({ ...base, delay: 200, infinite: true, direction: "alternate", fill: "none" }, "x")).toBe("x 700ms ease-out 200ms infinite alternate")
    expect(animationValue({ ...base, iterations: 3, fill: "none" }, "x")).toBe("x 700ms ease-out 3")
  })

  it("adds a reduced-motion override and builds every preset", () => {
    expect(buildAnimationCss({ ...base, reducedMotion: true })).toContain("@media (prefers-reduced-motion: reduce) {\n  .animate {\n    animation: none;")
    for (const id of PRESET_IDS) expect(buildAnimationCss({ ...base, preset: id, name: id })).toContain(`@keyframes ${id} {`)
  })
})

describe("easing", () => {
  const base: EasingSettings = { curve: [0.16, 1, 0.3, 1], duration: 1000, compare: "none", output: "property", variableName: "ease-out-expo" }

  it("outputs properties, a variable or the bare value", () => {
    expect(buildEasingCss(base)).toBe(
      "transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);\nanimation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);",
    )
    expect(buildEasingCss({ ...base, output: "variable" })).toBe(":root {\n  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);\n}")
    expect(buildEasingCss({ ...base, output: "value" })).toBe("cubic-bezier(0.16, 1, 0.3, 1)")
  })

  it("parses pasted curves and keeps x within 0–1", () => {
    expect(parseBezier("cubic-bezier(0.4, 0, 0.2, 1);")).toEqual([0.4, 0, 0.2, 1])
    expect(parseBezier(".68 -.6 .32 1.6")).toEqual([0.68, -0.6, 0.32, 1.6])
    expect(parseBezier("1.5, 3, -1, 0")).toEqual([1, 2, 0, 0])
    expect(parseBezier("ease")).toBeNull()
    expect(parseBezier("0, 0, 1")).toBeNull()
  })
})

describe("palette", () => {
  it("builds 11 shades that pass through the base colour, light to dark", () => {
    const shades = buildShades("#f8a02d")
    expect(shades.map((s) => s.step)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
    expect(shades.filter((s) => s.isBase).map((s) => s.hex)).toEqual(["#f8a02d"])
    const l = shades.map((s) => hexToHsl(s.hex).l)
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeLessThan(l[i - 1])
  })

  it("exports CSS variables", () => {
    const css = buildPaletteCss({ base: "#1e1242", name: "navy", format: "hex", text: "#000", background: "#fff" })
    expect(css.startsWith(":root {\n  --navy-50: #")).toBe(true)
    expect(css).toContain("#1e1242;")
  })

  it("checks WCAG contrast", () => {
    expect(checkContrast("#000000", "#ffffff")).toEqual({ ratio: 21, aaNormal: true, aaLarge: true, aaaNormal: true, aaaLarge: true })
    const mid = checkContrast("#777777", "#ffffff")
    expect(mid.ratio).toBeCloseTo(4.48, 1)
    expect(mid.aaNormal).toBe(false)
    expect(mid.aaLarge).toBe(true)
  })
})

describe("css variables", () => {
  const base: VariablesSettings = {
    prefix: "Brand", useClientColors: true, colors: [{ id: "x", name: "Primary", value: "#ABC" }],
    fonts: [{ id: "f", name: "heading", value: "'Montserrat', sans-serif" }, { id: "g", name: "empty", value: " " }],
    includeSpacing: true, spaceBase: 16, includeRadius: false, radius: { sm: 4, md: 8, lg: 16 }, unit: "rem",
  }

  it("names client and custom colours uniquely", () => {
    const g = buildTokens(base, [{ name: "Primary", hex: "#f8a02d" }, { name: "Dark Navy!", hex: "#1e1242" }])
    expect(g.colors).toEqual([
      { name: "--brand-primary", value: "#f8a02d" },
      { name: "--brand-dark-navy", value: "#1e1242" },
      { name: "--brand-primary-2", value: "#aabbcc" },
    ])
    expect(g.fonts).toEqual([{ name: "--brand-font-heading", value: "'Montserrat', sans-serif" }])
    expect(g.spacing[0]).toEqual({ name: "--brand-space-2xs", value: "0.25rem" })
    expect(g.radius).toEqual([])
  })

  it("skips client colours when off and writes grouped CSS", () => {
    const css = buildVariablesCss(buildTokens({ ...base, useClientColors: false, unit: "px" }, [{ name: "x", hex: "#000" }]))
    expect(css).toContain(":root {\n  /* Colours */\n  --brand-primary: #aabbcc;")
    expect(css).toContain("  --brand-space-md: 32px;")
    expect(css).not.toContain("--brand-x")
    expect(uniqueNames(["", "a", "A"], "color")).toEqual(["color-1", "a", "a-2"])
  })
})

describe("border", () => {
  const sd = (p: Partial<BorderSide> = {}): BorderSide => ({ width: 2, style: "solid", color: color("#000"), ...p })
  const base: BorderSettings = {
    linked: true, sides: { top: sd(), right: sd(), bottom: sd(), left: sd() }, outline: false, outlineWidth: 2,
    outlineStyle: "dashed", outlineColor: color("#f8a02d"), outlineOffset: 0, radius: 0, fill: color("#fff"),
  }

  it("uses one shorthand when all sides match", () => {
    expect(buildBorder(base)).toEqual([["border", "2px solid #000000"]])
  })

  it("writes each side when they differ, and the outline", () => {
    const decls = buildBorder({
      ...base, sides: { ...base.sides, bottom: sd({ width: 4, style: "dashed" }), left: sd({ style: "none" }) },
      outline: true, outlineOffset: 4,
    })
    expect(decls).toEqual([
      ["border-top", "2px solid #000000"],
      ["border-right", "2px solid #000000"],
      ["border-bottom", "4px dashed #000000"],
      ["border-left", "none"],
      ["outline", "2px dashed #f8a02d"],
      ["outline-offset", "4px"],
    ])
  })
})

describe("scrollbar", () => {
  const base: ScrollbarSettings = {
    target: "page", className: "scroll-area", size: 12, radius: 999, padding: 3,
    track: color("#f1f5f9"), thumb: color("#1e1242"), thumbHover: color("#f8a02d"),
  }

  it("targets the whole page with webkit rules and a guarded Firefox fallback", () => {
    const css = buildScrollbarCss(base)
    expect(css.startsWith("/* Chrome, Edge, Safari */\n\n::-webkit-scrollbar {\n  width: 12px;")).toBe(true)
    expect(css).toContain("::-webkit-scrollbar-thumb {\n  background: #1e1242;\n  border-radius: 999px;\n  border: 3px solid #f1f5f9;\n}")
    expect(css).toContain("@supports not selector(::-webkit-scrollbar) {\n  html {\n    scrollbar-width: auto;\n    scrollbar-color: #1e1242 #f1f5f9;")
  })

  it("scopes to a class, uses thin in Firefox, and caps the thumb gap", () => {
    const css = buildScrollbarCss({ ...base, target: "element", className: ".my box", size: 8, padding: 10 })
    expect(css).toContain(".my-box::-webkit-scrollbar-thumb:hover {")
    expect(css).toContain("  .my-box {\n    scrollbar-width: thin;")
    expect(css).toContain("border: 3px solid")
  })
})

describe("shapes", () => {
  it("builds border and clip-path triangles", () => {
    expect(borderTriangle("up", 80, 60, "#f00")).toEqual([
      ["width", "0"], ["height", "0"],
      ["border-left", "40px solid transparent"], ["border-right", "40px solid transparent"], ["border-bottom", "60px solid #f00"],
    ])
    expect(borderTriangle("down-right", 20, 30, "#f00")).toContainEqual(["border-left", "20px solid transparent"])
    expect(clipTriangle("right", 20, 30, "#f00")).toContainEqual(["clip-path", "polygon(0 0, 100% 50%, 0 100%)"])
  })

  it("places the bubble arrow on the chosen side", () => {
    expect(arrowDecls("bottom", 30, 10, "#000")).toEqual([
      ["content", '""'], ["position", "absolute"], ["top", "100%"], ["left", "30%"], ["transform", "translateX(-50%)"],
      ["border", "10px solid transparent"], ["border-top-color", "#000"],
    ])
    expect(arrowDecls("left", 50, 8, "#000")).toContainEqual(["border-right-color", "#000"])
  })
})

describe("aspect ratio", () => {
  const base: AspectSettings = { ratio: "16/9", customW: 5, customH: 2, fit: "cover", posX: 50, posY: 50, className: "media" }

  it("writes the box and image rules", () => {
    expect(buildAspectCss(base)).toBe(
      ".media {\n  aspect-ratio: 16 / 9;\n  overflow: hidden;\n}\n\n.media img,\n.media video {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n  object-position: center;\n}",
    )
  })

  it("handles custom ratios, keyword positions and fill", () => {
    expect(buildAspectCss({ ...base, ratio: "custom", customW: 5, customH: 2 })).toContain("aspect-ratio: 5 / 2;")
    expect(aspectPosition(0, 100)).toBe("left bottom")
    expect(aspectPosition(30, 50)).toBe("30% center")
    expect(buildAspectCss({ ...base, fit: "fill", posX: 0 })).not.toContain("object-position")
  })
})
