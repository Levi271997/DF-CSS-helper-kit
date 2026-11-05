import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Slider } from "@/components/controls"
import { useToolState } from "@/components/useToolState"
import { declsToCss, declsToStyle } from "@/lib/css"
import { buildTransform, TRANSFORM_DEFAULTS, type TransformSettings } from "./build-css"

const defaults = (): TransformSettings => ({ ...TRANSFORM_DEFAULTS })

export default function TransformPage() {
  const { state, update, reset, loadedSnippet } = useToolState("transform", defaults)
  const decls = useMemo(() => buildTransform(state), [state])
  const s = state
  const num = (key: keyof TransformSettings) => (v: number) => update({ [key]: v } as Partial<TransformSettings>)

  return (
    <ToolLayout
      title="Transforms"
      description="Translate, rotate, skew and scale in 2D or 3D. Add perspective to see 3D rotation and Z translation."
      tool="transform"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame className="bg-slate-100">
          {/* Outline of the untransformed element for reference */}
          <div className="absolute h-32 w-32 rounded-xl border-2 border-dashed border-slate-300 sm:h-40 sm:w-40" />
          <div
            className="relative flex h-32 w-32 items-center justify-center rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-lg sm:h-40 sm:w-40"
            style={declsToStyle(decls)}
          >
            Element
            <span
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500"
              style={{ left: `${s.originX}%`, top: `${s.originY}%` }}
              title="Transform origin"
            />
          </div>
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Translate">
            <div className="grid grid-cols-2 gap-4">
              <Slider label="X" unit="px" min={-200} max={200} value={s.translateX} onChange={num("translateX")} />
              <Slider label="Y" unit="px" min={-200} max={200} value={s.translateY} onChange={num("translateY")} />
            </div>
            <Slider label="Z" unit="px" min={-300} max={300} value={s.translateZ} onChange={num("translateZ")} />
          </Section>
          <Section title="Rotate">
            <Slider label="Rotate" unit="deg" min={-180} max={180} value={s.rotateZ} onChange={num("rotateZ")} />
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Tilt X" unit="deg" min={-180} max={180} value={s.rotateX} onChange={num("rotateX")} />
              <Slider label="Tilt Y" unit="deg" min={-180} max={180} value={s.rotateY} onChange={num("rotateY")} />
            </div>
          </Section>
          <Section title="Skew">
            <div className="grid grid-cols-2 gap-4">
              <Slider label="X" unit="deg" min={-60} max={60} value={s.skewX} onChange={num("skewX")} />
              <Slider label="Y" unit="deg" min={-60} max={60} value={s.skewY} onChange={num("skewY")} />
            </div>
          </Section>
          <Section title="Scale">
            <div className="grid grid-cols-2 gap-4">
              <Slider label="X" min={0} max={3} step={0.05} value={s.scaleX} onChange={num("scaleX")} />
              <Slider label="Y" min={0} max={3} step={0.05} value={s.scaleY} onChange={num("scaleY")} />
            </div>
          </Section>
          <Section title="3D & origin">
            <Slider label="Perspective" unit="px" min={0} max={2000} step={10} value={s.perspective} onChange={num("perspective")} />
            {s.perspective === 0 && (s.rotateX !== 0 || s.rotateY !== 0 || s.translateZ !== 0) && (
              <p className="text-xs text-amber-700">Tip: set a perspective to see 3D tilt and Z depth.</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Origin X" unit="%" min={0} max={100} value={s.originX} onChange={num("originX")} />
              <Slider label="Origin Y" unit="%" min={0} max={100} value={s.originY} onChange={num("originY")} />
            </div>
          </Section>
        </>
      }
    />
  )
}
