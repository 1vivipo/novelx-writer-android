/**
 * 人物设计师 - 优化版
 */
import ZAI from 'z-ai-web-dev-sdk';

export interface CharacterOutput {
  characters: string;
}

export class CharacterDesigner {
  async generate(prompt: string, worldview: string, outline: string, totalChapters: number): Promise<CharacterOutput> {
    const zai = await ZAI.create();
    
    const systemPrompt = `你是人物设计师。创建人物设定：
1. 主角（姓名、性格、背景、成长线）
2. 女主（如适用）
3. 主要配角
4. 反派

每个人物简洁描述，不超过200字。`;

    const userPrompt = `为小说创建人物：
主题：${prompt}
大纲：${outline.substring(0, 500)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 6000
    });

    return { characters: completion.choices[0]?.message?.content || '' };
  }

  formatOutput(output: CharacterOutput): string {
    return output.characters;
  }
}
