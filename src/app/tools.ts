import type { ComponentType } from "react"
import type { ToolId } from "@/store"
import ShadowPage from "@/generators/shadow/ShadowPage"
import TextShadowPage from "@/generators/text-shadow/TextShadowPage"
import FluidTypePage from "@/generators/fluid-type/FluidTypePage"
import ButtonPage from "@/generators/button/ButtonPage"
import AnimationPage from "@/generators/animation/AnimationPage"
import GlassPage from "@/generators/glass/GlassPage"
import FiltersPage from "@/generators/filters/FiltersPage"
import GradientPage from "@/generators/gradient/GradientPage"
import ClipPathPage from "@/generators/clip-path/ClipPathPage"
import TransformPage from "@/generators/transform/TransformPage"
import RadiusPage from "@/generators/radius/RadiusPage"
import GridPage from "@/generators/grid/GridPage"
import FlexboxPage from "@/generators/flexbox/FlexboxPage"
import BackgroundPage from "@/generators/background/BackgroundPage"

// Pages are small (~30 KB combined), so they're bundled up front — no loading flash.
export const TOOLS: { id: ToolId; path: string; label: string; page: ComponentType }[] = [
  { id: "shadow", path: "/shadow", label: "Box shadow", page: ShadowPage },
  { id: "text-shadow", path: "/text-shadow", label: "Text shadow", page: TextShadowPage },
  { id: "fluid-type", path: "/fluid-type", label: "Fluid typography", page: FluidTypePage },
  { id: "button", path: "/button", label: "Button builder", page: ButtonPage },
  { id: "animation", path: "/animation", label: "Animations", page: AnimationPage },
  { id: "glass", path: "/glass", label: "Glassmorphism", page: GlassPage },
  { id: "filters", path: "/filters", label: "Filters", page: FiltersPage },
  { id: "gradient", path: "/gradient", label: "Gradients", page: GradientPage },
  { id: "clip-path", path: "/clip-path", label: "Clip path", page: ClipPathPage },
  { id: "transform", path: "/transform", label: "Transforms", page: TransformPage },
  { id: "radius", path: "/radius", label: "Border radius", page: RadiusPage },
  { id: "grid", path: "/grid", label: "CSS grid", page: GridPage },
  { id: "flexbox", path: "/flexbox", label: "Flexbox", page: FlexboxPage },
  { id: "background", path: "/background", label: "Background", page: BackgroundPage },
]
