/**
 * 创建小说项目 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, totalChapters } = body;
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '请输入提示词' },
        { status: 400 }
      );
    }
    
    const chapters = parseInt(totalChapters) || 30;
    if (chapters < 5 || chapters > 500) {
      return NextResponse.json(
        { error: '章节数必须在5-500之间' },
        { status: 400 }
      );
    }
    
    const scheduler = getScheduler();
    const project = await scheduler.createProject(prompt, chapters);
    
    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        totalChapters: project.totalChapters,
        status: project.status,
        createdAt: project.createdAt.toISOString()
      }
    });
    
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      { error: `创建项目失败: ${error}` },
      { status: 500 }
    );
  }
}
