/**
 * 智能体9：查重审核员
 * 负责检查章节内和跨章节的重复内容
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { DUPLICATE_CHECK_RULES } from '../types';

export interface DuplicateCheckResult {
  passed: boolean;
  internalDuplicateRate: number;  // 章节内重复率
  crossChapterDuplicateRate: number; // 跨章节重复率
  duplicateSegments: string[];    // 重复片段
  suggestions: string[];
  score: number;
}

export class DuplicateChecker {
  private agentName = '查重审核员';
  private agentDescription = '专注于检查内容的重复和抄袭';

  async check(
    content: string,
    chapterNum: number,
    previousChapters: string[]
  ): Promise<DuplicateCheckResult> {
    console.log(`[${this.agentName}] 开始检查第 ${chapterNum} 章重复率...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 检查章节内的重复内容
2. 检查与之前章节的重复
3. 识别重复的句式和描写
4. 提供修改建议

【查重规则】
${DUPLICATE_CHECK_RULES}

输出格式要求（JSON）：
{
  "passed": true/false,
  "internalDuplicateRate": 章节内重复率(0-100),
  "crossChapterDuplicateRate": 跨章节重复率(0-100),
  "duplicateSegments": ["重复片段1", "重复片段2"],
  "suggestions": ["建议1", "建议2"],
  "score": 0-100分
}`;

    const previousContent = previousChapters.slice(-5).join('\n\n---\n\n');
    
    const userPrompt = `请检查以下章节的重复率：

【章节】第 ${chapterNum} 章

【待检查内容】
${content}

【之前章节内容】
${previousContent || '（无之前章节）'}

【检查要求】
1. 检查章节内是否有重复描写
2. 检查是否有与之前章节重复的内容
3. 检查是否有重复的句式
4. 检查是否有重复的对话模式
5. 重复率标准：章节内<5%，跨章节<3%

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
        const result = extractJSON(content) as DuplicateCheckResult;
        console.log(`[${this.agentName}] 第 ${chapterNum} 章查重完成，得分：${result.score}`);
        return result;
      }
      
      // 无法解析时进行简单检查
      return this.simpleCheck(content, previousChapters);
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      return this.simpleCheck(content, previousChapters);
    }
  }

  // 简单的查重算法
  private simpleCheck(content: string, previousChapters: string[]): DuplicateCheckResult {
    const segments: string[] = [];
    
    // 检查重复句子
    const sentences = content.split(/[。！？\n]/).filter(s => s.length > 10);
    const sentenceCounts = new Map<string, number>();
    
    for (const sentence of sentences) {
      const normalized = sentence.trim();
      sentenceCounts.set(normalized, (sentenceCounts.get(normalized) || 0) + 1);
    }
    
    for (const [sentence, count] of sentenceCounts) {
      if (count > 1) {
        segments.push(`重复${count}次: "${sentence.substring(0, 30)}..."`);
      }
    }
    
    // 检查与之前章节的重复
    const crossSegments: string[] = [];
    for (const prevChapter of previousChapters) {
      const prevSentences = prevChapter.split(/[。！？\n]/).filter(s => s.length > 15);
      for (const prevSentence of prevSentences) {
        if (content.includes(prevSentence.trim())) {
          crossSegments.push(prevSentence.trim().substring(0, 30));
        }
      }
    }
    
    const internalRate = Math.min(segments.length * 2, 20);
    const crossRate = Math.min(crossSegments.length * 3, 15);
    
    return {
      passed: internalRate < 5 && crossRate < 3,
      internalDuplicateRate: internalRate,
      crossChapterDuplicateRate: crossRate,
      duplicateSegments: [...segments.slice(0, 5), ...crossSegments.slice(0, 3)],
      suggestions: segments.length > 0 ? ['建议修改重复的句子'] : [],
      score: Math.max(0, 100 - internalRate * 5 - crossRate * 10)
    };
  }

  // 计算文本相似度
  calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}
