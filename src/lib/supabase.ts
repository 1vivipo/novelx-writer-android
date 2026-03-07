/**
 * Supabase 客户端配置
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase 配置缺失:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库表名
export const TABLES = {
  PROJECTS: 'novel_projects',
  SETTINGS: 'novel_settings', 
  CHAPTERS: 'novel_chapters',
  EMAIL_LOGS: 'novel_email_logs'
} as const;
