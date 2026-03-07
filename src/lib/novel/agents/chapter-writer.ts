/**
 * 智能体6：正文撰写师
 * 负责根据设定和章纲撰写正文内容
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
    previousChapters: string[], // 前几章的内容摘要
    previousContent: string     // 上一章的完整内容
  ): Promise<WritingOutput> {
    console.log(`[${this.agentName}] 开始撰写第 ${chapterNum} 章...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

【文风要求：鲁迅风格】
1. 语言精炼有力，不拖泥带水，每个字都有分量
2. 善用白描手法，寥寥数笔勾勒人物神态
3. 讽刺与幽默并存，在严肃中见诙谐
4. 句式多变，长短句交错，节奏感强
5. 善用反语和双关，言外之意丰富
6. 描写细腻而不繁琐，点到即止
7. 对话生动自然，符合人物身份
8. 心理描写深入，但不直白说破
9. 环境描写与人物心境交融
10. 结尾常有留白，引人深思

【写作原则】
1. 严格按照章节细纲写作
2. 保持人物性格一致
3. 保持故事连贯性
4. 避免AI味，写出人味
5. 每章2000-4000字

【去AI味要点】
- 不用"仿佛"、"似乎"、"宛如"等AI常用词
- 减少形容词堆砌，多用动词和名词
- 避免过于工整的排比句式
- 不使用"那一刻"、"这一刻"等时间标记
- 减少"心中涌起一股..."类心理描写
- 对话要口语化，符合人物身份
- 加入生活化细节`;

    const userPrompt = `请根据以下设定撰写第 ${chapterNum} 章正文：

【世界观设定】
${settings.worldview.substring(0, 1000)}

【人物设定】
${settings.characters.substring(0, 1500)}

【故事大纲】
${settings.outline.substring(0, 1000)}

【情节设计】
${settings.plotDesign.substring(0, 1000)}

【本章细纲】
第${chapterOutline.chapter}章 ${chapterOutline.title}
概要：${chapterOutline.summary || '根据故事发展写作'}
关键事件：${(chapterOutline.keyEvents || []).join('、') || '按情节发展'}
出场人物：${(chapterOutline.characters || []).join('、') || '主角等'}
场景：${chapterOutline.location || '修仙界'}
基调：${chapterOutline.mood || '正常'}
${chapterOutline.cliffhanger ? `结尾钩子：${chapterOutline.cliffhanger}` : ''}

【前文提要】
${previousChapters.length > 0 ? previousChapters.join('\n') : '（这是第一章）'}

【上一章内容】
${previousContent ? previousContent.substring(previousContent.length - 2000) : '（无）'}

【要求】
1. 严格按照本章细纲写作
2. 保持与上文连贯
3. 文风要像鲁迅先生
4. 字数要求：${chapterOutline.wordCount}字左右
5. 章节标题：${chapterOutline.title}

请直接输出章节正文，格式如下：
【标题】${chapterOutline.title}
【正文】
（正文内容...）`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.9,
        max_tokens: 8000
      });

      const content = completion.choices[0]?.message?.content || '';
      
      // 解析输出
      const titleMatch = content.match(/【标题】(.+?)(?:\n|【)/);
      const contentMatch = content.match(/【正文】\n?([\s\S]+)/);
      
      const title = titleMatch ? titleMatch[1].trim() : chapterOutline.title;
      const chapterContent = contentMatch ? contentMatch[1].trim() : content;
      
      // 清理可能的格式问题
      const cleanContent = this.cleanContent(chapterContent);
      
      console.log(`[${this.agentName}] 第 ${chapterNum} 章撰写完成，字数：${cleanContent.length}`);
      
      return {
        title,
        content: cleanContent,
        wordCount: cleanContent.length
      };
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      throw error;
    }
  }

  private cleanContent(content: string): string {
    // 移除可能的AI痕迹
    return content
      .replace(/作为AI[，,。]/g, '')
      .replace(/我注意到/g, '')
      .replace(/总的来说[，,。]/g, '')
      .replace(/总而言之[，,。]/g, '')
      .replace(/综上所述[，,。]/g, '')
      .replace(/希望这/g, '')
      .trim();
  }
}
