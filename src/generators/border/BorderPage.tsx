import { useMemo, useState } from "react"
import { ToolLayout, PreviewFrame } from "@/components/ToolLayout"
import { Section, Segmented, Select, Slider, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color, toCss } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { BORDER_STYLES, SIDES, buildBorder, type BorderSettings, type Side, type SideName } from "./build-css"

const side = (): Side => ({ width: 3, style: "solid", color: color("#1e1242") })

const defaults = (): BorderSettings => ({
  linked: true,
  sides: { top: side(), right: side(), bottom: side(), left: side() },
  outline: true,
  outlineWidth: 2,
  outlineStyle: "dashed",
  outlineColor: color("#f8a02d"),
  outlineOffset: 6,
  radius: 12,
  fill: color("#ffffff"),
})

const OUTLINE_STYLES = BORDER_STYLES.filter((s) => s !== "none")
const LABELS: Record<SideName, string> = { top: "Top", right: "Right", bottom: "Bottom", left: "Left" }

function SideControls({ value, onChange }: { value: Side; onChange: (patch: Partial<Side>) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Slider label="Width" unit="px" min={0} max={30} value={value.width} onChange={(width) => onChange({ width })} />
        <Select label="Style" value={value.style} options={BORDER_STYLES} onChange={(style) => onChange({ style })} />
      </div>
      <ColorPicker label="Colour" value={value.color} onChange={(c) => onChange({ color: c })} />
    </>
  )
}

export default function BorderPage() {
  const { state, update, reset, loadedSnippet } = useToolState("border", defaults)
  const [active, setActive] = useState<SideName>("top")
  const decls = useMemo(() => buildBorder(state), [state])

  const setSide = (name: SideName, patch: Partial<Side>) => {
    if (state.linked) {
      const next = { ...state.sides[name], ...patch }
      update({ sides: { top: next, right: next, bottom: next, left: next } })
    } else {
      update({ sides: { ...state.sides, [name]: { ...state.sides[name], ...patch } } })
    }
  }

  return (
    <ToolLayout
      title="Border and outline"
      description="Set the width, style and colour of each side, and add an outline with an offset, often used for focus rings."
      tool="border"
      css={declsToCss(decls)}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <PreviewFrame className="bg-slate-100">
          <div
            className="flex h-2/5 w-2/5 min-w-32 items-center justify-center text-sm text-slate-400"
            style={{ ...declsToStyle(decls), borderRadius: state.radius, background: toCss(state.fill) }}
          >
            {!state.linked && LABELS[active]}
          </div>
        </PreviewFrame>
      }
      controls={
        <>
          <Section title="Border">
            <Toggle
              label="Same border on all sides"
              checked={state.linked}
              onChange={(linked) => {
                const s = state.sides[active]
                update(linked ? { linked, sides: { top: s, right: s, bottom: s, left: s } } : { linked })
              }}
            />
            {!state.linked && (
              <Segmented
                label="Side"
                value={active}
                onChange={setActive}
                options={SIDES.map((s) => ({ value: s, label: LABELS[s] }))}
              />
            )}
            <SideControls value={state.sides[state.linked ? "top" : active]} onChange={(p) => setSide(state.linked ? "top" : active, p)} />
          </Section>

          <Section title="Outline">
            <Toggle label="Add an outline" checked={state.outline} onChange={(outline) => update({ outline })} />
            {state.outline && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Slider label="Width" unit="px" min={1} max={20} value={state.outlineWidth} onChange={(outlineWidth) => update({ outlineWidth })} />
                  <Select label="Style" value={state.outlineStyle} options={OUTLINE_STYLES} onChange={(outlineStyle) => update({ outlineStyle })} />
                </div>
                <Slider label="Offset" unit="px" min={-20} max={40} value={state.outlineOffset} onChange={(outlineOffset) => update({ outlineOffset })} />
                <ColorPicker label="Colour" value={state.outlineColor} onChange={(outlineColor) => update({ outlineColor })} />
              </>
            )}
          </Section>

          <Section title="Preview box">
            <Slider label="Corner radius" unit="px" min={0} max={80} value={state.radius} onChange={(radius) => update({ radius })} />
            <ColorPicker label="Fill" alpha={false} value={state.fill} onChange={(fill) => update({ fill })} />
            <p className="text-xs text-slate-500">Radius and fill are only for the preview. Use the Border radius tool to export rounded corners.</p>
          </Section>
        </>
      }
    />
  )
}
