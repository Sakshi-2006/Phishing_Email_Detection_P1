# Phishing Email Detection & Awareness Dashboard

> Defensive cybersecurity dashboard for analyzing **synthetic** email content, sender patterns, URLs, attachments and social-engineering indicators to produce **explainable** phishing risk assessments.

**Live demo (deployed on Bolt):** https://phishing-detection-d-gb9h.bolt.host/

## Overview
A beginner-friendly, SOC-style triage tool. You paste an email (or upload a safe `.txt`/`.eml`), and it returns a 0-100 risk score, a classification (`SAFE`, `LOW RISK`, `MODERATE RISK`, `SUSPICIOUS`, `HIGH RISK / LIKELY PHISHING`), a plain-English **"why"**, and recommended actions. Results feed an analytics dashboard and a searchable history. An awareness module teaches users how to spot phishing.

## Problem Statement
Phishing is one of the most common ways attackers gain access to accounts and money. Simple filters miss novel lures, and a bare "PHISHING" verdict gives analysts and users nothing to act on. This project shows how multiple weak signals can be combined into a transparent, explainable decision.

## Objectives
Detect phishing indicators in sender / subject / body / URLs / attachment names - score and classify risk - explain every decision - store safe metadata - visualise trends - educate users - stay 100% defensive and safe.

## Features
- Sender analysis (format, lookalike domains, display-name mismatch, subdomains, punycode, free-mail + official name)
- Content analysis (urgency, fear, financial pressure, credential/personal-info requests, rewards, generic greeting, formatting)
- Static URL analysis (raw IP, non-HTTPS, shorteners, keywords, subdomains, `@` tricks, HTML link-text mismatch) - **URLs are never visited**
- Attachment filename analysis (executables, scripts, macro docs, archives, double extensions) - **never opened**
- Rule-based scoring engine + optional ML (TF-IDF + indicators) + hybrid score
- Dashboard (6 charts + KPI cards), history (search/filter/sort/detail/delete), awareness module + checklist
- REST API, SQLite storage (metadata only), optional login/roles, rate limiting, CSP headers, 42 automated tests

## Cybersecurity Relevance
Mirrors what email-security gateways and SOC triage workflows do: feature extraction, scoring, explainability, analyst review. Maps to the MITRE ATT&CK *Phishing (T1566)* family - see `docs/01_CONCEPTS_AND_INDUSTRY.md`.

## Architecture
```
User -> Web Dashboard -> Flask REST API -> Preprocessing
      -> [Sender | Content | URL | Attachment analyzers] (+ optional ML)
      -> Risk engine -> Classification -> Explanation + Recommendations -> Dashboard + SQLite
```
Details: `docs/02_ARCHITECTURE_API_DB.md`.

## Technology Stack
Python 3.10+, Flask, scikit-learn, pandas, matplotlib, SQLite, vanilla JavaScript + SVG (no frontend build step, no CDN), `unittest`. The hosted demo is deployed on Bolt.

## Dataset
`data/generate_dataset.py` creates **600 synthetic emails** (330 legitimate, 270 phishing) with seed 42, saved to `data/phishing_email_dataset.csv`.
- Legitimate categories: university, HR, project, meeting, shopping, newsletter, password-change confirmation, bank-style (fictional banks).
- Phishing categories: fake verification, invoice, prize, password expiry, delivery, HR request, executive request, "polished" low-signal phishing.
- Only reserved domains (`example.*`, `*.invalid.test`) and documentation IPs (`192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`).
- Includes **hard cases**: legit mail that says "urgent"; phishing with perfect grammar and no urgency. An extra `category` column is used only for generalisation tests.

## Phishing Indicators / Sender / Content / URL / Attachment Analysis
Implemented in `backend/services/` (`sender_analyzer.py`, `content_analyzer.py`, `url_analyzer.py`, `attachment_analyzer.py`). Each returns findings with severity, points and an explanation. **No single indicator proves phishing.** HTTPS does not mean a site is trustworthy. An unfamiliar domain is not automatically malicious.

