import { useMemo } from "react"
import { Link } from "react-router-dom"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Segmented, Slider, TextField, Toggle } from "@/components/controls"
import { useToolState } from "@/components/useToolState"
import { newId } from "@/lib/id"
import { useActiveClient } from "@/store"
import { buildTokens, buildVariablesCss, type NamedValue, type VariablesSettings } from "./build-css"

const defaults = (): VariablesSettings => ({
  prefix: "brand",
  useClientColors: true,
  colors: [],
  fonts: [
    { id: newId(), name: "heading", value: "'Montserrat', sans-serif" },
    { id: newId(), name: "body", value: "'Poppins', sans-serif" },
  ],
  includeSpacing: true,
  spaceBase: 16,
  includeRadius: true,
  radius: { sm: 4, md: 8, lg: 16 },
  unit: "rem",
})

/** Editable name/value rows used for both colours and fonts. */
function Rows({
  rows,
  onChange,
  kind,
}: {
  rows: NamedValue[]
  onChange: (rows: NamedValue[]) => void
  kind: "color" | "font"
}) {
  const set = (id: string, patch: Partial<NamedValue>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-2">
          {kind === "color" && (
            <input
              type="color"
              aria-label={`${r.name || "Colour"} value`}
              value={r.value}
              onChange={(e) => set(r.id, { value: e.target.value })}
              className="h-8 w-9 shrink-0 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
            />
          )}
          <input
            aria-label="Name"
            value={r.name}
            placeholder="name"
            onChange={(e) => set(r.id, { name: e.target.value })}
            className="w-24 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-sm"
          />
          {kind === "font" && (
            <input
              aria-label={`${r.name || "Font"} stack`}
              value={r.value}
              placeholder="'Inter', sans-serif"
              onChange={(e) => set(r.id, { value: e.target.value })}
              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-sm"
            />
          )}
          {kind === "color" && <span className="min-w-0 flex-1 font-mono text-xs text-slate-500">{r.value}</span>}
          <Button variant="danger" aria-label={`Remove ${r.name || kind}`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>
            ✕
          </Button>
        </div>
      ))}
    </div>
  )
}

export default function VariablesPage() {
  const { state, update, reset, loadedSnippet } = useToolState("variables", defaults)
  const client = useActiveClient()
  const clientColors = state.useClientColors ? (client?.colors ?? []) : []

  const groups = useMemo(() => buildTokens(state, client?.colors ?? []), [state, client])
  const css = useMemo(() => buildVariablesCss(groups), [groups])
  const empty = !groups.colors.length && !groups.fonts.length && !groups.spacing.length && !groups.radius.length

  return (
    <ToolLayout
      title="CSS variables"
      description="Combine a client's colours, fonts, spacing and radius into one :root block to paste into the theme or Elementor custom CSS."
      tool="variables"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
          {empty && <p className="text-sm text-slate-500">Nothing to export yet. Add colours or fonts, or turn on spacing.</p>}

          {groups.colors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colours</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {groups.colors.map((t) => (
                  <div key={t.name} className="overflow-hidden border border-slate-200">
                    <div className="h-14" style={{ background: t.value }} />
                    <div className="px-2 py-1.5">
                      <p className="truncate font-mono text-xs text-slate-700">{t.name}</p>
                      <p className="font-mono text-xs text-slate-400">{t.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {groups.fonts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fonts</h3>
              {groups.fonts.map((t) => (
                <div key={t.name} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
                  <span className="text-xl text-brand-600" style={{ fontFamily: t.value }}>
                    The quick brown fox
                  </span>
                  <span className="font-mono text-xs text-slate-500">{t.name}</span>
                </div>
              ))}
            </div>
          )}

          {groups.spacing.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spacing</h3>
              {groups.spacing.map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 font-mono text-xs text-slate-500">{t.name}</span>
                  <span className="h-3 bg-accent-400" style={{ width: t.value }} />
                  <span className="font-mono text-xs text-slate-400">{t.value}</span>
                </div>
              ))}
            </div>
          )}

          {groups.radius.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Radius</h3>
              <div className="flex flex-wrap gap-4">
                {groups.radius.map((t) => (
                  <div key={t.name} className="space-y-1 text-center">
                    <div className="mx-auto h-14 w-14 bg-brand-600" style={{ borderRadius: t.value }} />
                    <p className="font-mono text-[11px] text-slate-500">{t.name.split("-").pop()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      }
      controls={
        <>
          <Section title="Naming">
            <TextField label="Prefix" value={state.prefix} placeholder="brand" onChange={(prefix) => update({ prefix })} />
            <Segmented
              label="Length unit"
              value={state.unit}
              onChange={(unit) => update({ unit })}
              options={[
                { value: "rem", label: "rem" },
                { value: "px", label: "px" },
              ]}
            />
          </Section>

          <Section
            title="Colours"
            action={
              <Button
                variant="ghost"
                onClick={() => update({ colors: [...state.colors, { id: newId(), name: "", value: "#1e1242" }] })}
              >
                + Add colour
              </Button>
            }
          >
            <Toggle
              label={client ? `Include ${client.name}'s brand colours (${client.colors.length})` : "Include the active client's brand colours"}
              checked={state.useClientColors}
              onChange={(useClientColors) => update({ useClientColors })}
            />
            {state.useClientColors && !client && (
              <p className="text-xs text-slate-500">
                No client selected. Pick one in the sidebar, or{" "}
                <Link to="/clients" className="font-medium text-brand-500 hover:underline">
                  add client colours
                </Link>
                .
              </p>
            )}
            {state.useClientColors && client && clientColors.length === 0 && (
              <p className="text-xs text-slate-500">
                {client.name} has no brand colours yet.{" "}
                <Link to="/clients" className="font-medium text-brand-500 hover:underline">
                  Add some
                </Link>
                .
              </p>
            )}
            <Rows kind="color" rows={state.colors} onChange={(colors) => update({ colors })} />
          </Section>

          <Section
            title="Fonts"
            action={
              <Button variant="ghost" onClick={() => update({ fonts: [...state.fonts, { id: newId(), name: "", value: "" }] })}>
                + Add font
              </Button>
            }
          >
            <Rows kind="font" rows={state.fonts} onChange={(fonts) => update({ fonts })} />
          </Section>

          <Section title="Spacing and radius">
            <Toggle label="Spacing scale (2xs – 3xl)" checked={state.includeSpacing} onChange={(includeSpacing) => update({ includeSpacing })} />
            {state.includeSpacing && (
              <Slider label="Base step (sm)" unit="px" min={2} max={32} value={state.spaceBase} onChange={(spaceBase) => update({ spaceBase })} />
            )}
            <Toggle label="Corner radius" checked={state.includeRadius} onChange={(includeRadius) => update({ includeRadius })} />
            {state.includeRadius && (
              <div className="grid grid-cols-3 gap-3">
                {(["sm", "md", "lg"] as const).map((k) => (
                  <Slider
                    key={k}
                    label={k}
                    unit="px"
                    min={0}
                    max={48}
                    value={state.radius[k]}
                    onChange={(v) => update({ radius: { ...state.radius, [k]: v } })}
                  />
                ))}
              </div>
            )}
          </Section>
        </>
      }
    />
  )
}
