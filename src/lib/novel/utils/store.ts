/**
 * 存储适配器
 * 根据环境自动选择存储方式
 */

// 检测是否在 Vercel 环境
const isVercel = process.env.VERCEL === '1';

// 内存存储（用于 Vercel 无服务器环境）
const memoryStore = {
  projects: new Map<string, any>(),
  settings: new Map<string, any>(),
  chapters: new Map<string, any[]>(),
  schedulerState: {
    runningProjects: [] as string[],
    queue: [] as string[],
    lastUpdate: new Date().toISOString()
  }
};

// 项目存储路径（本地环境）
const NOVELS_DIR = '/home/z/my-project/novels';

export function getProjectStore() {
  if (isVercel) {
    return {
      type: 'memory',
      save: async (projectId: string, project: any) => {
        memoryStore.projects.set(projectId, project);
        return true;
      },
      load: async (projectId: string) => {
        return memoryStore.projects.get(projectId) || null;
      },
      loadAll: async () => {
        return Array.from(memoryStore.projects.values());
      },
      saveChapters: async (projectId: string, chapters: any[]) => {
        memoryStore.chapters.set(projectId, chapters);
      },
      loadChapters: async (projectId: string) => {
        return memoryStore.chapters.get(projectId) || [];
      },
      getSchedulerState: () => memoryStore.schedulerState,
      updateSchedulerState: (state: any) => {
        Object.assign(memoryStore.schedulerState, state);
      }
    };
  }
  
  // 本地环境使用文件系统
  return {
    type: 'filesystem',
    save: async (projectId: string, project: any) => {
      // 文件系统存储在 scheduler 中实现
      return true;
    },
    load: async (projectId: string) => {
      return null;
    },
    loadAll: async () => {
      return [];
    },
    saveChapters: async (projectId: string, chapters: any[]) => {
      return true;
    },
    loadChapters: async (projectId: string) => {
      return [];
    },
    getSchedulerState: () => memoryStore.schedulerState,
    updateSchedulerState: (state: any) => {
      Object.assign(memoryStore.schedulerState, state);
    }
  };
}

export { memoryStore, isVercel };
