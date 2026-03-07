/**
 * 获取项目详情 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json(
        { success: false, error: '缺少项目ID' },
        { status: 400 }
      );
    }
    
    const scheduler = getScheduler();
    const project = await scheduler.getProject(projectId);
    
    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        prompt: project.prompt,
        totalChapters: project.totalChapters,
        currentChapter: project.currentChapter,
        status: project.status,
        error: project.error,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        settings: project.settings,
        chapters: project.chapters.map(ch => ({
          number: ch.number,
          title: ch.title,
          status: ch.status,
          wordCount: ch.wordCount,
          createdAt: ch.createdAt.toISOString()
        }))
      }
    });
    
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取项目详情失败' },
      { status: 500 }
    );
  }
}
