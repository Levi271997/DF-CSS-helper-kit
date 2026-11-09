import { describe, expect, it } from "vitest"
import { color } from "@/lib/color"
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
