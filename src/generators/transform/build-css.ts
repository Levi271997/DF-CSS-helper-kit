import type { Decl } from "@/lib/css"

export interface TransformSettings {
  perspective: number
  translateX: number
  translateY: number
  translateZ: number
  rotateX: number
  rotateY: number
  rotateZ: number
  scaleX: number
  scaleY: number
  skewX: number
  skewY: number
  originX: number
  originY: number
}

export const TRANSFORM_DEFAULTS: TransformSettings = {
  perspective: 0,
  translateX: 0,
  translateY: 0,
  translateZ: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
  originX: 50,
  originY: 50,
}

export function transformValue(s: TransformSettings): string {
  const parts: string[] = []
  if (s.perspective > 0) parts.push(`perspective(${s.perspective}px)`)
  if (s.translateZ !== 0) {
    parts.push(`translate3d(${s.translateX}px, ${s.translateY}px, ${s.translateZ}px)`)
  } else if (s.translateX !== 0 || s.translateY !== 0) {
    parts.push(`translate(${s.translateX}px, ${s.translateY}px)`)
  }
  if (s.rotateX !== 0) parts.push(`rotateX(${s.rotateX}deg)`)
  if (s.rotateY !== 0) parts.push(`rotateY(${s.rotateY}deg)`)
  if (s.rotateZ !== 0) parts.push(`rotate(${s.rotateZ}deg)`)
  if (s.skewX !== 0 || s.skewY !== 0) parts.push(`skew(${s.skewX}deg, ${s.skewY}deg)`)
  if (s.scaleX !== 1 || s.scaleY !== 1) {
    parts.push(s.scaleX === s.scaleY ? `scale(${s.scaleX})` : `scale(${s.scaleX}, ${s.scaleY})`)
  }
  return parts.length ? parts.join(" ") : "none"
}

export function buildTransform(s: TransformSettings): Decl[] {
  const decls: Decl[] = [["transform", transformValue(s)]]
  if (s.originX !== 50 || s.originY !== 50) decls.push(["transform-origin", `${s.originX}% ${s.originY}%`])
  return decls
}
