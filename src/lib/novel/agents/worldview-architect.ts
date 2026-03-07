/**
 * 智能体1：世界观师
 * 负责构建小说的世界观、背景设定、地理环境等
 */

import ZAI from 'z-ai-web-dev-sdk';
import { extractJSON } from '../utils/json-parser';

export interface WorldviewOutput {
  worldName: string;        // 世界名称
  era: string;              // 时代背景
  geography: string;        // 地理环境
  powerSystem: string;      // 力量体系（修仙/魔法等）
  socialStructure: string;  // 社会结构
  majorForces: string;      // 主要势力
  history: string;          // 历史背景
  rules: string;            // 世界规则
  map: string;              // 地图描述
  fullDescription: string;  // 完整描述
}

export class WorldviewArchitect {
  private agentName = '世界观师';
  private agentDescription = '专注于构建完整、自洽、有深度的小说世界观';

  async generate(prompt: string): Promise<WorldviewOutput> {
    console.log(`[${this.agentName}] 开始构建世界观...`);
    
    const zai = await ZAI.create();
    
    const systemPrompt = `你是${this.agentName}，${this.agentDescription}。

你的任务是：
1. 根据用户的提示词，构建一个完整、自洽、有深度的世界观
2. 世界观要有足够的细节支撑长篇故事
3. 要有内在的矛盾和张力，为故事发展提供土壤
4. 要有独特的特色，避免千篇一律

输出格式要求（JSON）：
{
  "worldName": "世界名称",
  "era": "时代背景",
  "geography": "地理环境描述",
  "powerSystem": "力量体系（如修仙等级、魔法体系等）",
  "socialStructure": "社会结构和阶层",
  "majorForces": "主要势力和组织",
  "history": "历史背景和重要事件",
  "rules": "世界运行规则",
  "map": "地图描述（主要地点和位置关系）",
  "fullDescription": "完整的世界观描述文本"
}`;

    const userPrompt = `请根据以下提示词构建世界观：

【用户提示词】
${prompt}

【要求】
1. 世界观要足够支撑${this.estimateChapters(prompt)}章的故事
2. 要有丰富的地理环境，至少包含5个重要地点
3. 要有清晰的力量体系，等级划分明确
4. 要有多个势力，形成复杂的利益关系
5. 要有历史底蕴，为故事提供背景
6. 世界观要有独特性，避免套路化

请输出JSON格式的世界观设定。`;

    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 8000
      });

      const content = completion.choices[0]?.message?.content || '';
      const result = extractJSON<WorldviewOutput>(content);
      
      if (result && result.worldName) {
        console.log(`[${this.agentName}] 世界观构建完成`);
        return result;
      }
      
      // 返回默认值
      console.log(`[${this.agentName}] JSON解析失败，使用默认值`);
      return this.getDefaultOutput(prompt);
    } catch (error) {
      console.error(`[${this.agentName}] 错误:`, error);
      return this.getDefaultOutput(prompt);
    }
  }

  private getDefaultOutput(prompt: string): WorldviewOutput {
    return {
      worldName: '玄幻世界',
      era: '上古时期',
      geography: '东域、西域、南域、北域、中州五大区域',
      powerSystem: '炼气、筑基、金丹、元婴、化神、渡劫、大乘',
      socialStructure: '宗门、世家、皇朝三足鼎立',
      majorForces: '天剑宗、玄冰阁、烈焰门、暗影楼',
      history: '万年前仙魔大战，天地灵气复苏',
      rules: '强者为尊，弱肉强食',
      map: '中州为核心，四方为边缘区域',
      fullDescription: `基于"${prompt}"构建的玄幻世界观`
    };
  }

  private estimateChapters(prompt: string): string {
    // 简单估计章节数，实际使用时会从项目获取
    return '50-100';
  }

  formatOutput(output: WorldviewOutput): string {
    return `
【世界观设定】

一、世界名称
${output.worldName}

二、时代背景
${output.era}

三、地理环境
${output.geography}

四、力量体系
${output.powerSystem}

五、社会结构
${output.socialStructure}

六、主要势力
${output.majorForces}

七、历史背景
${output.history}

八、世界规则
${output.rules}

九、世界地图
${output.map}

【完整描述】
${output.fullDescription}
`.trim();
  }
}
