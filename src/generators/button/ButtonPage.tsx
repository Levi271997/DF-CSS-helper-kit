import { useMemo, useState } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Segmented, Slider, TextField, Toggle } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { HtmlPanel } from "@/components/HtmlPanel"
import { useToolState } from "@/components/useToolState"
import { color } from "@/lib/color"
import { BUTTON_PRESETS, buildButtonCss, buildButtonHtml, type ButtonColors, type ButtonSettings } from "./build-css"

const defaults = (): ButtonSettings => ({
  label: "Get a free quote",
  className: "btn",
  fontFamily: "inherit",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: 0,
  uppercase: false,
  paddingY: 14,
  paddingX: 28,
  radius: 8,
  borderWidth: 0,
  normal: { background: color("#f8a02d"), text: color("#1e1242"), border: color("#f8a02d") },
  hover: { background: color("#f37920"), text: color("#1e1242"), border: color("#f37920") },
  shadow: true,
  shadowY: 4,
  shadowBlur: 12,
  shadowColor: color("#1e1242", 0.2),
  lift: 2,
  press: true,
  focusColor: color("#4b3b8c"),
  duration: 200,
})

type PreviewState = "live" | "hover" | "focus"

// Preview-only selectors: the real pseudo-classes plus classes that force a state on.
const PREVIEW = ".dfbtn-preview"
const previewSelectors = {
  base: PREVIEW,
  hover: `${PREVIEW}:hover, ${PREVIEW}.is-hover`,
  focus: `${PREVIEW}:focus-visible, ${PREVIEW}.is-focus`,
  active: `${PREVIEW}:active`,
}

const BACKGROUNDS = { light: "#ffffff", grey: "#f1f5f9", dark: "#1e1242" } as const

export default function ButtonPage() {
  const { state, update, reset, loadedSnippet } = useToolState("button", defaults)
  const [previewState, setPreviewState] = useState<PreviewState>("live")
  const [editing, setEditing] = useState<"normal" | "hover">("normal")
  const [bg, setBg] = useState<keyof typeof BACKGROUNDS>("grey")

  const css = useMemo(() => buildButtonCss(state), [state])
  const previewCss = useMemo(() => buildButtonCss(state, previewSelectors), [state])
  const html = useMemo(() => buildButtonHtml(state), [state])

  const colors = state[editing]
  const setColors = (patch: Partial<ButtonColors>) => update({ [editing]: { ...colors, ...patch } } as Partial<ButtonSettings>)

  return (
    <ToolLayout
      title="Button builder"
      description="Style a button with its hover, focus and pressed states. Hover the preview to try it, or force a state below."
      tool="button"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-slate-200 sm:aspect-[16/7]">
            <style>{previewCss}</style>
            <div className="absolute inset-0 flex items-center justify-center p-6" style={{ background: BACKGROUNDS[bg] }}>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className={`dfbtn-preview ${previewState === "hover" ? "is-hover" : ""} ${previewState === "focus" ? "is-focus" : ""}`}
              >
                {state.label || "Button"}
              </a>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmented
              label="Preview state"
              value={previewState}
              onChange={setPreviewState}
              options={[
                { value: "live", label: "Live" },
                { value: "hover", label: "Hover" },
                { value: "focus", label: "Focus" },
              ]}
            />
            <Segmented
              label="Preview background"
              value={bg}
              onChange={setBg}
              options={[
                { value: "light", label: "White" },
                { value: "grey", label: "Grey" },
                { value: "dark", label: "Navy" },
              ]}
            />
          </div>
        </div>
      }
      below={<HtmlPanel html={html} />}
      controls={
        <>
          <Section title="Presets">
            <div className="flex flex-wrap gap-2">
              {BUTTON_PRESETS.map((p) => (
                <Button key={p.name} onClick={() => update(p.settings)}>
                  {p.name}
                </Button>
              ))}
            </div>
          </Section>

          <Section title="Text">
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Label" value={state.label} placeholder="Button" onChange={(label) => update({ label })} />
              <TextField label="Class name" value={state.className} placeholder="btn" onChange={(className) => update({ className })} />
            </div>
            <TextField label="Font family" value={state.fontFamily} placeholder="inherit" onChange={(fontFamily) => update({ fontFamily })} />
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Size" unit="px" min={10} max={32} value={state.fontSize} onChange={(fontSize) => update({ fontSize })} />
              <Slider label="Weight" min={100} max={900} step={100} value={state.fontWeight} onChange={(fontWeight) => update({ fontWeight })} />
            </div>
            <Slider label="Letter spacing" unit="em" min={-0.05} max={0.3} step={0.01} value={state.letterSpacing} onChange={(letterSpacing) => update({ letterSpacing })} />
            <Toggle label="Uppercase" checked={state.uppercase} onChange={(uppercase) => update({ uppercase })} />
          </Section>

          <Section title="Shape">
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Padding Y" unit="px" min={0} max={48} value={state.paddingY} onChange={(paddingY) => update({ paddingY })} />
              <Slider label="Padding X" unit="px" min={0} max={96} value={state.paddingX} onChange={(paddingX) => update({ paddingX })} />
              <Slider label="Radius" unit="px" min={0} max={999} value={state.radius} onChange={(radius) => update({ radius })} />
              <Slider label="Border" unit="px" min={0} max={8} value={state.borderWidth} onChange={(borderWidth) => update({ borderWidth })} />
            </div>
          </Section>

          <Section
            title="Colors"
            action={
              <Segmented
                label="Colors for state"
                value={editing}
                onChange={(v) => {
                  setEditing(v)
                  setPreviewState(v === "hover" ? "hover" : "live")
                }}
                options={[
                  { value: "normal", label: "Normal" },
                  { value: "hover", label: "Hover" },
                ]}
              />
            }
          >
            <ColorPicker label="Background" value={colors.background} onChange={(background) => setColors({ background })} />
            <ColorPicker label="Text" alpha={false} value={colors.text} onChange={(text) => setColors({ text })} />
            {state.borderWidth > 0 && <ColorPicker label="Border" value={colors.border} onChange={(border) => setColors({ border })} />}
          </Section>

          <Section title="Shadow">
            <Toggle label="Drop shadow" checked={state.shadow} onChange={(shadow) => update({ shadow })} />
            {state.shadow && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Slider label="Y" unit="px" min={0} max={30} value={state.shadowY} onChange={(shadowY) => update({ shadowY })} />
                  <Slider label="Blur" unit="px" min={0} max={60} value={state.shadowBlur} onChange={(shadowBlur) => update({ shadowBlur })} />
                </div>
                <ColorPicker label="Shadow color" value={state.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
              </>
            )}
          </Section>

          <Section title="Interaction">
            <Slider label="Lift on hover" unit="px" min={0} max={8} value={state.lift} onChange={(lift) => update({ lift })} />
            <Slider label="Transition" unit="ms" min={0} max={600} step={25} value={state.duration} onChange={(duration) => update({ duration })} />
            <Toggle label="Shrink slightly when pressed" checked={state.press} onChange={(press) => update({ press })} />
            <ColorPicker label="Keyboard focus ring" alpha={false} value={state.focusColor} onChange={(focusColor) => update({ focusColor })} />
          </Section>
        </>
      }
    />
  )
}
