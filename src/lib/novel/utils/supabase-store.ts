/**
 * Supabase 存储服务
 * 负责所有数据的读写操作
 */

import { supabase, TABLES } from '@/lib/supabase';
import { NovelProject, Chapter } from '../types';

// ==================== 项目操作 ====================

// 保存项目
export async function saveProject(project: NovelProject): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.PROJECTS)
      .upsert({
        id: project.id,
        title: project.title || '生成中...',
        prompt: project.prompt,
        total_chapters: project.totalChapters,
        current_chapter: project.currentChapter,
        status: project.status,
        error: project.error || null,
        created_at: project.createdAt.toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      console.error('保存项目失败:', error);
      return false;
    }
    
    console.log(`[Supabase] 项目 ${project.id} 已保存`);
    return true;
  } catch (e) {
    console.error('保存项目异常:', e);
    return false;
  }
}

// 加载项目
export async function loadProject(projectId: string): Promise<NovelProject | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !data) {
      console.error('加载项目失败:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      prompt: data.prompt,
      totalChapters: data.total_chapters,
      currentChapter: data.current_chapter,
      status: data.status,
      error: data.error,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      settings: await loadSettings(projectId) || {
        worldview: '',
        characters: '',
        outline: '',
        plotDesign: '',
        chapterOutline: '',
        writingRules: ''
      },
      chapters: await loadChapters(projectId)
    };
  } catch (e) {
    console.error('加载项目异常:', e);
    return null;
  }
}

// 加载所有项目
export async function loadAllProjects(): Promise<NovelProject[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('加载项目列表失败:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      title: item.title,
      prompt: item.prompt,
      totalChapters: item.total_chapters,
      currentChapter: item.current_chapter,
      status: item.status,
      error: item.error,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      settings: {
        worldview: '',
        characters: '',
        outline: '',
        plotDesign: '',
        chapterOutline: '',
        writingRules: ''
      },
      chapters: []
    }));
  } catch (e) {
    console.error('加载项目列表异常:', e);
    return [];
  }
}

// 删除项目
export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    // 先删除关联数据
    await supabase.from(TABLES.CHAPTERS).delete().eq('project_id', projectId);
    await supabase.from(TABLES.SETTINGS).delete().eq('project_id', projectId);
    await supabase.from(TABLES.EMAIL_LOGS).delete().eq('project_id', projectId);
    
    // 删除项目
    const { error } = await supabase
      .from(TABLES.PROJECTS)
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('删除项目失败:', error);
      return false;
    }
    
    console.log(`[Supabase] 项目 ${projectId} 已删除`);
    return true;
  } catch (e) {
    console.error('删除项目异常:', e);
    return false;
  }
}

// ==================== 设定操作 ====================

// 保存设定
export async function saveSettings(projectId: string, settings: NovelProject['settings']): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.SETTINGS)
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

    if (error) {
      console.error('保存设定失败:', error);
      return false;
    }
    
    console.log(`[Supabase] 项目 ${projectId} 设定已保存`);
    return true;
  } catch (e) {
    console.error('保存设定异常:', e);
    return false;
  }
}

// 加载设定
export async function loadSettings(projectId: string): Promise<NovelProject['settings'] | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.SETTINGS)
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      worldview: data.worldview || '',
      characters: data.characters || '',
      outline: data.outline || '',
      plotDesign: data.plot_design || '',
      chapterOutline: data.chapter_outline || '',
      writingRules: data.writing_rules || ''
    };
  } catch (e) {
    return null;
  }
}

// ==================== 章节操作 ====================

// 保存章节
export async function saveChapter(projectId: string, chapter: Chapter): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(TABLES.CHAPTERS)
      .upsert({
        project_id: projectId,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content,
        status: chapter.status,
        word_count: chapter.wordCount,
        retry_count: chapter.retryCount || 0,
        review_notes: chapter.reviewNotes || null,
        created_at: chapter.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'project_id,number' });

    if (error) {
      console.error('保存章节失败:', error);
      return false;
    }
    
    console.log(`[Supabase] 章节 ${chapter.number} 已保存`);
    return true;
  } catch (e) {
    console.error('保存章节异常:', e);
    return false;
  }
}

// 加载章节列表
export async function loadChapters(projectId: string): Promise<Chapter[]> {
  try {
    const { data, error } = await supabase
      .from(TABLES.CHAPTERS)
      .select('*')
      .eq('project_id', projectId)
      .order('number', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(item => ({
      number: item.number,
      title: item.title,
      content: item.content,
      status: item.status,
      wordCount: item.word_count,
      retryCount: item.retry_count,
      reviewNotes: item.review_notes,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  } catch (e) {
    return [];
  }
}

// 加载单个章节
export async function loadChapter(projectId: string, chapterNum: number): Promise<Chapter | null> {
  try {
    const { data, error } = await supabase
      .from(TABLES.CHAPTERS)
      .select('*')
      .eq('project_id', projectId)
      .eq('number', chapterNum)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      number: data.number,
      title: data.title,
      content: data.content,
      status: data.status,
      wordCount: data.word_count,
      retryCount: data.retry_count,
      reviewNotes: data.review_notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (e) {
    return null;
  }
}

// ==================== 邮件日志 ====================

export async function logEmail(
  projectId: string, 
  chapterNum: number, 
  email: string, 
  status: string, 
  error?: string
): Promise<void> {
  try {
    await supabase
      .from(TABLES.EMAIL_LOGS)
      .insert({
        project_id: projectId,
        chapter_num: chapterNum,
        email,
        status,
        error: error || null,
        sent_at: new Date().toISOString()
      });
  } catch (e) {
    console.error('记录邮件日志失败:', e);
  }
}

// ==================== 调度器状态 ====================

const SCHEDULER_STATE_KEY = 'scheduler_state';

interface SchedulerState {
  runningProjects: string[];
  queue: string[];
  lastUpdate: string;
  userEmail?: string;
}

// 保存调度器状态
export async function saveSchedulerState(state: SchedulerState): Promise<void> {
  try {
    // 使用 localStorage 在客户端，或使用数据库
    // 这里简化处理，使用内存缓存
    globalThis.__schedulerState = state;
  } catch (e) {
    console.error('保存调度器状态失败:', e);
  }
}

// 加载调度器状态
export async function loadSchedulerState(): Promise<SchedulerState> {
  try {
    return globalThis.__schedulerState || {
      runningProjects: [],
      queue: [],
      lastUpdate: new Date().toISOString()
    };
  } catch (e) {
    return {
      runningProjects: [],
      queue: [],
      lastUpdate: new Date().toISOString()
    };
  }
}

// 全局状态缓存
declare global {
  // eslint-disable-next-line no-var
  var __schedulerState: SchedulerState | undefined;
}
