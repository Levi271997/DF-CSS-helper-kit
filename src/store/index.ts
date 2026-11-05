import { useSyncExternalStore } from "react"
import { createStore, type Client, type Data } from "./store"

const storage = (() => {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
})()

export const store = createStore(storage)

export function useData<T>(selector: (d: Data) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()))
}

export function useActiveClient(): Client | null {
  return useData((d) => d.clients.find((c) => c.id === d.activeClientId) ?? null)
}

export * from "./store"
