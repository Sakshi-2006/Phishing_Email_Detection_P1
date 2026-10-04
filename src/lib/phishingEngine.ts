export type Classification = 'SAFE' | 'LOW RISK' | 'MODERATE RISK' | 'SUSPICIOUS' | 'HIGH RISK / LIKELY PHISHING';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Indicator {
  indicator_type: 'SENDER' | 'SUBJECT' | 'CONTENT' | 'URL' | 'ATTACHMENT';
  description: string;
  severity: Severity;
  weight: number;
}

export interface UrlAnalysisResult {
  url: string;
  risk_score: number;
  findings: string[];
  parsed: {
    scheme: string;
    hostname: string;
    path: string;
    has_ip: boolean;
    is_https: boolean;
    subdomain_count: number;
    hostname_length: number;
    url_length: number;
  };
}

export interface SenderAnalysisResult {
  risk_score: number;
  findings: string[];
  domain: string;
  display_name: string;
  email_address: string;
}

export interface ContentAnalysisResult {
  findings: Indicator[];
  categories: {
    urgency: boolean;
    fear: boolean;
    financial: boolean;
    credential: boolean;
    reward: boolean;
    personal_info: boolean;
    generic_greeting: boolean;
  };
}

export interface AttachmentAnalysisResult {
  risk_score: number;
  findings: string[];
  has_attachment: boolean;
  extension: string;
  is_suspicious: boolean;
}

export interface AnalysisResult {
  risk_score: number;
  classification: Classification;
  indicators: Indicator[];
  sender_analysis: SenderAnalysisResult;
  content_analysis: ContentAnalysisResult;
  url_analyses: UrlAnalysisResult[];
  attachment_analysis: AttachmentAnalysisResult;
  recommendations: string[];
  features: Record<string, number | boolean>;
}

// ─── Keyword sets ────────────────────────────────────────────────────────────

const URGENCY_KEYWORDS = [
  'urgent', 'immediately', 'act now', 'asap', 'right away', 'expires',
  'deadline', 'today only', 'limited time', 'final notice', 'last chance',
  'within 24 hours', 'without delay', 'hurry', 'soon',
];

const CREDENTIAL_KEYWORDS = [
  'password', 'verify your account', 'confirm your identity', 'login',
  'credential', 'reset your password', 'validate', 're-authenticate',
  'account details', 'sign in', 'username', 'passcode', 'pin code',
];

const FINANCIAL_KEYWORDS = [
  'invoice', 'payment', 'outstanding', 'balance due', 'wire transfer',
  'bank account', 'refund', 'tax', 'irs', 'overdue', 'billing',
  'transaction', 'transfer funds', 'unclaimed funds', 'prize money',
];

const THREAT_KEYWORDS = [
  'suspended', 'terminated', 'closed', 'deactivated', 'locked',
  'legal action', 'lawsuit', 'arrest', 'prosecuted', 'penalty',
  'fine', 'compliance', 'violation', 'consequences',
];

const REWARD_KEYWORDS = [
  'you have won', 'winner', 'congratulations', 'lottery', 'sweepstakes',
  'inheritance', 'prize', 'reward', 'gift card', 'free', 'selected',
  'special offer', 'exclusive deal',
];

const PERSONAL_INFO_KEYWORDS = [
  'confirm your personal details', 'social security', 'date of birth',
  'home address', 'phone number', 'mother\'s maiden name', 'passport',
  'national id', 'bank details', 'credit card number', 'cvv',
];

const SUSPICIOUS_URL_KEYWORDS = [
  'verify', 'login', 'signin', 'account', 'update', 'confirm',
  'secure', 'validation', 'auth', 'password', 'reset', 'wallet',
  'bank', 'paypal', 'amazon', 'microsoft', 'apple', 'google',
  'support', 'activate', 'unlock', 'suspended',
];

const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly',
  'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorte.st',
  'tiny.cc', 'rb.gy', 'lnkd.in', 'shorturl.at',
];

