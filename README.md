# DF CSS Helper Kit

Internal CSS generator for the Digitalfeet team. Build an effect with a client's
brand colors, copy the CSS, and save it as a snippet to reuse later.

## Tools

| Tool           | What it makes                                               |
|----------------|-------------------------------------------------------------|
| Box shadow     | Layered `box-shadow` with inset, reorderable layers, presets |
| Glassmorphism  | Frosted panels: tint, `backdrop-filter`, border, shadow      |
| Filters        | `filter` for elements, or `backdrop-filter` for what's behind |
| Gradients      | Linear, radial and conic, repeating, unlimited stops         |
| Clip path      | Drag-and-drop `polygon()` editor with shape presets          |
| Transforms     | Translate / rotate / skew / scale, 3D with perspective        |
| Border radius  | Per-corner radius, or organic blob shapes                    |

## Clients & snippets

- Add clients and their brand colors on **Clients & snippets**.
- Choose the active client in the sidebar: its colors show as quick picks in
  every color picker.
- **Save snippet** under any CSS output stores the CSS *and* the settings, so
  **Open** brings the generator back exactly as it was.
- Everything is stored in this browser (`localStorage`). Use **Export** /
  **Import** on the Clients page to move data between browsers or teammates.
  Import merges: existing items with the same id are replaced, nothing else is
  removed.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (CSS builders, color helpers, store)
npm run build      # type-check + production build into dist/
```

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, React Router, Vitest.

### Project layout

```
src/
  app/          shell, sidebar, routes, Clients page
  components/   shared UI (controls, ColorPicker, CodePanel, ToolLayout, Toast)
  generators/   one folder per tool: build-css.ts (pure) + <Tool>Page.tsx
  store/        clients, palettes, snippets
  lib/          color + CSS helpers
```

Each tool's `build-css.ts` turns settings into a list of CSS declarations. The
copied CSS and the live preview both come from that same list, so they always
match. Add tests for new tools in `src/generators/build-css.test.ts`.

## Deploy

Netlify: build command `npm run build`, publish directory `dist`
(already set in `netlify.toml`). `public/_redirects` handles client-side routes.
