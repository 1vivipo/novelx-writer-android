/**
 * 智能体6：正文撰写师
 * 负责根据设定和章纲撰写正文内容
 * 优化版：支持长章节输出，减少 token 消耗
 */

import ZAI from 'z-ai-web-dev-sdk';
import { NovelSettings } from '../types';
import { ChapterOutline } from './chapter-planner';

export interface WritingOutput {
  title: string;
  content: string;
  wordCount: number;
}

export class ChapterWriter {
  private agentName = '正文撰写师';
  private agentDescription = '专注于撰写高质量的小说正文';

  async write(
    settings: NovelSettings,
    chapterOutline: ChapterOutline,
    chapterNum: number,
    previousChapters: string[],
    previousContent: string
  ): Promise<WritingOutput> {
    console.log(`[${this.agentName}] 开始撰写第 ${chapterNum} 章...`);
    
    const zai = await ZAI.create();
    
    // 精简的系统提示词
    const systemPrompt = `你是资深小说作家，文风类似鲁迅：语言精炼、白描手法、讽刺幽默。

【写作原则】
1. 严格按照章节细纲写作
2. 保持人物性格一致
3. 避免AI味，不用"仿佛"、"似乎"、"那一刻"等词
4. 对话口语化，符合人物身份
5. 每章8000-12000字`;

    // 精简的用户提示词，减少 token 消耗
    const userPrompt = `写第 ${chapterNum} 章

【本章信息】
标题：${chapterOutline.title}
概要：${chapterOutline.summary || '按故事发展'}
关键事件：${(chapterOutline.keyEvents || []).join('、')}

【人物】
${settings.characters.substring(0, 800)}

【前文】
${previousContent ? previousContent.substring(previousContent.length - 1500) : '（第一章）'}

【要求】
1. 字数：10000字左右
2. 标题：${chapterOutline.title}
3. 直接输出正文，不要标题行`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 16000  // 增加到 16000，支持约 10000 字输出
      });

      const content = completion.choices[0]?.message?.content || '';
      
      // 清理内容
      const cleanContent = this.cleanContent(content);
      
      console.log(`[${this.agentName}] 第 ${chapterNum} 章完成，字数：${cleanContent.length}`);
      
      return {
        title: chapterOutline.title,
        content: cleanContent,
        wordCount: cleanContent.length
      };
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      throw error;
    }
  }

  private cleanContent(content: string): string {
    return content
      .replace(/作为AI[，,。]/g, '')
      .replace(/我注意到/g, '')
      .replace(/总的来说[，,。]/g, '')
      .replace(/总而言之[，,。]/g, '')
      .replace(/综上所述[，,。]/g, '')
      .replace(/希望这/g, '')
      .replace(/^【标题】.+\n?/gm, '')
      .replace(/^【正文】\n?/gm, '')
      .trim();
  }
}
