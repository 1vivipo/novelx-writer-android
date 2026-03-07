/**
 * Supabase 数据库操作
 */

import { supabase, DBProject, DBSettings, DBChapter, DBEmailLog, DBSchedulerState } from './supabase';

// ==================== 项目操作 ====================

// 保存项目
export async function saveProject(project: {
  id: string;
  title: string;
  prompt: string;
  totalChapters: number;
  currentChapter: number;
  status: string;
  error?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('novel_projects')
      .upsert({
        id: project.id,
        title: project.title,
        prompt: project.prompt,
        total_chapters: project.totalChapters,
        current_chapter: project.currentChapter,
        status: project.status,
        error: project.error || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`[Supabase] 项目 ${project.id} 已保存`);
  } catch (error) {
    console.error(`[Supabase] 保存项目失败:`, error);
  }
}

// 获取所有项目
export async function getAllProjects(): Promise<DBProject[]> {
  try {
    const { data, error } = await supabase
      .from('novel_projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`[Supabase] 获取项目列表失败:`, error);
    return [];
  }
}

// 获取单个项目
export async function getProject(projectId: string): Promise<DBProject | null> {
  try {
    const { data, error } = await supabase
      .from('novel_projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`[Supabase] 获取项目失败:`, error);
    return null;
  }
}

// ==================== 设定操作 ====================

// 保存设定
export async function saveSettings(projectId: string, settings: {
  worldview: string;
  characters: string;
  outline: string;
  plotDesign: string;
  chapterOutline: string;
  writingRules: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('novel_settings')
      .upsert({
        project_id: projectId,
        worldview: settings.worldview,
        characters: settings.characters,
        outline: settings.outline,
        plot_design: settings.plotDesign,
        chapter_outline: settings.chapterOutline,
        writing_rules: settings.writingRules,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id' });
    
    if (error) throw error;
    console.log(`[Supabase] 项目 ${projectId} 设定已保存`);
  } catch (error) {
    console.error(`[Supabase] 保存设定失败:`, error);
  }
}

// 获取设定
export async function getSettings(projectId: string): Promise<DBSettings | null> {
  try {
    const { data, error } = await supabase
      .from('novel_settings')
      .select('*')
      .eq('project_id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`[Supabase] 获取设定失败:`, error);
    return null;
  }
}

// ==================== 章节操作 ====================

// 保存章节
export async function saveChapter(projectId: string, chapter: {
  number: number;
  title: string;
  content: string;
  status: string;
  wordCount: number;
  retryCount: number;
  reviewNotes?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('novel_chapters')
      .upsert({
        project_id: projectId,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content,
        status: chapter.status,
        word_count: chapter.wordCount,
        retry_count: chapter.retryCount,
        review_notes: chapter.reviewNotes || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id,number' });
    
    if (error) throw error;
    console.log(`[Supabase] 章节 ${chapter.number} 已保存`);
  } catch (error) {
    console.error(`[Supabase] 保存章节失败:`, error);
  }
}

// 获取所有章节
export async function getChapters(projectId: string): Promise<DBChapter[]> {
  try {
    const { data, error } = await supabase
      .from('novel_chapters')
      .select('*')
      .eq('project_id', projectId)
      .order('number', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`[Supabase] 获取章节失败:`, error);
    return [];
  }
}

// 获取单个章节
export async function getChapter(projectId: string, chapterNum: number): Promise<DBChapter | null> {
  try {
    const { data, error } = await supabase
      .from('novel_chapters')
      .select('*')
      .eq('project_id', projectId)
      .eq('number', chapterNum)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`[Supabase] 获取章节失败:`, error);
    return null;
  }
}

// ==================== 邮件日志操作 ====================

// 记录邮件发送
export async function logEmailSent(
  projectId: string,
  chapterNum: number,
  email: string,
  status: string,
  error?: string
): Promise<void> {
  try {
    const { error: dbError } = await supabase
      .from('novel_email_logs')
      .insert({
        project_id: projectId,
        chapter_num: chapterNum,
        email,
        status,
        error: error || null
      });
    
    if (dbError) throw dbError;
  } catch (err) {
    console.error(`[Supabase] 记录邮件日志失败:`, err);
  }
}

// ==================== 调度器状态操作 ====================

// 获取调度器状态
export async function getSchedulerState(): Promise<DBSchedulerState | null> {
  try {
    const { data, error } = await supabase
      .from('novel_scheduler_state')
      .select('*')
      .eq('id', 1)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`[Supabase] 获取调度器状态失败:`, error);
    return null;
  }
}

// 更新调度器状态
export async function updateSchedulerState(state: {
  runningProjects: string[];
  queue: string[];
  userEmail: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('novel_scheduler_state')
      .upsert({
        id: 1,
        running_projects: state.runningProjects,
        queue: state.queue,
        user_email: state.userEmail,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) throw error;
  } catch (error) {
    console.error(`[Supabase] 更新调度器状态失败:`, error);
  }
}
