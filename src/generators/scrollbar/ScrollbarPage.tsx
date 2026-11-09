import { useMemo } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Section, Segmented, Slider, TextField } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { buildScrollbarCss, type ScrollbarSettings } from "./build-css"

const defaults = (): ScrollbarSettings => ({
  target: "page",
  className: "scroll-area",
  size: 12,
  radius: 999,
  padding: 3,
  track: color("#f1f5f9"),
  thumb: color("#1e1242"),
  thumbHover: color("#f8a02d"),
})

const PREVIEW = ".dfscroll-preview"

const PARAGRAPHS = Array.from({ length: 8 }, (_, i) => i)

export default function ScrollbarPage() {
  const { state, update, reset, loadedSnippet } = useToolState("scrollbar", defaults)
  const css = useMemo(() => buildScrollbarCss(state), [state])
  const previewCss = useMemo(() => buildScrollbarCss(state, PREVIEW), [state])

  return (
    <ToolLayout
      title="Scrollbar"
      description="Custom scrollbars that work in Chrome, Edge and Safari, with matching colours in Firefox."
      tool="scrollbar"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-2">
          <style>{previewCss}</style>
          <div className="dfscroll-preview h-80 overflow-auto rounded-xl border border-slate-200 bg-white p-5">
            <div className="w-[140%] space-y-3 text-sm leading-relaxed text-slate-600">
              <h3 className="font-heading text-lg font-bold text-brand-600">Scroll me, both ways</h3>
              {PARAGRAPHS.map((i) => (
                <p key={i}>
                  Good websites are built to last. We look after hosting, updates, backups and security so your site keeps working while
                  you focus on running your business. This paragraph is here so the box has something to scroll through.
                </p>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Firefox only supports colours and a thin or normal width, so size, rounding and hover colour won't show there.
          </p>
        </div>
      }
      controls={
        <>
          <Section title="Apply to">
            <Segmented
              label="Apply scrollbar to"
              value={state.target}
              onChange={(target) => update({ target })}
              options={[
                { value: "page", label: "Whole page" },
                { value: "element", label: "One element" },
              ]}
            />
            {state.target === "element" && (
              <TextField label="Class name" value={state.className} placeholder="scroll-area" onChange={(className) => update({ className })} />
            )}
          </Section>

          <Section title="Size">
            <Slider label="Thickness" unit="px" min={2} max={24} value={state.size} onChange={(size) => update({ size })} />
            <Slider label="Thumb rounding" unit="px" min={0} max={999} value={state.radius} onChange={(radius) => update({ radius })} />
            <Slider label="Gap around thumb" unit="px" min={0} max={Math.max(0, Math.floor(state.size / 2) - 1)} value={state.padding} onChange={(padding) => update({ padding })} />
          </Section>

          <Section title="Colours">
            <ColorPicker label="Track" value={state.track} onChange={(track) => update({ track })} />
            <ColorPicker label="Thumb" value={state.thumb} onChange={(thumb) => update({ thumb })} />
            <ColorPicker label="Thumb on hover" value={state.thumbHover} onChange={(thumbHover) => update({ thumbHover })} />
          </Section>
        </>
      }
    />
  )
}
