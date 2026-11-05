import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { newId } from "@/lib/id"

type Kind = "ok" | "error"
type Show = (message: string, kind?: Kind) => void

const ToastContext = createContext<Show>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: string; message: string; kind: Kind }[]>([])

  const show = useCallback<Show>((message, kind = "ok") => {
    const id = newId()
    setItems((list) => [...list.slice(-2), { id, message, kind }])
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2600)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.kind === "error" ? "bg-rose-600" : "bg-slate-900"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
