import { useEffect, useId, useMemo, useState } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Slider } from "@/components/controls"
import { useToast } from "@/components/Toast"
import { useToolState } from "@/components/useToolState"
import { copyText } from "@/lib/clipboard"
import { newId } from "@/lib/id"
import {
  areaValue,
  buildGridCss,
  buildGridHtml,
  collides,
  fitItems,
  gapValue,
  rectFromCells,
  type GridSettings,
  type Rect,
} from "./build-css"

type Cell = { col: number; row: number }
type Drag = { kind: "create"; start: Cell; current: Cell } | { kind: "resize"; id: string; current: Cell }

const defaults = (): GridSettings => ({
  columns: 5,
  rows: 5,
  columnGap: 8,
  rowGap: 8,
  columnSize: "1fr",
  rowSize: "1fr",
  parentClass: "parent",
  itemPrefix: "div",
  items: [],
})

/** Finds the placeholder cell under the pointer (items ignore pointer events while dragging). */
function cellAt(x: number, y: number): Cell | null {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-cell]")
  if (!el) return null
  const [col, row] = el.dataset.cell!.split(",").map(Number)
  return { col, row }
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const id = useId()
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-slate-700">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-700"
      />
    </div>
  )
}

export default function GridPage() {
  const { state, update, reset, loadedSnippet } = useToolState("grid", defaults)
  const [drag, setDrag] = useState<Drag | null>(null)
  const toast = useToast()

  const css = useMemo(() => buildGridCss(state), [state])
  const html = useMemo(() => buildGridHtml(state), [state])

  const setSize = (patch: Partial<Pick<GridSettings, "columns" | "rows">>) => {
    const columns = patch.columns ?? state.columns
    const rows = patch.rows ?? state.rows
    update({ ...patch, items: fitItems(state.items, columns, rows) })
  }

  // Rectangle the current drag would produce, and whether it's allowed.
  const ghost = useMemo((): { rect: Rect; ok: boolean } | null => {
    if (!drag) return null
    if (drag.kind === "create") {
      const rect = rectFromCells(drag.start, drag.current)
      return { rect, ok: !collides(rect, state.items) }
    }
    const item = state.items.find((it) => it.id === drag.id)
    if (!item) return null
    const rect = {
      col: item.col,
      row: item.row,
      colSpan: Math.max(1, drag.current.col - item.col + 1),
      rowSpan: Math.max(1, drag.current.row - item.row + 1),
    }
    return { rect, ok: !collides(rect, state.items, item.id) }
  }, [drag, state.items])

  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => {
      const cell = cellAt(e.clientX, e.clientY)
      if (cell && (cell.col !== drag.current.col || cell.row !== drag.current.row)) setDrag({ ...drag, current: cell })
    }
    const up = () => {
      if (ghost?.ok) {
        if (drag.kind === "create") update({ items: [...state.items, { id: newId(), ...ghost.rect }] })
        else update({ items: state.items.map((it) => (it.id === drag.id ? { ...it, ...ghost.rect } : it)) })
      }
      setDrag(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
    return () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
    }
  }, [drag, ghost, state.items, update])

  const gridStyle = {
    gridTemplateColumns: `repeat(${state.columns}, ${state.columnSize.trim() || "1fr"})`,
    gridTemplateRows: `repeat(${state.rows}, ${state.rowSize.trim() || "1fr"})`,
    gap: gapValue(state),
  }

  const cells: Cell[] = []
  for (let row = 1; row <= state.rows; row++) for (let col = 1; col <= state.columns; col++) cells.push({ col, row })

  const copyHtml = async () => {
    const ok = await copyText(html)
    toast(ok ? "HTML copied to clipboard" : "Couldn't copy — select the code and copy it manually", ok ? "ok" : "error")
  }

  return (
    <ToolLayout
      title="CSS grid"
      description="Click a cell to add an item, drag across cells to span several, and drag an item's corner to resize it."
      tool="grid"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div
            className={`relative grid h-[420px] min-w-[320px] select-none touch-none ${drag ? "cursor-crosshair" : ""}`}
            style={gridStyle}
          >
            {cells.map((c) => (
              <button
                key={`${c.col},${c.row}`}
                type="button"
                data-cell={`${c.col},${c.row}`}
                aria-label={`Add item at column ${c.col}, row ${c.row}`}
                onPointerDown={(e) => {
                  e.preventDefault()
                  setDrag({ kind: "create", start: c, current: c })
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" && e.key !== " ") return
                  e.preventDefault()
                  const rect = { ...c, colSpan: 1, rowSpan: 1 }
                  if (!collides(rect, state.items)) update({ items: [...state.items, { id: newId(), ...rect }] })
                }}
                className="group flex min-h-8 items-center justify-center border border-dashed border-slate-300 bg-white text-lg text-slate-300 hover:border-accent-400 hover:text-accent-500"
                style={{ gridArea: `${c.row} / ${c.col}` }}
              >
                <span className="opacity-0 group-hover:opacity-100" aria-hidden>
                  +
                </span>
              </button>
            ))}

            {state.items.map((it, i) => (
              <div
                key={it.id}
                className={`relative flex items-center justify-center bg-brand-600 font-heading text-lg font-semibold text-white ${
                  drag ? "pointer-events-none" : ""
                } ${drag?.kind === "resize" && drag.id === it.id ? "opacity-40" : ""}`}
                style={{ gridArea: areaValue(it) }}
              >
                {i + 1}
                <button
                  type="button"
                  aria-label={`Remove item ${i + 1}`}
                  onClick={() => update({ items: state.items.filter((x) => x.id !== it.id) })}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center text-sm text-white/70 hover:bg-white/15 hover:text-white"
                >
                  ×
                </button>
                <span
                  role="presentation"
                  title="Drag to resize"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    setDrag({ kind: "resize", id: it.id, current: { col: it.col + it.colSpan - 1, row: it.row + it.rowSpan - 1 } })
                  }}
                  className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-accent-400"
                />
              </div>
            ))}

            {ghost && (
              <div
                className={`pointer-events-none border-2 ${ghost.ok ? "border-accent-400 bg-accent-400/25" : "border-rose-500 bg-rose-500/20"}`}
                style={{ gridArea: areaValue({ id: "", ...ghost.rect }) }}
              />
            )}
          </div>
        </div>
      }
      below={
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
            <span className="text-sm font-semibold text-slate-700">HTML</span>
            <Button variant="primary" onClick={copyHtml}>
              Copy HTML
            </Button>
          </div>
          <pre className="overflow-x-auto bg-brand-700 p-4 font-mono text-[13px] leading-relaxed text-slate-100">
            <code>{html}</code>
          </pre>
        </div>
      }
      controls={
        <>
          <Section title="Tracks">
            <Slider label="Columns" min={1} max={12} value={state.columns} onChange={(columns) => setSize({ columns })} />
            <Slider label="Rows" min={1} max={12} value={state.rows} onChange={(rows) => setSize({ rows })} />
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Column size" value={state.columnSize} placeholder="1fr" onChange={(columnSize) => update({ columnSize })} />
              <TextField label="Row size" value={state.rowSize} placeholder="1fr" onChange={(rowSize) => update({ rowSize })} />
            </div>
          </Section>

          <Section title="Gap">
            <Slider label="Column gap" unit="px" min={0} max={64} value={state.columnGap} onChange={(columnGap) => update({ columnGap })} />
            <Slider label="Row gap" unit="px" min={0} max={64} value={state.rowGap} onChange={(rowGap) => update({ rowGap })} />
          </Section>

          <Section
            title="Items"
            action={
              <Button variant="danger" disabled={!state.items.length} onClick={() => update({ items: [] })}>
                Clear all
              </Button>
            }
          >
            <p className="text-xs text-slate-500">
              {state.items.length ? `${state.items.length} item${state.items.length > 1 ? "s" : ""} placed.` : "No items yet — click a cell in the preview."}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Parent class" value={state.parentClass} placeholder="parent" onChange={(parentClass) => update({ parentClass })} />
              <TextField label="Item class prefix" value={state.itemPrefix} placeholder="div" onChange={(itemPrefix) => update({ itemPrefix })} />
            </div>
          </Section>
        </>
      }
    />
  )
}