## Risk Scoring
`risk_engine.py`: weighted indicators (credential request +20, suspicious URL +20, suspicious attachment +25, urgency +10, generic greeting +5, credential+URL combination +10, ...), capped at 100.

| Score | Classification |
|---|---|
| 0 | SAFE |
| 1-20 | LOW RISK |
| 21-40 | MODERATE RISK |
| 41-70 | SUSPICIOUS |
| 71-100 | HIGH RISK / LIKELY PHISHING |

**Weights and thresholds are project assumptions** that must be calibrated with validation data in real use.

## Machine Learning
`python -m ml.train_model` trains Logistic Regression, Naive Bayes and Random Forest on TF-IDF text + 21 indicator features (70/15/15 stratified split; model chosen on validation F1) and writes metrics + charts to `reports/`. Optional **hybrid** score = 0.6 x rule score + 0.4 x ML probability.

## Explainable Detection
Every result shows: score, class, a "WHY?" checklist with point contributions, per-analyzer findings, defanged URLs, and recommended actions. Explainability lets analysts verify, challenge and tune decisions, and tells users what to do.

## Dashboard / Security Awareness
KPI cards, classification donut, flagged-vs-not donut, risk histogram, top indicators, common keywords, daily trend. Awareness page: 10 spotting tips + interactive "Before You Click" checklist.

## Installation
```bash
git clone https://github.com/<your-username>/Phishing-Email-Detection-Awareness-Dashboard.git
cd Phishing-Email-Detection-Awareness-Dashboard
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python data/generate_dataset.py      # (re)create the synthetic dataset
python -m ml.train_model             # optional: train ML + create reports
python -m scripts.seed_history --count 200   # optional: fill dashboard with sample analyses
python -m backend.app                # open http://127.0.0.1:5000
```

## Usage
1. Open the **Email Analyzer**; click *Load phishing sample*, then **ANALYZE EMAIL**; compare with *Load legitimate sample*.
2. Tick *Add ML (hybrid)* (needs the trained model).
3. Explore **Dashboard**, **History** (search, filter, sort, click a row) and **Awareness**.

## API Documentation
| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| POST | `/api/analyze` | analyse an email (JSON: sender, subject, body, attachment_name, display_name, use_ml, save) | 201 (200 if `save=false`) |
| POST | `/api/analyze/url` | analyse one URL string | 200 |
| POST | `/api/parse-file` | parse uploaded `.txt`/`.eml` into form fields | 200 |
| GET | `/api/analyses?classification=&q=&sort=&limit=&offset=` | list history | 200 |
| GET | `/api/analyses/{id}` | one analysis | 200 / 404 |
| DELETE | `/api/analyses/{id}` | delete (admin when auth on) | 204 / 404 |
| GET | `/api/dashboard/stats`, `/api/dashboard/indicators` | analytics | 200 |
| POST | `/api/register`, `/api/login`, `/api/logout` | optional auth | 201 / 200 |

Errors: 400 validation, 401 not logged in, 403 forbidden, 404, 409, 413 too large, 429 rate limit. Full table: `docs/02_ARCHITECTURE_API_DB.md`.

Example:
```bash
curl -s -X POST localhost:5000/api/analyze -H "Content-Type: application/json" -d '{
 "sender":"Security <security-alert@account-check.invalid.test>",
 "subject":"URGENT: Verify Your Account Immediately",
 "body":"Dear Customer, your account will be suspended. Verify your password: http://198.51.100.10/verify-account"}'
```

## Testing
```bash
python -m unittest discover -s tests -t .      # 42 tests, all passing (also runs under pytest)
python -m scripts.make_test_report             # regenerates docs/TEST_REPORT.md
```

## Security & Privacy
- Attachments never opened; URLs never visited (static string analysis, shown defanged)
- Email bodies never stored (only domain, subject, score, indicators, defanged URLs)
- Parameterised SQL, whitelisted sort fields
- UI built with `textContent`/DOM APIs (no `innerHTML` with email data) + strict Content-Security-Policy
- Upload type/size limits, request size cap, rate limiting
- Password hashing, optional login, admin-only delete
- Security log without email content; secrets via environment variables
- Raw HTML email can load tracking pixels, run scripts or hide links, so this tool shows **text only**

