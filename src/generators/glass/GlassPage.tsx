import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Slider, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { usePreviewImage, useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { buildGlass, type GlassSettings } from "./build-css"

const defaults = (): GlassSettings => ({
  tint: color("#ffffff", 0.18),
  blur: 14,
  saturate: 160,
  radius: 20,
  borderWidth: 1,
  borderColor: color("#ffffff", 0.35),
  shadow: true,
  shadowY: 10,
  shadowBlur: 40,
  shadowColor: color("#1e1242", 0.2),
})

export default function GlassPage() {
  const { state, update, reset, loadedSnippet } = useToolState("glass", defaults)
  const [image, upload] = usePreviewImage()
  const decls = useMemo(() => buildGlass(state), [state])

  return (
    <ToolLayout
      title="Glassmorphism"
      description="Frosted-glass panels with backdrop blur. Works best over colorful or busy backgrounds."
      tool="glass"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame background={image} onUpload={upload}>
          <div className="w-3/5 max-w-sm space-y-3 p-6 text-white" style={declsToStyle(decls)}>
            <div className="h-10 w-10 rounded-full bg-white/40" />
            <p className="text-lg font-semibold">Glass card</p>
            <p className="text-sm opacity-80">Content stays readable while the background shows through.</p>
          </div>
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Surface">
            <ColorPicker label="Tint" value={state.tint} onChange={(c) => update({ tint: c })} />
            <Slider label="Blur" unit="px" min={0} max={40} value={state.blur} onChange={(v) => update({ blur: v })} />
            <Slider label="Saturation" unit="%" min={50} max={250} value={state.saturate} onChange={(v) => update({ saturate: v })} />
            <Slider label="Corner radius" unit="px" min={0} max={60} value={state.radius} onChange={(v) => update({ radius: v })} />
          </Section>
          <Section title="Border">
            <Slider label="Width" unit="px" min={0} max={6} value={state.borderWidth} onChange={(v) => update({ borderWidth: v })} />
            {state.borderWidth > 0 && (
              <ColorPicker label="Color" value={state.borderColor} onChange={(c) => update({ borderColor: c })} />
            )}
          </Section>
          <Section title="Shadow" action={<Toggle label="On" checked={state.shadow} onChange={(v) => update({ shadow: v })} />}>
            {state.shadow && (
              <>
                <Slider label="Offset Y" unit="px" min={0} max={60} value={state.shadowY} onChange={(v) => update({ shadowY: v })} />
                <Slider label="Blur" unit="px" min={0} max={120} value={state.shadowBlur} onChange={(v) => update({ shadowBlur: v })} />
                <ColorPicker label="Color" value={state.shadowColor} onChange={(c) => update({ shadowColor: c })} />
              </>
            )}
          </Section>
        </>
      }
    />
  )
}
