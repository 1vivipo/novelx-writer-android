/**
 * 初始化调度器 API
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function GET() {
  try {
    // 初始化调度器
    getScheduler();
    
    return NextResponse.json({
      success: true,
      message: '调度器已初始化'
    });
    
  } catch (error) {
    console.error('初始化失败:', error);
    return NextResponse.json(
      { success: false, error: '初始化失败' },
      { status: 500 }
    );
  }
}
