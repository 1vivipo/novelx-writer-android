/**
 * 智能体4：情节设计师
 * 负责设计具体的情节和场景，确保故事精彩
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { WorldviewOutput } from './worldview-architect';
import { OutlineOutput } from './outline-architect';
import { CharacterOutput } from './character-designer';

export interface PlotDesignOutput {
  keyScenes: string;         // 关键场景
  conflicts: string;         // 冲突设计
  foreshadowing: string;     // 伏笔设计
  climaxes: string;          // 高潮场景
  emotionalBeats: string;    // 情感节点
  plotTwists: string;        // 情节转折
  battleScenes: string;      // 战斗场景（如适用）
  romanticScenes: string;    // 感情场景
  fullDesign: string;        // 完整设计
}

export class PlotDesigner {
  private agentName = '情节设计师';
  private agentDescription = '专注于设计精彩、紧凑、有张力的情节';

  async generate(
    prompt: string,
    worldview: WorldviewOutput,
    outline: OutlineOutput,
    characters: CharacterOutput,
    totalChapters: number
  ): Promise<PlotDesignOutput> {
    console.log(`[${this.agentName}] 开始设计情节...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 设计具体的情节和场景
2. 确保情节紧凑、有张力
3. 设计合理的冲突和转折
4. 安排好伏笔和呼应

【情节设计参考：冰临神下风格】
- 开篇即入戏，不拖沓铺垫
- 情节环环相扣，伏笔埋设精妙
- 人物命运多舛但不刻意虐心
- 反转自然，不突兀不生硬
- 节奏张弛有度，高潮迭起
- 细节前后呼应，逻辑严密
- 冲突设置合理，矛盾层层递进
- 悬念设置恰到好处，不故弄玄虚

输出格式要求（JSON）：
{
  "keyScenes": "关键场景设计（至少10个重要场景）",
  "conflicts": "冲突设计（主要冲突和次要冲突）",
  "foreshadowing": "伏笔设计（重要伏笔和揭示时机）",
  "climaxes": "高潮场景设计",
  "emotionalBeats": "情感节点设计",
  "plotTwists": "情节转折设计",
  "battleScenes": "战斗/对抗场景设计",
  "romanticScenes": "感情场景设计",
  "fullDesign": "完整的情节设计文本"
}`;

    const userPrompt = `请根据以下信息设计情节：

【用户提示词】
${prompt}

【世界观】
世界名称：${worldview.worldName}
力量体系：${worldview.powerSystem}

【故事大纲】
主题：${outline.mainTheme}
核心冲突：${outline.coreConflict}
主线剧情：${outline.mainPlot}
转折点：${outline.turningPoints}

【人物设定】
男主：${characters.protagonist.substring(0, 500)}
女主：${characters.heroine.substring(0, 500)}

【章节数量】
共 ${totalChapters} 章

【要求】
1. 设计至少10个关键场景
2. 设计至少5个重要伏笔
3. 确保冲突层层递进
4. 感情线要自然发展
5. 高潮要震撼有力
6. 转折要出人意料又合理
7. 情节要能支撑 ${totalChapters} 章

请输出JSON格式的情节设计。`;

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
      const result = extractJSON<PlotDesignOutput>(content);
      
      if (result && result.keyScenes) {
        console.log(`[${this.agentName}] 情节设计完成`);
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

  private getDefaultOutput(prompt: string, totalChapters: number): PlotDesignOutput {
    return {
      keyScenes: `1. 主角获得功法；2. 初入修仙界；3. 遇见女主；4. 第一次战斗；5. 加入宗门；6. 宗门大比；7. 发现阴谋；8. 营救女主；9. 最终决战；10. 大结局`,
      conflicts: `主要冲突：主角与暗影势力的对抗；次要冲突：宗门内部斗争、感情纠葛`,
      foreshadowing: `伏笔1：功法的真正来源；伏笔2：主角的身世之谜；伏笔3：女主的秘密`,
      climaxes: `高潮1：宗门大比夺魁；高潮2：揭露阴谋；高潮3：最终决战`,
      emotionalBeats: `情感节点：初遇、误会、和解、表白、生死与共`,
      plotTwists: `转折1：功法来源揭秘；转折2：反派身份揭露；转折3：最终真相`,
      battleScenes: `战斗场景：初战妖兽、宗门大比、对抗反派`,
      romanticScenes: `感情场景：月下相遇、并肩作战、生死告白`,
      fullDesign: `基于"${prompt}"的情节设计，共${totalChapters}章`
    };
  }

  formatOutput(output: PlotDesignOutput): string {
    return `
【情节设计】

一、关键场景
${output.keyScenes}

二、冲突设计
${output.conflicts}

三、伏笔设计
${output.foreshadowing}

四、高潮场景
${output.climaxes}

五、情感节点
${output.emotionalBeats}

六、情节转折
${output.plotTwists}

七、战斗场景
${output.battleScenes}

八、感情场景
${output.romanticScenes}

【完整设计】
${output.fullDesign}
`.trim();
  }
}
