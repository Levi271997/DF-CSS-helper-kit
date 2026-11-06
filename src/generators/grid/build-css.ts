export interface GridItem {
  id: string
  /** 1-based start column / row. */
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

export interface GridSettings {
  columns: number
  rows: number
  columnGap: number
  rowGap: number
  /** Track size used for every column / row, e.g. `1fr`, `100px`, `auto`. */
  columnSize: string
  rowSize: string
  parentClass: string
  itemPrefix: string
  items: GridItem[]
}

export interface Rect {
  col: number
  row: number
  colSpan: number
  rowSpan: number
}

/** Normalised rectangle covering two cells, in either drag direction. */
export function rectFromCells(a: { col: number; row: number }, b: { col: number; row: number }): Rect {
  const col = Math.min(a.col, b.col)
  const row = Math.min(a.row, b.row)
  return { col, row, colSpan: Math.abs(a.col - b.col) + 1, rowSpan: Math.abs(a.row - b.row) + 1 }
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.col < b.col + b.colSpan &&
    b.col < a.col + a.colSpan &&
    a.row < b.row + b.rowSpan &&
    b.row < a.row + a.rowSpan
  )
}

export function collides(rect: Rect, items: GridItem[], exceptId?: string): boolean {
  return items.some((it) => it.id !== exceptId && overlaps(rect, it))
}

/** Drops items that start outside the grid and trims spans that run past its edge. */
export function fitItems(items: GridItem[], columns: number, rows: number): GridItem[] {
  return items
    .filter((it) => it.col <= columns && it.row <= rows)
    .map((it) => ({
      ...it,
      colSpan: Math.min(it.colSpan, columns - it.col + 1),
      rowSpan: Math.min(it.rowSpan, rows - it.row + 1),
    }))
}

const track = (count: number, size: string) => `repeat(${count}, ${size.trim() || "1fr"})`

export function gapValue(s: GridSettings): string {
  return s.rowGap === s.columnGap ? `${s.rowGap}px` : `${s.rowGap}px ${s.columnGap}px`
}

/** `grid-area: row-start / col-start / row-end / col-end` */
export function areaValue(it: GridItem): string {
  return `${it.row} / ${it.col} / ${it.row + it.rowSpan} / ${it.col + it.colSpan}`
}

const cls = (name: string, fallback: string) => name.trim().replace(/[^\w-]/g, "-") || fallback

export function buildGridCss(s: GridSettings): string {
  const parent = cls(s.parentClass, "parent")
  const prefix = cls(s.itemPrefix, "div")
  const lines = [
    `.${parent} {`,
    `  display: grid;`,
    `  grid-template-columns: ${track(s.columns, s.columnSize)};`,
    `  grid-template-rows: ${track(s.rows, s.rowSize)};`,
    `  gap: ${gapValue(s)};`,
    `}`,
  ]
  s.items.forEach((it, i) => {
    lines.push("", `.${prefix}${i + 1} {`, `  grid-area: ${areaValue(it)};`, `}`)
  })
  return lines.join("\n")
}

export function buildGridHtml(s: GridSettings): string {
  const parent = cls(s.parentClass, "parent")
  const prefix = cls(s.itemPrefix, "div")
  const children = s.items.map((_, i) => `  <div class="${prefix}${i + 1}">${i + 1}</div>`)
  return [`<div class="${parent}">`, ...children, `</div>`].join("\n")
}
