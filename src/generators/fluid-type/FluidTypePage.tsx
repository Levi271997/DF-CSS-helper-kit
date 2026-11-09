import { useMemo } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Section, Segmented, Select, Slider, TextField } from "@/components/controls"
import { useToolState } from "@/components/useToolState"
import { round } from "@/lib/color"
import { RATIOS, buildFluidCss, scaleSteps, sizeAt, type FluidSettings } from "./build-css"

const defaults = (): FluidSettings => ({
  mode: "single",
  unit: "rem",
  root: 16,
  minVw: 360,
  maxVw: 1240,
  minSize: 32,
  maxSize: 56,
  baseMin: 16,
  baseMax: 18,
  ratioMin: "1.2",
  ratioMax: "1.25",
  stepsDown: 2,
  stepsUp: 5,
  prefix: "step",
  previewVw: 800,
  text: "Websites that work as hard as you do",
})

/** Size vs viewport chart: flat, then a ramp between the two breakpoints, then flat again. */
function Chart({ s }: { s: FluidSettings }) {
  const W = 600
  const H = 160
  const pad = 24
  const span = Math.max(s.maxVw - s.minVw, 1)
  const x0 = Math.max(0, s.minVw - span * 0.3)
  const x1 = s.maxVw + span * 0.3
  const yMax = Math.max(s.minSize, s.maxSize) * 1.2
  const px = (vw: number) => pad + ((vw - x0) / (x1 - x0)) * (W - pad * 2)
  const py = (size: number) => H - pad - (size / yMax) * (H - pad * 2)
  const points = [x0, s.minVw, s.maxVw, x1].map((vw) => `${px(vw)},${py(sizeAt(s.minSize, s.maxSize, s.minVw, s.maxVw, vw))}`).join(" ")
  const markerVw = Math.min(Math.max(s.previewVw, x0), x1)
  const markerSize = sizeAt(s.minSize, s.maxSize, s.minVw, s.maxVw, s.previewVw)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Font size grows from ${s.minSize}px at ${s.minVw}px wide to ${s.maxSize}px at ${s.maxVw}px wide`}>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} className="stroke-slate-300" />
      {[s.minVw, s.maxVw].map((vw) => (
        <g key={vw}>
          <line x1={px(vw)} x2={px(vw)} y1={pad / 2} y2={H - pad} className="stroke-slate-300" strokeDasharray="4 4" />
          <text x={px(vw)} y={H - 6} textAnchor="middle" className="fill-slate-500 text-[11px]">
            {vw}px
          </text>
        </g>
      ))}
      <polyline points={points} fill="none" strokeWidth={3} strokeLinejoin="round" className="stroke-brand-600" />
      <line x1={px(markerVw)} x2={px(markerVw)} y1={pad / 2} y2={H - pad} className="stroke-accent-500" strokeWidth={1.5} />
      <circle cx={px(markerVw)} cy={py(markerSize)} r={5} className="fill-accent-400 stroke-white" strokeWidth={2} />
    </svg>
  )
}

export default function FluidTypePage() {
  const { state, update, reset, loadedSnippet } = useToolState("fluid-type", defaults)
  const css = useMemo(() => buildFluidCss(state), [state])
  const steps = useMemo(() => scaleSteps(state), [state])
  const badRange = state.maxVw <= state.minVw

  const single = sizeAt(state.minSize, state.maxSize, state.minVw, state.maxVw, state.previewVw)

  return (
    <ToolLayout
      title="Fluid typography"
      description="Font sizes that scale smoothly with the screen width using clamp(). Make a single size or a whole type scale."
      tool="fluid-type"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <Slider
            label="Preview screen width"
            unit="px"
            min={240}
            max={2560}
            value={state.previewVw}
            onChange={(previewVw) => update({ previewVw })}
          />
          {state.mode === "single" ? (
            <>
              <Chart s={state} />
              <p className="text-sm text-slate-500">
                At {state.previewVw}px wide the font size is <span className="font-mono font-semibold text-brand-600">{round(single, 2)}px</span>.
              </p>
              <div className="overflow-hidden border-t border-slate-200 pt-4">
                <p className="font-heading font-bold leading-tight text-brand-600" style={{ fontSize: single }}>
                  {state.text || "Preview text"}
                </p>
              </div>
            </>
          ) : (
            <ul className="divide-y divide-slate-100">
              {steps.map((st) => {
                const size = sizeAt(st.min, st.max, state.minVw, state.maxVw, state.previewVw)
                return (
                  <li key={st.step} className="flex items-baseline gap-4 py-2">
                    <span className="w-24 shrink-0 font-mono text-xs text-slate-500">
                      {st.name}
                      <br />
                      <span className="text-brand-600">{round(size, 1)}px</span>
                    </span>
                    <span
                      className={`min-w-0 truncate leading-tight text-brand-600 ${st.step > 0 ? "font-heading font-bold" : ""}`}
                      style={{ fontSize: size }}
                    >
                      {state.text || "Preview text"}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      }
      controls={
        <>
          <Section
            title="Mode"
            action={
              <Segmented
                label="Output unit"
                value={state.unit}
                onChange={(unit) => update({ unit })}
                options={[
                  { value: "rem", label: "rem" },
                  { value: "px", label: "px" },
                ]}
              />
            }
          >
            <Segmented
              label="Mode"
              value={state.mode}
              onChange={(mode) => update({ mode })}
              options={[
                { value: "single", label: "Single size" },
                { value: "scale", label: "Type scale" },
              ]}
            />
          </Section>

          <Section title="Screen widths">
            <Slider label="Small screen" unit="px" min={240} max={1200} value={state.minVw} onChange={(minVw) => update({ minVw })} />
            <Slider label="Large screen" unit="px" min={600} max={2560} value={state.maxVw} onChange={(maxVw) => update({ maxVw })} />
            {badRange && <p className="text-xs text-rose-600">The large screen width must be bigger than the small one.</p>}
            {state.unit === "rem" && (
              <Slider label="Root font size" unit="px" min={10} max={24} value={state.root} onChange={(root) => update({ root })} />
            )}
          </Section>

          {state.mode === "single" ? (
            <Section title="Font size">
              <Slider label="On small screens" unit="px" min={8} max={160} value={state.minSize} onChange={(minSize) => update({ minSize })} />
              <Slider label="On large screens" unit="px" min={8} max={160} value={state.maxSize} onChange={(maxSize) => update({ maxSize })} />
            </Section>
          ) : (
            <Section title="Type scale">
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Base, small" unit="px" min={10} max={32} value={state.baseMin} onChange={(baseMin) => update({ baseMin })} />
                <Slider label="Base, large" unit="px" min={10} max={32} value={state.baseMax} onChange={(baseMax) => update({ baseMax })} />
              </div>
              <Select label="Ratio on small screens" value={state.ratioMin} options={RATIOS} onChange={(ratioMin) => update({ ratioMin })} />
              <Select label="Ratio on large screens" value={state.ratioMax} options={RATIOS} onChange={(ratioMax) => update({ ratioMax })} />
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Steps up" min={0} max={8} value={state.stepsUp} onChange={(stepsUp) => update({ stepsUp })} />
                <Slider label="Steps down" min={0} max={4} value={state.stepsDown} onChange={(stepsDown) => update({ stepsDown })} />
              </div>
              <TextField label="Variable prefix" value={state.prefix} placeholder="step" onChange={(prefix) => update({ prefix })} />
            </Section>
          )}

          <Section title="Preview">
            <TextField label="Sample text" value={state.text} placeholder="Preview text" onChange={(text) => update({ text })} />
          </Section>
        </>
      }
    />
  )
}
