/**
 * Supabase 客户端配置
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://mbrpsuigifayotpxxnp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_EhtFZL5xlYXjuuLg_h0cPQ_jO12-g05';

export const supabase = createClient(supabaseUrl, supabaseKey);

// 项目类型
export interface DBProject {
  id: string;
  title: string;
  prompt: string;
  total_chapters: number;
  current_chapter: number;
  status: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

// 设定类型
export interface DBSettings {
  id?: number;
  project_id: string;
  worldview: string;
  characters: string;
  outline: string;
  plot_design: string;
  chapter_outline: string;
  writing_rules: string;
  created_at: string;
  updated_at: string;
}

// 章节类型
export interface DBChapter {
  id?: number;
  project_id: string;
  number: number;
  title: string;
  content: string;
  status: string;
  word_count: number;
  retry_count: number;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

// 邮件日志类型
export interface DBEmailLog {
  id?: number;
  project_id: string;
  chapter_num: number;
  email: string;
  status: string;
  error?: string;
  created_at: string;
}

// 调度器状态类型
export interface DBSchedulerState {
  id?: number;
  running_projects: string[];
  queue: string[];
  user_email: string;
  updated_at: string;
}
