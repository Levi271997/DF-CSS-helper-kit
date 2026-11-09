import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Select, Slider, TextField, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { usePreviewImage, useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { ATTACHMENTS, REPEATS, SIZES, buildBackground, type BackgroundSettings } from "./build-css"

const defaults = (): BackgroundSettings => ({
  color: color("#1e1242"),
  image: true,
  imageUrl: "/images/hero.jpg",
  size: "cover",
  sizePercent: 50,
  posX: 50,
  posY: 50,
  repeat: "no-repeat",
  attachment: "scroll",
  overlay: false,
  overlayColor: color("#131028", 0.45),
})

export default function BackgroundPage() {
  const { state, update, reset, loadedSnippet } = useToolState("background", defaults)
  const [image, upload] = usePreviewImage()
  const css = useMemo(() => declsToCss(buildBackground(state)), [state])
  // Preview shows the built-in scene or an uploaded image in place of the URL.
  const style = useMemo(() => declsToStyle(buildBackground(state, image)), [state, image])

  return (
    <ToolLayout
      title="Background"
      description="Background color, image sizing, position, repeat and an optional color overlay."
      tool="background"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame onUpload={state.image ? upload : undefined} className="checker">
          <div className="absolute inset-0" style={style} />
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Color">
            <ColorPicker label="Background color" value={state.color} onChange={(c) => update({ color: c })} />
          </Section>
          <Section title="Image" action={<Toggle label="On" checked={state.image} onChange={(v) => update({ image: v })} />}>
            {state.image && (
              <>
                <TextField
                  label="Image URL (used in the CSS)"
                  value={state.imageUrl}
                  placeholder="/images/hero.jpg"
                  onChange={(v) => update({ imageUrl: v })}
                />
                <Select label="Size" value={state.size} options={SIZES} onChange={(v) => update({ size: v })} />
                {state.size === "custom" && (
                  <Slider label="Width" unit="%" min={5} max={200} value={state.sizePercent} onChange={(v) => update({ sizePercent: v })} />
                )}
                <Slider label="Position X" unit="%" min={0} max={100} value={state.posX} onChange={(v) => update({ posX: v })} />
                <Slider label="Position Y" unit="%" min={0} max={100} value={state.posY} onChange={(v) => update({ posY: v })} />
                <Select label="Repeat" value={state.repeat} options={REPEATS} onChange={(v) => update({ repeat: v })} />
                <Select label="Attachment" value={state.attachment} options={ATTACHMENTS} onChange={(v) => update({ attachment: v })} />
              </>
            )}
          </Section>
          {state.image && (
            <Section title="Overlay" action={<Toggle label="On" checked={state.overlay} onChange={(v) => update({ overlay: v })} />}>
              {state.overlay && (
                <ColorPicker label="Overlay color" value={state.overlayColor} onChange={(c) => update({ overlayColor: c })} />
              )}
            </Section>
          )}
        </>
      }
    />
  )
}
