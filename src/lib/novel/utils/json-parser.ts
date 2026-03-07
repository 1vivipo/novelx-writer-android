/**
 * JSON 解析工具
 * 用于安全解析 AI 返回的 JSON
 */

/**
 * 安全解析 JSON，支持多种格式和错误恢复
 */
export function safeParseJSON<T>(content: string, defaultValue: T): T {
  if (!content || typeof content !== 'string') {
    return defaultValue;
  }
  
  // 尝试多种 JSON 提取方式
  const patterns = [
    /\{[\s\S]*\}/,           // 标准JSON对象
    /\[[\s\S]*\]/,           // JSON数组
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        // 尝试直接解析
        return JSON.parse(match[0]) as T;
      } catch (e) {
        // 尝试修复常见的 JSON 错误
        let fixed = match[0];
        
        // 修复末尾多余的逗号
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        // 修复缺少引号的键名
        fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
        
        // 修复单引号
        fixed = fixed.replace(/'/g, '"');
        
        // 修复换行符在字符串中
        fixed = fixed.replace(/\n/g, '\\n');
        
        try {
          return JSON.parse(fixed) as T;
        } catch (e2) {
          console.error('JSON 解析失败:', e2);
          continue;
        }
      }
    }
  }
  
  return defaultValue;
}

/**
 * 从 AI 响应中提取 JSON
 */
export function extractJSON<T>(content: string): T | null {
  if (!content) return null;
  
  // 尝试找到 JSON 代码块
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch (e) {
      // 继续尝试其他方式
    }
  }
  
  // 尝试找到 JSON 对象
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]) as T;
    } catch (e) {
      // 尝试修复
      let fixed = jsonMatch[0];
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      fixed = fixed.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      fixed = fixed.replace(/'/g, '"');
      
      try {
        return JSON.parse(fixed) as T;
      } catch (e2) {
        console.error('JSON 提取失败:', e2);
      }
    }
  }
  
  return null;
}

/**
 * 带重试的 JSON 提取
 */
export async function extractJSONWithRetry<T>(
  getContent: () => Promise<string>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const content = await getContent();
      const result = extractJSON<T>(content);
      if (result) return result;
      
      console.log(`JSON 提取失败，重试 ${i + 1}/${maxRetries}`);
    } catch (e) {
      console.error(`提取尝试 ${i + 1} 失败:`, e);
    }
  }
  return null;
}
