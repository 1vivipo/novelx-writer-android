package com.novelx.writer.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.novelx.writer.ChapterInfo
import com.novelx.writer.NovelViewModel
import com.novelx.writer.ProjectDetail
import com.novelx.writer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectScreen(
    projectId: String,
    viewModel: NovelViewModel,
    onBack: () -> Unit,
    onReadChapter: (Int) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val project = uiState.currentProject
    
    LaunchedEffect(projectId) {
        viewModel.loadProject(projectId)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(project?.title ?: "加载中...", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = PrimaryColor,
                    titleContentColor = SurfaceColor
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回", tint = SurfaceColor)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.loadProject(projectId) }) {
                        Icon(Icons.Default.Refresh, contentDescription = "刷新", tint = SurfaceColor)
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading && project == null) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = PrimaryColor)
            }
        } else if (project != null) {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item { ProjectInfoCard(project = project) }
                item { ActionButtons(project = project, projectId = projectId, viewModel = viewModel, onRefresh = { viewModel.loadProject(projectId) }) }
                item { Text("章节列表", style = MaterialTheme.typography.titleMedium, color = TextPrimary) }
                
                if (project.chapters.isNotEmpty()) {
                    items(project.chapters) { chapter ->
                        ChapterItem(chapter = chapter, onClick = { onReadChapter(chapter.number) })
                    }
                } else {
                    item {
                        Box(modifier = Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text("还没有章节", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                        }
                    }
                }
            }
        }
        
        uiState.message?.let { message ->
            Snackbar(modifier = Modifier.padding(16.dp), action = { TextButton(onClick = { viewModel.clearMessage() }) { Text("关闭") } }) { Text(message) }
        }
        
        uiState.error?.let { error ->
            AlertDialog(
                onDismissRequest = { viewModel.clearError() },
                title = { Text("错误") },
                text = { Text(error) },
                confirmButton = { TextButton(onClick = { viewModel.clearError() }) { Text("确定") } }
            )
        }
    }
}

@Composable
fun ProjectInfoCard(project: ProjectDetail) {
    val statusColor = when (project.status) {
        "pending" -> WarningColor
        "setting" -> PrimaryColor
        "writing" -> SecondaryColor
        "completed" -> SuccessColor
        "error" -> ErrorColor
        else -> TextSecondary
    }
    
    val statusText = when (project.status) {
        "pending" -> "等待中"
        "setting" -> "生成设定中"
        "writing" -> "写作中"
        "completed" -> "已完成"
        "error" -> "错误"
        else -> project.status
    }
    
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = SurfaceColor)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("状态", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Surface(color = statusColor, shape = MaterialTheme.shapes.small) {
                    Text(statusText, style = MaterialTheme.typography.labelSmall, color = SurfaceColor, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("进度", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Text("${project.currentChapter}/${project.totalChapters} 章", style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
            }
            Spacer(modifier = Modifier.height(8.dp))
            val progress = project.currentChapter.toFloat() / project.totalChapters.toFloat().coerceAtLeast(1f)
            LinearProgressIndicator(
                progress = progress,
                modifier = Modifier.fillMaxWidth().height(8.dp),
                color = statusColor,
                trackColor = statusColor.copy(alpha = 0.2f)
            )
        }
    }
}

@Composable
fun ActionButtons(project: ProjectDetail, projectId: String, viewModel: NovelViewModel, onRefresh: () -> Unit) {
    val uiState by viewModel.uiState.collectAsState()
    
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        when (project.status) {
            "pending" -> {
                Button(
                    onClick = { viewModel.executeStep(projectId, "worldview") { onRefresh() } },
                    modifier = Modifier.weight(1f),
                    enabled = !uiState.isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryColor)
                ) {
                    if (uiState.isLoading) { CircularProgressIndicator(modifier = Modifier.size(20.dp), color = SurfaceColor) }
                    else { Icon(Icons.Default.PlayArrow, contentDescription = null); Spacer(modifier = Modifier.width(4.dp)); Text("开始生成") }
                }
            }
            "setting" -> {
                Button(
                    onClick = {
                        val step = when {
                            project.settings.worldview.isEmpty() -> "worldview"
                            project.settings.outline.isEmpty() -> "outline"
                            project.settings.characters.isEmpty() -> "characters"
                            project.settings.plotDesign.isEmpty() -> "plot"
                            project.settings.chapterOutline.isEmpty() -> "chapter_outline"
                            else -> null
                        }
                        step?.let { viewModel.executeStep(projectId, it) { onRefresh() } }
                    },
                    modifier = Modifier.weight(1f),
                    enabled = !uiState.isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryColor)
                ) {
                    if (uiState.isLoading) { CircularProgressIndicator(modifier = Modifier.size(20.dp), color = SurfaceColor) }
                    else { Icon(Icons.Default.AutoFixHigh, contentDescription = null); Spacer(modifier = Modifier.width(4.dp)); Text("继续生成") }
                }
            }
            "writing" -> {
                Button(
                    onClick = { viewModel.executeStep(projectId, "write_chapter", project.currentChapter + 1) { onRefresh() } },
                    modifier = Modifier.weight(1f),
                    enabled = !uiState.isLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = SecondaryColor)
                ) {
                    if (uiState.isLoading) { CircularProgressIndicator(modifier = Modifier.size(20.dp), color = SurfaceColor) }
                    else { Icon(Icons.Default.Edit, contentDescription = null); Spacer(modifier = Modifier.width(4.dp)); Text("写作下一章") }
                }
            }
            else -> {}
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChapterItem(chapter: ChapterInfo, onClick: () -> Unit) {
    val statusColor = when (chapter.status) {
        "completed" -> SuccessColor
        "error" -> ErrorColor
        else -> WarningColor
    }
    
    ListItem(
        headlineContent = { Text("第${chapter.number}章 ${chapter.title}", style = MaterialTheme.typography.bodyLarge, color = TextPrimary) },
        supportingContent = { Text("${chapter.wordCount} 字", style = MaterialTheme.typography.bodySmall, color = TextSecondary) },
        trailingContent = {
            Surface(color = statusColor, shape = MaterialTheme.shapes.small) {
                Text(when (chapter.status) { "completed" -> "完成"; "error" -> "错误"; else -> "待写" }, style = MaterialTheme.typography.labelSmall, color = SurfaceColor, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
            }
        },
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        colors = ListItemDefaults.colors(containerColor = SurfaceColor)
    )
    Divider(modifier = Modifier.padding(start = 16.dp), color = TextSecondary.copy(alpha = 0.1f))
}
