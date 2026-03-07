/**
 * 获取调度器状态 API
 */

import { NextResponse } from 'next/server';
import { getScheduler } from '@/lib/novel/scheduler';

export async function GET() {
  try {
    const scheduler = getScheduler();
    const status = scheduler.getSchedulerStatus();
    
    return NextResponse.json({
      success: true,
      scheduler: {
        runningProjects: status.runningProjects,
        queueLength: status.queue.length,
        lastUpdate: status.lastUpdate,
        maxConcurrent: 3,
        userEmail: status.userEmail
      }
    });
    
  } catch (error) {
    console.error('获取状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取状态失败' },
      { status: 500 }
    );
  }
}
