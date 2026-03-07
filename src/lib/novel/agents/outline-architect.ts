/**
 * 大纲架构师 - 优化版
 */
import ZAI from 'z-ai-web-dev-sdk';

export interface OutlineOutput {
  fullOutline: string;
}

export class OutlineArchitect {
  async generate(prompt: string, worldview: string, totalChapters: number): Promise<OutlineOutput> {
    const zai = await ZAI.create();
    
    const systemPrompt = `你是故事大纲师。创建故事大纲，包括：
1. 故事主题
2. 核心冲突
3. 主线剧情
4. 支线剧情
5. 重要转折点
6. 高潮设计
7. 结局设计

简洁明了。`;

    const userPrompt = `创建 ${totalChapters} 章小说大纲：
主题：${prompt}
世界：${worldview.substring(0, 500)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 8000
    });

    return { fullOutline: completion.choices[0]?.message?.content || '' };
  }

  formatOutput(output: OutlineOutput): string {
    return output.fullOutline;
  }
}
