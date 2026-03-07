/**
 * 执行项目 API
 * 用于手动触发项目执行
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId } = body;
    
    if (!projectId) {
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
    }
    
    const scheduler = getScheduler();
    const project = await scheduler.getProject(projectId);
    
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }
    
    const agents = scheduler.agents;
    let message = '';
    let nextAction = 'continue';
    
    // 根据当前状态执行下一步
    if (project.status === 'pending') {
      project.status = 'setting';
      await scheduler.saveProjectData(project);
      message = '项目已启动';
    }
    else if (project.status === 'setting') {
      if (!project.settings.worldview) {
        const worldview = await agents.worldviewArchitect.generate(project.prompt);
        project.settings.worldview = agents.worldviewArchitect.formatOutput(worldview);
        message = '世界观生成完成';
      } else if (!project.settings.outline) {
        const outline = await agents.outlineArchitect.generate(project.prompt, project.settings.worldview, project.totalChapters);
        project.settings.outline = agents.outlineArchitect.formatOutput(outline);
        message = '大纲生成完成';
      } else if (!project.settings.characters) {
        const characters = await agents.characterDesigner.generate(project.prompt, project.settings.worldview, project.settings.outline, project.totalChapters);
        project.settings.characters = agents.characterDesigner.formatOutput(characters);
        message = '人物设定完成';
      } else if (!project.settings.plotDesign) {
        const plot = await agents.plotDesigner.generate(project.prompt, project.settings.worldview, project.settings.outline, project.settings.characters, project.totalChapters);
        project.settings.plotDesign = agents.plotDesigner.formatOutput(plot);
        message = '情节设计完成';
      } else if (!project.settings.chapterOutline) {
        const chapterOutline = await agents.chapterPlanner.generate(project.prompt, project.settings.worldview, project.settings.outline, project.settings.characters, project.settings.plotDesign, project.totalChapters);
        project.settings.chapterOutline = agents.chapterPlanner.formatOutput(chapterOutline);
        const titleMatch = project.settings.outline.match(/(?:书名|标题|作品名)[：:]\s*(.+)/);
        project.title = titleMatch ? titleMatch[1].trim() : `小说_${project.id}`;
        project.status = 'writing';
        message = '设定完成，开始写作';
        nextAction = 'write';
      }
      await scheduler.saveProjectData(project);
    }
    else if (project.status === 'writing') {
      if (project.currentChapter >= project.totalChapters) {
        project.status = 'completed';
        await scheduler.saveProjectData(project);
        message = '小说已完成！';
        nextAction = 'none';
      } else {
        const chapterNum = project.currentChapter + 1;
        const chapterOutlines = parseChapterOutlines(project.settings.chapterOutline);
        const outline = chapterOutlines.get(chapterNum) || { title: `第${chapterNum}章`, summary: '' };
        
        const previousSummaries = project.chapters.slice(-3).map((ch: any) => `第${ch.number}章：${ch.title}`);
        const previousContent = project.chapters.length > 0 ? project.chapters[project.chapters.length - 1].content : '';
        
        const written = await agents.chapterWriter.write(project.settings, { chapter: chapterNum, ...outline }, chapterNum, previousSummaries, previousContent);
        const polished = await agents.stylePolisher.polish(written.content, chapterNum, written.title, project.settings.characters);
        
        project.chapters.push({ number: chapterNum, title: written.title, content: polished.content, status: 'completed', wordCount: polished.wordCount, createdAt: new Date() });
        project.currentChapter = chapterNum;
        
        if (project.currentChapter >= project.totalChapters) project.status = 'completed';
        await scheduler.saveProjectData(project);
        
        message = `第 ${chapterNum} 章完成，${polished.wordCount} 字`;
        nextAction = project.status === 'completed' ? 'none' : 'write';
      }
    }
    else if (project.status === 'completed') {
      message = '小说已完成！';
      nextAction = 'none';
    }
    else if (project.status === 'error') {
      project.status = 'pending';
      project.error = null;
      await scheduler.saveProjectData(project);
      message = '正在重试...';
    }
    
    return NextResponse.json({
      success: true,
      message,
      status: project.status,
      currentChapter: project.currentChapter,
      totalChapters: project.totalChapters,
      nextAction
    });
    
  } catch (error: any) {
    console.error('执行失败:', error);
    return NextResponse.json({ error: `执行失败: ${error.message}` }, { status: 500 });
  }
}

function parseChapterOutlines(outlineText: string): Map<number, any> {
  const outlines = new Map();
  if (!outlineText) return outlines;
  const lines = outlineText.split('\n');
  let currentChapter = 0;
  let currentData: any = {};
  for (const line of lines) {
    const match = line.match(/第(\d+)章\s+(.+)/);
    if (match) {
      if (currentChapter > 0) outlines.set(currentChapter, currentData);
      currentChapter = parseInt(match[1]);
      currentData = { title: match[2].trim() };
    }
  }
  if (currentChapter > 0) outlines.set(currentChapter, currentData);
  return outlines;
}
