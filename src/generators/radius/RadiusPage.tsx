import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Button, Section, Segmented, Slider, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color, toCss, type Color } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { buildRadius, randomBlob, type RadiusSettings } from "./build-css"

type Settings = RadiusSettings & { fill: Color }
type Corner = keyof RadiusSettings["corners"]

const defaults = (): Settings => ({
  mode: "corners",
  unit: "px",
  linked: true,
  corners: { tl: 24, tr: 24, br: 24, bl: 24 },
  blob: { top: 30, right: 35, bottom: 60, left: 65 },
  fill: color("#1e1242"),
})

const CORNERS: { key: Corner; label: string }[] = [
  { key: "tl", label: "Top left" },
  { key: "tr", label: "Top right" },
  { key: "br", label: "Bottom right" },
  { key: "bl", label: "Bottom left" },
]

export default function RadiusPage() {
  const { state, update, reset, loadedSnippet } = useToolState("radius", defaults)
  const decls = useMemo(() => buildRadius(state), [state])
  const max = state.unit === "%" ? 50 : 200

  const setCorner = (key: Corner, v: number) =>
    update({
      corners: state.linked ? { tl: v, tr: v, br: v, bl: v } : { ...state.corners, [key]: v },
    })

  return (
    <ToolLayout
      title="Border radius"
      description="Round individual corners, or switch to Blob mode for organic shapes."
      tool="radius"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame className="bg-slate-100">
          <div
            className="h-3/5 w-2/5 min-w-32 shadow-lg transition-[border-radius] duration-300"
            style={{ ...declsToStyle(decls), background: toCss(state.fill) }}
          />
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Mode">
            <Segmented
              label="Radius mode"
              value={state.mode}
              onChange={(mode) => update({ mode })}
              options={[
                { value: "corners", label: "Corners" },
                { value: "blob", label: "Blob" },
              ]}
            />
          </Section>

          {state.mode === "corners" ? (
            <Section
              title="Corners"
              action={
                <Segmented
                  label="Unit"
                  value={state.unit}
                  onChange={(unit) => {
                    const lim = unit === "%" ? 50 : 200
                    const c = state.corners
                    update({
                      unit,
                      corners: { tl: Math.min(c.tl, lim), tr: Math.min(c.tr, lim), br: Math.min(c.br, lim), bl: Math.min(c.bl, lim) },
                    })
                  }}
                  options={[
                    { value: "px", label: "px" },
                    { value: "%", label: "%" },
                  ]}
                />
              }
            >
              <Toggle
                label="Same value for all corners"
                checked={state.linked}
                onChange={(linked) => {
                  const v = state.corners.tl
                  update(linked ? { linked, corners: { tl: v, tr: v, br: v, bl: v } } : { linked })
                }}
              />
              {state.linked ? (
                <Slider label="All corners" unit={state.unit} min={0} max={max} value={state.corners.tl} onChange={(v) => setCorner("tl", v)} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {CORNERS.map((c) => (
                    <Slider key={c.key} label={c.label} unit={state.unit} min={0} max={max} value={state.corners[c.key]} onChange={(v) => setCorner(c.key, v)} />
                  ))}
                </div>
              )}
            </Section>
          ) : (
            <Section title="Blob shape" action={<Button variant="ghost" onClick={() => update({ blob: randomBlob() })}>Shuffle</Button>}>
              <p className="text-xs text-slate-500">Each slider moves where the curve meets that edge.</p>
              <Slider label="Top" unit="%" min={0} max={100} value={state.blob.top} onChange={(top) => update({ blob: { ...state.blob, top } })} />
              <Slider label="Right" unit="%" min={0} max={100} value={state.blob.right} onChange={(right) => update({ blob: { ...state.blob, right } })} />
              <Slider label="Bottom" unit="%" min={0} max={100} value={state.blob.bottom} onChange={(bottom) => update({ blob: { ...state.blob, bottom } })} />
              <Slider label="Left" unit="%" min={0} max={100} value={state.blob.left} onChange={(left) => update({ blob: { ...state.blob, left } })} />
            </Section>
          )}

          <Section title="Preview">
            <ColorPicker label="Fill" alpha={false} value={state.fill} onChange={(fill) => update({ fill })} />
          </Section>
        </>
      }
    />
  )
}
