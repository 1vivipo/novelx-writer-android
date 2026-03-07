/**
 * 配置API
 * 设置用户邮箱等配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { setUserEmail, getUserEmail } from '@/lib/novel/scheduler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: '请输入邮箱地址' },
        { status: 400 }
      );
    }
    
    // 简单验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }
    
    setUserEmail(email);
    
    return NextResponse.json({
      success: true,
      message: `邮箱设置成功: ${email}`,
      email
    });
    
  } catch (error) {
    console.error('设置邮箱失败:', error);
    return NextResponse.json(
      { error: '设置邮箱失败' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const email = getUserEmail();
    return NextResponse.json({
      success: true,
      email
    });
  } catch (error) {
    console.error('获取邮箱失败:', error);
    return NextResponse.json(
      { error: '获取邮箱失败' },
      { status: 500 }
    );
  }
}
