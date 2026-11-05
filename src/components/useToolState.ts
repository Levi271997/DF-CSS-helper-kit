import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { store, type ToolId } from "@/store"
import { SCENE_URL } from "@/lib/scene"

/**
 * Tool settings state. When the URL has `?snippet=<id>` for this tool, starts
 * from that snippet's saved settings. The page is remounted per URL (see App),
 * so this only runs once per snippet.
 */
export function useToolState<T extends object>(tool: ToolId, defaults: () => T) {
  const [params] = useSearchParams()
  const snippetId = params.get("snippet")

  const [initial] = useState(() => {
    const snippet = snippetId
      ? store.getState().snippets.find((s) => s.id === snippetId && s.tool === tool)
      : undefined
    const saved = snippet && typeof snippet.settings === "object" && snippet.settings !== null
    return {
      state: saved ? ({ ...defaults(), ...(snippet.settings as Partial<T>) } as T) : defaults(),
      name: snippet?.name,
    }
  })

  const [state, setState] = useState<T>(initial.state)
  const update = useCallback((patch: Partial<T>) => setState((s) => ({ ...s, ...patch })), [])
  const reset = useCallback(() => setState(defaults()), [defaults])

  return { state, setState, update, reset, loadedSnippet: initial.name }
}

/** Preview background: the built-in scene, or an uploaded image kept in memory only. */
export function usePreviewImage() {
  const [src, setSrc] = useState(SCENE_URL)
  const current = useRef<string | null>(null)

  const upload = useCallback((url: string) => {
    if (current.current) URL.revokeObjectURL(current.current)
    current.current = url
    setSrc(url)
  }, [])

  useEffect(() => () => {
    if (current.current) URL.revokeObjectURL(current.current)
  }, [])

  return [src, upload] as const
}
