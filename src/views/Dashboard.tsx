import { Shield, ScanSearch, LayoutDashboard, History, BookOpen, TrendingUp, AlertTriangle, CheckCircle, Activity, Mail, Link2, FileWarning, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { sampleEmails } from '@/lib/sampleEmails';

interface DashboardStats {
  total: number;
  highRisk: number;
  suspicious: number;
  moderate: number;
  lowRisk: number;
  safe: number;
  avgScore: number;
}

interface IndicatorCount {
  indicator_type: string;
  count: number;
}

export default function Dashboard({ onNavigate }: { onNavigate: (v: 'analyzer' | 'history' | 'awareness') => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [classificationData, setClassificationData] = useState<{ label: string; count: number; color: string }[]>([]);
  const [topIndicators, setTopIndicators] = useState<IndicatorCount[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data: analyses } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!analyses) {
        setLoading(false);
        return;
      }

      const total = analyses.length;
      const highRisk = analyses.filter(a => a.classification === 'HIGH RISK / LIKELY PHISHING').length;
      const suspicious = analyses.filter(a => a.classification === 'SUSPICIOUS').length;
      const moderate = analyses.filter(a => a.classification === 'MODERATE RISK').length;
      const lowRisk = analyses.filter(a => a.classification === 'LOW RISK').length;
      const safe = analyses.filter(a => a.classification === 'SAFE').length;
      const avgScore = total > 0 ? Math.round(analyses.reduce((sum, a) => sum + a.risk_score, 0) / total) : 0;

      setStats({ total, highRisk, suspicious, moderate, lowRisk, safe, avgScore });
      setClassificationData([
        { label: 'High Risk', count: highRisk, color: 'bg-red-500' },
        { label: 'Suspicious', count: suspicious, color: 'bg-orange-500' },
        { label: 'Moderate', count: moderate, color: 'bg-amber-500' },
        { label: 'Low Risk', count: lowRisk, color: 'bg-green-500' },
        { label: 'Safe', count: safe, color: 'bg-emerald-500' },
      ]);
      setRecentAnalyses(analyses.slice(0, 8));

      const { data: indicators } = await supabase
        .from('indicators')
        .select('indicator_type');

      if (indicators) {
        const counts: Record<string, number> = {};
        indicators.forEach(i => {
          counts[i.indicator_type] = (counts[i.indicator_type] || 0) + 1;
        });
        const sorted = Object.entries(counts)
          .map(([type, count]) => ({ indicator_type: type, count }))
          .sort((a, b) => b.count - a.count);
        setTopIndicators(sorted);
      }

      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Analyzed', value: stats?.total ?? 0, icon: Mail, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'High Risk', value: stats?.highRisk ?? 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Suspicious', value: stats?.suspicious ?? 0, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Low Risk', value: (stats?.lowRisk ?? 0) + (stats?.safe ?? 0), icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Avg Risk Score', value: stats?.avgScore ?? 0, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  const indicatorColors: Record<string, string> = {
    SENDER: 'text-purple-400',
    CONTENT: 'text-cyan-400',
    URL: 'text-orange-400',
    ATTACHMENT: 'text-red-400',
    SUBJECT: 'text-amber-400',
  };

  const indicatorIcons: Record<string, typeof Mail> = {
    SENDER: Mail,
    CONTENT: Activity,
    URL: Link2,
    ATTACHMENT: FileWarning,
    SUBJECT: AlertTriangle,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Security Operations Dashboard</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Real-time phishing risk monitoring and email security analytics
            </p>
          </div>
          <button
            onClick={() => onNavigate('analyzer')}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/30 active:scale-[0.98]"
          >
            <ScanSearch className="h-4 w-4" />
            Analyze Email
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-all hover:border-slate-700"
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold tabular-nums">{card.value}</p>
              <p className="mt-0.5 text-xs text-slate-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Classification distribution */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-200">Classification Distribution</h3>
          <p className="mt-0.5 text-xs text-slate-500">Breakdown of all analyzed emails</p>
          <div className="mt-5 space-y-3">
            {classificationData.map((c) => {
              const max = Math.max(...classificationData.map(d => d.count), 1);
              const widthPct = (c.count / max) * 100;
              return (
                <div key={c.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{c.label}</span>
                    <span className="tabular-nums text-slate-400">{c.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${c.color} transition-all duration-500`}
                      style={{ width: `${Math.max(widthPct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top indicators */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-200">Top Detected Indicators</h3>
          <p className="mt-0.5 text-xs text-slate-500">Most common phishing signals found</p>
          <div className="mt-5 space-y-3">
            {topIndicators.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No indicators detected yet. Analyze some emails to see data.</p>
            ) : (
              topIndicators.map((ind) => {
                const Icon = indicatorIcons[ind.indicator_type] || AlertTriangle;
                const color = indicatorColors[ind.indicator_type] || 'text-slate-400';
                const max = Math.max(...topIndicators.map(i => i.count), 1);
                const widthPct = (ind.count / max) * 100;
                return (
                  <div key={ind.indicator_type} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-slate-300">{ind.indicator_type}</span>
                        <span className="tabular-nums text-slate-400">{ind.count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${color.replace('text', 'bg')} transition-all duration-500`}
                          style={{ width: `${Math.max(widthPct, 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Risk score distribution gauge + Recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Risk gauge */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-200">Average Risk Score</h3>
          <div className="mt-4 flex flex-col items-center">
            <div className="relative h-36 w-36">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(30,41,59)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round"
                  stroke={!stats || stats.avgScore <= 25 ? 'rgb(34,197,94)' : stats.avgScore <= 45 ? 'rgb(245,158,11)' : stats.avgScore <= 70 ? 'rgb(249,115,22)' : 'rgb(239,68,68)'}
                  strokeDasharray={`${(stats?.avgScore ?? 0) * 3.27} 327`}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold tabular-nums">{stats?.avgScore ?? 0}</span>
                <span className="text-xs text-slate-400">out of 100</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {!stats || stats.avgScore <= 25 ? 'Low overall risk' : stats.avgScore <= 45 ? 'Moderate risk level' : stats.avgScore <= 70 ? 'Elevated risk level' : 'High risk environment'}
            </p>
          </div>
        </div>

        {/* Recent analyses */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Recent Activity</h3>
              <p className="mt-0.5 text-xs text-slate-500">Latest email analyses</p>
            </div>
            <button onClick={() => onNavigate('history')} className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
              View all
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {recentAnalyses.length === 0 ? (
              <div className="py-8 text-center">
                <Mail className="mx-auto h-8 w-8 text-slate-700" />
                <p className="mt-2 text-sm text-slate-500">No analyses yet</p>
                <button
                  onClick={() => onNavigate('analyzer')}
                  className="mt-3 text-xs font-medium text-cyan-400 hover:text-cyan-300"
                >
                  Analyze your first email
                </button>
              </div>
            ) : (
              recentAnalyses.map((a) => {
                const colors: Record<string, string> = {
                  'SAFE': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
                  'LOW RISK': 'bg-green-500/15 text-green-400 border-green-500/20',
                  'MODERATE RISK': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
                  'SUSPICIOUS': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
                  'HIGH RISK / LIKELY PHISHING': 'bg-red-500/15 text-red-400 border-red-500/20',
                };
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2.5 transition-colors hover:border-slate-700"
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${colors[a.classification] || colors['LOW RISK']}`}>
                      {a.risk_score}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{a.subject || '(no subject)'}</p>
                      <p className="truncate text-xs text-slate-500">{a.sender || 'Unknown sender'}</p>
                    </div>
                    <span className={`flex-shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${colors[a.classification] || colors['LOW RISK']}`}>
                      {a.classification.replace(' / LIKELY PHISHING', '')}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick demo samples */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-slate-200">Quick Demo: Try a Sample Email</h3>
        <p className="mt-0.5 text-xs text-slate-500">Pre-loaded synthetic emails for testing the detection engine</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {sampleEmails.slice(0, 4).map((email) => (
            <button
              key={email.id}
              onClick={() => {
                sessionStorage.setItem('sampleEmailId', email.id);
                onNavigate('analyzer');
              }}
              className="group rounded-xl border border-slate-800 bg-slate-800/30 p-4 text-left transition-all hover:border-cyan-500/30 hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${email.label === 'PHISHING' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                  {email.label}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-200 line-clamp-1">{email.subject}</p>
              <p className="mt-1 text-[11px] text-slate-500">{email.category}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
