import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Button, Section, Slider, TextField, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color, toCss } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { newId } from "@/lib/id"
import {
  buildTextShadow,
  TEXT_SHADOW_PRESETS,
  type TextShadowLayer,
  type TextShadowPreset,
  type TextShadowSettings,
} from "./build-css"

const newLayer = (): TextShadowLayer => ({ id: newId(), enabled: true, x: 2, y: 2, blur: 4, color: color("#1e1242", 0.3) })

const fromPreset = (p: TextShadowPreset) => ({
  layers: p.layers.map((l) => ({ ...l, id: newId(), enabled: true })),
  textColor: p.textColor,
  background: p.background,
})

const defaults = (): TextShadowSettings => ({
  ...fromPreset(TEXT_SHADOW_PRESETS[0]),
  text: "Digitalfeet",
  fontSize: 72,
  fontWeight: 800,
})

export default function TextShadowPage() {
  const { state, update, reset, loadedSnippet } = useToolState("text-shadow", defaults)
  const decls = useMemo(() => buildTextShadow(state), [state])

  const setLayer = (id: string, patch: Partial<TextShadowLayer>) =>
    update({ layers: state.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)) })

  const move = (index: number, dir: -1 | 1) => {
    const layers = [...state.layers]
    const [l] = layers.splice(index, 1)
    layers.splice(index + dir, 0, l)
    update({ layers })
  }

  return (
    <ToolLayout
      title="Text shadow"
      description="Stack shadow layers for glows, outlines, neon and 3D text. The first layer is drawn on top."
      tool="text-shadow"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame>
          <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: toCss(state.background) }}>
            <p
              className="max-w-full break-words text-center font-heading leading-tight"
              style={{
                ...declsToStyle(decls),
                color: toCss(state.textColor),
                fontSize: `min(${state.fontSize}px, 14vw)`,
                fontWeight: state.fontWeight,
              }}
            >
              {state.text || "Preview text"}
            </p>
          </div>
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Presets">
            <div className="flex flex-wrap gap-2">
              {TEXT_SHADOW_PRESETS.map((p) => (
                <Button key={p.name} onClick={() => update(fromPreset(p))}>
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
                      <div className="grid grid-cols-2 gap-4">
                        <Slider label="X" unit="px" min={-50} max={50} value={l.x} onChange={(v) => setLayer(l.id, { x: v })} />
                        <Slider label="Y" unit="px" min={-50} max={50} value={l.y} onChange={(v) => setLayer(l.id, { y: v })} />
                      </div>
                      <Slider label="Blur" unit="px" min={0} max={100} value={l.blur} onChange={(v) => setLayer(l.id, { blur: v })} />
                      <ColorPicker label="Color" value={l.color} onChange={(c) => setLayer(l.id, { color: c })} />
                    </>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section title="Preview text">
            <TextField label="Text" value={state.text} placeholder="Preview text" onChange={(text) => update({ text })} />
            <Slider label="Font size" unit="px" min={16} max={160} value={state.fontSize} onChange={(fontSize) => update({ fontSize })} />
            <Slider label="Font weight" min={100} max={900} step={100} value={state.fontWeight} onChange={(fontWeight) => update({ fontWeight })} />
            <ColorPicker label="Text color" value={state.textColor} onChange={(textColor) => update({ textColor })} />
            <ColorPicker label="Background" alpha={false} value={state.background} onChange={(background) => update({ background })} />
          </Section>
        </>
      }
    />
  )
}
