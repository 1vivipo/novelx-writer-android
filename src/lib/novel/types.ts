// 小说项目类型定义

// 项目状态
export type ProjectStatus = 
  | 'pending'      // 等待开始
  | 'setting'      // 生成设定中
  | 'writing'      // 写作中
  | 'paused'       // 暂停
  | 'completed'    // 已完成
  | 'error';       // 错误

// 章节状态
export type ChapterStatus = 
  | 'pending'      // 等待写作
  | 'writing'      // 写作中
  | 'reviewing'    // 审核中
  | 'completed'    // 已完成
  | 'error';       // 需要重写

// 小说项目
export interface NovelProject {
  id: string;
  title: string;
  prompt: string;           // 用户输入的提示词
  totalChapters: number;    // 预计章节数
  currentChapter: number;   // 当前写作章节
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
  settings: NovelSettings;  // 小说设定
  chapters: Chapter[];      // 章节列表
  error?: string;           // 错误信息
}

// 小说设定
export interface NovelSettings {
  worldview: string;        // 世界观设定
  characters: string;       // 人物设定
  outline: string;          // 故事大纲
  plotDesign: string;       // 情节设计
  chapterOutline: string;   // 章节细纲
  writingRules: string;     // 写作规范
  map?: string;             // 世界地图（可选）
  relationships?: string;   // 人物关系图（可选）
}

// 章节
export interface Chapter {
  number: number;
  title: string;
  content: string;
  status: ChapterStatus;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;       // 重试次数
  reviewNotes?: string;     // 审核备注
}

// 智能体任务
export interface AgentTask {
  id: string;
  projectId: string;
  type: AgentTaskType;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type AgentTaskType = 
  | 'generate_worldview'
  | 'generate_characters'
  | 'generate_outline'
  | 'generate_plot'
  | 'generate_chapter_outline'
  | 'generate_writing_rules'
  | 'write_chapter'
  | 'polish_chapter'
  | 'check_continuity'
  | 'check_duplicate'
  | 'final_review';

// 调度器状态
export interface SchedulerState {
  runningProjects: string[];  // 正在运行的项目ID
  queue: string[];            // 等待队列
  maxConcurrent: number;      // 最大并发数
}

// 写作风格配置
export interface WritingStyle {
  proseStyle: string;         // 文风描述
  plotStyle: string;          // 情节风格
  characterStyle: string;     // 人物刻画风格
  reference: string;          // 参考作品
}

// 默认写作风格（鲁迅文风 + 冰临神下情节 + 六爻人物刻画）
export const DEFAULT_WRITING_STYLE: WritingStyle = {
  proseStyle: `鲁迅文风特点：
1. 语言精炼有力，不拖泥带水，每个字都有分量
2. 善用白描手法，寥寥数笔勾勒人物神态
3. 讽刺与幽默并存，在严肃中见诙谐
4. 句式多变，长短句交错，节奏感强
5. 善用反语和双关，言外之意丰富
6. 描写细腻而不繁琐，点到即止
7. 对话生动自然，符合人物身份
8. 心理描写深入，但不直白说破
9. 环境描写与人物心境交融
10. 结尾常有留白，引人深思`,
  
  plotStyle: `冰临神下情节设计特点：
1. 开篇即入戏，不拖沓铺垫
2. 情节环环相扣，伏笔埋设精妙
3. 人物命运多舛但不刻意虐心
4. 反转自然，不突兀不生硬
5. 节奏张弛有度，高潮迭起
6. 细节前后呼应，逻辑严密
7. 主线清晰，支线丰富但不杂乱
8. 冲突设置合理，矛盾层层递进
9. 悬念设置恰到好处，不故弄玄虚
10. 结局出人意料又在情理之中`,
  
  characterStyle: `《六爻》人物刻画特点：
1. 主角性格鲜明，有成长弧光
2. 配角立体丰满，各有特色
3. 人物行为符合性格逻辑
4. 对话体现人物身份和性格
5. 感情线细腻自然，不突兀
6. 单男主单女主，感情专一
7. 人物关系复杂但有层次
8. 反派有深度，非脸谱化
9. 人物成长有迹可循
10. 人物命运与情节紧密相连`,
  
  reference: '文风参考鲁迅，情节设计参考冰临神下，人物刻画参考《六爻》'
};

// 去AI味规则
export const DE_AI_RULES = `
【去AI味核心规则】

一、语言层面：
1. 避免使用"仿佛"、"似乎"、"宛如"等AI常用比喻词
2. 减少形容词堆砌，多用动词和名词
3. 避免过于工整的排比句式
4. 不使用"那一刻"、"这一刻"等时间标记
5. 减少"心中涌起一股..."类心理描写
6. 避免过度使用"然而"、"但是"转折
7. 不用"不禁"、"忍不住"等弱化词
8. 减少"眼中闪过一丝..."类描写

二、结构层面：
1. 章节开头不使用"阳光透过..."类环境描写
2. 避免每章结尾都用悬念或转折
3. 不刻意制造戏剧性冲突
4. 减少大段心理独白
5. 避免情节过于巧合

三、人物层面：
1. 对话要口语化，符合人物身份
2. 避免人物说话过于文艺
3. 不让所有角色都说"正确的话"
4. 人物反应要真实，不要过度戏剧化

四、情感层面：
1. 不刻意煽情
2. 感情发展要自然渐进
3. 避免大段感情宣泄
4. 用细节暗示而非直白表达

五、细节层面：
1. 加入生活化细节
2. 使用具体数字而非模糊描述
3. 加入方言或口语表达
4. 适当使用不完美表达
`;

// 查重规则
export const DUPLICATE_CHECK_RULES = `
【查重核心规则】

一、章节内查重：
1. 检查是否有重复的描写句式
2. 检查是否有重复的对话模式
3. 检查是否有重复的心理描写
4. 检查是否有重复的环境描写

二、跨章节查重：
1. 检查是否有重复的情节模式
2. 检查是否有重复的场景描写
3. 检查是否有重复的人物反应
4. 检查是否有重复的对话风格

三、与设定一致性：
1. 人物性格是否前后一致
2. 世界观设定是否遵守
3. 时间线是否正确
4. 人物关系是否正确

四、重复率标准：
- 章节内重复率 < 5%
- 跨章节重复率 < 3%
- 与设定冲突 = 0
`;
