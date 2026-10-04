import { useState } from 'react';
import {
  BookOpen, Shield, Mail, Link2, FileWarning, Clock, Eye, KeyRound,
  AlertTriangle, HandHeart, UserX, BadgeDollarSign, Skull, ChevronRight,
} from 'lucide-react';

const lessons = [
  {
    id: 'sender',
    title: 'Check the Sender Address',
    icon: Mail,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    content: `Always examine the sender's full email address, not just the display name. Attackers spoof display names to appear legitimate.

Look for:
• Misspelled domains (micr0soft.com vs microsoft.com)
• Free email providers used for "official" communication
• Domains with excessive subdomains
• Display name that doesn't match the domain

Example: "Microsoft Support" <support@micr0soft-verify.invalid.test> is NOT from Microsoft.`,
  },
  {
    id: 'domain',
    title: 'Verify Domain Spelling',
    icon: Shield,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    content: `Phishers register lookalike domains (homoglyph attacks) that use similar characters:

• paypa1.com (number 1 instead of letter l)
• amaz0n.com (zero instead of letter o)
• g00gle.com (zeros instead of letters o)
• faceb00k.net

Always type known domains directly into your browser rather than clicking email links.`,
  },
  {
    id: 'urgency',
    title: 'Watch for Unexpected Urgency',
    icon: Clock,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    content: `Phishing emails create false urgency to make you act before thinking.

Red flags:
• "Act now or your account will be closed"
• "Within 24 hours" deadlines
• "Final notice" or "last chance"
• "Immediate action required"

Legitimate organizations rarely demand instant action. When pressured, slow down and verify independently.`,
  },
  {
    id: 'links',
    title: 'Inspect Suspicious Links',
    icon: Link2,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    content: `Never click links in suspicious emails. Instead:

• Hover over links to see the real destination
• Check for raw IP addresses (http://198.51.100.10)
• Watch for URL shorteners (bit.ly, tinyurl) that hide destinations
• Look for misleading subdomains
• Remember: HTTPS does NOT mean a site is safe — phishing sites can have certificates too

When in doubt, navigate to the organization's website directly by typing the URL.`,
  },
  {
    id: 'credentials',
    title: 'Never Share Credentials',
    icon: KeyRound,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    content: `No legitimate organization will ever ask you to:
• Send your password via email
• "Verify" your login credentials through a link
• Provide your full Social Security number by email
• Confirm your CVV or full card number

If an email asks for any of these, it is phishing. Report it and delete it.`,
  },
  {
    id: 'attachments',
    title: 'Beware Unexpected Attachments',
    icon: FileWarning,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    content: `Malicious attachments are a primary delivery method for malware.

Dangerous file types:
• Executables: .exe, .scr, .bat, .cmd, .com, .pif
• Scripts: .js, .vbs, .ps1, .hta
• Double extensions: invoice.pdf.exe (disguised as PDF)

Never open attachments from unknown senders. Even known senders' accounts can be compromised. Scan all attachments with antivirus software.`,
  },
  {
    id: 'greeting',
    title: 'Notice Generic Greetings',
    icon: UserX,
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    content: `Phishing emails often use impersonal greetings because the attacker doesn't know your name:

• "Dear Valued Customer"
• "Dear User"
• "Dear Account Holder"
• "Dear Sir/Madam"

Legitimate organizations you do business with typically know your name. A generic greeting combined with other indicators increases suspicion.`,
  },
  {
    id: 'payment',
    title: 'Be Wary of Payment Requests',
    icon: BadgeDollarSign,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    content: `Financial phishing seeks to steal money or financial data:

• Fake invoices demanding immediate payment
• "Outstanding balance" threats
• Wire transfer requests from "executives" (BEC attacks)
• Refund or rebate offers requiring bank details

Always verify payment requests through a known, independent channel. Call the organization directly using a verified phone number.`,
  },
  {
    id: 'threats',
    title: 'Recognize Threatening Language',
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    content: `Fear is a powerful manipulation tool. Phishing emails threaten:

• Account suspension or termination
• Legal action or lawsuits
• Arrest or prosecution
• Fines or penalties
• Loss of access to services

These threats are designed to panic you into acting quickly. Real institutions follow formal processes, not email ultimatums.`,
  },
  {
    id: 'context',
    title: 'Consider the Context',
    icon: Eye,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    content: `Ask yourself:
• Was I expecting this email?
• Does this make sense in my current situation?
• Would this organization really contact me this way?
• Is the tone consistent with previous communications?

Context is key. An email about a package delivery when you haven't ordered anything is suspicious. A tax refund notice in October doesn't match tax season timing.`,
  },
];

