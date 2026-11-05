import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section } from "@/components/controls"
import { usePreviewImage, useToolState } from "@/components/useToolState"
import { clamp, round } from "@/lib/color"
import { declsToCss, declsToStyle } from "@/lib/css"
import { newId } from "@/lib/id"
import { buildClip, CLIP_PRESETS, insertIndex, MIN_POINTS, polygonValue, type ClipPoint, type ClipSettings } from "./build-css"

const toPoints = (coords: [number, number][]): ClipPoint[] => coords.map(([x, y]) => ({ id: newId(), x, y }))

const defaults = (): ClipSettings => ({ points: toPoints(CLIP_PRESETS[5].coords) })

const isTyping = (el: Element | null) =>
  !!el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || (el as HTMLElement).isContentEditable)

export default function ClipPathPage() {
  const { state, update, reset, loadedSnippet } = useToolState("clip-path", defaults)
  const [image, upload] = usePreviewImage()
  const [selected, setSelected] = useState<string | null>(null)
  const dragging = useRef<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const decls = useMemo(() => buildClip(state), [state])
  const { points } = state

  const toPercent = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100), 1),
      y: round(clamp(((clientY - rect.top) / rect.height) * 100, 0, 100), 1),
    }
  }

  const setPoint = (id: string, patch: Partial<ClipPoint>) =>
    update({ points: points.map((p) => (p.id === id ? { ...p, ...patch } : p)) })

  const removePoint = (id: string) => {
    if (points.length <= MIN_POINTS) return
    update({ points: points.filter((p) => p.id !== id) })
    setSelected((s) => (s === id ? null : s))
  }

  const addAt = (x: number, y: number) => {
    const at = insertIndex(points, x, y)
    const pt = { id: newId(), x, y }
    update({ points: [...points.slice(0, at), pt, ...points.slice(at)] })
    setSelected(pt.id)
  }

  // Keyboard: Delete removes the selected point, arrows nudge it (Shift = 10).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected || isTyping(document.activeElement)) return
      const p = points.find((pt) => pt.id === selected)
      if (!p) return
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault()
        removePoint(selected)
        return
      }
      const step = e.shiftKey ? 10 : 1
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
      }
      const d = delta[e.key]
      if (d) {
        e.preventDefault()
        setPoint(selected, { x: clamp(p.x + d[0], 0, 100), y: clamp(p.y + d[1], 0, 100) })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const onHandleDown = (e: ReactPointerEvent<SVGCircleElement>, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = id
    setSelected(id)
  }
  const onHandleMove = (e: ReactPointerEvent<SVGCircleElement>, id: string) => {
    if (dragging.current !== id) return
    setPoint(id, toPercent(e.clientX, e.clientY))
  }
  const onHandleUp = () => {
    dragging.current = null
  }

  const pointsTable = (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Points ({points.length})</div>
      <div className="max-h-72 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-4 py-2 text-left font-medium">#</th>
              <th className="px-4 py-2 text-left font-medium">X %</th>
              <th className="px-4 py-2 text-left font-medium">Y %</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.id} className={`border-t border-slate-100 ${selected === p.id ? "bg-indigo-50" : ""}`} onClick={() => setSelected(p.id)}>
                <td className="px-4 py-1.5 font-mono text-slate-500">{i + 1}</td>
                {(["x", "y"] as const).map((axis) => (
                  <td key={axis} className="px-4 py-1.5">
                    <input
                      type="number"
                      aria-label={`Point ${i + 1} ${axis}`}
                      min={0}
                      max={100}
                      step={0.1}
                      value={p[axis]}
                      onChange={(e) => {
                        const n = parseFloat(e.target.value)
                        if (!Number.isNaN(n)) setPoint(p.id, { [axis]: round(clamp(n, 0, 100), 1) })
                      }}
                      className="w-20 rounded-md border border-slate-200 px-2 py-1 font-mono text-xs"
                    />
                  </td>
                ))}
                <td className="px-4 py-1.5 text-right">
                  <Button
                    variant="danger"
                    aria-label={`Remove point ${i + 1}`}
                    disabled={points.length <= MIN_POINTS}
                    onClick={(e) => {
                      e.stopPropagation()
                      removePoint(p.id)
                    }}
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <ToolLayout
      title="Clip path"
      description="Drag handles to shape the polygon. Click the canvas to add a point on the nearest edge; Delete removes the selected point, arrow keys nudge it."
      tool="clip-path"
      css={declsToCss(decls)}
      settings={state}
      onReset={() => {
        reset()
        setSelected(null)
      }}
      loadedSnippet={loadedSnippet}
      below={pointsTable}
      preview={
        <div className="relative mx-auto aspect-square w-full max-w-xl select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" draggable={false} />
          <img src={image} alt="Clipped preview" className="absolute inset-0 h-full w-full object-cover" style={declsToStyle(decls)} draggable={false} />
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full touch-none"
          >
            <rect
              width="100"
              height="100"
              fill="transparent"
              className="cursor-crosshair"
              onClick={(e) => {
                const { x, y } = toPercent(e.clientX, e.clientY)
                addAt(x, y)
              }}
            />
            <polygon
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
            {points.map((p) => (
              <circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={selected === p.id ? 2.6 : 2}
                fill={selected === p.id ? "#4f46e5" : "#ffffff"}
                stroke="#4f46e5"
                strokeWidth="0.6"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => onHandleDown(e, p.id)}
                onPointerMove={(e) => onHandleMove(e, p.id)}
                onPointerUp={onHandleUp}
                onPointerCancel={onHandleUp}
              />
            ))}
          </svg>
          <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow hover:bg-white">
            Upload image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) upload(URL.createObjectURL(f))
                e.target.value = ""
              }}
            />
          </label>
        </div>
      }
      controls={
        <>
          <Section title="Shapes">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-3">
              {CLIP_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    update({ points: toPoints(p.coords) })
                    setSelected(null)
                  }}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 p-2 hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <span className="h-9 w-9 bg-indigo-500" style={{ clipPath: polygonValue(toPoints(p.coords)) }} />
                  <span className="text-[11px] text-slate-600">{p.name}</span>
                </button>
              ))}
            </div>
          </Section>
          <Section title="Selected point">
            {selected ? (
              <div className="flex gap-2">
                <Button variant="danger" disabled={points.length <= MIN_POINTS} onClick={() => removePoint(selected)}>
                  Delete point
                </Button>
                <Button variant="ghost" onClick={() => setSelected(null)}>
                  Deselect
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Click a handle to select it.</p>
            )}
          </Section>
        </>
      }
    />
  )
}
