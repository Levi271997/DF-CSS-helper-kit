import { useMemo, useState } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Select, Slider, TextField } from "@/components/controls"
import { HtmlPanel } from "@/components/HtmlPanel"
import { useToolState } from "@/components/useToolState"
import { declsToStyle } from "@/lib/css"
import { newId } from "@/lib/id"
import {
  ALIGN_CONTENT,
  ALIGN_ITEMS,
  ALIGN_SELF,
  DIRECTIONS,
  JUSTIFY,
  WRAPS,
  buildFlexCss,
  buildFlexHtml,
  containerDecls,
  itemDecls,
  newFlexItem,
  type FlexItem,
  type FlexSettings,
} from "./build-css"

const MAX_ITEMS = 12

const defaults = (): FlexSettings => ({
  direction: "row",
  wrap: "nowrap",
  justify: "flex-start",
  alignItems: "stretch",
  alignContent: "normal",
  rowGap: 12,
  columnGap: 12,
  parentClass: "parent",
  itemPrefix: "child",
  items: Array.from({ length: 4 }, () => newFlexItem(newId())),
})

// Preview-only padding so items differ in size and alignment changes are visible.
const PREVIEW_PADDING = ["16px 24px", "32px 20px", "10px 36px", "24px 28px"]

export default function FlexboxPage() {
  const { state, update, reset, loadedSnippet } = useToolState("flexbox", defaults)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const css = useMemo(() => buildFlexCss(state), [state])
  const html = useMemo(() => buildFlexHtml(state), [state])

  const selectedIndex = state.items.findIndex((it) => it.id === selectedId)
  const selected = selectedIndex >= 0 ? state.items[selectedIndex] : null

  const updateItem = (patch: Partial<FlexItem>) =>
    update({ items: state.items.map((it) => (it.id === selectedId ? { ...it, ...patch } : it)) })

  const addItem = () => {
    const item = newFlexItem(newId())
    update({ items: [...state.items, item] })
    setSelectedId(item.id)
  }

  const removeSelected = () => {
    update({ items: state.items.filter((it) => it.id !== selectedId) })
    setSelectedId(null)
  }

  return (
    <ToolLayout
      title="Flexbox"
      description="Set the container's direction, wrapping and alignment, then click an item to change how it grows, shrinks and aligns."
      tool="flexbox"
      css={css}
      settings={state}
      onReset={() => {
        reset()
        setSelectedId(null)
      }}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div
            className="h-90 min-w-[320px] border border-dashed border-slate-300 bg-white p-3"
            style={declsToStyle(containerDecls(state))}
          >
            {state.items.map((it, i) => (
              <button
                key={it.id}
                type="button"
                aria-pressed={it.id === selectedId}
                aria-label={`Select item ${i + 1}`}
                onClick={() => setSelectedId(it.id === selectedId ? null : it.id)}
                className={`flex min-h-12 min-w-16 items-center justify-center font-heading text-lg font-semibold transition-colors ${
                  it.id === selectedId
                    ? "bg-accent-400 text-brand-600 outline-2 outline-offset-2 outline-accent-500"
                    : "bg-brand-600 text-white hover:bg-brand-500"
                }`}
                style={{ ...declsToStyle(itemDecls(it)), padding: PREVIEW_PADDING[i % PREVIEW_PADDING.length] }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      }
      below={<HtmlPanel html={html} />}
      controls={
        <>
          <Section title="Container">
            <div className="grid grid-cols-2 gap-4">
              <Select label="Direction" value={state.direction} options={DIRECTIONS} onChange={(direction) => update({ direction })} />
              <Select label="Wrap" value={state.wrap} options={WRAPS} onChange={(wrap) => update({ wrap })} />
              <Select label="Justify content" value={state.justify} options={JUSTIFY} onChange={(justify) => update({ justify })} />
              <Select label="Align items" value={state.alignItems} options={ALIGN_ITEMS} onChange={(alignItems) => update({ alignItems })} />
            </div>
            <Select label="Align content" value={state.alignContent} options={ALIGN_CONTENT} onChange={(alignContent) => update({ alignContent })} />
            {state.wrap === "nowrap" && <p className="text-xs text-slate-500">Align content only applies when items wrap.</p>}
          </Section>

          <Section title="Gap">
            <Slider label="Row gap" unit="px" min={0} max={64} value={state.rowGap} onChange={(rowGap) => update({ rowGap })} />
            <Slider label="Column gap" unit="px" min={0} max={64} value={state.columnGap} onChange={(columnGap) => update({ columnGap })} />
          </Section>

          <Section
            title="Items"
            action={
              <Button variant="ghost" disabled={state.items.length >= MAX_ITEMS} onClick={addItem}>
                + Add item
              </Button>
            }
          >
            {selected ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Item {selectedIndex + 1}</span>
                  <Button variant="danger" onClick={removeSelected}>
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Slider label="Grow" min={0} max={10} value={selected.grow} onChange={(grow) => updateItem({ grow })} />
                  <Slider label="Shrink" min={0} max={10} value={selected.shrink} onChange={(shrink) => updateItem({ shrink })} />
                  <TextField label="Basis" value={selected.basis} placeholder="auto" onChange={(basis) => updateItem({ basis })} />
                  <Select label="Align self" value={selected.alignSelf} options={ALIGN_SELF} onChange={(alignSelf) => updateItem({ alignSelf })} />
                </div>
                <Slider label="Order" min={-10} max={10} value={selected.order} onChange={(order) => updateItem({ order })} />
              </>
            ) : (
              <p className="text-xs text-slate-500">
                {state.items.length} item{state.items.length === 1 ? "" : "s"}. Click an item in the preview to edit it.
              </p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Parent class" value={state.parentClass} placeholder="parent" onChange={(parentClass) => update({ parentClass })} />
              <TextField label="Item class prefix" value={state.itemPrefix} placeholder="child" onChange={(itemPrefix) => update({ itemPrefix })} />
            </div>
          </Section>
        </>
      }
    />
  )
}
