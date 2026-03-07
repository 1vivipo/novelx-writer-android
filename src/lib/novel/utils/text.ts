/**
 * 文本处理工具
 */

// 提取人物名称
export function extractCharacterNames(text: string): string[] {
  const names: Set<string> = new Set();
  
  // 匹配中文人名模式（2-4个字）
  const patterns = [
    /([\\u4e00-\\u9fa5]{2,4})(说|道|问|答|笑|哭|怒|惊|叹)/g,
    /"([^"]+)"[，,]([\\u4e00-\\u9fa5]{2,4})说/g,
    /([\\u4e00-\\u9fa5]{2,4})的(父亲|母亲|师父|师兄|师姐|师弟|师妹)/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length >= 2 && match[1].length <= 4) {
        names.add(match[1]);
      }
    }
  }
  
  return Array.from(names);
}

// 提取地点名称
export function extractLocationNames(text: string): string[] {
  const locations: Set<string> = new Set();
  
  // 匹配地点模式
  const patterns = [
    /在([\\u4e00-\\u9fa5]{2,6})(山|峰|谷|洞|殿|阁|楼|城|镇|村|岛|海|江|河)/g,
    /来到([\\u4e00-\\u9fa5]{2,6})/g,
    /离开([\\u4e00-\\u9fa5]{2,6})/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1]) {
        locations.add(match[1] + (match[2] || ''));
      }
    }
  }
  
  return Array.from(locations);
}

// 生成文本摘要
export function generateSummary(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;
  
  // 按句子分割
  const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return text.substring(0, maxLength) + '...';
  
  // 取前几句
  let summary = '';
  for (const sentence of sentences) {
    if (summary.length + sentence.length > maxLength) break;
    summary += sentence + '。';
  }
  
  return summary || text.substring(0, maxLength) + '...';
}

// 计算文本相似度（简单的Jaccard相似度）
export function calculateSimilarity(text1: string, text2: string): number {
  // 分词（简单按字符分割）
  const chars1 = new Set(text1.split(''));
  const chars2 = new Set(text2.split(''));
  
  const intersection = new Set([...chars1].filter(x => chars2.has(x)));
  const union = new Set([...chars1, ...chars2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// 检测AI痕迹
export function detectAITraces(text: string): {
  score: number;
  traces: string[];
} {
  const traces: string[] = [];
  let score = 100;
  
  // AI常用词汇
  const aiPhrases = [
    { pattern: /仿佛/g, penalty: 5, name: '仿佛' },
    { pattern: /似乎/g, penalty: 3, name: '似乎' },
    { pattern: /宛如/g, penalty: 5, name: '宛如' },
    { pattern: /那一刻/g, penalty: 8, name: '那一刻' },
    { pattern: /这一刻/g, penalty: 8, name: '这一刻' },
    { pattern: /心中涌起/g, penalty: 10, name: '心中涌起' },
    { pattern: /眼中闪过/g, penalty: 8, name: '眼中闪过' },
    { pattern: /不禁/g, penalty: 5, name: '不禁' },
    { pattern: /忍不住/g, penalty: 5, name: '忍不住' },
    { pattern: /一种莫名的/g, penalty: 10, name: '一种莫名的' },
    { pattern: /难以言喻/g, penalty: 8, name: '难以言喻' },
    { pattern: /总的来说/g, penalty: 10, name: '总的来说' },
    { pattern: /总而言之/g, penalty: 10, name: '总而言之' },
    { pattern: /综上所述/g, penalty: 10, name: '综上所述' },
    { pattern: /作为AI/g, penalty: 20, name: '作为AI' },
  ];
  
  for (const { pattern, penalty, name } of aiPhrases) {
    const matches = text.match(pattern);
    if (matches) {
      traces.push(`${name}(${matches.length}次)`);
      score -= penalty * matches.length;
    }
  }
  
  // 检查句式重复
  const sentences = text.split(/[。！？]/);
  const sentenceCounts = new Map<string, number>();
  for (const sentence of sentences) {
    const normalized = sentence.trim().substring(0, 20);
    if (normalized.length > 10) {
      sentenceCounts.set(normalized, (sentenceCounts.get(normalized) || 0) + 1);
    }
  }
  
  for (const [sentence, count] of sentenceCounts) {
    if (count > 1) {
      traces.push(`重复句式: "${sentence}..."(${count}次)`);
      score -= 5 * count;
    }
  }
  
  return {
    score: Math.max(0, score),
    traces
  };
}

// 清理AI痕迹
export function cleanAITraces(text: string): string {
  const replacements: [RegExp, string][] = [
    [/仿佛/g, ''],
    [/似乎/g, ''],
    [/宛如/g, ''],
    [/那一刻/g, ''],
    [/这一刻/g, ''],
    [/心中涌起一股/g, '心中'],
    [/眼中闪过一丝/g, '眼中'],
    [/不禁/g, ''],
    [/忍不住/g, ''],
    [/一种莫名的/g, ''],
    [/难以言喻的/g, ''],
    [/总的来说[，,。]/g, ''],
    [/总而言之[，,。]/g, ''],
    [/综上所述[，,。]/g, ''],
    [/作为AI[，,。]/g, ''],
  ];
  
  let cleaned = text;
  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // 清理多余的空白
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/[，,]{2,}/g, '，');
  cleaned = cleaned.replace(/[。]{2,}/g, '。');
  
  return cleaned;
}

// 统计文本信息
export function getTextStats(text: string): {
  charCount: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  dialogueCount: number;
} {
  return {
    charCount: text.length,
    wordCount: text.replace(/\s/g, '').length,
    sentenceCount: (text.match(/[。！？]/g) || []).length,
    paragraphCount: text.split(/\n\n+/).filter(p => p.trim()).length,
    dialogueCount: (text.match(/["「『]/g) || []).length
  };
}
