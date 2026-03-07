/**
 * 智能体2：大纲架构师
 * 负责设计故事的整体架构和主线发展
 */

import ZAI from 'z-ai-web-dev-sdk';
import { WorldviewOutput } from './worldview-architect';
import { extractJSON } from '../utils/json-parser';

export interface OutlineOutput {
  mainTheme: string;         // 主题
  coreConflict: string;      // 核心冲突
  storyArc: string;          // 故事弧线
  mainPlot: string;          // 主线剧情
  subPlots: string;          // 支线剧情
  turningPoints: string;     // 转折点
  climax: string;            // 高潮设计
  ending: string;            // 结局设计
  pacing: string;            // 节奏规划
  fullOutline: string;       // 完整大纲
}

export class OutlineArchitect {
  private agentName = '大纲架构师';
  private agentDescription = '专注于设计故事的整体架构，确保情节紧凑、逻辑严密';

  async generate(
    prompt: string, 
    worldview: WorldviewOutput,
    totalChapters: number
  ): Promise<OutlineOutput> {
    console.log(`[${this.agentName}] 开始构建故事大纲...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 根据世界观和用户提示，设计完整的故事大纲
2. 确保故事有清晰的起承转合
3. 设计合理的冲突和转折
4. 规划好节奏，张弛有度

【情节设计参考：冰临神下风格】
- 开篇即入戏，不拖沓铺垫
- 情节环环相扣，伏笔埋设精妙
- 人物命运多舛但不刻意虐心
- 反转自然，不突兀不生硬
- 节奏张弛有度，高潮迭起
- 细节前后呼应，逻辑严密
- 主线清晰，支线丰富但不杂乱
- 冲突设置合理，矛盾层层递进
- 悬念设置恰到好处，不故弄玄虚
- 结局出人意料又在情理之中

输出格式要求（JSON）：
{
  "mainTheme": "故事主题",
  "coreConflict": "核心冲突",
  "storyArc": "故事弧线描述",
  "mainPlot": "主线剧情概要",
  "subPlots": "支线剧情列表",
  "turningPoints": "重要转折点",
  "climax": "高潮设计",
  "ending": "结局设计",
  "pacing": "节奏规划",
  "fullOutline": "完整大纲文本"
}

重要：请确保输出的是有效的JSON格式，不要有多余的逗号或缺少引号。`;

    const userPrompt = `请根据以下信息构建故事大纲：

【用户提示词】
${prompt}

【世界观设定】
世界名称：${worldview.worldName}
时代背景：${worldview.era}
力量体系：${worldview.powerSystem}
主要势力：${worldview.majorForces}

【章节数量】
共 ${totalChapters} 章

【要求】
1. 大纲要能支撑 ${totalChapters} 章的内容
2. 设计清晰的开端、发展、高潮、结局
3. 至少设计3个重要转折点
4. 主线清晰，支线丰富
5. 确保单男主单女主的感情线
6. 结局要出人意料又在情理之中

请输出JSON格式的故事大纲。`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 10000
      });

      const content = completion.choices[0]?.message?.content || '';
      const result = extractJSON<OutlineOutput>(content);
      
      if (result && result.mainTheme) {
        console.log(`[${this.agentName}] 故事大纲构建完成`);
        return result;
      }
      
      // 返回默认值
      console.log(`[${this.agentName}] JSON解析失败，使用默认值`);
      return this.getDefaultOutput(prompt, totalChapters);
      
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      return this.getDefaultOutput(prompt, totalChapters);
    }
  }

  private getDefaultOutput(prompt: string, totalChapters: number): OutlineOutput {
    return {
      mainTheme: '成长与探索',
      coreConflict: '主角与命运的对抗',
      storyArc: '从平凡到非凡的成长之路',
      mainPlot: `根据用户提示"${prompt}"设计的主线剧情，共${totalChapters}章`,
      subPlots: '感情线、友情线、师徒线',
      turningPoints: '第一章：命运转折；中段：真相揭露；结尾：最终决战',
      climax: '主角面对最终挑战，完成蜕变',
      ending: '开放式结局，引人深思',
      pacing: '前期铺垫，中期加速，后期高潮',
      fullOutline: `故事大纲：${prompt}`
    };
  }

  formatOutput(output: OutlineOutput): string {
    return `
【故事大纲】

一、故事主题
${output.mainTheme}

二、核心冲突
${output.coreConflict}

三、故事弧线
${output.storyArc}

四、主线剧情
${output.mainPlot}

五、支线剧情
${output.subPlots}

六、重要转折点
${output.turningPoints}

七、高潮设计
${output.climax}

八、结局设计
${output.ending}

九、节奏规划
${output.pacing}

【完整大纲】
${output.fullOutline}
`.trim();
  }
}
