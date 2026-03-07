/**
 * 世界观架构师 - 优化版
 */
import ZAI from 'z-ai-web-dev-sdk';

export interface WorldviewOutput {
  worldview: string;
}

export class WorldviewArchitect {
  async generate(prompt: string): Promise<WorldviewOutput> {
    const zai = await ZAI.create();
    
    const systemPrompt = `你是世界观架构师。创建小说世界观，包括：
1. 世界名称
2. 时代背景
3. 地理环境
4. 力量体系
5. 社会结构
6. 主要势力
7. 历史背景

简洁明了，避免冗余。`;

    const userPrompt = `为以下小说创建世界观：
${prompt}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 6000
    });

    return { worldview: completion.choices[0]?.message?.content || '' };
  }

  formatOutput(output: WorldviewOutput): string {
    return output.worldview;
  }
}
