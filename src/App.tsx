import { useState, useCallback, useEffect } from 'react';
import { Shield, ScanSearch, LayoutDashboard, History, BookOpen, Menu, X } from 'lucide-react';
import Dashboard from '@/views/Dashboard';
import EmailAnalyzer from '@/views/EmailAnalyzer';
import AnalysisHistory from '@/views/AnalysisHistory';
import Awareness from '@/views/Awareness';

type View = 'dashboard' | 'analyzer' | 'history' | 'awareness';

const navItems: { id: View; label: string; icon: typeof Shield }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analyzer', label: 'Email Analyzer', icon: ScanSearch },
  { id: 'history', label: 'Analysis History', icon: History },
  { id: 'awareness', label: 'Awareness', icon: BookOpen },
];

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = useCallback((v: View) => {
    setView(v);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <Shield className="h-5.5 w-5.5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight tracking-tight sm:text-lg">
                Phishing Detection
              </h1>
              <p className="text-[11px] text-slate-400 leading-tight">Awareness Dashboard</p>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-cyan-500/15 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-800 px-4 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {view === 'analyzer' && <EmailAnalyzer />}
        {view === 'history' && <AnalysisHistory />}
        {view === 'awareness' && <Awareness />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          Defensive cybersecurity education tool. Uses synthetic/fictional data only. Not affiliated with any real organization.
        </div>
      </footer>
    </div>
  );
}
