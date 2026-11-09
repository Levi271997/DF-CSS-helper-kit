import { describe, expect, it } from "vitest"
import { color, hexToHsl, hexToRgb, hslToHex, isValidHex, normalizeHex, toCss } from "./color"
import { declsToCss, declsToStyle, toCamel } from "./css"

describe("color", () => {
  it("normalizes hex", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc")
    expect(normalizeHex("1a73e8")).toBe("#1a73e8")
    expect(normalizeHex("nope")).toBe("#000000")
  })

  it("validates hex", () => {
    expect(isValidHex("#fff")).toBe(true)
    expect(isValidHex("#ffff")).toBe(false)
  })

  it("converts hex to rgb", () => {
    expect(hexToRgb("#1a73e8")).toEqual({ r: 26, g: 115, b: 232 })
  })

  it("outputs hex when opaque and rgba otherwise", () => {
    expect(toCss(color("#1a73e8"))).toBe("#1a73e8")
    expect(toCss(color("#000000", 0.25))).toBe("rgba(0, 0, 0, 0.25)")
    expect(toCss(color("#000000", 0.123))).toBe("rgba(0, 0, 0, 0.12)")
  })

  it("clamps alpha", () => {
    expect(color("#fff", 5).a).toBe(1)
    expect(color("#fff", -1).a).toBe(0)
  })
})

describe("css", () => {
  it("renders declarations", () => {
    expect(declsToCss([["a", "1"], ["b", "2"]])).toBe("a: 1;\nb: 2;")
  })

  it("camel-cases properties including vendor prefixes", () => {
    expect(toCamel("box-shadow")).toBe("boxShadow")
    expect(toCamel("-webkit-backdrop-filter")).toBe("WebkitBackdropFilter")
  })

  it("builds a style object", () => {
    expect(declsToStyle([["border-radius", "4px"]])).toEqual({ borderRadius: "4px" })
  })
})

describe("hsl and contrast helpers", () => {
  it("round-trips hex through hsl", () => {
    for (const hex of ["#f8a02d", "#1e1242", "#ffffff", "#000000", "#4b3b8c"]) {
      const { h, s, l } = hexToHsl(hex)
      expect(hslToHex(h, s, l)).toBe(hex)
    }
  })
})
