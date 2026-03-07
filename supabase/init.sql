-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 项目表
CREATE TABLE IF NOT EXISTS novel_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  prompt TEXT NOT NULL,
  total_chapters INTEGER NOT NULL DEFAULT 0,
  current_chapter INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 设定表
CREATE TABLE IF NOT EXISTS novel_settings (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE REFERENCES novel_projects(id) ON DELETE CASCADE,
  worldview TEXT DEFAULT '',
  characters TEXT DEFAULT '',
  outline TEXT DEFAULT '',
  plot_design TEXT DEFAULT '',
  chapter_outline TEXT DEFAULT '',
  writing_rules TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 章节表
CREATE TABLE IF NOT EXISTS novel_chapters (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES novel_projects(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  word_count INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, number)
);

-- 4. 邮件日志表
CREATE TABLE IF NOT EXISTS novel_email_logs (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES novel_projects(id) ON DELETE CASCADE,
  chapter_num INTEGER NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 调度器状态表
CREATE TABLE IF NOT EXISTS novel_scheduler_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  running_projects TEXT[] DEFAULT '{}',
  queue TEXT[] DEFAULT '{}',
  user_email TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 插入初始调度器状态
INSERT INTO novel_scheduler_state (id, running_projects, queue, user_email)
VALUES (1, '{}', '{}', 'f1ash23@outlook.com')
ON CONFLICT (id) DO NOTHING;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON novel_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created ON novel_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_project ON novel_chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_project ON novel_email_logs(project_id);

-- 启用 Row Level Security
ALTER TABLE novel_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_scheduler_state ENABLE ROW LEVEL SECURITY;

-- 创建允许所有操作的策略
CREATE POLICY "Allow all operations" ON novel_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON novel_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON novel_chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON novel_email_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations" ON novel_scheduler_state FOR ALL USING (true) WITH CHECK (true);
