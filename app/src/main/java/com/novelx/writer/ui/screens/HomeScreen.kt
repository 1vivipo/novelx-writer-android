package com.novelx.writer.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.novelx.writer.NovelViewModel
import com.novelx.writer.Project
import com.novelx.writer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: NovelViewModel,
    onNavigateToCreate: () -> Unit,
    onNavigateToProject: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadProjects()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("NovelX Writer") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = PrimaryColor,
                    titleContentColor = SurfaceColor
                ),
                actions = {
                    IconButton(onClick = { viewModel.loadProjects() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "刷新", tint = SurfaceColor)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToCreate,
                containerColor = PrimaryColor,
                contentColor = SurfaceColor
            ) {
                Icon(Icons.Default.Add, contentDescription = "创建项目")
            }
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = PrimaryColor)
            }
        } else if (uiState.projects.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Icon(Icons.Default.Book, contentDescription = null, modifier = Modifier.size(64.dp), tint = TextSecondary)
                    Text("还没有小说项目", style = MaterialTheme.typography.titleMedium, color = TextSecondary)
                    Text("点击右下角按钮创建第一个项目", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(uiState.projects) { project ->
                    ProjectCard(project = project, onClick = { onNavigateToProject(project.id) })
                }
            }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectCard(project: Project, onClick: () -> Unit) {
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
        "setting" -> "生成设定"
        "writing" -> "写作中"
        "completed" -> "已完成"
        "error" -> "错误"
        else -> project.status
    }
    
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = SurfaceColor)
    ) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = project.title.ifEmpty { "生成中..." },
                    style = MaterialTheme.typography.titleMedium,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                Surface(color = statusColor, shape = MaterialTheme.shapes.small) {
                    Text(text = statusText, style = MaterialTheme.typography.labelSmall, color = SurfaceColor, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(text = project.prompt, style = MaterialTheme.typography.bodyMedium, color = TextSecondary, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(text = "进度: ${project.currentChapter}/${project.totalChapters} 章", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                val progress = if (project.totalChapters > 0) project.currentChapter.toFloat() / project.totalChapters.toFloat() else 0f
                LinearProgressIndicator(
                    progress = progress,
                    modifier = Modifier.width(100.dp).height(4.dp),
                    color = statusColor,
                    trackColor = statusColor.copy(alpha = 0.2f)
                )
            }
        }
    }
}
