import { newId } from "@/lib/id"
import { normalizeHex } from "@/lib/color"

export type ToolId = "shadow" | "glass" | "filters" | "gradient" | "clip-path" | "transform" | "radius" | "grid" | "flexbox" | "background" | "text-shadow" | "fluid-type"

export const TOOL_IDS: ToolId[] = ["shadow", "glass", "filters", "gradient", "clip-path", "transform", "radius", "grid", "flexbox", "background", "text-shadow", "fluid-type"]

export interface BrandColor {
  id: string
  name: string
  hex: string
}

export interface Client {
  id: string
  name: string
  colors: BrandColor[]
}

export interface Snippet {
  id: string
  clientId: string | null
  tool: ToolId
  name: string
  settings: unknown
  css: string
  createdAt: number
}

export interface Data {
  version: 1
  clients: Client[]
  snippets: Snippet[]
  activeClientId: string | null
}

export const STORAGE_KEY = "df-css-kit:v1"

export const emptyData = (): Data => ({ version: 1, clients: [], snippets: [], activeClientId: null })

type StorageLike = Pick<Storage, "getItem" | "setItem">

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null
const isStr = (v: unknown): v is string => typeof v === "string"

function parseClient(v: unknown): Client | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.name) || !Array.isArray(v.colors)) return null
  const colors: BrandColor[] = []
  for (const c of v.colors) {
    if (!isObj(c) || !isStr(c.id) || !isStr(c.name) || !isStr(c.hex)) return null
    colors.push({ id: c.id, name: c.name, hex: normalizeHex(c.hex) })
  }
  return { id: v.id, name: v.name, colors }
}

function parseSnippet(v: unknown): Snippet | null {
  if (!isObj(v) || !isStr(v.id) || !isStr(v.name) || !isStr(v.css)) return null
  if (!TOOL_IDS.includes(v.tool as ToolId)) return null
  if (v.clientId !== null && !isStr(v.clientId)) return null
  return {
    id: v.id,
    clientId: v.clientId,
    tool: v.tool as ToolId,
    name: v.name,
    settings: v.settings ?? {},
    css: v.css,
    createdAt: typeof v.createdAt === "number" ? v.createdAt : Date.now(),
  }
}

/** Validates unknown JSON into Data. Returns an error message when invalid. */
export function parseData(raw: unknown): { data: Data } | { error: string } {
  if (!isObj(raw)) return { error: "File is not a JSON object." }
  if (raw.version !== 1) return { error: "Unsupported file version." }
  if (!Array.isArray(raw.clients) || !Array.isArray(raw.snippets)) {
    return { error: "File is missing clients or snippets." }
  }
  const clients: Client[] = []
  for (const c of raw.clients) {
    const parsed = parseClient(c)
    if (!parsed) return { error: "File contains an invalid client." }
    clients.push(parsed)
  }
  const snippets: Snippet[] = []
  for (const s of raw.snippets) {
    const parsed = parseSnippet(s)
    if (!parsed) return { error: "File contains an invalid snippet." }
    snippets.push(parsed)
  }
  const active = isStr(raw.activeClientId) && clients.some((c) => c.id === raw.activeClientId)
    ? raw.activeClientId
    : null
  return { data: { version: 1, clients, snippets, activeClientId: active } }
}

const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
  const map = new Map(current.map((x) => [x.id, x]))
  for (const x of incoming) map.set(x.id, x)
  return [...map.values()]
}

export function createStore(storage: StorageLike | null) {
  let state: Data = load()
  const listeners = new Set<() => void>()

  function load(): Data {
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      if (!raw) return emptyData()
      const result = parseData(JSON.parse(raw))
      return "data" in result ? result.data : emptyData()
    } catch {
      return emptyData()
    }
  }

  function set(next: Data) {
    state = next
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage full or blocked: keep working in memory.
    }
    listeners.forEach((l) => l())
  }

  const updateClient = (id: string, fn: (c: Client) => Client) =>
    set({ ...state, clients: state.clients.map((c) => (c.id === id ? fn(c) : c)) })

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    addClient(name: string): string {
      const client: Client = { id: newId(), name: name.trim() || "Untitled client", colors: [] }
      set({ ...state, clients: [...state.clients, client], activeClientId: client.id })
      return client.id
    },
    renameClient(id: string, name: string) {
      updateClient(id, (c) => ({ ...c, name: name.trim() || c.name }))
    },
    /** Deletes the client; its snippets are kept but become unassigned. */
    deleteClient(id: string) {
      set({
        ...state,
        clients: state.clients.filter((c) => c.id !== id),
        snippets: state.snippets.map((s) => (s.clientId === id ? { ...s, clientId: null } : s)),
        activeClientId: state.activeClientId === id ? null : state.activeClientId,
      })
    },
    setActiveClient(id: string | null) {
      set({ ...state, activeClientId: id && state.clients.some((c) => c.id === id) ? id : null })
    },

    addColor(clientId: string, name: string, hex: string) {
      updateClient(clientId, (c) => ({
        ...c,
        colors: [...c.colors, { id: newId(), name: name.trim() || "Color", hex: normalizeHex(hex) }],
      }))
    },
    updateColor(clientId: string, colorId: string, patch: Partial<Omit<BrandColor, "id">>) {
      updateClient(clientId, (c) => ({
        ...c,
        colors: c.colors.map((col) =>
          col.id === colorId
            ? { ...col, ...patch, hex: patch.hex !== undefined ? normalizeHex(patch.hex) : col.hex }
            : col,
        ),
      }))
    },
    deleteColor(clientId: string, colorId: string) {
      updateClient(clientId, (c) => ({ ...c, colors: c.colors.filter((col) => col.id !== colorId) }))
    },

    saveSnippet(input: Omit<Snippet, "id" | "createdAt">): string {
      const snippet: Snippet = { ...input, id: newId(), createdAt: Date.now() }
      set({ ...state, snippets: [snippet, ...state.snippets] })
      return snippet.id
    },
    deleteSnippet(id: string) {
      set({ ...state, snippets: state.snippets.filter((s) => s.id !== id) })
    },

    exportJson(): string {
      return JSON.stringify(state, null, 2)
    },
    /** Merges an exported file into the current data. Items with the same id are replaced. */
    importJson(json: string): { ok: true; clients: number; snippets: number } | { ok: false; error: string } {
      let raw: unknown
      try {
        raw = JSON.parse(json)
      } catch {
        return { ok: false, error: "File is not valid JSON." }
      }
      const result = parseData(raw)
      if ("error" in result) return { ok: false, error: result.error }
      const { clients, snippets } = result.data
      set({
        ...state,
        clients: mergeById(state.clients, clients),
        snippets: mergeById(state.snippets, snippets),
      })
      return { ok: true, clients: clients.length, snippets: snippets.length }
    },
  }
}

export type Store = ReturnType<typeof createStore>
