package com.novelx.writer.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.novelx.writer.NovelViewModel
import com.novelx.writer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChapterScreen(
    projectId: String,
    chapterNum: Int,
    viewModel: NovelViewModel,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val chapter = uiState.currentChapter
    
    LaunchedEffect(projectId, chapterNum) {
        viewModel.loadChapter(projectId, chapterNum)
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(chapter?.title ?: "第${chapterNum}章", maxLines = 1, overflow = TextOverflow.Ellipsis) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = PrimaryColor,
                    titleContentColor = SurfaceColor
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回", tint = SurfaceColor)
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = androidx.compose.ui.Alignment.Center) {
                CircularProgressIndicator(color = PrimaryColor)
            }
        } else if (chapter != null) {
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                Surface(modifier = Modifier.fillMaxWidth(), color = PrimaryColor.copy(alpha = 0.1f)) {
                    Row(modifier = Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("第${chapter.number}章", style = MaterialTheme.typography.titleMedium, color = PrimaryColor)
                        Text("${chapter.wordCount} 字", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                    }
                }
                HorizontalDivider()
                Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
                    Text(text = chapter.content, style = MaterialTheme.typography.bodyLarge, color = TextPrimary, lineHeight = MaterialTheme.typography.bodyLarge.fontSize * 1.8)
                }
            }
        } else {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = androidx.compose.ui.Alignment.Center) {
                Text("章节不存在", style = MaterialTheme.typography.bodyLarge, color = TextSecondary)
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
