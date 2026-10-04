import { useState, useEffect, useCallback } from 'react';
import { History, Search, Trash2, Mail, ChevronRight, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface HistoryItem {
  id: string;
  sender: string;
  sender_domain: string;
  subject: string;
  risk_score: number;
  classification: string;
  body_preview: string;
  created_at: string;
  indicators?: IndicatorItem[];
  url_analyses?: UrlItem[];
}

interface IndicatorItem {
  id: string;
  indicator_type: string;
  description: string;
  severity: string;
  weight: number;
}

interface UrlItem {
  id: string;
  url: string;
  risk_score: number;
  findings: string;
}

const classificationFilters = ['ALL', 'HIGH RISK / LIKELY PHISHING', 'SUSPICIOUS', 'MODERATE RISK', 'LOW RISK', 'SAFE'];

const classColors: Record<string, string> = {
  'SAFE': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'LOW RISK': 'bg-green-500/15 text-green-400 border-green-500/20',
  'MODERATE RISK': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'SUSPICIOUS': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'HIGH RISK / LIKELY PHISHING': 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function AnalysisHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filtered, setFiltered] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [sortDesc, setSortDesc] = useState(true);
  const [selected, setSelected] = useState<HistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data as HistoryItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    let result = [...items];
    if (filter !== 'ALL') {
      result = result.filter(i => i.classification === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.subject?.toLowerCase().includes(q) ||
        i.sender?.toLowerCase().includes(q) ||
        i.sender_domain?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => sortDesc ? b.risk_score - a.risk_score : a.risk_score - b.risk_score);
    setFiltered(result);
  }, [items, filter, search, sortDesc]);

  const handleDelete = useCallback(async (id: string) => {
    await supabase.from('analyses').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    setSelected(null);
  }, []);

  const handleSelect = useCallback(async (item: HistoryItem) => {
    const [{ data: indicators }, { data: urls }] = await Promise.all([
      supabase.from('indicators').select('*').eq('analysis_id', item.id),
      supabase.from('url_analyses').select('*').eq('analysis_id', item.id),
    ]);
    setSelected({
      ...item,
      indicators: (indicators || []) as IndicatorItem[],
      url_analyses: (urls || []) as UrlItem[],
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Analysis History</h2>
        <p className="mt-1 text-sm text-slate-400">Browse, search, and review past email analyses</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by subject, sender, or domain..."
            className="w-full rounded-lg border border-slate-800 bg-slate-800/50 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
          >
            {classificationFilters.map(f => (
              <option key={f} value={f}>{f === 'ALL' ? 'All Classifications' : f.replace(' / LIKELY PHISHING', '')}</option>
            ))}
          </select>
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Risk: {sortDesc ? 'High→Low' : 'Low→High'}
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 py-16 text-center">
          <History className="h-10 w-10 text-slate-700" />
          <p className="mt-3 text-sm font-medium text-slate-400">No analyses found</p>
          <p className="mt-1 text-xs text-slate-500">
            {items.length === 0 ? 'Analyze some emails to build your history' : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-slate-700"
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold ${classColors[item.classification] || classColors['LOW RISK']}`}>
                {item.risk_score}
              </div>
              <button onClick={() => handleSelect(item)} className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-slate-200">{item.subject || '(no subject)'}</p>
                <p className="truncate text-xs text-slate-500">
                  {item.sender || 'Unknown'} · {item.sender_domain || 'no domain'}
                </p>
              </button>
              <span className={`hidden sm:inline-flex flex-shrink-0 rounded-md border px-2.5 py-0.5 text-[11px] font-medium ${classColors[item.classification] || classColors['LOW RISK']}`}>
                {item.classification.replace(' / LIKELY PHISHING', '')}
              </span>
              <span className="flex-shrink-0 text-[11px] text-slate-500">
                {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <button
                onClick={() => handleSelect(item)}
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setSelected(null)}>
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${classColors[selected.classification] || classColors['LOW RISK']}`}>
                    {selected.classification.replace(' / LIKELY PHISHING', '')}
                  </span>
                  <span className="text-xs text-slate-400">Risk Score: <span className="font-bold text-slate-200">{selected.risk_score}/100</span></span>
                </div>
                <h3 className="text-base font-semibold text-slate-100">{selected.subject || '(no subject)'}</h3>
                <p className="mt-1 text-xs text-slate-500">From: {selected.sender || 'Unknown'}</p>
                <p className="text-xs text-slate-500">Domain: {selected.sender_domain || 'N/A'}</p>
                <p className="text-xs text-slate-500">{new Date(selected.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelected(null)} className="flex-shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {selected.body_preview && (
              <div className="mt-4 rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                <p className="text-[11px] text-slate-500 mb-1">Body Preview (first 200 chars):</p>
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{selected.body_preview}</p>
              </div>
            )}

            {selected.indicators && selected.indicators.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-200 mb-2">Detected Indicators ({selected.indicators.length})</h4>
                <div className="space-y-2">
                  {selected.indicators.map((ind) => (
                    <div key={ind.id} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2">
                      <span className="flex-shrink-0 rounded bg-slate-700/60 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">{ind.indicator_type}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-300">{ind.description}</p>
                        <div className="mt-0.5 flex gap-2 text-[10px]">
                          <span className={ind.severity === 'HIGH' ? 'text-red-400' : ind.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-500'}>
                            {ind.severity}
                          </span>
                          <span className="text-slate-500">+{ind.weight} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected.url_analyses && selected.url_analyses.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-200 mb-2">URL Analysis ({selected.url_analyses.length})</h4>
                <div className="space-y-2">
                  {selected.url_analyses.map((url) => (
                    <div key={url.id} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-mono text-xs text-slate-300">{url.url}</p>
                        <span className={`flex-shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                          url.risk_score > 40 ? 'bg-red-500/15 text-red-400' :
                          url.risk_score > 20 ? 'bg-amber-500/15 text-amber-400' :
                          'bg-emerald-500/15 text-emerald-400'
                        }`}>{url.risk_score}/100</span>
                      </div>
                      {url.findings && url.findings !== '[]' && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {JSON.parse(url.findings).join(' • ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleDelete(selected.id)}
                className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
