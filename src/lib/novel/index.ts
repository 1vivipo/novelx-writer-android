/**
 * 小说写作系统主模块
 * 
 * 这是一个完整的云端自主写小说工具，包含：
 * - 10个智能体协作
 * - 自动生成设定
 * - 逐章写作
 * - 去AI味
 * - 查重审核
 * - 云端自主运行
 */

// 类型定义
export * from './types';

// 智能体
export * from './agents';

// 调度器
export { NovelScheduler, getScheduler } from './scheduler';

// 工具
export * from './utils';
