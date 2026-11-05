import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Button, Section, Slider, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color, toCss } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { newId } from "@/lib/id"
import { buildShadow, SHADOW_PRESETS, type ShadowLayer, type ShadowSettings } from "./build-css"

const newLayer = (): ShadowLayer => ({
  id: newId(), enabled: true, inset: false, x: 0, y: 8, blur: 24, spread: -4, color: color("#0f172a", 0.2),
})

const defaults = (): ShadowSettings => ({
  layers: SHADOW_PRESETS[1].layers.map((l) => ({ ...l, id: newId(), enabled: true })),
  boxColor: color("#ffffff"),
  radius: 16,
})

export default function ShadowPage() {
  const { state, update, reset, loadedSnippet } = useToolState("shadow", defaults)
  const decls = useMemo(() => buildShadow(state), [state])

  const setLayer = (id: string, patch: Partial<ShadowLayer>) =>
    update({ layers: state.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })

  const move = (index: number, dir: -1 | 1) => {
    const layers = [...state.layers]
    const [l] = layers.splice(index, 1)
    layers.splice(index + dir, 0, l)
    update({ layers })
  }

  return (
    <ToolLayout
      title="Box shadow"
      description="Stack shadow layers for realistic depth. Layers render top to bottom in the order listed."
      tool="shadow"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame className="bg-slate-100">
          <div
            className="h-2/5 w-2/5 min-w-32"
            style={{ ...declsToStyle(decls), background: toCss(state.boxColor), borderRadius: state.radius }}
          />
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Presets">
            <div className="flex flex-wrap gap-2">
              {SHADOW_PRESETS.map((p) => (
                <Button
                  key={p.name}
                  onClick={() => update({ layers: p.layers.map((l) => ({ ...l, id: newId(), enabled: true })) })}
                >
                  {p.name}
                </Button>
              ))}
            </div>
          </Section>

          <Section
            title={`Layers (${state.layers.length})`}
            action={
              <Button variant="ghost" onClick={() => update({ layers: [...state.layers, newLayer()] })}>
                + Add layer
              </Button>
            }
          >
            {state.layers.length === 0 && <p className="text-sm text-slate-500">No layers — add one or pick a preset.</p>}
            <div className="space-y-4">
              {state.layers.map((l, i) => (
                <div key={l.id} className="space-y-4 rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Toggle label={<span className="font-medium">Layer {i + 1}</span>} checked={l.enabled} onChange={(v) => setLayer(l.id, { enabled: v })} />
                    <div className="flex items-center">
                      <Button variant="ghost" aria-label="Move layer up" disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
                      <Button variant="ghost" aria-label="Move layer down" disabled={i === state.layers.length - 1} onClick={() => move(i, 1)}>↓</Button>
                      <Button variant="danger" aria-label={`Remove layer ${i + 1}`} onClick={() => update({ layers: state.layers.filter((x) => x.id !== l.id) })}>✕</Button>
                    </div>
                  </div>
                  {l.enabled && (
                    <>
                      <Toggle label="Inset" checked={l.inset} onChange={(v) => setLayer(l.id, { inset: v })} />
                      <div className="grid grid-cols-2 gap-4">
                        <Slider label="X" unit="px" min={-100} max={100} value={l.x} onChange={(v) => setLayer(l.id, { x: v })} />
                        <Slider label="Y" unit="px" min={-100} max={100} value={l.y} onChange={(v) => setLayer(l.id, { y: v })} />
                        <Slider label="Blur" unit="px" min={0} max={150} value={l.blur} onChange={(v) => setLayer(l.id, { blur: v })} />
                        <Slider label="Spread" unit="px" min={-50} max={50} value={l.spread} onChange={(v) => setLayer(l.id, { spread: v })} />
                      </div>
                      <ColorPicker label="Color" value={l.color} onChange={(c) => setLayer(l.id, { color: c })} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Preview box">
            <ColorPicker label="Box color" alpha={false} value={state.boxColor} onChange={(c) => update({ boxColor: c })} />
            <Slider label="Corner radius" unit="px" min={0} max={80} value={state.radius} onChange={(v) => update({ radius: v })} />
          </Section>
        </>
      }
    />
  )
}
