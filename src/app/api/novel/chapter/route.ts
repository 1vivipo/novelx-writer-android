/**
 * 获取章节内容 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const chapter = searchParams.get('chapter');
    
    if (!projectId || !chapter) {
      return NextResponse.json(
        { success: false, error: '缺少参数' },
        { status: 400 }
      );
    }
    
    const scheduler = getScheduler();
    const chapterData = await scheduler.getChapter(projectId, parseInt(chapter));
    
    if (!chapterData) {
      return NextResponse.json(
        { success: false, error: '章节不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      chapter: {
        number: chapterData.number,
        title: chapterData.title,
        content: chapterData.content,
        wordCount: chapterData.wordCount,
        status: chapterData.status
      }
    });
    
  } catch (error) {
    console.error('获取章节失败:', error);
    return NextResponse.json(
      { success: false, error: '获取章节失败' },
      { status: 500 }
    );
  }
}
