/**
 * 获取项目列表 API
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function GET() {
  try {
    const scheduler = getScheduler();
    const projects = await scheduler.getAllProjects();
    
    return NextResponse.json({
      success: true,
      projects: projects.map(p => ({
        id: p.id,
        title: p.title,
        prompt: p.prompt,
        totalChapters: p.totalChapters,
        currentChapter: p.currentChapter,
        status: p.status,
        error: p.error,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      }))
    });
    
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取项目列表失败' },
      { status: 500 }
    );
  }
}
