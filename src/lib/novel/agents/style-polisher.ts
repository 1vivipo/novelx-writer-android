/**
 * 智能体7：文风润色师
 * 负责对写好的正文进行润色，去除AI味，提升文学性
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { DE_AI_RULES } from '../types';

export interface PolishOutput {
  content: string;
  wordCount: number;
  changes: string[];  // 主要修改说明
}

export class StylePolisher {
  private agentName = '文风润色师';
  private agentDescription = '专注于润色正文，去除AI味，提升文学性';

  async polish(
    content: string,
    chapterNum: number,
    title: string,
    characterSettings: string
  ): Promise<PolishOutput> {
    console.log(`[${this.agentName}] 开始润色第 ${chapterNum} 章...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 润色正文，使其更接近鲁迅先生的文风
2. 去除AI味，让文字更有人味
3. 保持故事连贯性和人物一致性
4. 提升文学性和可读性

【鲁迅文风要点】
1. 语言精炼有力，不拖泥带水
2. 善用白描手法，寥寥数笔勾勒人物
3. 讽刺与幽默并存
4. 句式多变，长短句交错
5. 善用反语和双关
6. 描写细腻而不繁琐
7. 对话生动自然
8. 心理描写深入但不直白
9. 环境描写与人物心境交融
10. 结尾留白，引人深思

【去AI味规则】
${DE_AI_RULES}

输出格式要求（JSON）：
{
  "content": "润色后的正文",
  "wordCount": 字数,
  "changes": ["主要修改1", "主要修改2"]
}`;

    const userPrompt = `请润色以下章节正文：

【章节】第 ${chapterNum} 章 ${title}

【人物设定参考】
${characterSettings.substring(0, 1000)}

【原文】
${content}

【润色要求】
1. 保持故事内容不变
2. 使文风更接近鲁迅先生
3. 去除AI味
4. 提升文学性
5. 保持字数大致相同

请输出JSON格式的润色结果。`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 10000
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = extractJSON(content) as PolishOutput;
        console.log(`[${this.agentName}] 第 ${chapterNum} 章润色完成，字数：${result.wordCount}`);
        return result;
      }
      
      // 如果无法解析JSON，返回清理后的原文
      const cleaned = this.deepClean(content);
      return {
        content: cleaned,
        wordCount: cleaned.length,
        changes: ['自动清理AI痕迹']
      };
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      // 出错时返回原文
      return {
        content,
        wordCount: content.length,
        changes: []
      };
    }
  }

  // 深度清理AI痕迹
  private deepClean(content: string): string {
    const aiPhrases = [
      /作为AI[，,。]/g,
      /我注意到/g,
      /总的来说[，,。]/g,
      /总而言之[，,。]/g,
      /综上所述[，,。]/g,
      /希望这/g,
      /仿佛/g,
      /似乎/g,
      /宛如/g,
      /那一刻/g,
      /这一刻/g,
      /心中涌起/g,
      /眼中闪过/g,
      /不禁/g,
      /忍不住/g,
      /一种莫名的/g,
      /难以言喻的/g,
    ];
    
    let cleaned = content;
    for (const phrase of aiPhrases) {
      cleaned = cleaned.replace(phrase, '');
    }
    
    return cleaned.trim();
  }
}
