/**
 * 智能体10：质量总监
 * 负责最终审核，决定章节是否通过或需要重写
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { ContinuityCheckResult } from './continuity-checker';
import { DuplicateCheckResult } from './duplicate-checker';

export interface QualityReviewResult {
  approved: boolean;
  needsRewrite: boolean;
  overallScore: number;
  qualityMetrics: {
    writing: number;      // 文笔得分
    continuity: number;   // 连续性得分
    originality: number;  // 原创性得分
    pacing: number;       // 节奏得分
    characterization: number; // 人物刻画得分
  };
  issues: string[];
  suggestions: string[];
  rewriteReason?: string;
}

export class QualityDirector {
  private agentName = '质量总监';
  private agentDescription = '负责最终审核，确保章节质量达标';

  async review(
    content: string,
    chapterNum: number,
    title: string,
    continuityResult: ContinuityCheckResult,
    duplicateResult: DuplicateCheckResult,
    settings: {
      worldview: string;
      characters: string;
      outline: string;
    }
  ): Promise<QualityReviewResult> {
    console.log(`[${this.agentName}] 开始审核第 ${chapterNum} 章...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 综合评估章节质量
2. 决定是否通过或需要重写
3. 提供具体的改进建议

【质量标准】
- 文笔：语言精炼，文风统一，无AI味
- 连续性：与设定一致，与上文连贯
- 原创性：内容新颖，无重复
- 节奏：张弛有度，推进合理
- 人物刻画：性格鲜明，行为合理

【通过标准】
- 总分 >= 70分
- 单项分 >= 60分
- 无严重问题

输出格式要求（JSON）：
{
  "approved": true/false,
  "needsRewrite": true/false,
  "overallScore": 0-100,
  "qualityMetrics": {
    "writing": 0-100,
    "continuity": 0-100,
    "originality": 0-100,
    "pacing": 0-100,
    "characterization": 0-100
  },
  "issues": ["问题1", "问题2"],
  "suggestions": ["建议1", "建议2"],
  "rewriteReason": "重写原因（如需要）"
}`;

    const userPrompt = `请审核以下章节：

【章节】第 ${chapterNum} 章 ${title}

【连续性检查结果】
通过：${continuityResult.passed}
得分：${continuityResult.score}
问题：${continuityResult.issues.join('；')}

【查重检查结果】
通过：${duplicateResult.passed}
得分：${duplicateResult.score}
章节内重复率：${duplicateResult.internalDuplicateRate}%
跨章节重复率：${duplicateResult.crossChapterDuplicateRate}%

【章节内容】
${content.substring(0, 3000)}

【设定参考】
世界观：${settings.worldview.substring(0, 300)}
人物：${settings.characters.substring(0, 500)}

【审核要求】
1. 综合评估章节质量
2. 决定是否通过
3. 如需重写，说明原因
4. 提供改进建议

请输出JSON格式的审核结果。`;

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
        const result = extractJSON(content) as QualityReviewResult;
        console.log(`[${this.agentName}] 第 ${chapterNum} 章审核完成，总分：${result.overallScore}，${result.approved ? '通过' : '需重写'}`);
        return result;
      }
      
      // 无法解析时根据检查结果判断
      return this.defaultReview(continuityResult, duplicateResult);
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      return this.defaultReview(continuityResult, duplicateResult);
    }
  }

  private defaultReview(
    continuityResult: ContinuityCheckResult,
    duplicateResult: DuplicateCheckResult
  ): QualityReviewResult {
    const overallScore = (continuityResult.score + duplicateResult.score) / 2;
    const approved = overallScore >= 70 && continuityResult.passed && duplicateResult.passed;
    
    return {
      approved,
      needsRewrite: !approved,
      overallScore,
      qualityMetrics: {
        writing: 75,
        continuity: continuityResult.score,
        originality: duplicateResult.score,
        pacing: 75,
        characterization: 75
      },
      issues: [...continuityResult.issues, ...duplicateResult.duplicateSegments.slice(0, 3)],
      suggestions: [...continuityResult.suggestions, ...duplicateResult.suggestions],
      rewriteReason: !approved ? '质量未达标' : undefined
    };
  }

  // 快速评估（不调用AI）
  quickAssess(content: string): { wordCount: number; estimatedQuality: number } {
    const wordCount = content.length;
    
    // 基于字数和简单特征估计质量
    let score = 70;
    
    // 字数合理
    if (wordCount >= 2000 && wordCount <= 5000) {
      score += 10;
    } else if (wordCount < 1500) {
      score -= 15;
    }
    
    // 对话比例合理
    const dialogueCount = (content.match(/["「『"]/g) || []).length;
    const dialogueRatio = dialogueCount / (wordCount / 100);
    if (dialogueRatio >= 5 && dialogueRatio <= 30) {
      score += 5;
    }
    
    // 段落结构
    const paragraphCount = content.split(/\n\n+/).length;
    if (paragraphCount >= 5 && paragraphCount <= 30) {
      score += 5;
    }
    
    return {
      wordCount,
      estimatedQuality: Math.min(100, Math.max(0, score))
    };
  }
}
