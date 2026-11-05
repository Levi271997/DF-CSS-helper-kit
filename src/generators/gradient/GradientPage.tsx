import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Button, Section, Segmented, Slider, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { newId } from "@/lib/id"
import { buildGradient, gradientValue, nextStopPos, sortStops, type GradientSettings, type GradientStop } from "./build-css"

const defaults = (): GradientSettings => ({
  type: "linear",
  angle: 135,
  shape: "ellipse",
  posX: 50,
  posY: 50,
  repeating: false,
  stops: [
    { id: newId(), color: color("#1e1242"), pos: 0 },
    { id: newId(), color: color("#f8a02d"), pos: 100 },
  ],
})

export default function GradientPage() {
  const { state, update, reset, loadedSnippet } = useToolState("gradient", defaults)
  const decls = useMemo(() => buildGradient(state), [state])
  const stops = sortStops(state.stops)

  const setStop = (id: string, patch: Partial<GradientStop>) =>
    update({ stops: state.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)) })

  const addStop = () => {
    const pos = nextStopPos(state.stops)
    const near = stops.reduce((a, b) => (Math.abs(b.pos - pos) < Math.abs(a.pos - pos) ? b : a), stops[0])
    update({ stops: [...state.stops, { id: newId(), color: { ...near.color }, pos }] })
  }

  return (
    <ToolLayout
      title="Gradients"
      description="Linear, radial and conic gradients with any number of color stops."
      tool="gradient"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame className="checker">
          <div className="absolute inset-0" style={declsToStyle(decls)} />
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Type">
            <Segmented
              label="Gradient type"
              value={state.type}
              onChange={(type) => update({ type })}
              options={[
                { value: "linear", label: "Linear" },
                { value: "radial", label: "Radial" },
                { value: "conic", label: "Conic" },
              ]}
            />
            {state.type !== "radial" && (
              <Slider label={state.type === "conic" ? "Start angle" : "Angle"} unit="deg" min={0} max={360} value={state.angle} onChange={(v) => update({ angle: v })} />
            )}
            {state.type === "radial" && (
              <Segmented
                label="Radial shape"
                value={state.shape}
                onChange={(shape) => update({ shape })}
                options={[
                  { value: "ellipse", label: "Ellipse" },
                  { value: "circle", label: "Circle" },
                ]}
              />
            )}
            {state.type !== "linear" && (
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Center X" unit="%" min={0} max={100} value={state.posX} onChange={(v) => update({ posX: v })} />
                <Slider label="Center Y" unit="%" min={0} max={100} value={state.posY} onChange={(v) => update({ posY: v })} />
              </div>
            )}
            <Toggle label="Repeating" checked={state.repeating} onChange={(v) => update({ repeating: v })} />
          </Section>

          <Section title={`Stops (${state.stops.length})`} action={<Button variant="ghost" onClick={addStop}>+ Add stop</Button>}>
            <div
              className="checker h-6 rounded-md border border-slate-200"
              aria-hidden
            >
              <div className="h-full rounded-md" style={{ background: gradientValue({ ...state, type: "linear", angle: 90, repeating: false }) }} />
            </div>
            <div className="space-y-4">
              {/* Listed in insertion order so cards don't jump while a position slider is dragged. */}
              {state.stops.map((s, i) => (
                <div key={s.id} className="space-y-3 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">Stop {i + 1}</span>
                    <Button
                      variant="danger"
                      aria-label={`Remove stop ${i + 1}`}
                      disabled={state.stops.length <= 2}
                      onClick={() => update({ stops: state.stops.filter((x) => x.id !== s.id) })}
                    >
                      ✕
                    </Button>
                  </div>
                  <ColorPicker label="Color" value={s.color} onChange={(c) => setStop(s.id, { color: c })} />
                  <Slider label="Position" unit="%" min={0} max={100} value={s.pos} onChange={(v) => setStop(s.id, { pos: v })} />
                </div>
              ))}
            </div>
          </Section>
        </>
      }
    />
  )
}
