/**
 * 智能体模块索引
 * 导出所有智能体类
 */

export { WorldviewArchitect } from './worldview-architect';
export type { WorldviewOutput } from './worldview-architect';

export { OutlineArchitect } from './outline-architect';
export type { OutlineOutput } from './outline-architect';

export { CharacterDesigner } from './character-designer';
export type { CharacterOutput } from './character-designer';

export { PlotDesigner } from './plot-designer';
export type { PlotDesignOutput } from './plot-designer';

export { ChapterPlanner } from './chapter-planner';
export type { ChapterOutline, ChapterOutlineOutput } from './chapter-planner';

export { ChapterWriter } from './chapter-writer';
export type { WritingOutput } from './chapter-writer';

export { StylePolisher } from './style-polisher';
export type { PolishOutput } from './style-polisher';

export { ContinuityChecker } from './continuity-checker';
export type { ContinuityCheckResult } from './continuity-checker';

export { DuplicateChecker } from './duplicate-checker';
export type { DuplicateCheckResult } from './duplicate-checker';

export { QualityDirector } from './quality-director';
export type { QualityReviewResult } from './quality-director';

// 智能体协调器
import { WorldviewArchitect } from './worldview-architect';
import { OutlineArchitect } from './outline-architect';
import { CharacterDesigner } from './character-designer';
import { PlotDesigner } from './plot-designer';
import { ChapterPlanner } from './chapter-planner';
import { ChapterWriter } from './chapter-writer';
import { StylePolisher } from './style-polisher';
import { ContinuityChecker } from './continuity-checker';
import { DuplicateChecker } from './duplicate-checker';
import { QualityDirector } from './quality-director';

export interface AgentTeam {
  worldviewArchitect: WorldviewArchitect;
  outlineArchitect: OutlineArchitect;
  characterDesigner: CharacterDesigner;
  plotDesigner: PlotDesigner;
  chapterPlanner: ChapterPlanner;
  chapterWriter: ChapterWriter;
  stylePolisher: StylePolisher;
  continuityChecker: ContinuityChecker;
  duplicateChecker: DuplicateChecker;
  qualityDirector: QualityDirector;
}

// 创建智能体团队
export function createAgentTeam(): AgentTeam {
  return {
    worldviewArchitect: new WorldviewArchitect(),
    outlineArchitect: new OutlineArchitect(),
    characterDesigner: new CharacterDesigner(),
    plotDesigner: new PlotDesigner(),
    chapterPlanner: new ChapterPlanner(),
    chapterWriter: new ChapterWriter(),
    stylePolisher: new StylePolisher(),
    continuityChecker: new ContinuityChecker(),
    duplicateChecker: new DuplicateChecker(),
    qualityDirector: new QualityDirector()
  };
}
