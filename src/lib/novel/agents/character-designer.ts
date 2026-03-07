/**
 * 智能体3：人物设计师
 * 负责设计小说中的所有人物，包括主角、配角、反派等
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';
import { WorldviewOutput } from './worldview-architect';
import { OutlineOutput } from './outline-architect';

export interface CharacterOutput {
  protagonist: string;       // 男主设定
  heroine: string;           // 女主设定
  antagonists: string;       // 反派设定
  supportingCharacters: string; // 配角设定
  relationships: string;     // 人物关系
  characterArcs: string;     // 人物成长线
  fullDescription: string;   // 完整描述
}

export class CharacterDesigner {
  private agentName = '人物设计师';
  private agentDescription = '专注于设计立体、鲜活、有深度的人物形象';

  async generate(
    prompt: string,
    worldview: WorldviewOutput,
    outline: OutlineOutput,
    totalChapters: number
  ): Promise<CharacterOutput> {
    console.log(`[${this.agentName}] 开始设计人物...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 设计完整的人物体系，包括主角、女主、反派、配角
2. 每个人物都要有鲜明的性格特点和成长空间
3. 人物之间要有复杂的关系网络
4. 确保单男主单女主的感情线

【人物刻画参考：《六爻》风格】
- 主角性格鲜明，有成长弧光
- 配角立体丰满，各有特色
- 人物行为符合性格逻辑
- 对话体现人物身份和性格
- 感情线细腻自然，不突兀
- 单男主单女主，感情专一
- 人物关系复杂但有层次
- 反派有深度，非脸谱化
- 人物成长有迹可循
- 人物命运与情节紧密相连

输出格式要求（JSON）：
{
  "protagonist": "男主角详细设定（姓名、年龄、外貌、性格、背景、能力、成长方向等）",
  "heroine": "女主角详细设定（同上）",
  "antagonists": "反派角色设定（主要反派和次要反派）",
  "supportingCharacters": "重要配角设定（至少5个）",
  "relationships": "人物关系网络描述",
  "characterArcs": "主要人物的成长线规划",
  "fullDescription": "完整的人物设定文本"
}`;

    const userPrompt = `请根据以下信息设计人物：

【用户提示词】
${prompt}

【世界观设定】
世界名称：${worldview.worldName}
力量体系：${worldview.powerSystem}
社会结构：${worldview.socialStructure}

【故事大纲】
主题：${outline.mainTheme}
核心冲突：${outline.coreConflict}
主线剧情：${outline.mainPlot}

【章节数量】
共 ${totalChapters} 章

【要求】
1. 男主和女主要有鲜明的性格特点
2. 两人要有合理的相遇和发展过程
3. 反派要有深度，不能脸谱化
4. 至少设计5个重要配角
5. 人物关系要复杂但有层次
6. 每个人物都要有成长空间
7. 人物设定要能支撑 ${totalChapters} 章的发展

请输出JSON格式的人物设定。`;

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
      const result = extractJSON<CharacterOutput>(content);
      
      if (result && result.protagonist) {
        console.log(`[${this.agentName}] 人物设计完成`);
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

  private getDefaultOutput(prompt: string, totalChapters: number): CharacterOutput {
    return {
      protagonist: `男主角：林风，18岁，性格坚韧不拔，从小生活在一个小村庄，意外获得神秘功法《天元诀》，从此踏上修仙之路。`,
      heroine: `女主角：苏晴，17岁，天才少女，天剑宗宗主之女，性格清冷但内心善良，与男主从敌对到相爱。`,
      antagonists: `主要反派：暗影楼主，神秘势力的首领，企图颠覆修仙界。次要反派：林风的堂兄林虎，嫉妒林风的机缘。`,
      supportingCharacters: `重要配角：1. 老村长-林风的启蒙者；2. 天剑宗长老-苏晴的师父；3. 小石头-林风的好友；4. 神秘老者-功法传承者；5. 烈焰门少主-情敌`,
      relationships: `林风与苏晴从敌对到相爱；林风与暗影楼主是宿敌；苏晴与天剑宗有血缘关系`,
      characterArcs: `林风：从普通少年成长为修仙强者；苏晴：从高冷少女变得温柔`,
      fullDescription: `基于"${prompt}"的人物设定，共${totalChapters}章`
    };
  }

  formatOutput(output: CharacterOutput): string {
    return `
【人物设定】

一、男主角
${output.protagonist}

二、女主角
${output.heroine}

三、反派角色
${output.antagonists}

四、重要配角
${output.supportingCharacters}

五、人物关系
${output.relationships}

六、人物成长线
${output.characterArcs}

【完整描述】
${output.fullDescription}
`.trim();
  }
}
