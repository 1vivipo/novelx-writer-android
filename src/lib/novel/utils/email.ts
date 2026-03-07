/**
 * 邮件发送服务
 * 负责发送章节完成通知邮件
 */

import nodemailer from 'nodemailer';

// 邮件配置
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

// 获取邮件配置
function getEmailConfig(): EmailConfig | null {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587');
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  
  if (!host || !user || !pass) {
    console.log('[邮件服务] 未配置邮件服务器，跳过邮件发送');
    return null;
  }
  
  return { host, port, secure: port === 465, user, pass };
}

// 创建邮件传输器
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  
  const config = getEmailConfig();
  if (!config) return null;
  
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
  
  return transporter;
}

// 发送章节完成邮件
export async function sendChapterEmail(params: {
  to: string;
  projectTitle: string;
  chapterNum: number;
  chapterTitle: string;
  content: string;
  wordCount: number;
}): Promise<{ success: boolean; error?: string }> {
  const { to, projectTitle, chapterNum, chapterTitle, content, wordCount } = params;
  
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: '邮件服务未配置' };
  }
  
  const paddedNum = String(chapterNum).padStart(3, '0');
  const subject = `【小说更新】${projectTitle} - 第${paddedNum}章 ${chapterTitle}`;
  
  const html = `
    <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; border-bottom: 2px solid #4a90d9; padding-bottom: 10px;">
        📖 ${projectTitle}
      </h2>
      <h3 style="color: #666;">第${paddedNum}章 ${chapterTitle}</h3>
      <p style="color: #888; font-size: 14px;">
        字数：${wordCount.toLocaleString()} 字 | 完成时间：${new Date().toLocaleString('zh-CN')}
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <div style="line-height: 1.8; white-space: pre-wrap; color: #333;">
${content}
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="color: #999; font-size: 12px; text-align: center;">
        此邮件由云端自主写小说工具自动发送
      </p>
    </div>
  `;
  
  // 纯文本版本
  const text = `
${projectTitle}

第${paddedNum}章 ${chapterTitle}
字数：${wordCount.toLocaleString()} 字
完成时间：${new Date().toLocaleString('zh-CN')}

${content}

---
此邮件由云端自主写小说工具自动发送
  `.trim();
  
  try {
    await transport.sendMail({
      from: `"云端写小说" <${getEmailConfig()?.user}>`,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: `第${paddedNum}章_${chapterTitle}.txt`,
          content: content,
          contentType: 'text/plain; charset=utf-8'
        }
      ]
    });
    
    console.log(`[邮件服务] 已发送第 ${chapterNum} 章到 ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error(`[邮件服务] 发送失败:`, error);
    return { success: false, error: String(error) };
  }
}

// 发送项目完成通知
export async function sendProjectCompleteEmail(params: {
  to: string;
  projectTitle: string;
  totalChapters: number;
  totalWords: number;
}): Promise<{ success: boolean; error?: string }> {
  const { to, projectTitle, totalChapters, totalWords } = params;
  
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: '邮件服务未配置' };
  }
  
  const subject = `【小说完成】${projectTitle} - 全部 ${totalChapters} 章已完成`;
  
  const html = `
    <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #4CAF50; text-align: center;">
        🎉 小说创作完成！
      </h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">${projectTitle}</h3>
        <p style="color: #666;">
          <strong>总章节：</strong>${totalChapters} 章<br>
          <strong>总字数：</strong>${totalWords.toLocaleString()} 字<br>
          <strong>完成时间：</strong>${new Date().toLocaleString('zh-CN')}
        </p>
      </div>
      <p style="color: #888; text-align: center;">
        您可以在网页端查看和下载所有章节
      </p>
    </div>
  `;
  
  try {
    await transport.sendMail({
      from: `"云端写小说" <${getEmailConfig()?.user}>`,
      to,
      subject,
      html
    });
    
    console.log(`[邮件服务] 已发送项目完成通知到 ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error(`[邮件服务] 发送失败:`, error);
    return { success: false, error: String(error) };
  }
}

// 测试邮件配置
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: '邮件服务未配置' };
  }
  
  try {
    await transport.verify();
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
