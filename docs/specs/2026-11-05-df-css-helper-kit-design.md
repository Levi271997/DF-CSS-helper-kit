# DF CSS Helper Kit — Design

Date: 2026-11-05

## Purpose

Internal tool for the Digitalfeet team to generate CSS for client work. Pick a
client, build an effect with that client's brand colors, copy the CSS, and find
it again later as a saved snippet.

Written from scratch. Not derived from any other project's code.

## Scope (v1)

Seven generators plus client tools:

| Route        | Tool            | Output                                      |
|--------------|-----------------|---------------------------------------------|
| `/shadow`    | Box shadow      | `box-shadow` with layers, inset, presets    |
| `/glass`     | Glassmorphism   | background + `backdrop-filter` + border     |
| `/filters`   | Filters         | `filter` or `backdrop-filter` (toggle)      |
| `/gradient`  | Gradients       | linear / radial / conic, repeating          |
| `/clip-path` | Clip path       | `polygon()` editor with presets             |
| `/transform` | Transforms      | 2D/3D transform + origin                    |
| `/radius`    | Border radius   | per-corner values, or organic blob shapes   |
| `/clients`   | Clients         | brand palettes, saved snippets, import/export |

Out of scope for v1: shared/team storage, login, CSS-variable or Tailwind output.

## Stack

Vite + React + TypeScript + Tailwind CSS v4, React Router. Static build hosted
on Netlify (SPA redirect in `public/_redirects`). Vitest for unit tests.

## Architecture

```
src/
  app/          layout, sidebar, client switcher, routes
  components/   shared UI: Slider, ColorPicker, CodePanel, ToolLayout, Toast
  generators/   one folder per tool: build-css.ts (pure) + Page.tsx
  store/        clients, palettes, snippets (localStorage)
  lib/          color helpers, CSS declaration helpers, ids
```

- Each tool's `build-css.ts` is a pure function `settings → declarations`
  (`[property, value][]`). Both the copied CSS and the live preview style are
  derived from the same declarations, so they cannot disagree.
- Colors are `{ hex, a }` everywhere; output uses hex when opaque and `rgba()`
  otherwise, so alpha is never lost.
- Every tool page uses the same layout: preview, controls, generated CSS with
  Copy and "Save snippet".

## Data

Stored in `localStorage` under a versioned key (`df-css-kit:v1`).

```
Client   { id, name, colors: [{ id, name, hex }] }
Snippet  { id, clientId | null, tool, name, settings, css, createdAt }
```

- The active client's colors show as quick-pick swatches in every color picker.
- Snippets store settings, so opening one restores the generator state for
  editing (`/<tool>?snippet=<id>`).
- Export/import: one JSON file with all clients and snippets. Import validates
  the shape and merges by id.
- Uploaded preview images are never stored (kept in memory only).

## Error handling

- Corrupt or missing localStorage → start empty, never crash.
- Invalid import file → toast with the reason, nothing changed.
- Clipboard failure → error toast.

## Testing

Vitest unit tests for color helpers, every `build-css` function, and the store
(import validation, merge, delete client). Manual check of each page in the
browser via `npm run dev`.
