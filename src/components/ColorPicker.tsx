import { useState } from "react"
import { isValidHex, normalizeHex, toCss, type Color } from "@/lib/color"
import { useActiveClient } from "@/store"

interface Props {
  label: string
  value: Color
  onChange: (value: Color) => void
  /** Show the opacity slider (default true). */
  alpha?: boolean
}

export function ColorPicker({ label, value, onChange, alpha = true }: Props) {
  const client = useActiveClient()
  const [draft, setDraft] = useState(value.hex)
  const [seen, setSeen] = useState(value.hex)
  if (value.hex !== seen) {
    setSeen(value.hex)
    setDraft(value.hex)
  }

  const onHexInput = (v: string) => {
    setDraft(v)
    if (isValidHex(v)) onChange({ ...value, hex: normalizeHex(v) })
  }

  const percent = Math.round(value.a * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="font-mono text-xs text-slate-400">{toCss(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="checker relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200">
          <span className="absolute inset-0" style={{ background: toCss(value) }} />
          <input
            type="color"
            aria-label={`${label} color`}
            value={value.hex}
            onChange={(e) => onChange({ ...value, hex: e.target.value })}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          aria-label={`${label} hex`}
          value={draft}
          onChange={(e) => onHexInput(e.target.value)}
          onBlur={() => setDraft(value.hex)}
          spellCheck={false}
          className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 font-mono text-xs uppercase"
        />
        {alpha && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              type="range"
              aria-label={`${label} opacity`}
              min={0}
              max={100}
              value={percent}
              onChange={(e) => onChange({ ...value, a: Number(e.target.value) / 100 })}
            />
            <span className="w-9 text-right font-mono text-xs text-slate-500">{percent}%</span>
          </div>
        )}
      </div>
      {client && client.colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={`${client.name} colors`}>
          {client.colors.map((c) => (
            <button
              key={c.id}
              type="button"
              title={`${c.name} · ${c.hex}`}
              aria-label={`Use ${c.name}`}
              onClick={() => onChange({ ...value, hex: c.hex })}
              className={`h-6 w-6 rounded-md border shadow-sm transition-transform hover:scale-110 ${
                c.hex === value.hex ? "border-slate-900 ring-2 ring-indigo-500 ring-offset-1" : "border-slate-200"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
