import { useMemo, useState } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Section, Segmented, TextField } from "@/components/controls"
import { ColorPicker } from "@/components/ColorPicker"
import { useToolState } from "@/components/useToolState"
import { color, contrastRatio, round } from "@/lib/color"
import { bestTextOn, buildPaletteCss, buildShades, checkContrast, type PaletteSettings } from "./build-css"

const defaults = (): PaletteSettings => ({
  base: "#f8a02d",
  name: "brand",
  format: "hex",
  text: "#1e1242",
  background: "#ffffff",
})

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>
      <span>{label}</span>
      <span className="font-semibold">{ok ? "Pass" : "Fail"}</span>
    </div>
  )
}

export default function PalettePage() {
  const { state, update, reset, loadedSnippet } = useToolState("palette", defaults)
  const [pickInto, setPickInto] = useState<"background" | "text">("background")

  const shades = useMemo(() => buildShades(state.base), [state.base])
  const css = useMemo(() => buildPaletteCss(state), [state])
  const result = checkContrast(state.text, state.background)

  return (
    <ToolLayout
      title="Colour palette"
      description="Turn one brand colour into a full 50–950 palette, export it as CSS variables, and check text contrast against WCAG."
      tool="palette"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-700">Palette</span>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                Click a shade to use it as
                <Segmented
                  label="Clicking a shade sets"
                  value={pickInto}
                  onChange={setPickInto}
                  options={[
                    { value: "background", label: "Background" },
                    { value: "text", label: "Text" },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-11">
              {shades.map((sh) => {
                const fg = bestTextOn(sh.hex)
                return (
                  <button
                    key={sh.step}
                    type="button"
                    onClick={() => update({ [pickInto]: sh.hex } as Partial<PaletteSettings>)}
                    aria-label={`Use ${state.name}-${sh.step} (${sh.hex}) as ${pickInto}`}
                    className="flex aspect-square flex-col justify-between p-1.5 text-left transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
                    style={{ background: sh.hex, color: fg }}
                  >
                    <span className="text-xs font-semibold">
                      {sh.step}
                      {sh.isBase && " ★"}
                    </span>
                    <span className="font-mono text-[10px] leading-tight opacity-80">
                      {sh.hex}
                      <br />
                      {round(contrastRatio(fg, sh.hex), 1)}:1
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">★ is your base colour. The ratio on each swatch is for the black or white text shown on it.</p>
          </div>

          <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div className="flex min-h-40 flex-col justify-center gap-2 p-6" style={{ background: state.background, color: state.text }}>
              <p className="font-heading text-2xl font-bold">Large heading text</p>
              <p className="text-sm">Body text at normal size. Can everyone read this comfortably?</p>
            </div>
            <div className="space-y-2">
              <p className="text-center">
                <span className="font-heading text-4xl font-bold text-brand-600">{result.ratio}</span>
                <span className="text-slate-500">:1</span>
              </p>
              <div className="divide-y divide-white overflow-hidden">
                <Badge ok={result.aaNormal} label="AA normal text (4.5)" />
                <Badge ok={result.aaLarge} label="AA large text (3)" />
                <Badge ok={result.aaaNormal} label="AAA normal text (7)" />
                <Badge ok={result.aaaLarge} label="AAA large text (4.5)" />
              </div>
            </div>
          </div>
        </div>
      }
      controls={
        <>
          <Section title="Base colour">
            <ColorPicker label="Brand colour" alpha={false} value={color(state.base)} onChange={(c) => update({ base: c.hex })} />
          </Section>

          <Section title="Contrast check">
            <ColorPicker label="Text" alpha={false} value={color(state.text)} onChange={(c) => update({ text: c.hex })} />
            <ColorPicker label="Background" alpha={false} value={color(state.background)} onChange={(c) => update({ background: c.hex })} />
            <button
              type="button"
              onClick={() => update({ text: state.background, background: state.text })}
              className="text-sm font-medium text-brand-500 hover:underline"
            >
              ⇅ Swap text and background
            </button>
          </Section>

          <Section title="Export">
            <TextField label="Variable name" value={state.name} placeholder="brand" onChange={(name) => update({ name })} />
            <Segmented
              label="Colour format"
              value={state.format}
              onChange={(format) => update({ format })}
              options={[
                { value: "hex", label: "HEX" },
                { value: "hsl", label: "HSL" },
              ]}
            />
          </Section>
        </>
      }
    />
  )
}
