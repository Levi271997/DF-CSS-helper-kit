import { useMemo, useState } from "react"
import { ToolLayout } from "@/components/ToolLayout"
import { Button, Section, Select, Slider, TextField, Toggle } from "@/components/controls"
import { useToolState } from "@/components/useToolState"
import {
  DIRECTIONS,
  EASINGS,
  FILLS,
  PARAM_DEFAULTS,
  PRESETS,
  PRESET_IDS,
  buildAnimationCss,
  type AnimationSettings,
  type PresetId,
} from "./build-css"

const presetPatch = (preset: PresetId): Partial<AnimationSettings> => ({
  preset,
  name: preset,
  ...PRESETS[preset].timing,
  delay: 0,
  iterations: 1,
  ...PARAM_DEFAULTS[preset],
})

const defaults = (): AnimationSettings => ({
  preset: "slide-in-up",
  name: "slide-in-up",
  className: "animate",
  distance: 40,
  scale: 1.08,
  duration: 700,
  delay: 0,
  easing: "ease-out",
  infinite: false,
  iterations: 1,
  direction: "normal",
  fill: "both",
  reducedMotion: true,
  ...presetPatch("slide-in-up"),
})

export default function AnimationPage() {
  const { state, update, reset, loadedSnippet } = useToolState("animation", defaults)
  const [replay, setReplay] = useState(0)

  const css = useMemo(() => buildAnimationCss(state), [state])
  // The preview ignores the reduced-motion block so it always plays, and uses its own names to avoid clashes.
  const previewCss = useMemo(
    () => buildAnimationCss({ ...state, className: "dfanim-preview", reducedMotion: false }, "dfanim-preview-kf"),
    [state],
  )
  const params = PRESETS[state.preset].params

  return (
    <ToolLayout
      title="Animations"
      description="Pick a keyframe animation and tune its timing. Copy the @keyframes rule and the animation line together."
      tool="animation"
      css={css}
      settings={state}
      onReset={reset}
      loadedSnippet={loadedSnippet}
      preview={
        <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 sm:aspect-video">
          <style>{previewCss}</style>
          {/* Re-keyed on every change so the animation restarts from the beginning. */}
          <div
            key={`${replay}-${previewCss}`}
            className="dfanim-preview flex h-28 w-28 items-center justify-center bg-brand-600 font-heading text-2xl font-bold text-accent-400 shadow-lg sm:h-36 sm:w-36"
          >
            DF
          </div>
          <Button variant="secondary" className="absolute bottom-3 right-3" onClick={() => setReplay((r) => r + 1)}>
            ↻ Replay
          </Button>
        </div>
      }
      controls={
        <>
          <Section title="Animation">
            <div className="flex flex-wrap gap-2">
              {PRESET_IDS.map((id) => (
                <Button
                  key={id}
                  variant={state.preset === id ? "primary" : "secondary"}
                  aria-pressed={state.preset === id}
                  onClick={() => update(presetPatch(id))}
                >
                  {PRESETS[id].label}
                </Button>
              ))}
            </div>
            {params.includes("distance") && (
              <Slider label="Distance" unit="px" min={1} max={200} value={state.distance} onChange={(distance) => update({ distance })} />
            )}
            {params.includes("scale") && (
              <Slider label="Scale" min={0} max={2} step={0.01} value={state.scale} onChange={(scale) => update({ scale })} />
            )}
          </Section>

          <Section title="Timing">
            <div className="grid grid-cols-2 gap-4">
              <Slider label="Duration" unit="ms" min={50} max={5000} step={50} value={state.duration} onChange={(duration) => update({ duration })} />
              <Slider label="Delay" unit="ms" min={0} max={3000} step={50} value={state.delay} onChange={(delay) => update({ delay })} />
            </div>
            <Select label="Easing" value={state.easing} options={EASINGS} onChange={(easing) => update({ easing })} />
          </Section>

          <Section title="Repeat">
            <Toggle label="Loop forever" checked={state.infinite} onChange={(infinite) => update({ infinite })} />
            {!state.infinite && (
              <Slider label="Times to play" min={1} max={10} value={state.iterations} onChange={(iterations) => update({ iterations })} />
            )}
            <div className="grid grid-cols-2 gap-4">
              <Select label="Direction" value={state.direction} options={DIRECTIONS} onChange={(direction) => update({ direction })} />
              <Select label="Fill mode" value={state.fill} options={FILLS} onChange={(fill) => update({ fill })} />
            </div>
          </Section>

          <Section title="Output">
            <div className="grid grid-cols-2 gap-4">
              <TextField label="Keyframes name" value={state.name} placeholder={state.preset} onChange={(name) => update({ name })} />
              <TextField label="Class name" value={state.className} placeholder="animate" onChange={(className) => update({ className })} />
            </div>
            <Toggle
              label="Turn off for visitors who prefer reduced motion"
              checked={state.reducedMotion}
              onChange={(reducedMotion) => update({ reducedMotion })}
            />
          </Section>
        </>
      }
    />
  )
}
