/*
# Phishing Analysis Dashboard - Database Schema

## Purpose
Stores email analysis results from the phishing detection dashboard. Single-tenant app (no auth).

## New Tables
### analyses - main analysis records
### indicators - detected phishing indicators per analysis
### url_analyses - URL-level analysis results per analysis

## Security
- RLS enabled on all tables
- Anon + authenticated CRUD (single-tenant, no auth)
*/

CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text DEFAULT '',
  sender_domain text DEFAULT '',
  subject text DEFAULT '',
  risk_score integer NOT NULL DEFAULT 0,
  classification text NOT NULL DEFAULT 'LOW RISK',
  body_preview text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analyses" ON analyses;
CREATE POLICY "anon_select_analyses" ON analyses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analyses" ON analyses;
CREATE POLICY "anon_insert_analyses" ON analyses FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analyses" ON analyses;
CREATE POLICY "anon_delete_analyses" ON analyses FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  indicator_type text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'LOW',
  weight integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_indicators" ON indicators;
CREATE POLICY "anon_select_indicators" ON indicators FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_indicators" ON indicators;
CREATE POLICY "anon_insert_indicators" ON indicators FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_indicators" ON indicators;
CREATE POLICY "anon_delete_indicators" ON indicators FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS url_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE,
  url text NOT NULL,
  risk_score integer NOT NULL DEFAULT 0,
  findings text DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE url_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_url_analyses" ON url_analyses;
CREATE POLICY "anon_select_url_analyses" ON url_analyses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_url_analyses" ON url_analyses;
CREATE POLICY "anon_insert_url_analyses" ON url_analyses FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_url_analyses" ON url_analyses;
CREATE POLICY "anon_delete_url_analyses" ON url_analyses FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_indicators_analysis_id ON indicators(analysis_id);
CREATE INDEX IF NOT EXISTS idx_url_analyses_analysis_id ON url_analyses(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_classification ON analyses(classification);
