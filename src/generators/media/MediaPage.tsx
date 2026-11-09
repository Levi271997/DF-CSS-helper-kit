import { useMemo, useState } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Segmented, Select, Slider, TextField, Toggle } from "@/components/controls"
import { useToolState } from "@/components/useToolState"
import { newId } from "@/lib/id"
import {
  BREAKPOINT_PRESETS,
  EXTRAS,
  appliesAt,
  buildBlocks,
  buildMediaCss,
  ranges,
  type Device,
  type ExtraKey,
  type MediaSettings,
  type PresetKey,
} from "./build-css"

const devicesFor = (key: PresetKey): Device[] =>
  BREAKPOINT_PRESETS[key].devices.map(([name, max]) => ({ id: newId(), name, max }))

const TOP_NAME: Record<PresetKey, string> = { elementor: "Desktop", "elementor-all": "Desktop", bootstrap: "xxl", tailwind: "2xl" }

const defaults = (): MediaSettings => ({
  preset: "elementor",
  devices: devicesFor("elementor"),
  topName: "Desktop",
  approach: "desktop-first",
  exact: false,
  syntax: "classic",
  selector: ".hero",
  extras: { reducedMotion: false, dark: false, hover: false, landscape: false, print: false },
})

const PRESET_OPTIONS = [
  ...(Object.keys(BREAKPOINT_PRESETS) as PresetKey[]).map((k) => ({ value: k, label: BREAKPOINT_PRESETS[k].label })),
  { value: "custom" as const, label: "Custom" },
]

const SEGMENT_COLORS = ["bg-brand-600", "bg-brand-500", "bg-brand-400", "bg-accent-400", "bg-accent-500", "bg-accent-600"]

export default function MediaPage() {
  const { state, update, reset, loadedSnippet } = useToolState("media", defaults)
  const css = useMemo(() => buildMediaCss(state), [state])
  const blocks = useMemo(() => buildBlocks(state), [state])
  const segs = useMemo(() => ranges(state), [state])

  const largest = Math.max(0, ...state.devices.map((d) => d.max))
  const scaleMax = Math.max(1600, Math.round(largest * 1.3))
  const [testWidth, setPreviewWidth] = useState(800)
  const previewWidth = Math.min(testWidth, scaleMax)

  const setDevice = (id: string, patch: Partial<Device>) =>
    update({ preset: "custom", devices: state.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)) })

  return (
    <ToolLayout
      title="Media queries"
      description="Pick a set of breakpoints, such as Elementor's, and get a responsive CSS skeleton to fill in."
      tool="media"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            <div className="relative flex h-10 overflow-hidden">
              {segs.map((r, i) => {
                const from = r.min ?? 0
                const to = r.max ?? scaleMax
                return (
                  <div
                    key={`${r.name}-${i}`}
                    className={`flex min-w-0 items-center justify-center px-1 text-xs font-medium text-white ${SEGMENT_COLORS[i % SEGMENT_COLORS.length]}`}
                    style={{ width: `${((to - from + 1) / (scaleMax + 1)) * 100}%` }}
                    title={`${r.name}: ${from}px – ${r.max ?? "∞"}${r.max ? "px" : ""}`}
                  >
                    <span className="truncate">{r.name}</span>
                  </div>
                )
              })}
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${(previewWidth / scaleMax) * 100}%` }} />
            </div>
            <div className="flex justify-between font-mono text-[11px] text-slate-400">
              <span>0</span>
              <span>{scaleMax}px</span>
            </div>
          </div>

          <Slider label="Screen width to test" unit="px" min={240} max={scaleMax} value={previewWidth} onChange={setPreviewWidth} />

          <ul className="space-y-1.5">
            {blocks.map((b, i) => {
              const on = appliesAt(b, previewWidth)
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-3 px-3 py-2 text-sm ${on ? "bg-emerald-50 text-emerald-900" : "bg-slate-50 text-slate-400"}`}
                >
                  <span className="min-w-0">
                    <span className="font-medium">{b.label}</span>
                    {b.query && <span className="block truncate font-mono text-xs opacity-80">@media {b.query}</span>}
                  </span>
                  <span className="shrink-0 text-xs font-semibold">{on ? "Applies" : "—"}</span>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-slate-500">
            Green blocks are the ones whose styles apply at {previewWidth}px.
            {!state.exact && " Blocks cascade, so later ones override earlier ones where both apply."}
          </p>
        </div>
      }
      controls={
        <>
          <Section title="Breakpoints">
            <Select
              label="Preset"
              value={state.preset}
              options={PRESET_OPTIONS}
              onChange={(preset) =>
                update(preset === "custom" ? { preset } : { preset, devices: devicesFor(preset), topName: TOP_NAME[preset] })
              }
            />
            <div className="space-y-2">
              {state.devices
                .map((d) => (
                  <div key={d.id} className="flex items-center gap-2">
                    <input
                      aria-label="Device name"
                      value={d.name}
                      onChange={(e) => setDevice(d.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
                    />
                    <span className="text-xs text-slate-500">up to</span>
                    <input
                      type="number"
                      aria-label={`${d.name} max width`}
                      value={d.max}
                      min={1}
                      onChange={(e) => setDevice(d.id, { max: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-right font-mono text-sm"
                    />
                    <span className="text-xs text-slate-500">px</span>
                    <Button
                      variant="danger"
                      aria-label={`Remove ${d.name}`}
                      onClick={() => update({ preset: "custom", devices: state.devices.filter((x) => x.id !== d.id) })}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => update({ preset: "custom", devices: [...state.devices, { id: newId(), name: "New", max: largest + 200 }] })}
            >
              + Add breakpoint
            </Button>
            <TextField label="Name for larger screens" value={state.topName} placeholder="Desktop" onChange={(topName) => update({ topName })} />
          </Section>

          <Section title="Approach">
            <Segmented
              label="Approach"
              value={state.approach}
              onChange={(approach) => update({ approach })}
              options={[
                { value: "desktop-first", label: "Desktop first" },
                { value: "mobile-first", label: "Mobile first" },
              ]}
            />
            <p className="text-xs text-slate-500">
              {state.approach === "desktop-first"
                ? "Base styles are for large screens; max-width queries adjust smaller ones. This is how Elementor works."
                : "Base styles are for phones; min-width queries add to them as screens get wider."}
            </p>
            <Toggle label="Target each range only (no cascading)" checked={state.exact} onChange={(exact) => update({ exact })} />
            <Segmented
              label="Query syntax"
              value={state.syntax}
              onChange={(syntax) => update({ syntax })}
              options={[
                { value: "classic", label: "min/max-width" },
                { value: "range", label: "Range (width <=)" },
              ]}
            />
          </Section>

          <Section title="Output">
            <TextField label="Selector (optional)" value={state.selector} placeholder=".hero" onChange={(selector) => update({ selector })} />
            <div className="space-y-2">
              <span className="text-sm text-slate-700">Extra queries</span>
              {(Object.keys(EXTRAS) as ExtraKey[]).map((k) => (
                <div key={k}>
                  <Toggle label={EXTRAS[k].label} checked={state.extras[k]} onChange={(v) => update({ extras: { ...state.extras, [k]: v } })} />
                </div>
              ))}
            </div>
          </Section>
        </>
      }
    />
  )
}
