import type { ReactNode } from "react"
import { Button } from "./controls"
import { CodePanel } from "./CodePanel"
import type { ToolId } from "@/store"

interface Props {
  title: string
  description: string
  tool: ToolId
  css: string
  settings: unknown
  preview: ReactNode
  controls: ReactNode
  onReset: () => void
  loadedSnippet?: string
  /** Extra content under the CSS panel (e.g. a points table). */
  below?: ReactNode
}

export function ToolLayout({ title, description, tool, css, settings, preview, controls, onReset, loadedSnippet, below }: Props) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-600">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        {loadedSnippet && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Editing snippet: {loadedSnippet}
          </span>
        )}
      </header>

      {/* grid-cols-1 = minmax(0, 1fr): keeps long CSS lines from widening the page on mobile */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6 lg:sticky lg:top-6">
          {preview}
          <CodePanel css={css} tool={tool} settings={settings} />
          {below}
        </div>

        <aside className="min-w-0 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Settings</h2>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
          </div>
          <div className="space-y-5">{controls}</div>
        </aside>
      </div>
    </div>
  )
}

/** Standard preview frame with an optional background image and an upload button. */
export function PreviewFrame({
  children,
  background,
  onUpload,
  className = "",
}: {
  children: ReactNode
  background?: string
  onUpload?: (url: string) => void
  className?: string
}) {
  return (
    <div
      className={`relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-cover bg-center sm:aspect-[16/10] ${className}`}
      style={background ? { backgroundImage: `url("${background}")` } : undefined}
    >
      {children}
      {onUpload && (
        <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow backdrop-blur hover:bg-white">
          Upload image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(URL.createObjectURL(file))
              e.target.value = ""
            }}
          />
        </label>
      )}
    </div>
  )
}
