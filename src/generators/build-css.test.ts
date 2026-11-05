import { describe, expect, it } from "vitest"
import { color } from "@/lib/color"
import { buildShadow, type ShadowLayer } from "./shadow/build-css"
import { buildGlass, type GlassSettings } from "./glass/build-css"
import { buildFilters, type FiltersSettings } from "./filters/build-css"
import { buildGradient, nextStopPos, type GradientSettings } from "./gradient/build-css"
import { buildClip, insertIndex } from "./clip-path/build-css"
import { buildTransform, TRANSFORM_DEFAULTS } from "./transform/build-css"
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
