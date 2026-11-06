import { Button } from "./controls"
import { useToast } from "./Toast"
import { copyText } from "@/lib/clipboard"

/** Read-only HTML markup panel with a copy button, shown under the CSS panel. */
export function HtmlPanel({ html }: { html: string }) {
  const toast = useToast()
  const copy = async () => {
    const ok = await copyText(html)
    toast(ok ? "HTML copied to clipboard" : "Couldn't copy — select the code and copy it manually", ok ? "ok" : "error")
  }
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
        <span className="text-sm font-semibold text-slate-700">HTML</span>
        <Button variant="primary" onClick={copy}>
          Copy HTML
        </Button>
      </div>
      <pre className="overflow-x-auto bg-brand-700 p-4 font-mono text-[13px] leading-relaxed text-slate-100">
        <code>{html}</code>
      </pre>
    </div>
  )
}
