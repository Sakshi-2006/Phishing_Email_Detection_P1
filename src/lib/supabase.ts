import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AnalysisRecord {
  id: string;
  sender: string;
  sender_domain: string;
  subject: string;
  risk_score: number;
  classification: string;
  body_preview: string;
  created_at: string;
}

export interface IndicatorRecord {
  id: string;
  analysis_id: string;
  indicator_type: string;
  description: string;
  severity: string;
  weight: number;
}

export interface UrlAnalysisRecord {
  id: string;
  analysis_id: string;
  url: string;
  risk_score: number;
  findings: string;
}