const SUSPICIOUS_EXTENSIONS = [
  '.exe', '.scr', '.bat', '.cmd', '.js', '.vbs', '.ps1',
  '.jar', '.com', '.pif', '.reg', '.msi', '.hta',
];

// ─── Helper functions ─────────────────────────────────────────────────────────

function extractDomain(email: string): string {
  const match = email.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : '';
}

function extractDisplayName(senderField: string): string {
  const match = senderField.match(/^"?(.+?)"?\s*<.*>$/);
  return match ? match[1].trim() : '';
}

function extractEmailAddress(senderField: string): string {
  const match = senderField.match(/<(.+?)>/);
  if (match) return match[1].trim().toLowerCase();
  const direct = senderField.match(/[\w.+-]+@[\w.-]+/);
  return direct ? direct[0].toLowerCase() : senderField.trim().toLowerCase();
}

function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"')]+/gi;
  const matches = text.match(urlRegex) || [];
  // Also catch bare domains that look like URLs
  const bareDomainRegex = /\b(?:www\.)?[\w-]+\.(?:com|org|net|edu|gov|io|co|info|biz|click|zip|top|xyz|country|gq|work|mov)\b[^\s]*/gi;
  const bare = text.match(bareDomainRegex) || [];
  return [...new Set([...matches, ...bare])];
}

function countSubdomains(hostname: string): number {
  if (!hostname) return 0;
  const parts = hostname.split('.');
  // e.g. "example.com" = 2 parts => 0 subdomains
  // "mail.example.com" = 3 parts => 1 subdomain
  return Math.max(0, parts.length - 2);
}

