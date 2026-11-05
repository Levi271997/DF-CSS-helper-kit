import { describe, expect, it } from "vitest"
import { createStore, STORAGE_KEY } from "./store"

function memoryStorage(initial?: string) {
  const map = new Map<string, string>()
  if (initial !== undefined) map.set(STORAGE_KEY, initial)
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    map,
  }
}

describe("store", () => {
  it("starts empty when storage is corrupt", () => {
    const store = createStore(memoryStorage("{not json"))
    expect(store.getState().clients).toEqual([])
  })

  it("persists clients and makes a new client active", () => {
    const storage = memoryStorage()
    const store = createStore(storage)
    const id = store.addClient("Acme")
    store.addColor(id, "Primary", "#1A73E8")
    expect(store.getState().activeClientId).toBe(id)
    const reloaded = createStore(storage)
    expect(reloaded.getState().clients[0].colors[0]).toMatchObject({ name: "Primary", hex: "#1a73e8" })
  })

  it("unassigns snippets when their client is deleted", () => {
    const store = createStore(memoryStorage())
    const id = store.addClient("Acme")
    store.saveSnippet({ clientId: id, tool: "shadow", name: "Card", settings: {}, css: "x" })
    store.deleteClient(id)
    expect(store.getState().snippets[0].clientId).toBeNull()
    expect(store.getState().activeClientId).toBeNull()
  })

  it("round-trips export and import, merging by id", () => {
    const a = createStore(memoryStorage())
    const id = a.addClient("Acme")
    a.saveSnippet({ clientId: id, tool: "gradient", name: "Hero", settings: { angle: 90 }, css: "y" })

    const b = createStore(memoryStorage())
    b.addClient("Other")
    const result = b.importJson(a.exportJson())
    expect(result).toEqual({ ok: true, clients: 1, snippets: 1 })
    expect(b.getState().clients.map((c) => c.name).sort()).toEqual(["Acme", "Other"])

    b.importJson(a.exportJson())
    expect(b.getState().clients).toHaveLength(2)
    expect(b.getState().snippets).toHaveLength(1)
  })

  it("rejects invalid import files without changing data", () => {
    const store = createStore(memoryStorage())
    store.addClient("Acme")
    expect(store.importJson("nope")).toMatchObject({ ok: false })
    expect(store.importJson(JSON.stringify({ version: 2 }))).toMatchObject({ ok: false })
    expect(
      store.importJson(JSON.stringify({ version: 1, clients: [], snippets: [{ id: "x", tool: "bad" }] })),
    ).toMatchObject({ ok: false })
    expect(store.getState().clients).toHaveLength(1)
  })
})
