import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Segmented, Select, Slider, TextField } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { HtmlPanel } from "@/components/HtmlPanel"
import { useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { ARROW_SIDES, DIRECTIONS, buildShapesCss, buildShapesHtml, type ShapesSettings } from "./build-css"

const defaults = (): ShapesSettings => ({
  mode: "bubble",
  className: "tooltip",
  direction: "up",
  method: "border",
  width: 80,
  height: 60,
  color: color("#f8a02d"),
  side: "bottom",
  position: 50,
  arrowSize: 10,
  background: color("#1e1242"),
  textColor: color("#ffffff"),
  radius: 8,
  padding: 12,
  text: "Free quote in 24 hours",
})

const PREVIEW = ".dfshape-preview"
const DEFAULT_CLASS = { triangle: "triangle", bubble: "tooltip" } as const

export default function ShapesPage() {
  const { state, update, reset, loadedSnippet } = useToolState("shapes", defaults)
  const css = useMemo(() => buildShapesCss(state), [state])
  const previewCss = useMemo(() => buildShapesCss(state, PREVIEW), [state])
  const html = useMemo(() => buildShapesHtml(state), [state])

  return (
    <ToolLayout
      title="Triangles and shapes"
      description="Pure-CSS triangles, and tooltips or speech bubbles with an arrow on any side."
      tool="shapes"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame className="bg-slate-100">
          <style>{previewCss}</style>
          {state.mode === "triangle" ? (
            <div className="dfshape-preview" />
          ) : (
            <div className="dfshape-preview max-w-[70%] text-center text-sm font-medium">{state.text || "Tooltip"}</div>
          )}
        </PreviewFrame>
      }
      below={<HtmlPanel html={html} />}
      controls={
        <>
          <Section title="Shape">
            <Segmented
              label="Shape"
              value={state.mode}
              onChange={(mode) =>
                update({
                  mode,
                  // Swap the class name too, unless it's been customised.
                  className: state.className === DEFAULT_CLASS[state.mode] ? DEFAULT_CLASS[mode] : state.className,
                })
              }
              options={[
                { value: "bubble", label: "Tooltip / bubble" },
                { value: "triangle", label: "Triangle" },
              ]}
            />
            <TextField label="Class name" value={state.className} placeholder={DEFAULT_CLASS[state.mode]} onChange={(className) => update({ className })} />
          </Section>

          {state.mode === "triangle" ? (
            <Section title="Triangle">
              <div className="grid grid-cols-2 gap-4">
                <Select label="Points" value={state.direction} options={DIRECTIONS} onChange={(direction) => update({ direction })} />
                <Select
                  label="Built with"
                  value={state.method}
                  options={[
                    { value: "border", label: "borders" },
                    { value: "clip-path", label: "clip-path" },
                  ]}
                  onChange={(method) => update({ method })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Width" unit="px" min={4} max={300} value={state.width} onChange={(width) => update({ width })} />
                <Slider label="Height" unit="px" min={4} max={300} value={state.height} onChange={(height) => update({ height })} />
              </div>
              <ColorPicker label="Colour" value={state.color} onChange={(c) => update({ color: c })} />
              <p className="text-xs text-slate-500">
                Borders work everywhere and can't be clipped by overflow. clip-path is simpler to size and can use gradients or images as the fill.
              </p>
            </Section>
          ) : (
            <>
              <Section title="Arrow">
                <Segmented
                  label="Arrow side"
                  value={state.side}
                  onChange={(side) => update({ side })}
                  options={ARROW_SIDES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))}
                />
                <Slider label="Position along side" unit="%" min={5} max={95} value={state.position} onChange={(position) => update({ position })} />
                <Slider label="Arrow size" unit="px" min={2} max={40} value={state.arrowSize} onChange={(arrowSize) => update({ arrowSize })} />
              </Section>
              <Section title="Bubble">
                <TextField label="Text" value={state.text} placeholder="Tooltip" onChange={(text) => update({ text })} />
                <div className="grid grid-cols-2 gap-4">
                  <Slider label="Padding" unit="px" min={0} max={40} value={state.padding} onChange={(padding) => update({ padding })} />
                  <Slider label="Radius" unit="px" min={0} max={40} value={state.radius} onChange={(radius) => update({ radius })} />
                </div>
                <ColorPicker label="Background" alpha={false} value={state.background} onChange={(background) => update({ background })} />
                <ColorPicker label="Text colour" alpha={false} value={state.textColor} onChange={(textColor) => update({ textColor })} />
              </Section>
            </>
          )}
        </>
      }
    />
  )
}
