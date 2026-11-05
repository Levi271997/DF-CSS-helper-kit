import { useMemo, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/controls"
import { useToast } from "@/components/Toast"
import { copyText } from "@/lib/clipboard"
import { isValidHex, normalizeHex } from "@/lib/color"
import { store, useData, type Client, type Snippet } from "@/store"
import { TOOLS } from "./tools"

export default function ClientsPage() {
  const clients = useData((d) => d.clients)
  const snippets = useData((d) => d.snippets)
  const activeId = useData((d) => d.activeClientId)
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [newName, setNewName] = useState("")

  const addClient = (e: FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    store.addClient(newName)
    setNewName("")
  }

  const exportFile = () => {
    const blob = new Blob([store.exportJson()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `df-css-kit-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File) => {
    const result = store.importJson(await file.text())
    if (result.ok) toast(`Imported ${result.clients} clients and ${result.snippets} snippets`)
    else toast(`Import failed: ${result.error}`, "error")
  }

  const unassigned = useMemo(() => snippets.filter((s) => s.clientId === null), [snippets])

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-slate-500">
            Brand colors appear as quick picks in every color picker while a client is active. Data is stored in this browser — export to share with the team.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fileRef.current?.click()}>Import</Button>
          <Button onClick={exportFile} disabled={clients.length === 0 && snippets.length === 0}>Export</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ""
            }}
          />
        </div>
      </header>

      <form onSubmit={addClient} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New client name"
          aria-label="New client name"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <Button type="submit" variant="primary" disabled={!newName.trim()}>
          Add client
        </Button>
      </form>

      {clients.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No clients yet. Add one above to save their brand colors.
        </p>
      )}

      {clients.map((c) => (
        <ClientCard
          key={c.id}
          client={c}
          active={c.id === activeId}
          snippets={snippets.filter((s) => s.clientId === c.id)}
        />
      ))}

      {unassigned.length > 0 && (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Unassigned snippets</h2>
          <SnippetList snippets={unassigned} />
        </section>
      )}
    </div>
  )
}

function ClientCard({ client, active, snippets }: { client: Client; active: boolean; snippets: Snippet[] }) {
    return (
      <section className={`space-y-5 rounded-xl border bg-white p-5 ${active ? "border-indigo-300 ring-1 ring-indigo-200" : "border-slate-200"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            defaultValue={client.name}
            aria-label="Client name"
            onBlur={(e) => store.renameClient(client.id, e.target.value)}
            className="-ml-2 rounded-md px-2 py-1 text-lg font-semibold hover:bg-slate-50 focus:bg-slate-50"
          />
          <div className="flex gap-2">
            {active ? (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">Active</span>
            ) : (
              <Button onClick={() => store.setActiveClient(client.id)}>Set active</Button>
            )}
            <Button
              variant="danger"
              onClick={() => {
                if (confirm(`Delete ${client.name}? Its snippets will be kept as unassigned.`)) store.deleteClient(client.id)
              }}
            >
              Delete
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Brand colors</h3>
          <div className="flex flex-wrap gap-3">
            {client.colors.map((col) => (
              <div key={col.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 pr-2">
                <span className="relative h-8 w-8 overflow-hidden rounded-md border border-slate-200" style={{ background: col.hex }}>
                  <input
                    type="color"
                    aria-label={`${col.name} color`}
                    value={col.hex}
                    onChange={(e) => store.updateColor(client.id, col.id, { hex: e.target.value })}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </span>
                <div className="flex flex-col">
                  <input
                    defaultValue={col.name}
                    aria-label="Color name"
                    onBlur={(e) => store.updateColor(client.id, col.id, { name: e.target.value || col.name })}
                    className="w-24 rounded px-1 text-sm font-medium hover:bg-slate-50"
                  />
                  <HexInput value={col.hex} onCommit={(hex) => store.updateColor(client.id, col.id, { hex })} />
                </div>
                <Button variant="danger" aria-label={`Remove ${col.name}`} onClick={() => store.deleteColor(client.id, col.id)}>
                  ✕
                </Button>
              </div>
            ))}
            <AddColor clientId={client.id} />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Snippets ({snippets.length})</h3>
          {snippets.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing saved yet. Use “Save snippet” in any tool while this client is active.</p>
          ) : (
            <SnippetList snippets={snippets} />
          )}
        </div>
      </section>
    )
}

function SnippetList({ snippets }: { snippets: Snippet[] }) {
    const toast = useToast()
    return (
      <ul className="divide-y divide-slate-100">
        {snippets.map((s) => {
          const tool = TOOLS.find((t) => t.id === s.tool)
          return (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {tool?.label} · {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Link
                  to={`${tool?.path ?? "/"}?snippet=${s.id}`}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  Open
                </Link>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const ok = await copyText(s.css)
                    toast(ok ? "CSS copied to clipboard" : "Couldn't copy", ok ? "ok" : "error")
                  }}
                >
                  Copy
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm(`Delete snippet “${s.name}”?`)) store.deleteSnippet(s.id)
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
    )
}

function HexInput({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  return (
    <input
      key={value}
      defaultValue={value}
      aria-label="Hex value"
      spellCheck={false}
      onBlur={(e) => {
        if (isValidHex(e.target.value)) onCommit(normalizeHex(e.target.value))
        else e.target.value = value
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="w-24 rounded px-1 font-mono text-xs uppercase text-slate-500 hover:bg-slate-50"
    />
  )
}

function AddColor({ clientId }: { clientId: string }) {
  const [hex, setHex] = useState("#4f46e5")
  const [name, setName] = useState("")
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        store.addColor(clientId, name || "Color", hex)
        setName("")
      }}
      className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-1.5"
    >
      <span className="relative h-8 w-8 overflow-hidden rounded-md border border-slate-200" style={{ background: hex }}>
        <input
          type="color"
          aria-label="New color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name, e.g. Primary"
        aria-label="New color name"
        className="w-32 rounded border border-slate-200 px-2 py-1 text-sm"
      />
      <Button type="submit">Add</Button>
    </form>
  )
}
