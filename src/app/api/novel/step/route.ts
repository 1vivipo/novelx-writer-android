/**
 * 执行写作步骤 API
 * 用于手动触发或继续项目的写作流程
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, step, chapter } = body;
    
    if (!projectId) {
      return NextResponse.json(
        { error: '缺少项目ID' },
        { status: 400 }
      );
    }
    
    const scheduler = getScheduler();
    const project = await scheduler.getProject(projectId);
    
    if (!project) {
      return NextResponse.json(
        { error: '项目不存在' },
        { status: 404 }
      );
    }
    
    // 根据步骤执行
    let message = '';
    let nextStep = '';
    let preview = '';
    
    switch (step) {
      case 'worldview':
        // 生成世界观
        const worldview = await scheduler.agents.worldviewArchitect.generate(project.prompt);
        project.settings.worldview = scheduler.agents.worldviewArchitect.formatOutput(worldview);
        await scheduler.saveProjectData(project);
        message = '世界观生成完成';
        nextStep = 'outline';
        preview = project.settings.worldview.substring(0, 500);
        break;
        
      case 'outline':
        // 生成大纲
        const outline = await scheduler.agents.outlineArchitect.generate(
          project.prompt, 
          project.settings.worldview, 
          project.totalChapters
        );
        project.settings.outline = scheduler.agents.outlineArchitect.formatOutput(outline);
        await scheduler.saveProjectData(project);
        message = '大纲生成完成';
        nextStep = 'characters';
        preview = project.settings.outline.substring(0, 500);
        break;
        
      case 'characters':
        // 生成人物
        const characters = await scheduler.agents.characterDesigner.generate(
          project.prompt,
          project.settings.worldview,
          project.settings.outline,
          project.totalChapters
        );
        project.settings.characters = scheduler.agents.characterDesigner.formatOutput(characters);
        await scheduler.saveProjectData(project);
        message = '人物设定完成';
        nextStep = 'plot';
        preview = project.settings.characters.substring(0, 500);
        break;
        
      case 'plot':
        // 生成情节
        const plot = await scheduler.agents.plotDesigner.generate(
          project.prompt,
          project.settings.worldview,
          project.settings.outline,
          project.settings.characters,
          project.totalChapters
        );
        project.settings.plotDesign = scheduler.agents.plotDesigner.formatOutput(plot);
        await scheduler.saveProjectData(project);
        message = '情节设计完成';
        nextStep = 'chapter_outline';
        preview = project.settings.plotDesign.substring(0, 500);
        break;
        
      case 'chapter_outline':
        // 生成章节细纲
        const chapterOutline = await scheduler.agents.chapterPlanner.generate(
          project.prompt,
          project.settings.worldview,
          project.settings.outline,
          project.settings.characters,
          project.settings.plotDesign,
          project.totalChapters
        );
        project.settings.chapterOutline = scheduler.agents.chapterPlanner.formatOutput(chapterOutline);
        project.title = extractTitle(outline) || `小说_${project.id}`;
        project.status = 'writing';
        await scheduler.saveProjectData(project);
        message = '章节细纲完成，可以开始写作';
        nextStep = 'write_chapter';
        preview = project.settings.chapterOutline.substring(0, 500);
        break;
        
      case 'write_chapter':
        // 写作章节
        const chapterNum = chapter || project.currentChapter + 1;
        if (chapterNum > project.totalChapters) {
          project.status = 'completed';
          await scheduler.saveProjectData(project);
          return NextResponse.json({
            success: true,
            message: '所有章节已完成',
            project
          });
        }
        
        // 这里需要调用实际的写作逻辑
        // 简化版本：直接调用调度器的内部方法
        message = `开始写作第 ${chapterNum} 章`;
        nextStep = 'write_chapter';
        break;
        
      default:
        return NextResponse.json(
          { error: '未知步骤' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message,
      nextStep,
      preview,
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        currentChapter: project.currentChapter,
        totalChapters: project.totalChapters
      }
    });
    
  } catch (error) {
    console.error('执行步骤失败:', error);
    return NextResponse.json(
      { error: `执行失败: ${error}` },
      { status: 500 }
    );
  }
}

function extractTitle(outline: any): string | null {
  if (!outline) return null;
  const text = typeof outline === 'string' ? outline : outline.fullOutline || '';
  const match = text.match(/(?:书名|标题|作品名)[：:]\s*(.+)/);
  return match ? match[1].trim() : null;
}
