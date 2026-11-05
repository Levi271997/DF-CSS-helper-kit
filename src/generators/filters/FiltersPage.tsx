import { useMemo } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Segmented, Slider, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { usePreviewImage, useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { buildFilters, FILTER_DEFS, type FilterItem, type FiltersSettings } from "./build-css"

const defaults = (): FiltersSettings => ({
  target: "filter",
  items: FILTER_DEFS.map((d) => ({ key: d.key, enabled: false, value: d.neutral })),
  dropShadow: { enabled: false, x: 0, y: 8, blur: 16, color: color("#1e1242", 0.35) },
})

export default function FiltersPage() {
  const { state, update, reset, loadedSnippet } = useToolState("filters", defaults)
  const [image, upload] = usePreviewImage()
  const decls = useMemo(() => buildFilters(state), [state])
  const style = declsToStyle(decls)

  const setItem = (key: string, patch: Partial<FilterItem>) =>
    update({ items: state.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) })

  return (
    <ToolLayout
      title="Filters"
      description="Adjust images with CSS filters, or apply them to whatever is behind an element with backdrop-filter."
      tool="filters"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        state.target === "filter" ? (
          <PreviewFrame className="bg-slate-100" onUpload={upload}>
            <img src={image} alt="Filter preview" className="h-4/5 w-4/5 rounded-lg object-cover" style={style} />
          </PreviewFrame>
        ) : (
          <PreviewFrame background={image} onUpload={upload}>
            <div className="flex h-1/2 w-1/2 items-center justify-center rounded-xl border border-white/40 text-sm font-medium text-white" style={style}>
              backdrop-filter
            </div>
          </PreviewFrame>
        )
      }
      controls={
        <>
          <Section title="Apply to">
            <Segmented
              label="Filter target"
              value={state.target}
              onChange={(target) => update({ target })}
              options={[
                { value: "filter", label: "Element (filter)" },
                { value: "backdrop-filter", label: "Backdrop" },
              ]}
            />
          </Section>
          <Section title="Adjustments">
            <div className="space-y-4">
              {FILTER_DEFS.map((d) => {
                const item = state.items.find((i) => i.key === d.key) ?? { key: d.key, enabled: false, value: d.neutral }
                return (
                  <div key={d.key} className="space-y-3">
                    <Toggle label={d.label} checked={item.enabled} onChange={(v) => setItem(d.key, { enabled: v })} />
                    {item.enabled && (
                      <Slider label={d.label} unit={d.unit} min={d.min} max={d.max} step={d.step} value={item.value} onChange={(v) => setItem(d.key, { value: v })} />
                    )}
                  </div>
                )
              })}
            </div>
          </Section>
          {state.target === "filter" && (
            <Section
              title="Drop shadow"
              action={
                <Toggle label="On" checked={state.dropShadow.enabled} onChange={(v) => update({ dropShadow: { ...state.dropShadow, enabled: v } })} />
              }
            >
              <p className="text-xs text-slate-500">Follows the shape of transparent images (PNG/SVG), unlike box-shadow.</p>
              {state.dropShadow.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Slider label="X" unit="px" min={-50} max={50} value={state.dropShadow.x} onChange={(x) => update({ dropShadow: { ...state.dropShadow, x } })} />
                    <Slider label="Y" unit="px" min={-50} max={50} value={state.dropShadow.y} onChange={(y) => update({ dropShadow: { ...state.dropShadow, y } })} />
                  </div>
                  <Slider label="Blur" unit="px" min={0} max={60} value={state.dropShadow.blur} onChange={(blur) => update({ dropShadow: { ...state.dropShadow, blur } })} />
                  <ColorPicker label="Color" value={state.dropShadow.color} onChange={(c) => update({ dropShadow: { ...state.dropShadow, color: c } })} />
                </>
              )}
            </Section>
          )}
        </>
      }
    />
  )
}