## Results
Produced by running the code on the held-out test set (n = 90: 41 phishing, 49 legitimate).

| System | Accuracy | Precision | Recall | F1 | FP | FN |
|---|---|---|---|---|---|---|
| Rule engine (flag if score >= 41) | 0.856 | 1.000 | 0.683 | 0.812 | 0 | 13 |
| Logistic Regression (text+indicators) | 1.000 | 1.000 | 1.000 | 1.000 | 0 | 0 |
| Naive Bayes / Random Forest | 1.000 | 1.000 | 1.000 | 1.000 | 0 | 0 |
| Hybrid (60% rules + 40% LR) | 0.989 | 1.000 | 0.976 | 0.988 | 0 | 1 |

**Read this honestly:** the ML scores of 1.000 are *not* evidence of a great detector. The data is template-generated, so test emails are near-copies of training emails (a form of leakage). A tougher **leave-one-template-out** test (train without an entire phishing family, then test on it) shows the real picture:
- ML and rules catch unseen *verify / password / prize / delivery / HR* phishing.
- Both score **0.000 recall** on unseen *executive gift-card* and *polished, no-urgency* phishing.
- Rules alone recall only 0.686 of unseen *invoice* lures.
- Lowering the rule threshold to 21 raises recall to 0.780 (FN 9): the precision/recall trade-off.

Full numbers: `reports/ml_metrics.json`. Real-world performance requires real, diverse, authorised data.

## False Positives & False Negatives
- **False positive:** a genuine HR email "Urgent: submit your documents today" gets urgency points. In this dataset such mail scores 10/100 (LOW RISK); across all 330 legitimate samples the maximum rule score is 10, which also shows the synthetic legitimate data is cleaner than real inboxes, so real-world false positives would be higher.
- **False negative:** a polished message with a plausible sender and no urgency, or a link-less CEO gift-card request, scores low.

This is why the tool reports a risk assessment built from many signals, not a verdict.

## Limitations
Synthetic data; static analysis only (no email headers, SPF/DKIM/DMARC, domain age or reputation); English keyword rules; fictional brand list; in-memory rate limiter; weights not statistically calibrated; no HTML/image/QR analysis.

## Future Improvements
Header + SPF/DKIM/DMARC ingestion, domain/URL reputation APIs, attachment-hash reputation, stronger NLP and explainable AI (SHAP/LIME), user reporting workflow, SOC ticket + SIEM integration, threat-intel enrichment, awareness quizzes, feedback-based retraining.

## Learning Outcomes
Phishing and social engineering - email-security triage - static URL/attachment analysis - feature engineering - rule vs ML vs hybrid detection - precision/recall/F1 and leakage awareness - secure coding (validation, XSS/SQLi defence, CSP) - REST API and SQL design - testing and documentation.

## Disclaimer
This project is designed for cybersecurity education and defensive analysis using synthetic or authorized data. It sends no emails, collects no credentials, visits no links and executes no attachments. Do not use it as the only control protecting real users.

## Documentation Index
| File | Contents |
|---|---|
| `docs/01_CONCEPTS_AND_INDUSTRY.md` | phishing concepts, industry roles, indicators, security/privacy, SOC workflow, MITRE ATT&CK, future work |
| `docs/02_ARCHITECTURE_API_DB.md` | architecture, folder structure, database design, full API table |
| `docs/03_RUN_GITHUB_PROOF.md` | run steps, demo scenarios, Git commands, 13-day plan, screenshot checklist |
| `docs/04_PROJECT_REPORT.md` | full project report with real results |
| `docs/05_CAREER_KIT.md` | resume bullets, LinkedIn text, 10 interview Q&As |
| `docs/TEST_REPORT.md` | per-test table (ID, scenario, input, expected, actual, pass/fail) |

## Author
**Sakshi Karwade**
