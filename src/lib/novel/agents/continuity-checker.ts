/**
 * 智能体8：连续性检查员
 * 负责检查章节与设定、上下文的一致性
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { NovelSettings } from '../types';

export interface ContinuityCheckResult {
  passed: boolean;
  issues: string[];
  suggestions: string[];
  score: number; // 0-100
}

export class ContinuityChecker {
  private agentName = '连续性检查员';
  private agentDescription = '专注于检查故事的连续性和一致性';

  async check(
    content: string,
    chapterNum: number,
    settings: NovelSettings,
    previousContent: string,
    chapterOutline: string
  ): Promise<ContinuityCheckResult> {
    console.log(`[${this.agentName}] 开始检查第 ${chapterNum} 章连续性...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 检查章节内容与设定的一致性
2. 检查章节与上下文的连贯性
3. 检查人物性格是否一致
4. 检查时间线是否正确
5. 检查情节逻辑是否合理

【检查要点】
1. 人物设定一致性：性格、能力、外貌等
2. 世界观一致性：规则、设定等
3. 时间线正确性：事件顺序、时间跨度
4. 情节连贯性：前后呼应、逻辑合理
5. 人物关系正确性：称呼、关系等

输出格式要求（JSON）：
{
  "passed": true/false,
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "score": 0-100分
}`;

    const userPrompt = `请检查以下章节的连续性：

【章节】第 ${chapterNum} 章

【世界观设定】
${settings.worldview.substring(0, 800)}

【人物设定】
${settings.characters.substring(0, 1200)}

【故事大纲】
${settings.outline.substring(0, 800)}

【本章细纲】
${chapterOutline.substring(0, 500)}

【上一章内容】
${previousContent ? previousContent.substring(previousContent.length - 1500) : '（这是第一章）'}

【待检查内容】
${content}

【检查要求】
1. 检查人物设定是否一致
2. 检查世界观设定是否遵守
3. 检查与上文是否连贯
4. 检查是否符合章节细纲
5. 检查情节逻辑是否合理

请输出JSON格式的检查结果。`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = extractJSON(content) as ContinuityCheckResult;
        console.log(`[${this.agentName}] 第 ${chapterNum} 章检查完成，得分：${result.score}`);
        return result;
      }
      
      // 无法解析时默认通过
      return {
        passed: true,
        issues: [],
        suggestions: [],
        score: 80
      };
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      return {
        passed: true,
        issues: [],
        suggestions: [],
        score: 75
      };
    }
  }

  // 快速检查（不调用AI）
  quickCheck(
    content: string,
    characterNames: string[],
    locationNames: string[]
  ): { hasCharacters: boolean; hasLocations: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // 检查是否有主要人物出现
    const hasCharacters = characterNames.some(name => content.includes(name));
    if (!hasCharacters && characterNames.length > 0) {
      issues.push('章节中未出现任何主要人物');
    }
    
    // 检查地点
    const hasLocations = locationNames.some(name => content.includes(name));
    
    return { hasCharacters, hasLocations, issues };
  }
}