function isIpHostname(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function countMatches(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((count, kw) => {
    return count + (lower.includes(kw) ? 1 : 0);
  }, 0);
}

function uppercaseRatio(text: string): number {
  const letters = text.replace(/[^a-zA-Z]/g, '');
  if (letters.length === 0) return 0;
  const upper = text.replace(/[^A-Z]/g, '');
  return upper.length / letters.length;
}

// ─── Sender Analysis ──────────────────────────────────────────────────────────

export function analyzeSender(senderField: string): SenderAnalysisResult {
  const email_address = extractEmailAddress(senderField);
  const display_name = extractDisplayName(senderField);
  const domain = extractDomain(email_address);
  const findings: string[] = [];
  let score = 0;

  // No valid email
  if (!email_address || !email_address.includes('@')) {
    findings.push('Sender address is missing or malformed');
    score += 15;
    return { risk_score: Math.min(score, 100), findings, domain, display_name, email_address };
  }

  // Domain length check
  if (domain.length > 30) {
    findings.push(`Sender domain is unusually long (${domain.length} characters)`);
    score += 8;
  }

  // Excessive subdomains
  const subdomainCount = countSubdomains(domain);
  if (subdomainCount > 3) {
    findings.push(`Sender domain has excessive subdomains (${subdomainCount})`);
    score += 12;
  } else if (subdomainCount > 2) {
    findings.push(`Sender domain has multiple subdomains (${subdomainCount})`);
    score += 5;
  }

  // Unusual characters in domain
  if (/[\d_]{4,}/.test(domain)) {
    findings.push('Sender domain contains unusual character patterns');
    score += 10;
  }

  // Lookalike domain patterns (homoglyph attacks)
  const lookalikePatterns = [
    { pattern: /paypa[l1i]/i, name: 'PayPal' },
    { pattern: /micr[o0]soft/i, name: 'Microsoft' },
    { pattern: /amaz[o0]n/i, name: 'Amazon' },
    { pattern: /g[o0][o0]gle/i, name: 'Google' },
    { pattern: /faceb[o0][o0]k/i, name: 'Facebook' },
    { pattern: /netfl[il1]x/i, name: 'Netflix' },
    { pattern: /apple[^.]*id/i, name: 'Apple' },
    { pattern: /bankofamer[il1]ca/i, name: 'Bank of America' },
  ];

  for (const { pattern, name } of lookalikePatterns) {
    if (pattern.test(domain)) {
      findings.push(`Sender domain appears to be a lookalike for ${name}`);
      score += 18;
    }
  }

  // Display name / domain mismatch
  if (display_name) {
    const nameLower = display_name.toLowerCase();
    const knownOrgs: Record<string, string[]> = {
      'paypal': ['paypal.com'],
      'microsoft': ['microsoft.com', 'outlook.com', 'office.com'],
      'amazon': ['amazon.com'],
      'google': ['google.com', 'gmail.com'],
      'apple': ['apple.com'],
      'bank': [],
      'security': [],
    };

    for (const [org, legitDomains] of Object.entries(knownOrgs)) {
      if (nameLower.includes(org) && legitDomains.length > 0) {
        if (!legitDomains.some(d => domain === d || domain.endsWith('.' + d))) {
          findings.push(`Display name mentions "${org}" but domain (${domain}) does not match the legitimate organization`);
          score += 15;
        }
      }
    }
  }

  // Free email providers (not inherently suspicious, but worth noting for impersonation)
  const freeProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'];
  if (freeProviders.includes(domain) && display_name) {
    const orgMatch = display_name.match(/(?:bank|security|support|admin|ceo|director)/i);
    if (orgMatch) {
      findings.push(`Display name suggests an official role but uses a free email provider (${domain})`);
      score += 10;
    }
  }

  if (findings.length === 0) {
    findings.push('No suspicious sender patterns detected');
  }

  return {
    risk_score: Math.min(score, 100),
    findings,
    domain,
    display_name,
    email_address,
  };
}

// ─── Content Analysis ─────────────────────────────────────────────────────────

export function analyzeEmailContent(subject: string, body: string): ContentAnalysisResult {
  const fullText = `${subject} ${body}`;
  const lowerText = fullText.toLowerCase();
  const findings: Indicator[] = [];
  const categories = {
    urgency: false,
    fear: false,
    financial: false,
    credential: false,
    reward: false,
    personal_info: false,
    generic_greeting: false,
  };

  // Urgency
  const urgencyCount = countMatches(lowerText, URGENCY_KEYWORDS);
  if (urgencyCount > 0) {
    categories.urgency = true;
    const sev: Severity = urgencyCount > 2 ? 'HIGH' : 'MEDIUM';
    findings.push({
      indicator_type: 'CONTENT',
      description: `Urgency language detected (${urgencyCount} instance${urgencyCount > 1 ? 's' : ''})`,
      severity: sev,
      weight: sev === 'HIGH' ? 15 : 10,
    });
  }

  // Fear / threats
  const threatCount = countMatches(lowerText, THREAT_KEYWORDS);
  if (threatCount > 0) {
    categories.fear = true;
    const sev: Severity = threatCount > 2 ? 'HIGH' : 'MEDIUM';
    findings.push({
      indicator_type: 'CONTENT',
      description: `Threatening or fear-based language detected (${threatCount} instance${threatCount > 1 ? 's' : ''})`,
      severity: sev,
      weight: sev === 'HIGH' ? 15 : 10,
    });
  }

  // Financial pressure
  const financialCount = countMatches(lowerText, FINANCIAL_KEYWORDS);
  if (financialCount > 0) {
    categories.financial = true;
    findings.push({
      indicator_type: 'CONTENT',
      description: `Financial pressure language detected (${financialCount} instance${financialCount > 1 ? 's' : ''})`,
      severity: financialCount > 2 ? 'HIGH' : 'MEDIUM',
      weight: financialCount > 2 ? 12 : 8,
    });
  }

  // Credential requests
  const credentialCount = countMatches(lowerText, CREDENTIAL_KEYWORDS);
  if (credentialCount > 0) {
    categories.credential = true;
    findings.push({
      indicator_type: 'CONTENT',
      description: `Credential-related request detected (${credentialCount} instance${credentialCount > 1 ? 's' : ''})`,
      severity: 'HIGH',
      weight: 20,
    });
  }

  // Reward claims
  const rewardCount = countMatches(lowerText, REWARD_KEYWORDS);
  if (rewardCount > 0) {
    categories.reward = true;
    findings.push({
      indicator_type: 'CONTENT',
      description: `Reward or prize claims detected (${rewardCount} instance${rewardCount > 1 ? 's' : ''})`,
      severity: 'HIGH',
      weight: 12,
    });
  }

  // Personal info requests
  const personalInfoCount = countMatches(lowerText, PERSONAL_INFO_KEYWORDS);
  if (personalInfoCount > 0) {
    categories.personal_info = true;
    findings.push({
      indicator_type: 'CONTENT',
      description: `Personal information request detected (${personalInfoCount} instance${personalInfoCount > 1 ? 's' : ''})`,
      severity: 'HIGH',
      weight: 18,
    });
  }

  // Generic greeting
  const genericGreetings = ['dear user', 'dear customer', 'dear valued customer', 'dear member', 'dear account holder', 'dear sir/madam', 'dear client'];
  if (genericGreetings.some(g => lowerText.includes(g))) {
    categories.generic_greeting = true;
    findings.push({
      indicator_type: 'CONTENT',
      description: 'Generic greeting detected (does not use recipient name)',
      severity: 'LOW',
      weight: 5,
    });
  }

  // High exclamation count
  const exclamationCount = (fullText.match(/!/g) || []).length;
  if (exclamationCount > 5) {
    findings.push({
      indicator_type: 'CONTENT',
      description: `Excessive exclamation marks (${exclamationCount})`,
      severity: 'LOW',
      weight: 5,
    });
  }

  // High uppercase ratio
  const uRatio = uppercaseRatio(body);
  if (uRatio > 0.3 && body.length > 50) {
    findings.push({
      indicator_type: 'CONTENT',
      description: `High percentage of uppercase text (${Math.round(uRatio * 100)}%)`,
      severity: 'MEDIUM',
      weight: 8,
    });
  }

  return { findings, categories };
}

// ─── URL Analysis ─────────────────────────────────────────────────────────────

export function analyzeUrl(url: string): UrlAnalysisResult {
  const findings: string[] = [];
  let score = 0;

  let parsed = {
    scheme: '',
    hostname: '',
    path: '',
    has_ip: false,
    is_https: false,
    subdomain_count: 0,
    hostname_length: 0,
    url_length: 0,
  };

  try {
    let workingUrl = url.trim();
    if (!workingUrl.match(/^https?:\/\//i)) {
      workingUrl = 'http://' + workingUrl;
    }

    const u = new URL(workingUrl);
    parsed = {
      scheme: u.protocol.replace(':', ''),
      hostname: u.hostname,
      path: u.pathname,
      has_ip: isIpHostname(u.hostname),
      is_https: u.protocol === 'https:',
      subdomain_count: countSubdomains(u.hostname),
      hostname_length: u.hostname.length,
      url_length: workingUrl.length,
    };

    // Raw IP address
    if (parsed.has_ip) {
      findings.push('URL uses a raw IP address instead of a domain name');
      score += 20;
    }

    // Non-HTTPS
    if (!parsed.is_https) {
      findings.push('URL does not use HTTPS (unencrypted connection)');
      score += 12;
    }

    // Excessive subdomains
    if (parsed.subdomain_count > 3) {
      findings.push(`URL contains excessive subdomains (${parsed.subdomain_count})`);
      score += 10;
    }

    // Long URL
    if (parsed.url_length > 75) {
      findings.push(`URL is unusually long (${parsed.url_length} characters)`);
      score += 8;
    }

    // Long hostname
    if (parsed.hostname_length > 30) {
      findings.push(`Hostname is unusually long (${parsed.hostname_length} characters)`);
      score += 8;
    }

    // Shortener
    if (SHORTENER_DOMAINS.some(d => parsed.hostname.includes(d))) {
      findings.push('URL uses a link shortening service (destination is hidden)');
      score += 12;
    }

    // Suspicious keywords in URL
    const urlLower = workingUrl.toLowerCase();
    const matchedKw = SUSPICIOUS_URL_KEYWORDS.filter(kw => urlLower.includes(kw));
    if (matchedKw.length > 0) {
      findings.push(`URL contains sensitive keywords: ${matchedKw.join(', ')}`);
      score += Math.min(matchedKw.length * 4, 16);
    }

    // Lookalike domains in URL
    const lookalikeUrl = [
      /paypa[l1i]/i, /micr[o0]soft/i, /amaz[o0]n/i, /g[o0][o0]gle/i,
      /faceb[o0][o0]k/i, /netfl[il1]x/i, /apple[^.]*id/i,
    ];
    for (const pattern of lookalikeUrl) {
      if (pattern.test(parsed.hostname)) {
        findings.push('URL hostname appears to be a lookalike domain');
        score += 15;
        break;
      }
    }

    // @ symbol in URL (can redirect)
    if (workingUrl.includes('@') && !workingUrl.match(/https?:\/\/[^@]+@/)) {
      findings.push('URL contains "@" symbol which can be used to obscure destination');
      score += 8;
    }

    // Multiple redirects
    if ((workingUrl.match(/\/\//g) || []).length > 3) {
      findings.push('URL contains multiple double-slashes (possible redirect chain)');
      score += 5;
    }

  } catch {
    findings.push('URL could not be parsed (malformed structure)');
    score += 15;
  }

  if (findings.length === 0) {
    findings.push('No suspicious URL characteristics detected');
  }

  return {
    url,
    risk_score: Math.min(score, 100),
    findings,
    parsed,
  };
}

// ─── Attachment Analysis ──────────────────────────────────────────────────────

export function analyzeAttachment(filename: string): AttachmentAnalysisResult {
  const trimmed = filename.trim();
  if (!trimmed) {
    return {
      risk_score: 0,
      findings: [],
      has_attachment: false,
      extension: '',
      is_suspicious: false,
    };
  }

  const findings: string[] = [];
  let score = 0;
  const lowerName = trimmed.toLowerCase();
  const extension = lowerName.substring(lowerName.lastIndexOf('.'));

  // Suspicious extension
  if (SUSPICIOUS_EXTENSIONS.includes(extension)) {
    findings.push(`Attachment has a suspicious extension (${extension})`);
    score += 25;
  }

  // Double extension
  const parts = lowerName.split('.');
  if (parts.length > 2) {
    const lastExt = '.' + parts[parts.length - 1];
    const secondLast = '.' + parts[parts.length - 2];
    if (SUSPICIOUS_EXTENSIONS.includes(lastExt)) {
      findings.push(`Double extension detected (${secondLast}${lastExt}) - likely disguised executable`);
      score += 20;
    } else if (['.pdf', '.doc', '.xls', '.txt', '.jpg', '.png'].includes(secondLast) && lastExt !== secondLast) {
      findings.push(`Double extension detected (${secondLast}${lastExt})`);
      score += 10;
    }
  }

  // Archive files
  if (['.zip', '.rar', '.7z'].includes(extension)) {
    findings.push('Attachment is an archive file - contents should be inspected before opening');
    score += 8;
  }

  // Script files
  if (['.js', '.vbs', '.ps1', '.hta'].includes(extension)) {
    findings.push(`Attachment is a script file (${extension}) - can execute code`);
    score += 25;
  }

  if (findings.length === 0) {
    findings.push('Attachment filename appears safe');
  }

  return {
    risk_score: Math.min(score, 100),
    findings,
    has_attachment: true,
    extension,
    is_suspicious: score >= 20,
  };
}

// ─── Feature Extraction ───────────────────────────────────────────────────────

export function extractEmailFeatures(
  senderField: string,
  subject: string,
  body: string,
  attachmentName: string,
): Record<string, number | boolean> {
  const senderResult = analyzeSender(senderField);
  const contentResult = analyzeEmailContent(subject, body);
  const urls = extractUrls(`${subject} ${body}`);
  const urlResults = urls.map(analyzeUrl);
  const attachmentResult = analyzeAttachment(attachmentName);

  return {
    urgent_keyword_count: countMatches(`${subject} ${body}`, URGENCY_KEYWORDS),
    credential_keyword_count: countMatches(`${subject} ${body}`, CREDENTIAL_KEYWORDS),
    financial_keyword_count: countMatches(`${subject} ${body}`, FINANCIAL_KEYWORDS),
    threat_keyword_count: countMatches(`${subject} ${body}`, THREAT_KEYWORDS),
    url_count: urls.length,
    suspicious_url_count: urlResults.filter(u => u.risk_score > 20).length,
    has_ip_url: urlResults.some(u => u.parsed.has_ip),
    has_shortened_url_pattern: urlResults.some(u =>
      SHORTENER_DOMAINS.some(d => u.parsed.hostname.includes(d))
    ),
    sender_domain_length: senderResult.domain.length,
    subdomain_count: countSubdomains(senderResult.domain),
    suspicious_attachment: attachmentResult.is_suspicious,
    generic_greeting: contentResult.categories.generic_greeting,
    contains_password_request: contentResult.categories.credential,
    contains_personal_info_request: contentResult.categories.personal_info,
    exclamation_count: (body.match(/!/g) || []).length,
    uppercase_ratio: Math.round(uppercaseRatio(body) * 100) / 100,
    body_length: body.length,
    subject_length: subject.length,
  };
}

// ─── Risk Scoring Engine ──────────────────────────────────────────────────────

export function calculatePhishingScore(
  sender: string,
  subject: string,
  body: string,
  attachmentName: string,
): AnalysisResult {
  const senderResult = analyzeSender(sender);
  const contentResult = analyzeEmailContent(subject, body);
  const urls = extractUrls(`${subject} ${body}`);
  const urlResults = urls.map(analyzeUrl);
  const attachmentResult = analyzeAttachment(attachmentName);
  const features = extractEmailFeatures(sender, subject, body, attachmentName);

  const indicators: Indicator[] = [...contentResult.findings];

  // Sender indicators
  if (senderResult.risk_score > 0) {
    indicators.push({
      indicator_type: 'SENDER',
      description: senderResult.findings.join('; '),
      severity: senderResult.risk_score > 30 ? 'HIGH' : senderResult.risk_score > 15 ? 'MEDIUM' : 'LOW',
      weight: Math.min(Math.round(senderResult.risk_score * 0.2), 20),
    });
  }

  // URL indicators
  for (const urlResult of urlResults) {
    if (urlResult.risk_score > 10) {
      indicators.push({
        indicator_type: 'URL',
        description: `[${urlResult.url}] ${urlResult.findings.join('; ')}`,
        severity: urlResult.risk_score > 40 ? 'HIGH' : urlResult.risk_score > 20 ? 'MEDIUM' : 'LOW',
        weight: Math.min(Math.round(urlResult.risk_score * 0.2), 20),
      });
    }
  }

  // Attachment indicators
  if (attachmentResult.has_attachment && attachmentResult.risk_score > 0) {
    indicators.push({
      indicator_type: 'ATTACHMENT',
      description: attachmentResult.findings.join('; '),
      severity: attachmentResult.risk_score > 20 ? 'HIGH' : 'MEDIUM',
      weight: Math.min(Math.round(attachmentResult.risk_score * 0.25), 25),
    });
  }

  // Subject indicators
  const subjectLower = subject.toLowerCase();
  if (URGENCY_KEYWORDS.some(kw => subjectLower.includes(kw))) {
    indicators.push({
      indicator_type: 'SUBJECT',
      description: 'Subject line contains urgency language',
      severity: 'MEDIUM',
      weight: 8,
    });
  }
  if (REWARD_KEYWORDS.some(kw => subjectLower.includes(kw))) {
    indicators.push({
      indicator_type: 'SUBJECT',
      description: 'Subject line contains reward or prize claims',
      severity: 'HIGH',
      weight: 10,
    });
  }

  // Calculate total score with weights
  let totalScore = 0;

  // Sender contribution (max ~20)
  totalScore += Math.min(senderResult.risk_score * 0.2, 20);

  // Content contribution
  for (const finding of contentResult.findings) {
    totalScore += finding.weight;
  }

  // URL contribution (max ~20 per URL)
  for (const urlResult of urlResults) {
    totalScore += Math.min(urlResult.risk_score * 0.2, 20);
  }

  // Attachment contribution (max ~25)
  totalScore += Math.min(attachmentResult.risk_score * 0.25, 25);

  totalScore = Math.min(Math.round(totalScore), 100);
  if (totalScore < 0) totalScore = 0;

  // Classify
  let classification: Classification;
  if (totalScore <= 10) classification = 'SAFE';
  else if (totalScore <= 25) classification = 'LOW RISK';
  else if (totalScore <= 45) classification = 'MODERATE RISK';
  else if (totalScore <= 70) classification = 'SUSPICIOUS';
  else classification = 'HIGH RISK / LIKELY PHISHING';

  // Recommendations based on classification
  const recommendations: string[] = [];
  if (totalScore > 40) {
    recommendations.push('Do not click any links in this email.');
  }
  if (attachmentResult.is_suspicious) {
    recommendations.push('Do not open the attachment - it may contain malicious code.');
  }
  if (contentResult.categories.credential) {
    recommendations.push('Never share passwords or credentials via email. Use the official website/app directly.');
  }
  if (totalScore > 20) {
    recommendations.push('Verify the sender through a trusted, independent channel (e.g., official website or phone number).');
  }
  if (totalScore > 10) {
    recommendations.push('Report suspicious emails to your security team or IT department.');
  }
  if (urlResults.some(u => !u.parsed.is_https)) {
    recommendations.push('Avoid visiting non-HTTPS (unencrypted) links.');
  }
  if (recommendations.length === 0) {
    recommendations.push('This email appears low risk. Continue to practice standard email security awareness.');
    recommendations.push('Always verify unexpected emails, even from known senders.');
  }
  recommendations.push('When in doubt, do not click, reply, or open attachments - verify first.');

  return {
    risk_score: totalScore,
    classification,
    indicators,
    sender_analysis: senderResult,
    content_analysis: contentResult,
    url_analyses: urlResults,
    attachment_analysis: attachmentResult,
    recommendations,
    features,
  };
}

// ─── Classification helpers ───────────────────────────────────────────────────

export function getClassificationColor(c: Classification): {
  bg: string; text: string; border: string; label: string;
} {
  switch (c) {
    case 'SAFE':
      return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', label: 'SAFE' };
    case 'LOW RISK':
      return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500', label: 'LOW RISK' };
    case 'MODERATE RISK':
      return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', label: 'MODERATE RISK' };
    case 'SUSPICIOUS':
      return { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500', label: 'SUSPICIOUS' };
    case 'HIGH RISK / LIKELY PHISHING':
      return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500', label: 'HIGH RISK' };
    default:
      return { bg: 'bg-gray-500', text: 'text-gray-600', border: 'border-gray-500', label: c };
  }
}

export function getRiskScoreColor(score: number): string {
  if (score <= 10) return 'text-emerald-500';
  if (score <= 25) return 'text-green-500';
  if (score <= 45) return 'text-amber-500';
  if (score <= 70) return 'text-orange-500';
  return 'text-red-500';
}
