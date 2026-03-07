/**
 * 自动执行 API - 一次性执行多个步骤直到完成或超时
 * Vercel Serverless 有执行时间限制，所以我们会尽可能多执行
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export const maxDuration = 300; // 5分钟超时

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const MAX_TIME = 280000; // 4分40秒，留出缓冲
  
  try {
    const body = await request.json();
    const { projectId, action } = body; // action: 'start' | 'stop' | 'status'
    
    const scheduler = getScheduler();
    
    if (action === 'stop') {
      // 停止执行 - 设置停止标志
      const project = await scheduler.getProject(projectId);
      if (project) {
        project.status = 'paused';
        await scheduler.saveProjectData(project);
      }
      return NextResponse.json({ success: true, message: '已暂停' });
    }
    
    if (action === 'status') {
      const project = await scheduler.getProject(projectId);
      return NextResponse.json({
        success: true,
        status: project?.status,
        currentChapter: project?.currentChapter,
        totalChapters: project?.totalChapters
      });
    }
    
    // 开始自动执行
    const project = await scheduler.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }
    
    const logs: string[] = [];
    const agents = scheduler.agents;
    
    // 执行函数
    async function runStep(stepName: string, stepFn: () => Promise<void>) {
      if (Date.now() - startTime > MAX_TIME) {
        logs.push('⏰ 时间限制，暂停执行');
        return false;
      }
      logs.push(`📝 ${stepName}...`);
      await stepFn();
      logs.push(`✅ ${stepName}完成`);
      return true;
    }
    
    // 根据状态执行
    if (project.status === 'pending' || project.status === 'paused') {
      project.status = 'setting';
      await scheduler.saveProjectData(project);
    }
    
    if (project.status === 'setting') {
      // 生成设定
      if (!project.settings.worldview) {
        if (!await runStep('生成世界观', async () => {
          const result = await agents.worldviewArchitect.generate(project.prompt);
          project.settings.worldview = agents.worldviewArchitect.formatOutput(result);
          await scheduler.saveProjectData(project);
        })) return NextResponse.json({ success: true, logs, message: '时间限制，请继续' });
      }
      
      if (!project.settings.outline) {
        if (!await runStep('生成大纲', async () => {
          const result = await agents.outlineArchitect.generate(project.prompt, project.settings.worldview, project.totalChapters);
          project.settings.outline = agents.outlineArchitect.formatOutput(result);
          await scheduler.saveProjectData(project);
        })) return NextResponse.json({ success: true, logs, message: '时间限制，请继续' });
      }
      
      if (!project.settings.characters) {
        if (!await runStep('生成人物', async () => {
          const result = await agents.characterDesigner.generate(project.prompt, project.settings.worldview, project.settings.outline, project.totalChapters);
          project.settings.characters = agents.characterDesigner.formatOutput(result);
          await scheduler.saveProjectData(project);
        })) return NextResponse.json({ success: true, logs, message: '时间限制，请继续' });
      }
      
      if (!project.settings.plotDesign) {
        if (!await runStep('生成情节', async () => {
          const result = await agents.plotDesigner.generate(project.prompt, project.settings.worldview, project.settings.outline, project.settings.characters, project.totalChapters);
          project.settings.plotDesign = agents.plotDesigner.formatOutput(result);
          await scheduler.saveProjectData(project);
        })) return NextResponse.json({ success: true, logs, message: '时间限制，请继续' });
      }
      
      if (!project.settings.chapterOutline) {
        if (!await runStep('生成章节细纲', async () => {
          const result = await agents.chapterPlanner.generate(project.prompt, project.settings.worldview, project.settings.outline, project.settings.characters, project.settings.plotDesign, project.totalChapters);
          project.settings.chapterOutline = agents.chapterPlanner.formatOutput(result);
          // 提取标题
          const titleMatch = project.settings.outline.match(/(?:书名|标题|作品名)[：:]\s*(.+)/);
          project.title = titleMatch ? titleMatch[1].trim() : `小说_${project.id}`;
          project.status = 'writing';
          await scheduler.saveProjectData(project);
        })) return NextResponse.json({ success: true, logs, message: '时间限制，请继续' });
      }
    }
    
    if (project.status === 'writing') {
      // 写作章节
      while (project.currentChapter < project.totalChapters) {
        if (Date.now() - startTime > MAX_TIME) {
          logs.push('⏰ 时间限制，暂停执行');
          return NextResponse.json({ 
            success: true, 
            logs, 
            message: `已写${project.currentChapter}/${project.totalChapters}章，请继续`,
            needContinue: true
          });
        }
        
        const chapterNum = project.currentChapter + 1;
        logs.push(`📝 写作第 ${chapterNum} 章...`);
        
        // 解析章节大纲
        const chapterOutlines = parseChapterOutlines(project.settings.chapterOutline);
        const outline = chapterOutlines.get(chapterNum) || { title: `第${chapterNum}章`, summary: '' };
        
        // 获取前文
        const previousSummaries = project.chapters.slice(-3).map((ch: any) => `第${ch.number}章：${ch.title}`);
        const previousContent = project.chapters.length > 0 ? project.chapters[project.chapters.length - 1].content : '';
        
        // 写作
        const written = await agents.chapterWriter.write(
          project.settings,
          { chapter: chapterNum, ...outline },
          chapterNum,
          previousSummaries,
          previousContent
        );
        
        // 润色
        const polished = await agents.stylePolisher.polish(
          written.content,
          chapterNum,
          written.title,
          project.settings.characters
        );
        
        // 保存章节
        project.chapters.push({
          number: chapterNum,
          title: written.title,
          content: polished.content,
          status: 'completed',
          wordCount: polished.wordCount,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        project.currentChapter = chapterNum;
        
        // 检查是否完成
        if (project.currentChapter >= project.totalChapters) {
          project.status = 'completed';
        }
        
        await scheduler.saveProjectData(project);
        logs.push(`✅ 第 ${chapterNum} 章完成，${polished.wordCount} 字`);
      }
    }
    
    if (project.status === 'completed') {
      logs.push('🎉 小说创作完成！');
    }
    
    return NextResponse.json({
      success: true,
      logs,
      status: project.status,
      currentChapter: project.currentChapter,
      totalChapters: project.totalChapters,
      title: project.title,
      needContinue: project.status !== 'completed'
    });
    
  } catch (error: any) {
    console.error('自动执行失败:', error);
    return NextResponse.json({ error: error.message, logs: [`❌ 错误: ${error.message}`] }, { status: 500 });
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
    } else if (line.includes('概要')) {
      currentData.summary = line.replace(/【概要】/, '').trim();
    }
  }
  if (currentChapter > 0) outlines.set(currentChapter, currentData);
  return outlines;
}