const checklistItems = [
  'Do I know the sender and was I expecting this email?',
  'Does the sender\'s email address match the organization\'s real domain?',
  'Are there spelling errors or unusual grammar?',
  'Does the email create false urgency or pressure?',
  'Does it ask for passwords, credentials, or sensitive personal data?',
  'Do links go to the legitimate website when I hover over them?',
  'Are there unexpected or suspicious attachments?',
  'Is the greeting generic instead of using my name?',
  'Does the email threaten consequences if I don\'t act?',
  'Does the overall context make sense?',
];

export default function Awareness() {
  const [activeLesson, setActiveLesson] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(checklistItems.length).fill(false));
  const [expanded, setExpanded] = useState<string | null>(null);

  const completedCount = checkedItems.filter(Boolean).length;
  const allChecked = completedCount === checklistItems.length;

  const toggleCheck = (i: number) => {
    setCheckedItems(prev => prev.map((v, idx) => idx === i ? !v : v));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Phishing Awareness</h2>
        <p className="mt-1 text-sm text-slate-400">
          Learn how to identify phishing emails and protect yourself from social engineering attacks
        </p>
      </div>

      {/* How to Spot Phishing */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">How to Spot a Phishing Email</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Ten key indicators that help identify suspicious emails. No single indicator proves phishing — look for multiple signals.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {lessons.map((lesson) => {
            const Icon = lesson.icon;
            const isActive = activeLesson === lesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveLesson(isActive ? null : lesson.id)}
                className={`group rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? 'border-cyan-500/30 bg-cyan-500/5'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${lesson.bg}`}>
                    <Icon className={`h-5 w-5 ${lesson.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{lesson.title}</p>
                    {isActive && (
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                        {lesson.content}
                      </p>
                    )}
                  </div>
                  <ChevronRight className={`h-4 w-4 flex-shrink-0 text-slate-600 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Before You Click Checklist */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <HandHeart className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">Before You Click Checklist</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Run through this mental checklist every time you receive an unexpected email with links or attachments.
        </p>

        <div className="space-y-2">
          {checklistItems.map((item, i) => (
            <button
              key={i}
              onClick={() => toggleCheck(i)}
              className="flex w-full items-start gap-3 rounded-lg border border-slate-800 bg-slate-800/30 px-3.5 py-3 text-left transition-all hover:border-slate-700"
            >
              <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                checkedItems[i]
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-slate-600 bg-transparent'
              }`}>
                {checkedItems[i] && <svg viewBox="0 0 12 12" className="h-3 w-3"><path d="M2 6l3 3 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className={`text-sm ${checkedItems[i] ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                {item}
              </span>
            </button>
          ))}
        </div>

        {allChecked && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <Shield className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-emerald-300">
              Great! You've completed the full checklist. If you answered "no" or "I'm not sure" to any item, treat the email as suspicious.
            </p>
          </div>
        )}
      </div>

      {/* MITRE ATT&CK Reference */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Skull className="h-5 w-5 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">MITRE ATT&CK Reference</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          This project relates to the MITRE ATT&CK framework's Initial Access tactics. Phishing is categorized under the "Phishing" technique family within the Resource Development or Initial Access tactic.
        </p>
        <div className="space-y-2">
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs font-semibold text-slate-200">Spearphishing Attachment</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Sending emails with malicious attachments (e.g., .exe, .scr, macro-enabled documents) designed to compromise the target system.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs font-semibold text-slate-200">Spearphishing Link</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Sending emails containing links that direct targets to malicious websites designed to collect credentials or deliver payloads.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-3">
            <p className="text-xs font-semibold text-slate-200">Spearphishing via Service</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Using third-party services (e.g., social media, collaboration platforms) to deliver phishing messages rather than traditional email.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-slate-600">
          Note: Technique names follow MITRE ATT&CK terminology. Refer to attack.mitre.com for current technique IDs and descriptions.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
          <p className="text-xs text-amber-300/80">
            This awareness module is for educational purposes only. Always follow your organization's security policies and report suspicious emails to your IT security team. This project uses synthetic/fictional data and does not interact with real systems.
          </p>
        </div>
      </div>
    </div>
  );
}
