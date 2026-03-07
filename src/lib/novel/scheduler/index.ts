/**
 * 任务调度系统 - Supabase 版
 * 所有数据存储在 Supabase 云端数据库
 */

import { NovelProject, Chapter } from '../types';
import { 
  createAgentTeam, 
  AgentTeam,
  OutlineOutput
} from '../agents';
import {
  saveProject,
  loadProject,
  loadAllProjects,
  saveSettings,
  loadSettings,
  saveChapter,
  loadChapter,
  loadChapters,
  saveSchedulerState,
  loadSchedulerState
} from '../utils/supabase-store';

// 最大并发项目数
const MAX_CONCURRENT = 3;

// 用户邮箱
let USER_EMAIL = '';

export function setUserEmail(email: string): void {
  USER_EMAIL = email;
}

export function getUserEmail(): string {
  return USER_EMAIL;
}

interface SchedulerState {
  runningProjects: string[];
  queue: string[];
  lastUpdate: string;
  userEmail?: string;
}

let schedulerInstance: NovelScheduler | null = null;

export class NovelScheduler {
  private agents: AgentTeam;
  private state: SchedulerState;
  private projectCache: Map<string, NovelProject> = new Map();
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.agents = createAgentTeam();
    this.state = {
      runningProjects: [],
      queue: [],
      lastUpdate: new Date().toISOString()
    };
    this.init();
  }

  private async init() {
    const savedState = await loadSchedulerState();
    if (savedState) {
      this.state = savedState;
      if (savedState.userEmail) {
        USER_EMAIL = savedState.userEmail;
      }
    }
  }

  static getInstance(): NovelScheduler {
    if (!schedulerInstance) {
      schedulerInstance = new NovelScheduler();
    }
    return schedulerInstance;
  }

  private async saveState(): Promise<void> {
    this.state.lastUpdate = new Date().toISOString();
    this.state.userEmail = USER_EMAIL;
    await saveSchedulerState(this.state);
  }

  async createProject(prompt: string, totalChapters: number): Promise<NovelProject> {
    const projectId = this.generateProjectId();
    
    const project: NovelProject = {
      id: projectId,
      title: '',
      prompt,
      totalChapters,
      currentChapter: 0,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        worldview: '',
        characters: '',
        outline: '',
        plotDesign: '',
        chapterOutline: '',
        writingRules: ''
      },
      chapters: []
    };
    
    // 保存到 Supabase
    await saveProject(project);
    this.projectCache.set(projectId, project);
    
    // 加入队列
    this.state.queue.push(projectId);
    await this.saveState();
    
    console.log(`[调度器] 创建项目 ${projectId}`);
    
    // 启动调度
    this.start();
    
    return project;
  }

  private generateProjectId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `novel_${timestamp}_${random}`;
  }

  async saveProjectData(project: NovelProject): Promise<void> {
    project.updatedAt = new Date();
    await saveProject(project);
    this.projectCache.set(project.id, project);
  }

  async loadProjectData(projectId: string): Promise<NovelProject | null> {
    if (this.projectCache.has(projectId)) {
      return this.projectCache.get(projectId)!;
    }
    
    const project = await loadProject(projectId);
    if (project) {
      this.projectCache.set(projectId, project);
    }
    return project;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[调度器] 启动');
    
    this.checkInterval = setInterval(() => {
      this.processQueue();
    }, 5000);
    
    this.processQueue();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
  }

  private async processQueue(): Promise<void> {
    while (this.state.runningProjects.length < MAX_CONCURRENT && this.state.queue.length > 0) {
      const projectId = this.state.queue.shift()!;
      this.state.runningProjects.push(projectId);
      await this.saveState();
      
      this.executeProject(projectId).catch(async error => {
        console.error(`[调度器] 项目 ${projectId} 失败:`, error);
        const project = await this.loadProjectData(projectId);
        if (project) {
          project.status = 'error';
          project.error = error.message;
          await this.saveProjectData(project);
        }
        await this.removeFromRunning(projectId);
      });
    }
    
    // 恢复中断的项目
    for (const projectId of this.state.runningProjects) {
      const project = await this.loadProjectData(projectId);
      if (project && (project.status === 'writing' || project.status === 'setting') && !this.isProjectActive(projectId)) {
        this.executeProject(projectId).catch(error => {
          console.error(`[调度器] 恢复项目 ${projectId} 失败:`, error);
        });
      }
    }
  }

  private activeProjects: Set<string> = new Set();
  
  private isProjectActive(projectId: string): boolean {
    return this.activeProjects.has(projectId);
  }

  private async executeProject(projectId: string): Promise<void> {
    if (this.activeProjects.has(projectId)) return;
    this.activeProjects.add(projectId);
    
    console.log(`[调度器] 执行项目 ${projectId}`);
    
    try {
      let project = await this.loadProjectData(projectId);
      if (!project) throw new Error('项目不存在');
      
      // 阶段1：生成设定
      if (project.status === 'pending') {
        project.status = 'setting';
        await this.saveProjectData(project);
        await this.generateSettings(project);
        project = await this.loadProjectData(projectId) || project;
      }
      
      // 阶段2：写作章节
      if (project.status === 'setting' || project.status === 'writing') {
        project.status = 'writing';
        await this.saveProjectData(project);
        await this.writeChapters(project);
        project = await this.loadProjectData(projectId) || project;
      }
      
      // 完成
      if (project.currentChapter >= project.totalChapters) {
        project.status = 'completed';
        await this.saveProjectData(project);
        console.log(`[调度器] 项目 ${projectId} 完成`);
      }
      
    } finally {
      this.activeProjects.delete(projectId);
      await this.removeFromRunning(projectId);
    }
  }

  private async removeFromRunning(projectId: string): Promise<void> {
    const index = this.state.runningProjects.indexOf(projectId);
    if (index > -1) {
      this.state.runningProjects.splice(index, 1);
      await this.saveState();
    }
  }

  private async generateSettings(project: NovelProject): Promise<void> {
    console.log(`[调度器] 开始生成设定: ${project.id}`);
    
    // 1. 世界观
    console.log('[智能体] 世界观师开始工作...');
    const worldview = await this.agents.worldviewArchitect.generate(project.prompt);
    project.settings.worldview = this.agents.worldviewArchitect.formatOutput(worldview);
    
    // 2. 故事大纲
    console.log('[智能体] 大纲架构师开始工作...');
    const outline = await this.agents.outlineArchitect.generate(project.prompt, worldview, project.totalChapters);
    project.settings.outline = this.agents.outlineArchitect.formatOutput(outline);
    
    // 3. 人物设定
    console.log('[智能体] 人物设计师开始工作...');
    const characters = await this.agents.characterDesigner.generate(project.prompt, worldview, outline, project.totalChapters);
    project.settings.characters = this.agents.characterDesigner.formatOutput(characters);
    
    // 4. 情节设计
    console.log('[智能体] 情节设计师开始工作...');
    const plotDesign = await this.agents.plotDesigner.generate(project.prompt, worldview, outline, characters, project.totalChapters);
    project.settings.plotDesign = this.agents.plotDesigner.formatOutput(plotDesign);
    
    // 5. 章节细纲
    console.log('[智能体] 章纲规划师开始工作...');
    const chapterOutline = await this.agents.chapterPlanner.generate(project.prompt, worldview, outline, characters, plotDesign, project.totalChapters);
    project.settings.chapterOutline = this.agents.chapterPlanner.formatOutput(chapterOutline);
    
    // 6. 写作规范
    project.settings.writingRules = this.generateWritingRules();
    
    // 提取标题
    project.title = this.extractTitle(outline) || `小说_${project.id}`;
    
    // 保存设定到 Supabase
    await saveSettings(project.id, project.settings);
    await this.saveProjectData(project);
    
    console.log(`[调度器] 设定生成完成: ${project.id}`);
  }

  private generateWritingRules(): string {
    return `
【写作规范】
一、文风要求 - 参考鲁迅先生：语言精炼，白描手法，讽刺幽默
二、情节要求 - 参考冰临神下：环环相扣，反转自然，节奏张弛有度
三、人物要求 - 参考《六爻》：性格鲜明，感情线自然，单男主单女主
四、去AI味要求：避免AI常用词汇，对话口语化，加入生活化细节
五、字数要求：每章2000-4000字
`;
  }

  private extractTitle(outline: OutlineOutput): string | null {
    const match = outline.fullOutline.match(/(?:书名|标题|作品名)[：:]\s*(.+)/);
    return match ? match[1].trim() : null;
  }

  private async writeChapters(project: NovelProject): Promise<void> {
    const chapterOutlines = await this.parseChapterOutlines(project.settings.chapterOutline);
    
    while (project.currentChapter < project.totalChapters) {
      const chapterNum = project.currentChapter + 1;
      console.log(`[调度器] 写作第 ${chapterNum} 章`);
      
      try {
        const chapter = await this.writeSingleChapter(project, chapterNum, chapterOutlines);
        
        // 保存章节到 Supabase
        await saveChapter(project.id, chapter);
        
        project.chapters.push(chapter);
        project.currentChapter = chapterNum;
        await this.saveProjectData(project);
        
        console.log(`[调度器] 第 ${chapterNum} 章完成，字数：${chapter.wordCount}`);
        
      } catch (error) {
        console.error(`[调度器] 第 ${chapterNum} 章失败:`, error);
        
        const errorChapter: Chapter = {
          number: chapterNum,
          title: `第${chapterNum}章`,
          content: '',
          status: 'error',
          wordCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          retryCount: 3,
          reviewNotes: `失败: ${error}`
        };
        
        await saveChapter(project.id, errorChapter);
        project.chapters.push(errorChapter);
        project.currentChapter = chapterNum;
        await this.saveProjectData(project);
      }
    }
  }

  private async parseChapterOutlines(outlineText: string): Promise<Map<number, any>> {
    const outlines = new Map();
    if (!outlineText) return outlines;
    
    const lines = outlineText.split('\n');
    let currentChapter = 0;
    let currentData: any = {};
    
    for (const line of lines) {
      const chapterMatch = line.match(/第(\d+)章\s+(.+)/);
      if (chapterMatch) {
        if (currentChapter > 0) outlines.set(currentChapter, currentData);
        currentChapter = parseInt(chapterMatch[1]);
        currentData = { title: chapterMatch[2].trim() };
      } else if (line.includes('概要')) {
        currentData.summary = line.replace(/【概要】/, '').trim();
      } else if (line.includes('关键事件')) {
        currentData.keyEvents = line.replace(/【关键事件】/, '').trim().split('、');
      }
    }
    if (currentChapter > 0) outlines.set(currentChapter, currentData);
    return outlines;
  }

  private async writeSingleChapter(
    project: NovelProject,
    chapterNum: number,
    chapterOutlines: Map<number, any>
  ): Promise<Chapter> {
    const outline = chapterOutlines.get(chapterNum) || {
      title: `第${chapterNum}章`,
      summary: '根据故事发展继续写作',
      keyEvents: [],
      characters: [],
      location: '',
      mood: '正常',
      wordCount: 3000
    };
    
    const previousSummaries = project.chapters.slice(-3).map(ch => 
      `第${ch.number}章：${ch.title}\n${ch.content?.substring(0, 300) || ''}...`
    );
    const previousContent = project.chapters.length > 0 
      ? project.chapters[project.chapters.length - 1].content 
      : '';
    
    // 写作
    console.log(`[智能体] 正文撰写师开始写作第 ${chapterNum} 章...`);
    const written = await this.agents.chapterWriter.write(
      project.settings,
      { chapter: chapterNum, ...outline },
      chapterNum,
      previousSummaries,
      previousContent
    );
    
    // 润色
    console.log(`[智能体] 文风润色师开始润色第 ${chapterNum} 章...`);
    const polished = await this.agents.stylePolisher.polish(
      written.content, chapterNum, written.title, project.settings.characters
    );
    
    return {
      number: chapterNum,
      title: written.title,
      content: polished.content,
      status: 'completed',
      wordCount: polished.wordCount,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0
    };
  }

  async getAllProjects(): Promise<NovelProject[]> {
    return await loadAllProjects();
  }

  async getProject(projectId: string): Promise<NovelProject | null> {
    return await this.loadProjectData(projectId);
  }

  async getChapter(projectId: string, chapterNum: number): Promise<Chapter | null> {
    return await loadChapter(projectId, chapterNum);
  }

  getSchedulerStatus(): SchedulerState {
    return { ...this.state, userEmail: USER_EMAIL };
  }
}

export function getScheduler(): NovelScheduler {
  return NovelScheduler.getInstance();
}
