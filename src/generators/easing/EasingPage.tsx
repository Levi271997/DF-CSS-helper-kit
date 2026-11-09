import { useEffect, useId, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Segmented, Slider, TextField } from "@/components/controls"
import { useToolState } from "@/components/useToolState"
import {
  EASING_PRESETS,
  Y_MAX,
  Y_MIN,
  bezierValue,
  buildEasingCss,
  normalizeCurve,
  parseBezier,
  type Bezier,
  type EasingSettings,
} from "./build-css"

const defaults = (): EasingSettings => ({
  curve: [0.16, 1, 0.3, 1],
  duration: 1200,
  compare: "linear",
  output: "property",
  variableName: "ease-custom",
})

// Editor geometry: S px per unit, showing y from -0.4 to 1.4 so overshoot is visible.
const S = 200
const PAD = 20
const Y_TOP = 1.4
const Y_BOTTOM = -0.4
const W = S + PAD * 2
const H = (Y_TOP - Y_BOTTOM) * S + PAD * 2
const sx = (x: number) => PAD + x * S
const sy = (y: number) => PAD + (Y_TOP - y) * S

function CurveEditor({ curve, onChange }: { curve: Bezier; onChange: (c: Bezier) => void }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState<0 | 1 | null>(null)
  const [x1, y1, x2, y2] = curve

  const toCurve = (e: ReactPointerEvent) => {
    const svg = svgRef.current
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: (pt.x - PAD) / S, y: Y_TOP - (pt.y - PAD) / S }
  }

  const move = (e: ReactPointerEvent) => {
    if (dragging === null) return
    const p = toCurve(e)
    if (!p) return
    onChange(normalizeCurve(dragging === 0 ? [p.x, p.y, x2, y2] : [x1, y1, p.x, p.y]))
  }

  const handle = (i: 0 | 1, x: number, y: number, label: string) => (
    <g>
      <line x1={sx(i)} y1={sy(i)} x2={sx(x)} y2={sy(y)} className="stroke-slate-400" strokeWidth={1.5} />
      <circle
        cx={sx(x)}
        cy={sy(y)}
        r={10}
        tabIndex={0}
        role="slider"
        aria-label={label}
        aria-valuetext={`${x}, ${y}`}
        className={`cursor-grab stroke-white outline-none focus-visible:stroke-brand-600 ${i === 0 ? "fill-accent-400" : "fill-brand-500"} ${
          dragging === i ? "cursor-grabbing" : ""
        }`}
        strokeWidth={3}
        onPointerDown={(e) => {
          e.preventDefault()
          svgRef.current?.setPointerCapture(e.pointerId)
          setDragging(i)
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.1 : 0.01
          const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key]
          if (!d) return
          e.preventDefault()
          onChange(normalizeCurve(i === 0 ? [x1 + d[0], y1 + d[1], x2, y2] : [x1, y1, x2 + d[0], y2 + d[1]]))
        }}
      />
    </g>
  )

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-64 touch-none select-none overflow-visible"
      onPointerMove={move}
      onPointerUp={() => setDragging(null)}
      onPointerCancel={() => setDragging(null)}
    >
      {/* 0–1 box */}
      <rect x={sx(0)} y={sy(1)} width={S} height={S} className="fill-slate-50 stroke-slate-200" />
      <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} className="stroke-slate-200" strokeDasharray="4 4" />
      <text x={sx(0)} y={sy(0) + 14} className="fill-slate-400 text-[10px]">time →</text>
      <text x={sx(0) - 4} y={sy(1) - 6} className="fill-slate-400 text-[10px]">progress</text>
      <path
        d={`M ${sx(0)} ${sy(0)} C ${sx(x1)} ${sy(y1)}, ${sx(x2)} ${sy(y2)}, ${sx(1)} ${sy(1)}`}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        className="stroke-brand-600"
      />
      {handle(0, x1, y1, "Start handle")}
      {handle(1, x2, y2, "End handle")}
    </svg>
  )
}

function Lane({ label, timing, duration }: { label: string; timing: string; duration: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-mono">{timing}</span>
      </div>
      <div className="relative h-9 rounded-full bg-slate-100">
        <div
          key={`${timing}-${duration}`}
          className="absolute top-1 h-7 w-7 rounded-full bg-accent-400 shadow"
          style={{ animation: `dfease-move ${duration}ms ${timing} infinite alternate` }}
        />
      </div>
    </div>
  )
}

