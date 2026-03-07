'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  BookOpen, Pen, Settings, Play, Pause, CheckCircle, XCircle, Clock, FileText,
  Loader2, Download, Sparkles, Users, Map, GitBranch, Mail, Globe, Database,
  Copy, Check, Trash2, Square
} from 'lucide-react'

interface Project {
  id: string
  title: string
  prompt: string
  totalChapters: number
  currentChapter: number
  status: 'pending' | 'setting' | 'writing' | 'paused' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
  error?: string
}

interface ProjectDetail extends Project {
  settings: {
    worldview: string
    characters: string
    outline: string
    plotDesign: string
    chapterOutline: string
    writingRules: string
  }
  chapters: {
    number: number
    title: string
    status: string
    wordCount: number
    createdAt: string
  }[]
}

export default function NovelWriter() {
  const [prompt, setPrompt] = useState('')
  const [totalChapters, setTotalChapters] = useState(10)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<ProjectDetail | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('create')
  const [viewingChapter, setViewingChapter] = useState<{number: number; title: string; content: string} | null>(null)
  const [viewingSetting, setViewingSetting] = useState<{title: string; content: string} | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [runLogs, setRunLogs] = useState<string[]>([])
  const [userEmail, setUserEmail] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [copied, setCopied] = useState(false)
  const [publicUrl, setPublicUrl] = useState('')

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/novel/projects')
      const data = await res.json()
      if (data.success) setProjects(data.projects)
    } catch (error) {
      console.error('加载项目失败:', error)
    }
  }, [])

  const loadProjectDetail = async (projectId: string) => {
    try {
      const res = await fetch(`/api/novel/project?id=${projectId}`)
      const data = await res.json()
      if (data.success) setSelectedProject(data.project)
    } catch (error) {
      console.error('加载项目详情失败:', error)
    }
  }

  const loadChapter = async (projectId: string, chapterNum: number) => {
    try {
      const res = await fetch(`/api/novel/chapter?projectId=${projectId}&chapter=${chapterNum}`)
      const data = await res.json()
      if (data.success) setViewingChapter(data.chapter)
    } catch (error) {
      console.error('加载章节失败:', error)
    }
  }

  const createProject = async () => {
    if (!prompt.trim()) { alert('请输入提示词'); return }
    setIsCreating(true)
    try {
      const res = await fetch('/api/novel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, totalChapters })
      })
      const data = await res.json()
      if (data.success) {
        setPrompt('')
        setTotalChapters(10)
        await loadProjects()
        setActiveTab('monitor')
        // 自动开始执行
        if (data.project?.id) {
          autoRun(data.project.id)
        }
      } else {
        alert(data.error || '创建失败')
      }
    } catch (error) {
      console.error('创建项目失败:', error)
      alert('创建项目失败')
    } finally {
      setIsCreating(false)
    }
  }

  const autoRun = async (projectId: string) => {
    setIsRunning(true)
    setRunLogs(['🚀 开始自动写作...'])
    
    try {
      const res = await fetch('/api/novel/auto-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'start' })
      })
      const data = await res.json()
      
      if (data.logs) {
        setRunLogs(data.logs)
      }
      
      if (data.needContinue && data.status !== 'completed') {
        // 需要继续执行
        setRunLogs(prev => [...prev, '⏳ 5秒后继续...'])
        setTimeout(() => autoRun(projectId), 5000)
      } else if (data.status === 'completed') {
        setRunLogs(prev => [...prev, '🎉 小说创作完成！'])
        setIsRunning(false)
      } else {
        setIsRunning(false)
      }
      
      await loadProjectDetail(projectId)
      await loadProjects()
      
    } catch (error: any) {
      setRunLogs(prev => [...prev, `❌ 错误: ${error.message}`])
      setIsRunning(false)
    }
  }

  const stopRun = async (projectId: string) => {
    try {
      await fetch('/api/novel/auto-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action: 'stop' })
      })
      setIsRunning(false)
      setRunLogs(prev => [...prev, '⏹️ 已暂停'])
      await loadProjectDetail(projectId)
      await loadProjects()
    } catch (error) {
      console.error('暂停失败:', error)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？此操作不可恢复！')) return
    
    try {
      await fetch(`/api/novel/delete?id=${projectId}`, { method: 'DELETE' })
      setSelectedProject(null)
      setActiveTab('monitor')
      await loadProjects()
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const saveEmail = async () => {
    if (!emailInput.trim()) return
    setIsSavingEmail(true)
    try {
      const res = await fetch('/api/novel/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInput })
      })
      const data = await res.json()
      if (data.success) {
        setUserEmail(emailInput)
        alert('邮箱设置成功！')
      } else {
        alert(data.error || '设置失败')
      }
    } catch (error) {
      alert('保存邮箱失败')
    } finally {
      setIsSavingEmail(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      await fetch('/api/novel/init')
      await loadProjects()
      if (typeof window !== 'undefined') setPublicUrl(window.location.origin)
      setIsLoading(false)
    }
    init()
  }, [loadProjects])

  useEffect(() => {
    const interval = setInterval(() => {
      loadProjects()
      if (selectedProject) loadProjectDetail(selectedProject.id)
    }, 5000)
    return () => clearInterval(interval)
  }, [loadProjects, selectedProject])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; icon: any }> = {
      pending: { variant: 'secondary', label: '等待中', icon: Clock },
      setting: { variant: 'default', label: '生成设定', icon: Settings },
      writing: { variant: 'default', label: '写作中', icon: Pen },
      paused: { variant: 'secondary', label: '已暂停', icon: Pause },
      completed: { variant: 'outline', label: '已完成', icon: CheckCircle },
      error: { variant: 'destructive', label: '错误', icon: XCircle }
    }
    const { variant, label, icon: Icon } = config[status] || config.pending
    return <Badge variant={variant} className="gap-1"><Icon className="w-3 h-3" />{label}</Badge>
  }

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString('zh-CN')

  const downloadChapter = (chapter: { number: number; title: string; content: string }) => {
    const blob = new Blob([chapter.content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `第${String(chapter.number).padStart(3, '0')}_${chapter.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">云端自主写小说工具</h1>
                <p className="text-xs text-slate-400">10智能体协作 · 自动写作 · 云端保存</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {publicUrl && (
                <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg">
                  <Globe className="w-4 h-4 text-green-500" />
                  <span className="text-slate-300 text-xs">{publicUrl}</span>
                </div>
              )}
              {isRunning && (
                <div className="flex items-center gap-2 text-green-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>写作中...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="create" className="data-[state=active]:bg-blue-600">
              <Sparkles className="w-4 h-4 mr-2" />创建项目
            </TabsTrigger>
            <TabsTrigger value="monitor" className="data-[state=active]:bg-blue-600">
              <Play className="w-4 h-4 mr-2" />项目列表
            </TabsTrigger>
            <TabsTrigger value="detail" className="data-[state=active]:bg-blue-600" disabled={!selectedProject}>
              <FileText className="w-4 h-4 mr-2" />项目详情
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pen className="w-5 h-5 text-blue-500" />创建新小说项目
                </CardTitle>
                <CardDescription>输入提示词，系统将自动生成完整设定并逐章写作</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">小说提示词</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="请输入小说的基本设定，例如：&#10;一个修仙世界的故事，主角是一个普通少年，意外获得一本神秘功法..."
                    className="min-h-[150px] bg-slate-900 border-slate-600 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">章节数量 (5-500)</label>
                  <Input
                    type="number"
                    value={totalChapters}
                    onChange={(e) => setTotalChapters(parseInt(e.target.value) || 10)}
                    min={5} max={500}
                    className="w-32 bg-slate-900 border-slate-600 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500">建议10-50章，每章约3000字</p>
                </div>
                <Button
                  onClick={createProject}
                  disabled={isCreating || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isCreating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />开始自动写作</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            {projects.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">暂无项目，请先创建小说项目</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors"
                    onClick={() => { loadProjectDetail(project.id); setActiveTab('detail') }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{project.title || '生成中...'}</h3>
                            {getStatusBadge(project.status)}
                          </div>
                          <p className="text-sm text-slate-400 line-clamp-2 mb-3">{project.prompt}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>章节: {project.currentChapter}/{project.totalChapters}</span>
                            <span>创建: {formatDate(project.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.status !== 'completed' && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); autoRun(project.id) }}>
                              <Play className="w-4 h-4 mr-1" />执行
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deleteProject(project.id) }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {project.error && (
                        <Alert className="mt-3 bg-red-900/20 border-red-800">
                          <AlertDescription className="text-red-400 text-sm">{project.error}</AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="detail" className="space-y-6">
            {selectedProject && (
              <>
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedProject.title || '生成中...'}</CardTitle>
                        <CardDescription>{selectedProject.prompt.substring(0, 100)}...</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedProject.status)}
                        {selectedProject.status !== 'completed' && (
                          <>
                            <Button size="sm" onClick={() => autoRun(selectedProject.id)} disabled={isRunning}>
                              {isRunning ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />执行中</> : <><Play className="w-4 h-4 mr-1" />继续</>}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => stopRun(selectedProject.id)}>
                              <Square className="w-4 h-4 mr-1" />暂停
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteProject(selectedProject.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />删除
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-500">{selectedProject.currentChapter}</div>
                        <div className="text-sm text-slate-400">已完成章节</div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-500">{selectedProject.totalChapters}</div>
                        <div className="text-sm text-slate-400">总章节数</div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-500">{selectedProject.chapters.reduce((sum, ch) => sum + ch.wordCount, 0).toLocaleString()}</div>
                        <div className="text-sm text-slate-400">总字数</div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-500">{Math.round((selectedProject.currentChapter / selectedProject.totalChapters) * 100)}%</div>
                        <div className="text-sm text-slate-400">完成进度</div>
                      </div>
                    </div>
                    {runLogs.length > 0 && (
                      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                        <div className="text-sm font-medium mb-2">执行日志</div>
                        <ScrollArea className="h-[100px]">
                          {runLogs.map((log, i) => <div key={i} className="text-xs text-slate-400">{log}</div>)}
                        </ScrollArea>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" />小说设定</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {[
                            { key: 'worldview', label: '世界观设定', icon: Map },
                            { key: 'characters', label: '人物设定', icon: Users },
                            { key: 'outline', label: '故事大纲', icon: GitBranch },
                            { key: 'plotDesign', label: '情节设计', icon: Sparkles },
                            { key: 'chapterOutline', label: '章节细纲', icon: FileText }
                          ].map(({ key, label, icon: Icon }) => (
                            <Button key={key} variant="ghost" className="w-full justify-start text-left hover:bg-slate-700"
                              onClick={() => setViewingSetting({ title: label, content: selectedProject.settings[key as keyof typeof selectedProject.settings] })}>
                              <Icon className="w-4 h-4 mr-2 text-blue-500" />{label}
                              {selectedProject.settings[key as keyof typeof selectedProject.settings] ? (
                                <Badge variant="outline" className="ml-auto">已生成</Badge>
                              ) : (
                                <Badge variant="secondary" className="ml-auto">待生成</Badge>
                              )}
                            </Button>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-purple-500" />章节列表</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {Array.from({ length: selectedProject.totalChapters }, (_, i) => i + 1).map((num) => {
                            const chapter = selectedProject.chapters.find(ch => ch.number === num)
                            return (
                              <div key={num} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-700/50 cursor-pointer"
                                onClick={() => chapter && loadChapter(selectedProject.id, num)}>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-slate-500 w-16">第{String(num).padStart(3, '0')}章</span>
                                  <span className="text-sm">{chapter?.title || '待写作'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {chapter?.status === 'completed' && (
                                    <><span className="text-xs text-slate-500">{chapter.wordCount}字</span><CheckCircle className="w-4 h-4 text-green-500" /></>
                                  )}
                                  {chapter?.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                                  {!chapter && num > selectedProject.currentChapter && <Clock className="w-4 h-4 text-slate-500" />}
                                  {!chapter && num === selectedProject.currentChapter + 1 && selectedProject.status === 'writing' && (
                                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* 章节查看弹窗 */}
      {viewingChapter && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>第{String(viewingChapter.number).padStart(3, '0')}章 {viewingChapter.title}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadChapter(viewingChapter)}>
                    <Download className="w-4 h-4 mr-2" />下载
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewingChapter(null)}>关闭</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[60vh]">
                <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">{viewingChapter.content}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 设定查看弹窗 */}
      {viewingSetting && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle>{viewingSetting.title}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewingSetting(null)}>关闭</Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[60vh]">
                <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">{viewingSetting.content || '内容生成中...'}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
