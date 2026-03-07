/**
 * 数据库备份服务
 * 负责将小说数据备份到数据库
 */

import { db } from '@/lib/db';

// 保存项目到数据库
export async function saveProjectToDB(project: {
  id: string;
  title: string;
  prompt: string;
  totalChapters: number;
  currentChapter: number;
  status: string;
  error?: string;
}): Promise<void> {
  try {
    await db.novelProject.upsert({
      where: { id: project.id },
      update: {
        title: project.title,
        currentChapter: project.currentChapter,
        status: project.status,
        error: project.error || null,
        updatedAt: new Date()
      },
      create: {
        id: project.id,
        title: project.title,
        prompt: project.prompt,
        totalChapters: project.totalChapters,
        currentChapter: project.currentChapter,
        status: project.status,
        error: project.error || null
      }
    });
    console.log(`[数据库备份] 项目 ${project.id} 已保存`);
  } catch (error) {
    console.error(`[数据库备份] 保存项目失败:`, error);
  }
}

// 保存设定到数据库
export async function saveSettingsToDB(projectId: string, settings: {
  worldview: string;
  characters: string;
  outline: string;
  plotDesign: string;
  chapterOutline: string;
  writingRules: string;
}): Promise<void> {
  try {
    await db.novelSetting.upsert({
      where: { projectId },
      update: {
        worldview: settings.worldview,
        characters: settings.characters,
        outline: settings.outline,
        plotDesign: settings.plotDesign,
        chapterOutline: settings.chapterOutline,
        writingRules: settings.writingRules,
        updatedAt: new Date()
      },
      create: {
        projectId,
        worldview: settings.worldview,
        characters: settings.characters,
        outline: settings.outline,
        plotDesign: settings.plotDesign,
        chapterOutline: settings.chapterOutline,
        writingRules: settings.writingRules
      }
    });
    console.log(`[数据库备份] 项目 ${projectId} 设定已保存`);
  } catch (error) {
    console.error(`[数据库备份] 保存设定失败:`, error);
  }
}

// 保存章节到数据库
export async function saveChapterToDB(projectId: string, chapter: {
  number: number;
  title: string;
  content: string;
  status: string;
  wordCount: number;
  retryCount: number;
  reviewNotes?: string;
}): Promise<void> {
  try {
    await db.chapter.upsert({
      where: {
        projectId_number: {
          projectId,
          number: chapter.number
        }
      },
      update: {
        title: chapter.title,
        content: chapter.content,
        status: chapter.status,
        wordCount: chapter.wordCount,
        retryCount: chapter.retryCount,
        reviewNotes: chapter.reviewNotes || null,
        updatedAt: new Date()
      },
      create: {
        projectId,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content,
        status: chapter.status,
        wordCount: chapter.wordCount,
        retryCount: chapter.retryCount,
        reviewNotes: chapter.reviewNotes || null
      }
    });
    console.log(`[数据库备份] 章节 ${chapter.number} 已保存`);
  } catch (error) {
    console.error(`[数据库备份] 保存章节失败:`, error);
  }
}

// 记录邮件发送
export async function logEmailSent(projectId: string, chapterNum: number, email: string, status: string, error?: string): Promise<void> {
  try {
    await db.emailLog.create({
      data: {
        projectId,
        chapterNum,
        email,
        status,
        error
      }
    });
  } catch (err) {
    console.error(`[数据库备份] 记录邮件日志失败:`, err);
  }
}

// 从数据库加载项目
export async function loadProjectFromDB(projectId: string) {
  try {
    const project = await db.novelProject.findUnique({
      where: { id: projectId },
      include: {
        settings: true,
        chapters: {
          orderBy: { number: 'asc' }
        }
      }
    });
    return project;
  } catch (error) {
    console.error(`[数据库备份] 加载项目失败:`, error);
    return null;
  }
}

// 获取所有项目
export async function getAllProjectsFromDB() {
  try {
    const projects = await db.novelProject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { chapters: true }
        }
      }
    });
    return projects;
  } catch (error) {
    console.error(`[数据库备份] 获取项目列表失败:`, error);
    return [];
  }
}

// 获取项目统计
export async function getProjectStats(projectId: string) {
  try {
    const stats = await db.chapter.aggregate({
      where: { projectId },
      _sum: { wordCount: true },
      _count: { _all: true }
    });
    return {
      totalChapters: stats._count._all,
      totalWords: stats._sum.wordCount || 0
    };
  } catch (error) {
    console.error(`[数据库备份] 获取统计失败:`, error);
    return { totalChapters: 0, totalWords: 0 };
  }
}
