import type { ComponentType } from "react"
import type { ToolId } from "@/store"
import ShadowPage from "@/generators/shadow/ShadowPage"
import GlassPage from "@/generators/glass/GlassPage"
import FiltersPage from "@/generators/filters/FiltersPage"
import GradientPage from "@/generators/gradient/GradientPage"
import ClipPathPage from "@/generators/clip-path/ClipPathPage"
import TransformPage from "@/generators/transform/TransformPage"
import RadiusPage from "@/generators/radius/RadiusPage"

// Pages are small (~30 KB combined), so they're bundled up front — no loading flash.
export const TOOLS: { id: ToolId; path: string; label: string; page: ComponentType }[] = [
  { id: "shadow", path: "/shadow", label: "Box shadow", page: ShadowPage },
  { id: "glass", path: "/glass", label: "Glassmorphism", page: GlassPage },
  { id: "filters", path: "/filters", label: "Filters", page: FiltersPage },
  { id: "gradient", path: "/gradient", label: "Gradients", page: GradientPage },
  { id: "clip-path", path: "/clip-path", label: "Clip path", page: ClipPathPage },
  { id: "transform", path: "/transform", label: "Transforms", page: TransformPage },
  { id: "radius", path: "/radius", label: "Border radius", page: RadiusPage },
]
