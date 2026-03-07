/**
 * 章节规划师 - 优化版
 */
import ZAI from 'z-ai-web-dev-sdk';

export interface ChapterOutline {
  chapter: number;
  title: string;
  summary: string;
  keyEvents?: string[];
  wordCount?: number;
}

export interface ChapterOutlineOutput {
  outlines: ChapterOutline[];
}

export class ChapterPlanner {
  async generate(prompt: string, worldview: string, outline: string, characters: string, plotDesign: string, totalChapters: number): Promise<ChapterOutlineOutput> {
    const zai = await ZAI.create();
    
    const systemPrompt = `你是章节规划师。为每章创建细纲：
- 标题
- 概要（50字内）
- 关键事件（2-3个）

格式：
第1章 标题
概要：xxx
关键事件：xxx、xxx`;

    const userPrompt = `为 ${totalChapters} 章小说创建章节细纲：
大纲：${outline.substring(0, 800)}
人物：${characters.substring(0, 400)}
情节：${plotDesign.substring(0, 400)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 15000
    });

    const content = completion.choices[0]?.message?.content || '';
    const outlines = this.parseOutlines(content, totalChapters);
    
    return { outlines };
  }

  private parseOutlines(content: string, totalChapters: number): ChapterOutline[] {
    const outlines: ChapterOutline[] = [];
    const lines = content.split('\n');
    let currentChapter = 0;
    let currentData: Partial<ChapterOutline> = {};

    for (const line of lines) {
      const match = line.match(/第(\d+)章\s+(.+)/);
      if (match) {
        if (currentChapter > 0) {
          outlines.push({
            chapter: currentChapter,
            title: currentData.title || '',
            summary: currentData.summary || '',
            keyEvents: currentData.keyEvents,
            wordCount: 10000
          });
        }
        currentChapter = parseInt(match[1]);
        currentData = { title: match[2].trim() };
      } else if (line.includes('概要')) {
        currentData.summary = line.replace(/概要[：:]/, '').trim();
      } else if (line.includes('关键事件')) {
        currentData.keyEvents = line.replace(/关键事件[：:]/, '').trim().split(/[、,，]/);
      }
    }

    if (currentChapter > 0) {
      outlines.push({
        chapter: currentChapter,
        title: currentData.title || '',
        summary: currentData.summary || '',
        keyEvents: currentData.keyEvents,
        wordCount: 10000
      });
    }

    // 确保有足够的章节
    while (outlines.length < totalChapters) {
      outlines.push({
        chapter: outlines.length + 1,
        title: `第${outlines.length + 1}章`,
        summary: '按故事发展',
        wordCount: 10000
      });
    }

    return outlines.slice(0, totalChapters);
  }

  formatOutput(output: ChapterOutlineOutput): string {
    return output.outlines.map(o => 
      `第${o.chapter}章 ${o.title}\n概要：${o.summary}\n关键事件：${(o.keyEvents || []).join('、')}`
    ).join('\n\n');
  }
}
