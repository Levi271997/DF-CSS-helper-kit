import { useEffect, useState } from "react"
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom"
import { ToastProvider } from "@/components/Toast"
import { store, useData } from "@/store"
import { TOOLS } from "./tools"
import ClientsPage from "./ClientsPage"

// Sidebar is navy like the digitalfeet.com hero; the active page is marked in brand orange.
const navClass = ({ isActive }: { isActive: boolean }) =>
  `block border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "border-accent-400 bg-white/10 text-accent-400"
      : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
  }`

function ClientSwitcher() {
  const clients = useData((d) => d.clients)
  const activeId = useData((d) => d.activeClientId)
  return (
    <div className="space-y-1.5">
      <label htmlFor="client-switcher" className="text-xs font-semibold uppercase tracking-wide text-white/50">
        Client
      </label>
      <select
        id="client-switcher"
        value={activeId ?? ""}
        onChange={(e) => store.setActiveClient(e.target.value || null)}
        className="w-full rounded-lg border border-white/15 bg-white px-2.5 py-2 text-sm text-df-text"
      >
        <option value="">No client</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <Link to="/clients" className="inline-block text-xs font-medium text-accent-400 hover:underline">
        Manage clients & snippets →
      </Link>
    </div>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex min-h-full flex-col gap-6 bg-brand-600 p-4 text-white">
      <Link to="/" onClick={onNavigate} className="flex items-center gap-2 px-1">
        <span className="font-heading text-[17px] font-bold leading-tight tracking-tight">
          DF CSS <span className="text-accent-400">Helper Kit</span>
        </span>
      </Link>
      <ClientSwitcher />
      <nav aria-label="Tools" className="space-y-0.5">
        {TOOLS.map((t) => (
          <NavLink key={t.id} to={t.path} className={navClass} onClick={onNavigate}>
            {t.label}
          </NavLink>
        ))}
        <div className="my-2 border-t border-white/10" />
        <NavLink to="/clients" className={navClass} onClick={onNavigate}>
          Clients & snippets
        </NavLink>
      </nav>
    </div>
  )
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => setMenuOpen(false), [location.pathname])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden bg-brand-600 lg:sticky lg:top-0 lg:block lg:h-screen lg:overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-brand-600 px-4 py-3 text-white lg:hidden">
        <Link to="/" className="flex items-center gap-2 font-heading font-bold">
          <span>
            DF CSS <span className="text-accent-400">Helper Kit</span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="rounded-lg p-2 text-white/80 hover:bg-white/10"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M3 5h14v2H3zM3 9h14v2H3zM3 13h14v2H3z" />
          </svg>
        </button>
      </div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-brand-700/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-brand-600 shadow-xl">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <main className="flex min-w-0 flex-col px-4 py-6 sm:px-6 lg:min-h-screen lg:px-8 lg:py-8">
        {/* Wrapper stretches to full width; pages center themselves inside it */}
        <div className="w-full">
        <Routes>
            <Route path="/" element={<Navigate to="/shadow" replace />} />
            {TOOLS.map((t) => (
              // Keyed by search so opening a different snippet remounts with its settings.
              <Route key={t.id} path={t.path} element={<t.page key={location.search} />} />
            ))}
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="*" element={<Navigate to="/shadow" replace />} />
        </Routes>
        </div>

        <footer className="mt-auto pt-10 text-center text-sm text-df-muted">
          Created by <span className="font-medium text-brand-600">Levi</span> with{" "}
          <span role="img" aria-label="love">
            ❤️
          </span>
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </BrowserRouter>
  )
}
