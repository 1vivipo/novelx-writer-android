package com.novelx.writer

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectListScreen(
    projects: List<Project>,
    onProjectClick: (Project) -> Unit,
    onCreateProject: (String, Int) -> Unit
) {
    var showCreateDialog by remember { mutableStateOf(false) }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("NovelX Writer") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF6366F1),
                    titleContentColor = Color.White
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showCreateDialog = true },
                containerColor = Color(0xFF6366F1)
            ) {
                Icon(Icons.Default.Add, contentDescription = "创建", tint = Color.White)
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(projects) { project ->
                ProjectCard(project = project, onClick = { onProjectClick(project) })
            }
        }
    }
    
    if (showCreateDialog) {
        CreateProjectDialog(
            onDismiss = { showCreateDialog = false },
            onCreate = { prompt, chapters ->
                onCreateProject(prompt, chapters)
                showCreateDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectCard(project: Project, onClick: () -> Unit) {
    val statusColor = when (project.status) {
        "pending" -> Color(0xFFF59E0B)
        "setting" -> Color(0xFF6366F1)
        "writing" -> Color(0xFF8B5CF6)
        "completed" -> Color(0xFF10B981)
        "error" -> Color(0xFFEF4444)
        else -> Color.Gray
    }
    
    val statusText = when (project.status) {
        "pending" -> "等待中"
        "setting" -> "生成设定"
        "writing" -> "写作中"
        "completed" -> "已完成"
        "error" -> "错误"
        else -> project.status
    }
    
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = project.title.ifEmpty { "生成中..." },
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Surface(color = statusColor, shape = MaterialTheme.shapes.small) {
                    Text(
                        text = statusText,
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = project.prompt,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "进度: ${project.currentChapter}/${project.totalChapters} 章",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
                LinearProgressIndicator(
                    progress = if (project.totalChapters > 0) project.currentChapter.toFloat() / project.totalChapters else 0f,
                    modifier = Modifier.width(100.dp).height(4.dp),
                    color = statusColor,
                    trackColor = statusColor.copy(alpha = 0.2f)
                )
            }
        }
    }
}

@Composable
fun CreateProjectDialog(
    onDismiss: () -> Unit,
    onCreate: (String, Int) -> Unit
) {
    var prompt by remember { mutableStateOf("") }
    var chapters by remember { mutableStateOf("30") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("创建小说") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = prompt,
                    onValueChange = { prompt = it },
                    label = { Text("小说提示词") },
                    placeholder = { Text("描述你想写的小说") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = chapters,
                    onValueChange = { if (it.all { c -> c.isDigit() }) chapters = it },
                    label = { Text("章节数量") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val chaptersNum = chapters.toIntOrNull() ?: 30
                    if (prompt.isNotBlank() && chaptersNum in 5..500) {
                        onCreate(prompt, chaptersNum)
                    }
                },
                enabled = prompt.isNotBlank()
            ) {
                Text("创建")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("取消")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectDetailScreen(
    project: Project,
    onBack: () -> Unit,
    onRefresh: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(project.title.ifEmpty { "项目详情" }) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF6366F1),
                    titleContentColor = Color.White
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "返回", tint = Color.White)
                    }
                },
                actions = {
                    IconButton(onClick = onRefresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "刷新", tint = Color.White)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("状态: ${project.status}", style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("进度: ${project.currentChapter}/${project.totalChapters} 章", style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("提示词: ${project.prompt}", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                }
            }
            
            if (project.error != null) {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2))) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text("错误信息", style = MaterialTheme.typography.titleMedium, color = Color(0xFFEF4444))
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(project.error!!, style = MaterialTheme.typography.bodyMedium, color = Color(0xFFEF4444))
                    }
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            Button(
                onClick = onRefresh,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("刷新状态")
            }
        }
    }
}
