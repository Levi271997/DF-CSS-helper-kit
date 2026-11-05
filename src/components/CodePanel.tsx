import { useState, type FormEvent } from "react"
import { Button } from "./controls"
import { useToast } from "./Toast"
import { copyText } from "@/lib/clipboard"
import { store, useActiveClient, type ToolId } from "@/store"

interface Props {
  css: string
  tool: ToolId
  settings: unknown
}

export function CodePanel({ css, tool, settings }: Props) {
  const toast = useToast()
  const client = useActiveClient()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")

  const copy = async () => {
    const ok = await copyText(css)
    toast(ok ? "CSS copied to clipboard" : "Couldn't copy — select the code and copy it manually", ok ? "ok" : "error")
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    store.saveSnippet({ clientId: client?.id ?? null, tool, name: name.trim(), settings, css })
    toast(`Saved “${name.trim()}” to ${client?.name ?? "Unassigned"}`)
    setName("")
    setSaving(false)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-700">CSS</span>
        <div className="flex gap-2">
          <Button onClick={() => setSaving((s) => !s)} aria-expanded={saving}>
            Save snippet
          </Button>
          <Button variant="primary" onClick={copy}>
            Copy CSS
          </Button>
        </div>
      </div>
      {saving && (
        <form onSubmit={save} className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Snippet name, e.g. Card shadow"
            aria-label="Snippet name"
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
          />
          <span className="text-xs text-slate-500">→ {client?.name ?? "Unassigned"}</span>
          <Button type="submit" variant="primary" disabled={!name.trim()}>
            Save
          </Button>
        </form>
      )}
      <pre className="overflow-x-auto bg-slate-900 p-4 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{css}</code>
      </pre>
    </div>
  )
}
