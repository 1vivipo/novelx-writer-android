/**
 * 智能体5：章纲规划师
 * 负责将整体大纲细化为每一章的详细规划
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { WorldviewOutput } from './worldview-architect';
import { OutlineOutput } from './outline-architect';
import { CharacterOutput } from './character-designer';
import { PlotDesignOutput } from './plot-designer';

export interface ChapterOutline {
  chapter: number;
  title: string;
  summary: string;
  keyEvents: string[];
  characters: string[];
  location: string;
  mood: string;
  wordCount: number;
  cliffhanger?: string;
}

export interface ChapterOutlineOutput {
  outlines: ChapterOutline[];
  fullOutline: string;
}

export class ChapterPlanner {
  private agentName = '章纲规划师';
  private agentDescription = '专注于将故事大纲细化为每一章的详细规划';

  async generate(
    prompt: string,
    worldview: WorldviewOutput,
    outline: OutlineOutput,
    characters: CharacterOutput,
    plotDesign: PlotDesignOutput,
    totalChapters: number
  ): Promise<ChapterOutlineOutput> {
    console.log(`[${this.agentName}] 开始规划章节细纲...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 将故事大纲细化为每一章的详细规划
2. 每章要有明确的目标和内容
3. 确保章节之间的连贯性
4. 合理分配情节和节奏

【规划原则】
- 每章2000-4000字为宜
- 每章要有明确的小目标
- 章节之间要有钩子连接
- 重要情节要分散到多章
- 留出足够的铺垫和过渡
- 高潮部分可以多章展开

输出格式要求（JSON）：
{
  "outlines": [
    {
      "chapter": 章节号,
      "title": "章节标题",
      "summary": "章节概要（100-200字）",
      "keyEvents": ["关键事件1", "关键事件2"],
      "characters": ["出场人物"],
      "location": "主要场景",
      "mood": "章节基调",
      "wordCount": 预计字数,
      "cliffhanger": "章节结尾钩子（可选）"
    }
  ],
  "fullOutline": "完整的章节细纲文本"
}`;

    const userPrompt = `请根据以下信息规划章节细纲：

【用户提示词】
${prompt}

【世界观】
世界名称：${worldview.worldName}
力量体系：${worldview.powerSystem}

【故事大纲】
主题：${outline.mainTheme}
核心冲突：${outline.coreConflict}
主线剧情：${outline.mainPlot}
转折点：${outline.turningPoints}

【人物设定】
男主：${characters.protagonist.substring(0, 300)}
女主：${characters.heroine.substring(0, 300)}

【情节设计】
关键场景：${plotDesign.keyScenes.substring(0, 500)}
伏笔设计：${plotDesign.foreshadowing.substring(0, 500)}

【章节数量】
共 ${totalChapters} 章

【要求】
1. 为每一章规划详细内容
2. 确保章节之间的连贯性
3. 合理分配情节和节奏
4. 重要转折点要预留铺垫
5. 感情线要自然发展
6. 每章要有明确的小目标

请输出JSON格式的章节细纲，包含全部 ${totalChapters} 章。`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 20000
      });

      const content = completion.choices[0]?.message?.content || '';
      const result = extractJSON<ChapterOutlineOutput>(content);
      
      if (result && result.outlines && result.outlines.length > 0) {
        console.log(`[${this.agentName}] 章节细纲规划完成，共 ${result.outlines.length} 章`);
        return result;
      }
      
      // 返回默认值
      console.log(`[${this.agentName}] JSON解析失败，使用默认值`);
      return this.getDefaultOutput(prompt, totalChapters);
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      return this.getDefaultOutput(prompt, totalChapters);
    }
  }

  private getDefaultOutput(prompt: string, totalChapters: number): ChapterOutlineOutput {
    const outlines: ChapterOutline[] = [];
    for (let i = 1; i <= totalChapters; i++) {
      outlines.push({
        chapter: i,
        title: `第${i}章`,
        summary: i === 1 ? '主角获得神秘功法，踏上修仙之路' : 
                 i === totalChapters ? '最终决战，主角完成蜕变' : 
                 `第${i}章的故事发展`,
        keyEvents: ['事件1', '事件2'],
        characters: ['主角', '女主'],
        location: '修仙界',
        mood: '紧张',
        wordCount: 3000
      });
    }
    return {
      outlines,
      fullOutline: `基于"${prompt}"的章节细纲，共${totalChapters}章`
    };
  }

  formatOutput(output: ChapterOutlineOutput): string {
    const chaptersText = output.outlines.map(ch => `
第${ch.chapter}章 ${ch.title}
【概要】${ch.summary}
【关键事件】${ch.keyEvents.join('、')}
【出场人物】${ch.characters.join('、')}
【场景】${ch.location}
【基调】${ch.mood}
【预计字数】${ch.wordCount}字
${ch.cliffhanger ? `【结尾钩子】${ch.cliffhanger}` : ''}
`).join('\n');

    return `
【章节细纲】

${chaptersText}

【完整规划】
${output.fullOutline}
`.trim();
  }

  // 获取单章细纲
  getChapterOutline(output: ChapterOutlineOutput, chapterNum: number): ChapterOutline | null {
    return output.outlines.find(ch => ch.chapter === chapterNum) || null;
  }
}
