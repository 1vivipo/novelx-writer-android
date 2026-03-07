/**
 * 文件操作工具
 */

import fs from 'fs';
import path from 'path';

const NOVELS_DIR = '/home/z/my-project/novels';

// 确保目录存在
export function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 初始化小说目录
export function initNovelDir(projectId: string): string {
  const projectDir = path.join(NOVELS_DIR, projectId);
  ensureDir(projectDir);
  ensureDir(path.join(projectDir, 'settings'));
  ensureDir(path.join(projectDir, 'chapters'));
  return projectDir;
}

// 读取文件
export function readFile(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
  } catch (error) {
    console.error('读取文件失败:', error);
    return null;
  }
}

// 写入文件
export function writeFile(filePath: string, content: string): boolean {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('写入文件失败:', error);
    return false;
  }
}

// 删除文件
export function deleteFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    return false;
  }
}

// 列出目录文件
export function listFiles(dir: string): string[] {
  try {
    if (fs.existsSync(dir)) {
      return fs.readdirSync(dir);
    }
    return [];
  } catch (error) {
    console.error('列出目录失败:', error);
    return [];
  }
}

// 获取文件统计信息
export function getFileStats(filePath: string): {
  exists: boolean;
  size: number;
  created: Date | null;
  modified: Date | null;
} {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    }
    return { exists: false, size: 0, created: null, modified: null };
  } catch (error) {
    return { exists: false, size: 0, created: null, modified: null };
  }
}

// 计算目录大小
export function getDirSize(dir: string): number {
  let size = 0;
  try {
    const files = listFiles(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    console.error('计算目录大小失败:', error);
  }
  return size;
}

// 格式化文件大小
export function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
