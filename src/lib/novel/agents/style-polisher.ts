/**
 * 智能体7：文风润色师
 * 优化版：精简提示词，减少 token 消耗
 */

import ZAI from 'z-ai-web-dev-sdk';

export interface PolishOutput {
  content: string;
  wordCount: number;
}

export class StylePolisher {
  private agentName = '文风润色师';

  async polish(
    content: string,
    chapterNum: number,
    title: string,
    characters: string
  ): Promise<PolishOutput> {
    console.log(`[${this.agentName}] 润色第 ${chapterNum} 章...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是文字润色专家。任务：
1. 去除AI味（不用"仿佛"、"似乎"、"那一刻"等）
2. 让对话更口语化
3. 保持原文风格和字数
4. 直接输出润色后的内容`;

    const userPrompt = `润色以下内容，保持原字数：

${content}`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000  // 匹配章节长度
      });

      const polished = completion.choices[0]?.message?.content || content;
      
      console.log(`[${this.agentName}] 第 ${chapterNum} 章润色完成`);
      
      return {
        content: polished,
        wordCount: polished.length
      };
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      // 润色失败返回原内容
      return { content, wordCount: content.length };
    }
  }
}
