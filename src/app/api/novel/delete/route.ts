/**
 * 删除项目 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');
    
    if (!projectId) {
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
    }
    
    // 删除章节
    await supabase.from('chapters').delete().eq('project_id', projectId);
    
    // 删除设定
    await supabase.from('settings').delete().eq('project_id', projectId);
    
    // 删除项目
    await supabase.from('projects').delete().eq('id', projectId);
    
    return NextResponse.json({ success: true, message: '项目已删除' });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
