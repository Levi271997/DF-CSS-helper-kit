import { useMemo } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Section, Select, Slider, TextField } from "@/components/controls"
import { HtmlPanel } from "@/components/HtmlPanel"
import { usePreviewImage, useToolState } from "@/components/useToolState"
import { FITS, FIT_HELP, RATIOS, buildAspectCss, buildAspectHtml, positionValue, ratioParts, type AspectSettings } from "./build-css"

const defaults = (): AspectSettings => ({
  ratio: "16/9",
  customW: 5,
  customH: 2,
  fit: "cover",
  posX: 50,
  posY: 50,
  className: "media",
})

// Checkerboard so empty areas from contain / none are obvious.
const CHECKER = {
  backgroundColor: "#f1f5f9",
  backgroundImage: "linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%),linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%)",
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 8px 8px",
}

export default function AspectPage() {
  const { state, update, reset, loadedSnippet } = useToolState("aspect", defaults)
  const [image, upload] = usePreviewImage()
  const css = useMemo(() => buildAspectCss(state), [state])
  const html = useMemo(() => buildAspectHtml(state), [state])
  const [w, h] = ratioParts(state)
  const position = positionValue(state.posX, state.posY)
  // Tall ratios get a narrower box so they fit the preview area.
  const boxWidth = `min(100%, ${Math.round(Math.min(560, 380 * (w / h)))}px)`

  return (
    <ToolLayout
      title="Aspect ratio and object-fit"
      description="Lock a box to a ratio and see how an image fills it with each object-fit and object-position setting."
      tool="aspect"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex justify-center">
            <div className="overflow-hidden border border-slate-300" style={{ ...CHECKER, aspectRatio: `${w} / ${h}`, width: boxWidth }}>
              <img src={image} alt="" className="block h-full w-full" style={{ objectFit: state.fit, objectPosition: position }} />
            </div>
          </div>
          <p className="text-center text-sm text-slate-500">{FIT_HELP[state.fit]}</p>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 sm:grid-cols-5">
            {FITS.map((fit) => (
              <button
                key={fit}
                type="button"
                aria-pressed={state.fit === fit}
                onClick={() => update({ fit })}
                className={`space-y-1 p-1 text-center transition-colors ${state.fit === fit ? "bg-accent-400/20 outline-2 outline-accent-400" : "hover:bg-slate-50"}`}
              >
                <div className="overflow-hidden border border-slate-200" style={{ ...CHECKER, aspectRatio: `${w} / ${h}` }}>
                  <img src={image} alt="" className="block h-full w-full" style={{ objectFit: fit, objectPosition: position }} />
                </div>
                <span className="font-mono text-xs text-slate-600">{fit}</span>
              </button>
            ))}
          </div>

          <label className="inline-block cursor-pointer text-sm font-medium text-brand-500 hover:underline">
            Try your own image
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) upload(URL.createObjectURL(file))
                e.target.value = ""
              }}
            />
          </label>
        </div>
      }
      below={<HtmlPanel html={html} />}
      controls={
        <>
          <Section title="Box">
            <Select label="Aspect ratio" value={state.ratio} options={RATIOS} onChange={(ratio) => update({ ratio })} />
            {state.ratio === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <Slider label="Width" min={1} max={32} value={state.customW} onChange={(customW) => update({ customW })} />
                <Slider label="Height" min={1} max={32} value={state.customH} onChange={(customH) => update({ customH })} />
              </div>
            )}
            <TextField label="Class name" value={state.className} placeholder="media" onChange={(className) => update({ className })} />
          </Section>

          <Section title="Image">
            <Select label="object-fit" value={state.fit} options={FITS} onChange={(fit) => update({ fit })} />
            {state.fit === "fill" ? (
              <p className="text-xs text-slate-500">Position has no effect with fill, because the image always covers the whole box.</p>
            ) : (
              <>
                <Slider label="Focus X" unit="%" min={0} max={100} value={state.posX} onChange={(posX) => update({ posX })} />
                <Slider label="Focus Y" unit="%" min={0} max={100} value={state.posY} onChange={(posY) => update({ posY })} />
                <p className="text-xs text-slate-500">Moves which part of the image stays visible when it's cropped or letterboxed.</p>
              </>
            )}
          </Section>
        </>
      }
    />
  )
}
