import { useState, useEffect, useCallback } from 'react';
import {
  ScanSearch, AlertTriangle, Shield, ShieldCheck, Mail, Link2, FileWarning,
  User, FileText, ChevronDown, ChevronUp, CheckCircle2, Info, Zap,
} from 'lucide-react';
import {
  calculatePhishingScore, getClassificationColor, getRiskScoreColor,
  type AnalysisResult,
} from '@/lib/phishingEngine';
import { sampleEmails } from '@/lib/sampleEmails';
import { supabase } from '@/lib/supabase';

interface FormData {
  sender: string;
  subject: string;
  body: string;
  attachmentName: string;
}

const emptyForm: FormData = { sender: '', subject: '', body: '', attachmentName: '' };

export default function EmailAnalyzer() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    sender: true, content: true, urls: true, attachment: true, features: false,
  });
  const [showSamples, setShowSamples] = useState(false);

  // Load sample from sessionStorage (set by Dashboard quick demo)
  useEffect(() => {
    const sampleId = sessionStorage.getItem('sampleEmailId');
    if (sampleId) {
      const email = sampleEmails.find(e => e.id === sampleId);
      if (email) {
        setForm({
          sender: email.sender,
          subject: email.subject,
          body: email.body,
          attachmentName: email.attachment_name,
        });
      }
      sessionStorage.removeItem('sampleEmailId');
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!form.sender && !form.subject && !form.body) return;
    setAnalyzing(true);
    setResult(null);
    setSaved(false);

    // Small delay for UX
    await new Promise(r => setTimeout(r, 400));

    const analysis = calculatePhishingScore(form.sender, form.subject, form.body, form.attachmentName);
    setResult(analysis);
    setAnalyzing(false);
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!result) return;

    const senderDomain = result.sender_analysis.domain;
    const bodyPreview = form.body.substring(0, 200);

    const { data: analysisRow, error: analysisError } = await supabase
      .from('analyses')
      .insert({
        sender: form.sender,
        sender_domain: senderDomain,
        subject: form.subject,
        risk_score: result.risk_score,
        classification: result.classification,
        body_preview: bodyPreview,
      })
      .select()
      .single();

    if (analysisError || !analysisRow) return;

    const indicatorRows = result.indicators.map(ind => ({
      analysis_id: analysisRow.id,
      indicator_type: ind.indicator_type,
      description: ind.description,
      severity: ind.severity,
      weight: ind.weight,
    }));

    if (indicatorRows.length > 0) {
      await supabase.from('indicators').insert(indicatorRows);
    }

    const urlRows = result.url_analyses.map(u => ({
      analysis_id: analysisRow.id,
      url: u.url,
      risk_score: u.risk_score,
      findings: JSON.stringify(u.findings),
    }));

    if (urlRows.length > 0) {
      await supabase.from('url_analyses').insert(urlRows);
    }

    setSaved(true);
  }, [result, form]);

  const loadSample = (emailId: string) => {
    const email = sampleEmails.find(e => e.id === emailId);
    if (email) {
      setForm({
        sender: email.sender,
        subject: email.subject,
        body: email.body,
        attachmentName: email.attachment_name,
      });
      setResult(null);
      setSaved(false);
      setShowSamples(false);
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const classColors = result ? getClassificationColor(result.classification) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Email Analyzer</h2>
        <p className="mt-1 text-sm text-slate-400">
          Paste email content to detect phishing indicators and generate a risk assessment
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Email Input</h3>
              <button
                onClick={() => setShowSamples(!showSamples)}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
              >
                Load Sample
              </button>
            </div>

            {showSamples && (
              <div className="mb-4 rounded-lg border border-slate-800 bg-slate-800/40 p-3 space-y-2 max-h-64 overflow-y-auto">
                <p className="text-[11px] text-slate-500 mb-2">Synthetic email samples (safe, fictional):</p>
                {sampleEmails.map(e => (
                  <button
                    key={e.id}
                    onClick={() => loadSample(e.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-slate-700/50"
                  >
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${e.label === 'PHISHING' ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                      {e.label === 'PHISHING' ? 'PHISH' : 'LEGIT'}
                    </span>
                    <span className="truncate text-slate-300">{e.subject}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Sender</label>
                <input
                  type="text"
                  value={form.sender}
                  onChange={e => setForm({ ...form, sender: e.target.value })}
                  placeholder='"Display Name" <user@example.com>'
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  placeholder="Email subject line"
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email Body</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  placeholder="Paste the full email body text here..."
                  rows={8}
                  className="w-full resize-y rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Attachment Filename (optional)</label>
                <input
                  type="text"
                  value={form.attachmentName}
                  onChange={e => setForm({ ...form, attachmentName: e.target.value })}
                  placeholder="e.g. invoice.pdf"
                  className="w-full rounded-lg border border-slate-800 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors focus:border-cyan-500/50"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || (!form.sender && !form.subject && !form.body)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {analyzing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ScanSearch className="h-4 w-4" />
                      Analyze Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setForm(emptyForm); setResult(null); setSaved(false); }}
                  className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {!result && !analyzing && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
                <Shield className="h-8 w-8 text-slate-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-400">No analysis yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Enter email details and click "Analyze Email" to see phishing indicators, risk score, and recommendations
              </p>
            </div>
          )}

          {analyzing && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-3 border-slate-700 border-t-cyan-400" />
              <p className="mt-4 text-sm font-medium text-slate-400">Analyzing phishing indicators...</p>
            </div>
          )}

          {result && !analyzing && (
            <div className="space-y-4">
              {/* Risk score card */}
              <div className={`rounded-2xl border-2 p-5 sm:p-6 ${
                result.classification === 'HIGH RISK / LIKELY PHISHING' ? 'border-red-500/30 bg-red-500/5' :
                result.classification === 'SUSPICIOUS' ? 'border-orange-500/30 bg-orange-500/5' :
                result.classification === 'MODERATE RISK' ? 'border-amber-500/30 bg-amber-500/5' :
                result.classification === 'LOW RISK' ? 'border-green-500/30 bg-green-500/5' :
                'border-emerald-500/30 bg-emerald-500/5'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Phishing Risk Score</p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className={`text-4xl font-bold tabular-nums ${getRiskScoreColor(result.risk_score)}`}>
                        {result.risk_score}
                      </span>
                      <span className="text-lg text-slate-500">/100</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Classification</p>
                    <span className={`mt-1 inline-block rounded-lg border px-3 py-1 text-sm font-bold ${classColors?.bg} ${classColors?.text} ${classColors?.border} border`}>
                      {classColors?.label}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      result.risk_score <= 10 ? 'bg-emerald-500' :
                      result.risk_score <= 25 ? 'bg-green-500' :
                      result.risk_score <= 45 ? 'bg-amber-500' :
                      result.risk_score <= 70 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(result.risk_score, 3)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                  <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
                </div>

                {/* Save button */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-200 transition-all hover:bg-slate-800 disabled:opacity-50"
                  >
                    {saved ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Saved to history</>
                    ) : (
                      <>Save to History</>
                    )}
                  </button>
                </div>
              </div>

              {/* Why is this suspicious? */}
              {result.indicators.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Why is this email flagged?
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">Detected indicators contributing to the risk score</p>
                  <div className="mt-4 space-y-2">
                    {result.indicators.map((ind, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2.5">
                        <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                          ind.severity === 'HIGH' ? 'bg-red-500/15 text-red-400' :
                          ind.severity === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          +{ind.weight}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                              {ind.indicator_type}
                            </span>
                            <span className={`text-[10px] ${ind.severity === 'HIGH' ? 'text-red-400' : ind.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-500'}`}>
                              {ind.severity}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-300">{ind.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sender Analysis */}
              <DetailSection
                title="Sender Analysis"
                icon={User}
                iconColor="text-purple-400"
                score={result.sender_analysis.risk_score}
                expanded={expandedSections.sender}
                onToggle={() => toggleSection('sender')}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-800/40 p-2.5">
                      <p className="text-slate-500">Email Address</p>
                      <p className="mt-0.5 font-mono text-slate-200 truncate">{result.sender_analysis.email_address || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg bg-slate-800/40 p-2.5">
                      <p className="text-slate-500">Domain</p>
                      <p className="mt-0.5 font-mono text-slate-200 truncate">{result.sender_analysis.domain || 'N/A'}</p>
                    </div>
                  </div>
                  {result.sender_analysis.findings.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {/* URL Analysis */}
              {result.url_analyses.length > 0 && (
                <DetailSection
                  title="URL Analysis"
                  icon={Link2}
                  iconColor="text-orange-400"
                  expanded={expandedSections.urls}
                  onToggle={() => toggleSection('urls')}
                >
                  <div className="space-y-3">
                    {result.url_analyses.map((urlRes, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-mono text-xs text-slate-300">{urlRes.url}</p>
                          <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            urlRes.risk_score > 40 ? 'bg-red-500/15 text-red-400' :
                            urlRes.risk_score > 20 ? 'bg-amber-500/15 text-amber-400' :
                            'bg-emerald-500/15 text-emerald-400'
                          }`}>
                            {urlRes.risk_score}/100
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
                          <div><span className="text-slate-500">Scheme:</span> <span className="text-slate-300">{urlRes.parsed.scheme || 'N/A'}</span></div>
                          <div><span className="text-slate-500">IP Host:</span> <span className={urlRes.parsed.has_ip ? 'text-red-400' : 'text-slate-300'}>{urlRes.parsed.has_ip ? 'Yes' : 'No'}</span></div>
                          <div><span className="text-slate-500">HTTPS:</span> <span className={urlRes.parsed.is_https ? 'text-emerald-400' : 'text-red-400'}>{urlRes.parsed.is_https ? 'Yes' : 'No'}</span></div>
                          <div><span className="text-slate-500">Subdomains:</span> <span className="text-slate-300">{urlRes.parsed.subdomain_count}</span></div>
                        </div>
                        <div className="mt-2 space-y-1">
                          {urlRes.findings.map((f, j) => (
                            <div key={j} className="flex items-start gap-1.5 text-[11px] text-slate-400">
                              <span className="text-amber-500">•</span> {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Attachment Analysis */}
              {result.attachment_analysis.has_attachment && (
                <DetailSection
                  title="Attachment Analysis"
                  icon={FileWarning}
                  iconColor="text-red-400"
                  score={result.attachment_analysis.risk_score}
                  expanded={expandedSections.attachment}
                  onToggle={() => toggleSection('attachment')}
                >
                  <div className="space-y-2">
                    <div className="rounded-lg bg-slate-800/40 p-2.5 text-xs">
                      <span className="text-slate-500">File:</span>{' '}
                      <span className="font-mono text-slate-200">{form.attachmentName}</span>
                      <span className="ml-2 text-slate-500">Extension:</span>{' '}
                      <span className={`font-mono ${result.attachment_analysis.is_suspicious ? 'text-red-400' : 'text-slate-200'}`}>
                        {result.attachment_analysis.extension || 'none'}
                      </span>
                    </div>
                    {result.attachment_analysis.findings.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-600" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Content Analysis */}
              <DetailSection
                title="Content Analysis"
                icon={FileText}
                iconColor="text-cyan-400"
                expanded={expandedSections.content}
                onToggle={() => toggleSection('content')}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.entries(result.content_analysis.categories).map(([key, val]) => (
                    <div key={key} className={`rounded-lg border px-3 py-2 text-xs ${
                      val ? 'border-amber-500/20 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-800/30 text-slate-500'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {val ? <Zap className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
                        <span className="capitalize">{key.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {/* Feature extraction */}
              <DetailSection
                title="Extracted Features"
                icon={Info}
                iconColor="text-slate-400"
                expanded={expandedSections.features}
                onToggle={() => toggleSection('features')}
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 text-xs">
                  {Object.entries(result.features).map(([key, val]) => (
                    <div key={key} className="rounded-lg bg-slate-800/40 p-2">
                      <p className="text-[10px] text-slate-500">{key.replace(/_/g, ' ')}</p>
                      <p className="mt-0.5 font-mono font-medium text-slate-200">
                        {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val}
                      </p>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {/* Recommendations */}
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Recommended Actions
                </h3>
                <div className="mt-3 space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-400" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailSection({
  title, icon: Icon, iconColor, score, expanded, onToggle, children,
}: {
  title: string;
  icon: typeof Info;
  iconColor: string;
  score?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-800/30"
      >
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-sm font-semibold text-slate-200">{title}</span>
          {score !== undefined && score > 0 && (
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
              score > 40 ? 'bg-red-500/15 text-red-400' :
              score > 20 ? 'bg-amber-500/15 text-amber-400' :
              'bg-slate-700 text-slate-400'
            }`}>
              {score}/100
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
      </button>
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-4">
          {children}
        </div>
      )}
    </div>
  );
}
