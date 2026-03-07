/**
 * 情节设计师 - 优化版
 */
import ZAI from 'z-ai-web-dev-sdk';

export interface PlotDesignOutput {
  plotDesign: string;
}

export class PlotDesigner {
  async generate(prompt: string, worldview: string, outline: string, characters: string, totalChapters: number): Promise<PlotDesignOutput> {
    const zai = await ZAI.create();
    
    const systemPrompt = `你是情节设计师。设计关键情节：
1. 关键场景（每章一个）
2. 冲突设计
3. 伏笔设计
4. 高潮场景
5. 情感节点
6. 情节转折

简洁明了。`;

    const userPrompt = `为 ${totalChapters} 章小说设计情节：
大纲：${outline.substring(0, 500)}
人物：${characters.substring(0, 500)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 8000
    });

    return { plotDesign: completion.choices[0]?.message?.content || '' };
  }

  formatOutput(output: PlotDesignOutput): string {
    return output.plotDesign;
  }
}
