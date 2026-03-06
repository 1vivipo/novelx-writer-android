package com.novelx.writer.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.novelx.writer.NovelViewModel
import com.novelx.writer.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateScreen(
    viewModel: NovelViewModel,
    onBack: () -> Unit,
    onCreated: (String) -> Unit
) {
    var prompt by remember { mutableStateOf("") }
    var chapters by remember { mutableStateOf("30") }
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("创建小说") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = PrimaryColor,
                    titleContentColor = SurfaceColor
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "返回", tint = SurfaceColor)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = prompt,
                onValueChange = { prompt = it },
                label = { Text("小说提示词") },
                placeholder = { Text("例如：一个少年在修仙世界中获得神秘传承，踏上强者之路") },
                modifier = Modifier.fillMaxWidth().height(150.dp),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryColor, focusedLabelColor = PrimaryColor)
            )
            
            OutlinedTextField(
                value = chapters,
                onValueChange = { if (it.all { c -> c.isDigit() } && it.length <= 3) chapters = it },
                label = { Text("章节数量") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = PrimaryColor, focusedLabelColor = PrimaryColor)
            )
            
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = PrimaryColor.copy(alpha = 0.1f))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("使用说明", style = MaterialTheme.typography.titleMedium, color = PrimaryColor)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("1. 输入小说的基本设定和故事方向\n2. 设置章节数量（建议5-100章）\n3. 点击创建后，系统将自动生成设定并开始写作\n4. 写作完成后可以在项目详情中查看", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            Button(
                onClick = {
                    val chaptersNum = chapters.toIntOrNull() ?: 30
                    if (chaptersNum in 5..500 && prompt.isNotBlank()) {
                        viewModel.createProject(prompt, chaptersNum) { projectId -> onCreated(projectId) }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                enabled = prompt.isNotBlank() && chapters.toIntOrNull()?.let { it in 5..500 } == true && !uiState.isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryColor, disabledContainerColor = TextSecondary)
            ) {
                if (uiState.isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), color = SurfaceColor)
                } else {
                    Text("创建项目")
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