function BezierInput({ curve, onChange }: { curve: Bezier; onChange: (c: Bezier) => void }) {
  const id = useId()
  const [draft, setDraft] = useState(bezierValue(curve))
  const [error, setError] = useState(false)
  useEffect(() => {
    setDraft(bezierValue(curve))
    setError(false)
  }, [curve])

  const commit = () => {
    const parsed = parseBezier(draft)
    if (parsed) onChange(parsed)
    else setError(true)
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-slate-700">
        Paste a curve
      </label>
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setError(false)
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        aria-invalid={error}
        className={`w-full rounded-md border bg-white px-2.5 py-1.5 font-mono text-sm text-slate-700 ${error ? "border-rose-400" : "border-slate-200"}`}
      />
      {error && <p className="text-xs text-rose-600">Use four numbers, e.g. cubic-bezier(0.4, 0, 0.2, 1).</p>}
    </div>
  )
}

export default function EasingPage() {
  const { state, update, reset, loadedSnippet } = useToolState("easing", defaults)
  const css = useMemo(() => buildEasingCss(state), [state])
  const value = bezierValue(state.curve)
  const [x1, y1, x2, y2] = state.curve
  const setCurve = (curve: Bezier) => update({ curve })
  const setPart = (i: number, v: number) => setCurve(normalizeCurve(state.curve.map((c, j) => (j === i ? v : c)) as Bezier))

  return (
    <ToolLayout
      title="Easing curve"
      description="Drag the two handles to shape a cubic-bezier() curve. The ball moves with your curve so you can feel the timing."
      tool="easing"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="grid items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-[auto_minmax(0,1fr)]">
          <style>{`@keyframes dfease-move { from { left: 4px; } to { left: calc(100% - 32px); } }`}</style>
          <div className="flex justify-center">
            <CurveEditor curve={state.curve} onChange={setCurve} />
          </div>
          <div className="space-y-5">
            <Lane label="Your curve" timing={value} duration={state.duration} />
            {state.compare !== "none" && <Lane label="Compare" timing={state.compare} duration={state.duration} />}
            <p className="text-xs text-slate-500">Tip: focus a handle and use the arrow keys to nudge it (hold Shift for bigger steps).</p>
          </div>
        </div>
      }
      controls={
        <>
          <Section title="Presets">
            <div className="flex flex-wrap gap-2">
              {EASING_PRESETS.map((p) => (
                <Button
                  key={p.name}
                  variant={p.curve.every((v, i) => v === state.curve[i]) ? "primary" : "secondary"}
                  onClick={() => setCurve(p.curve)}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </Section>

          <Section title="Curve">
            <div className="grid grid-cols-2 gap-4">
              <Slider label="X1" min={0} max={1} step={0.01} value={x1} onChange={(v) => setPart(0, v)} />
              <Slider label="Y1" min={Y_MIN} max={Y_MAX} step={0.01} value={y1} onChange={(v) => setPart(1, v)} />
              <Slider label="X2" min={0} max={1} step={0.01} value={x2} onChange={(v) => setPart(2, v)} />
              <Slider label="Y2" min={Y_MIN} max={Y_MAX} step={0.01} value={y2} onChange={(v) => setPart(3, v)} />
            </div>
            <BezierInput curve={state.curve} onChange={setCurve} />
          </Section>

          <Section title="Preview">
            <Slider label="Duration" unit="ms" min={200} max={4000} step={100} value={state.duration} onChange={(duration) => update({ duration })} />
            <Segmented
              label="Compare with"
              value={state.compare}
              onChange={(compare) => update({ compare })}
              options={[
                { value: "none", label: "None" },
                { value: "linear", label: "linear" },
                { value: "ease", label: "ease" },
              ]}
            />
          </Section>

          <Section title="Output">
            <Segmented
              label="Output format"
              value={state.output}
              onChange={(output) => update({ output })}
              options={[
                { value: "property", label: "Properties" },
                { value: "variable", label: "CSS variable" },
                { value: "value", label: "Value only" },
              ]}
            />
            {state.output === "variable" && (
              <TextField label="Variable name" value={state.variableName} placeholder="ease-custom" onChange={(variableName) => update({ variableName })} />
            )}
          </Section>
        </>
      }
    />
  )
}
