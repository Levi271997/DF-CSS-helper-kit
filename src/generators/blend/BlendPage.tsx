import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Segmented, Select, TextField } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { usePreviewImage, useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { declsToStyle } from "@/lib/css"
import { BLEND_MODES, MODE_HELP, blendDecls, buildBlendCss, defaultClass, type BlendSettings } from "./build-css"

const defaults = (): BlendSettings => ({
  type: "mix",
  layer: "shape",
  mode: "multiply",
  color: color("#f8a02d"),
  text: "BLEND",
  imageUrl: "image.jpg",
  className: "blend-layer",
})

function Layer({ s, image, small = false }: { s: BlendSettings; image: string; small?: boolean }) {
  const style = declsToStyle(blendDecls(s, image))
  if (s.type === "background") return <div className="absolute inset-0" style={style} />
  return (
    <div className="absolute inset-0 isolate bg-cover bg-center" style={{ backgroundImage: `url("${image}")` }}>
      {s.layer === "shape" ? (
        <div className="absolute inset-y-0 left-1/4 right-0" style={style} />
      ) : (
        <div
          className={`absolute inset-0 flex items-center justify-center text-center font-heading font-extrabold leading-none ${small ? "text-2xl" : "text-[clamp(3rem,12vw,8rem)]"}`}
          style={style}
        >
          {s.text || "BLEND"}
        </div>
      )}
    </div>
  )
}

export default function BlendPage() {
  const { state, update, reset, loadedSnippet } = useToolState("blend", defaults)
  const [image, upload] = usePreviewImage()
  const css = useMemo(() => buildBlendCss(state), [state])

  return (
    <ToolLayout
      title="Blend modes"
      description="See how mix-blend-mode and background-blend-mode combine a colour or text with an image."
      tool="blend"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-4">
          <PreviewFrame onUpload={upload}>
            <Layer s={state} image={image} />
          </PreviewFrame>
          {MODE_HELP[state.mode] && <p className="text-sm text-slate-500">{MODE_HELP[state.mode]}</p>}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {BLEND_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={state.mode === mode}
                onClick={() => update({ mode })}
                className={`space-y-1 p-1 text-center transition-colors ${state.mode === mode ? "bg-accent-400/20 outline-2 outline-accent-400" : "hover:bg-slate-100"}`}
              >
                <div className="relative aspect-square overflow-hidden">
                  <Layer s={{ ...state, mode }} image={image} small />
                </div>
                <span className="block truncate font-mono text-[10px] text-slate-600">{mode}</span>
              </button>
            ))}
          </div>
        </div>
      }
      controls={
        <>
          <Section title="Type">
            <Segmented
              label="Blend type"
              value={state.type}
              onChange={(type) =>
                update({ type, className: state.className === defaultClass(state) ? defaultClass({ type }) : state.className })
              }
              options={[
                { value: "mix", label: "Layer over image" },
                { value: "background", label: "Background" },
              ]}
            />
            <p className="text-xs text-slate-500">
              {state.type === "mix"
                ? "mix-blend-mode: an element (colour block or text) blends with whatever is behind it."
                : "background-blend-mode: one element's background colour blends with its own background image."}
            </p>
            {state.type === "mix" && (
              <Segmented
                label="Layer"
                value={state.layer}
                onChange={(layer) => update({ layer })}
                options={[
                  { value: "shape", label: "Colour block" },
                  { value: "text", label: "Text" },
                ]}
              />
            )}
          </Section>

          <Section title="Blend">
            <Select label="Mode" value={state.mode} options={BLEND_MODES} onChange={(mode) => update({ mode })} />
            <ColorPicker label={state.type === "mix" && state.layer === "text" ? "Text colour" : "Colour"} value={state.color} onChange={(c) => update({ color: c })} />
            {state.type === "mix" && state.layer === "text" && (
              <TextField label="Text" value={state.text} placeholder="BLEND" onChange={(text) => update({ text })} />
            )}
          </Section>

          <Section title="Output">
            <TextField label="Class name" value={state.className} placeholder={defaultClass(state)} onChange={(className) => update({ className })} />
            {state.type === "background" && (
              <TextField label="Image URL" value={state.imageUrl} placeholder="image.jpg" onChange={(imageUrl) => update({ imageUrl })} />
            )}
          </Section>
        </>
      }
    />
  )
}
