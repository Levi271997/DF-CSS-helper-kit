/** Built-in colorful backdrop so glass and filter previews have something to work on. */
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#131028"/><stop offset="0.5" stop-color="#1e1242"/><stop offset="1" stop-color="#c10fff"/></linearGradient>
<radialGradient id="sun" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#ffbc7d"/><stop offset="1" stop-color="#f58825"/></radialGradient>
</defs>
<rect width="800" height="600" fill="url(#bg)"/>
<circle cx="170" cy="150" r="110" fill="url(#sun)"/>
<circle cx="640" cy="440" r="150" fill="#55cbfd" opacity="0.85"/>
<circle cx="560" cy="130" r="60" fill="#f8a02d"/>
<rect x="90" y="380" width="220" height="140" rx="28" fill="#e1d8ff"/>
<path d="M0 520 C 200 440, 380 600, 800 500 L 800 600 L 0 600 Z" fill="#131028" opacity="0.6"/>
<g fill="#ffffff" opacity="0.9"><rect x="340" y="250" width="180" height="16" rx="8"/><rect x="340" y="280" width="120" height="16" rx="8"/></g>
</svg>`

export const SCENE_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
