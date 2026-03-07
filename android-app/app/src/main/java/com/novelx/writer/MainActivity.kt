package com.novelx.writer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
import com.novelx.writer.ui.theme.NovelXWriterTheme
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.concurrent.TimeUnit

data class Project(
    val id: String,
    val title: String,
    val prompt: String,
    val totalChapters: Int,
    val currentChapter: Int,
    val status: String,
    val error: String?,
    val createdAt: String,
    val updatedAt: String
)

class MainActivity : ComponentActivity() {
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(180, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    companion object {
        private const val BASE_URL = "https://my-project-eight-chi-80.vercel.app/api"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NovelXWriterTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    MainScreen()
                }
            }
        }
    }
    
    @Composable
    fun MainScreen() {
        var projects by remember { mutableStateOf<List<Project>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        var error by remember { mutableStateOf<String?>(null) }
        var selectedProject by remember { mutableStateOf<Project?>(null) }
        var isRunning by remember { mutableStateOf(false) }
        var runMessage by remember { mutableStateOf<String?>(null) }
        
        LaunchedEffect(Unit) {
            loadProjects { result ->
                when (result) {
                    is Result.Success -> { projects = result.data; isLoading = false }
                    is Result.Error -> { error = result.message; isLoading = false }
                }
            }
        }
        
        when {
            selectedProject != null -> ProjectDetailScreen(
                project = selectedProject!!,
                isRunning = isRunning,
                runMessage = runMessage,
                onBack = { selectedProject = null; loadProjects { if (it is Result.Success) projects = it.data } },
                onRefresh = { loadProjectDetail(selectedProject!!.id) { if (it is Result.Success) selectedProject = it.data } },
                onAutoRun = { 
                    isRunning = true
                    runMessage = "正在执行..."
                    autoRunStep(selectedProject!!.id) { result ->
                        isRunning = false
                        when (result) {
                            is Result.Success -> {
                                runMessage = result.data
                                loadProjectDetail(selectedProject!!.id) { if (it is Result.Success) selectedProject = it.data }
                            }
                            is Result.Error -> runMessage = "错误: ${result.message}"
                        }
                    }
                },
                onDelete = {
                    deleteProject(selectedProject!!.id) { result ->
                        if (result is Result.Success) {
                            selectedProject = null
                            loadProjects { if (it is Result.Success) projects = it.data }
                        }
                    }
                }
            )
            isLoading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(color = Color(0xFF6366F1))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("加载中...", color = Color.Gray)
                }
            }
            error != null -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("加载失败: $error", color = Color(0xFFEF4444))
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { isLoading = true; error = null; loadProjects { if (it is Result.Success) projects = it.data else error = it.message } }, 
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))) { Text("重试") }
                }
            }
            projects.isEmpty() -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { Text("暂无项目", color = Color.Gray) }
            else -> ProjectListScreen(
                projects = projects,
                onProjectClick = { selectedProject = it },
                onCreateProject = { p, c -> createProject(p, c) { loadProjects { if (it is Result.Success) projects = it.data } } },
                onDelete = { id -> deleteProject(id) { loadProjects { if (it is Result.Success) projects = it.data } } }
            )
        }
    }
    
    sealed class Result<T> { data class Success<T>(val data: T) : Result<T>(); data class Error<T>(val message: String) : Result<T>() }
    
    private fun loadProjects(callback: (Result<List<Project>>) -> Unit) {
        Thread { try {
            val request = Request.Builder().url("$BASE_URL/novel/projects").build()
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val body = response.body?.string() ?: "{}"
                    val map: Map<String, Any> = gson.fromJson(body, object : TypeToken<Map<String, Any>>() {}.type)
                    @Suppress("UNCHECKED_CAST")
                    val list = (map["projects"] as? List<*>)?.map { val p = it as Map<String, Any?>
                        Project(p["id"] as? String ?: "", p["title"] as? String ?: "", p["prompt"] as? String ?: "",
                            (p["totalChapters"] as? Number)?.toInt() ?: 0, (p["currentChapter"] as? Number)?.toInt() ?: 0,
                            p["status"] as? String ?: "", p["error"] as? String, p["createdAt"] as? String ?: "", p["updatedAt"] as? String ?: "")
                    } ?: emptyList()
                    runOnUiThread { callback(Result.Success(list)) }
                } else runOnUiThread { callback(Result.Error("HTTP ${response.code}")) }
            }
        } catch (e: Exception) { runOnUiThread { callback(Result.Error(e.message ?: "Error")) } } }.start()
    }
    
    private fun loadProjectDetail(id: String, callback: (Result<Project>) -> Unit) {
        Thread { try {
            val request = Request.Builder().url("$BASE_URL/novel/project?id=$id").build()
            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val map: Map<String, Any> = gson.fromJson(response.body?.string() ?: "{}", object : TypeToken<Map<String, Any>>() {}.type)
                    @Suppress("UNCHECKED_CAST")
                    val p = map["project"] as? Map<String, Any?>
                    if (p != null) runOnUiThread { callback(Result.Success(Project(p["id"] as? String ?: "", p["title"] as? String ?: "", p["prompt"] as? String ?: "",
                        (p["totalChapters"] as? Number)?.toInt() ?: 0, (p["currentChapter"] as? Number)?.toInt() ?: 0,
                        p["status"] as? String ?: "", p["error"] as? String, p["createdAt"] as? String ?: "", p["updatedAt"] as? String ?: ""))) }
                    else runOnUiThread { callback(Result.Error("Not found")) }
                } else runOnUiThread { callback(Result.Error("HTTP ${response.code}")) }
            }
        } catch (e: Exception) { runOnUiThread { callback(Result.Error(e.message ?: "Error")) } } }.start()
    }
    
    private fun createProject(prompt: String, chapters: Int, callback: () -> Unit) {
        Thread { try {
            val body = """{"prompt":"$prompt","totalChapters":$chapters}""".toRequestBody("application/json".toMediaType())
            val request = Request.Builder().url("$BASE_URL/novel/create").post(body).build()
            client.newCall(request).execute().use { 
                if (it.isSuccessful) runOnUiThread { callback() }
            }
        } catch (e: Exception) { } }.start()
    }
    
    private fun deleteProject(id: String, callback: (Result<String>) -> Unit) {
        Thread { try {
            val request = Request.Builder().url("$BASE_URL/novel/delete?id=$id").delete().build()
            client.newCall(request).execute().use {
                if (it.isSuccessful) runOnUiThread { callback(Result.Success("Deleted")) }
                else runOnUiThread { callback(Result.Error("HTTP ${it.code}")) }
            }
        } catch (e: Exception) { runOnUiThread { callback(Result.Error(e.message ?: "Error")) } } }.start()
    }
    
    private fun autoRunStep(id: String, callback: (Result<String>) -> Unit) {
        Thread { try {
            // 先获取项目状态，决定下一步
            val detailRequest = Request.Builder().url("$BASE_URL/novel/project?id=$id").build()
            val detailResponse = client.newCall(detailRequest).execute()
            
            if (detailResponse.isSuccessful) {
                val map: Map<String, Any> = gson.fromJson(detailResponse.body?.string() ?: "{}", object : TypeToken<Map<String, Any>>() {}.type)
                @Suppress("UNCHECKED_CAST")
                val p = map["project"] as? Map<String, Any?>
                val status = p?.get("status") as? String ?: ""
                val settings = p?.get("settings") as? Map<String, Any?> ?: emptyMap()
                val currentChapter = (p?.get("currentChapter") as? Number)?.toInt() ?: 0
                val totalChapters = (p?.get("totalChapters") as? Number)?.toInt() ?: 0
                
                // 决定下一步
                val nextStep = when {
                    status == "pending" -> "worldview"
                    status == "setting" && settings["worldview"] == null -> "worldview"
                    status == "setting" && settings["outline"] == null -> "outline"
                    status == "setting" && settings["characters"] == null -> "characters"
                    status == "setting" && settings["plotDesign"] == null -> "plot"
                    status == "setting" && settings["chapterOutline"] == null -> "chapter_outline"
                    status == "writing" || status == "setting" -> "write_chapter"
                    else -> null
                }
                
                if (nextStep == null || status == "completed") {
                    runOnUiThread { callback(Result.Success("已完成！")) }
                    return@Thread
                }
                
                // 执行步骤
                val stepBody = """{"projectId":"$id","step":"$nextStep","chapter":${currentChapter + 1}}""".toRequestBody("application/json".toMediaType())
                val stepRequest = Request.Builder().url("$BASE_URL/novel/step").post(stepBody).build()
                
                client.newCall(stepRequest).execute().use { stepResponse ->
                    if (stepResponse.isSuccessful) {
                        val stepMap: Map<String, Any> = gson.fromJson(stepResponse.body?.string() ?: "{}", object : TypeToken<Map<String, Any>>() {}.type)
                        val message = stepMap["message"] as? String ?: "完成"
                        runOnUiThread { callback(Result.Success(message)) }
                    } else {
                        runOnUiThread { callback(Result.Error("HTTP ${stepResponse.code}")) }
                    }
                }
            } else {
                runOnUiThread { callback(Result.Error("HTTP ${detailResponse.code}")) }
            }
        } catch (e: Exception) { runOnUiThread { callback(Result.Error(e.message ?: "Error")) } } }.start()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectListScreen(projects: List<Project>, onProjectClick: (Project) -> Unit, onCreateProject: (String, Int) -> Unit, onDelete: (String) -> Unit) {
    var showDialog by remember { mutableStateOf(false) }
    Scaffold(
        topBar = { TopAppBar(title = { Text("NovelX Writer") }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF6366F1), titleContentColor = Color.White)) },
        floatingActionButton = { FloatingActionButton(onClick = { showDialog = true }, containerColor = Color(0xFF6366F1)) { Icon(Icons.Default.Add, null, tint = Color.White) } }
    ) { padding ->
        LazyColumn(modifier = Modifier.fillMaxSize().padding(padding), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(projects) { project ->
                ProjectCard(project, onProjectClick, onDelete)
            }
        }
    }
    if (showDialog) { var prompt by remember { mutableStateOf("") }; var chapters by remember { mutableStateOf("10") }
        AlertDialog(onDismissRequest = { showDialog = false }, title = { Text("创建小说") }, text = { Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            OutlinedTextField(prompt, { prompt = it }, label = { Text("提示词") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(chapters, { if (it.all { c -> c.isDigit() }) chapters = it }, label = { Text("章节数(5-500)") }, modifier = Modifier.fillMaxWidth())
        }}, confirmButton = { Button(onClick = { val c = chapters.toIntOrNull() ?: 10; if (prompt.isNotBlank() && c in 5..500) { onCreateProject(prompt, c); showDialog = false } }, enabled = prompt.isNotBlank()) { Text("创建") } }, dismissButton = { TextButton(onClick = { showDialog = false }) { Text("取消") } })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectCard(project: Project, onClick: () -> Unit, onDelete: (String) -> Unit) {
    val statusColor = when (project.status) { "pending" -> Color(0xFFF59E0B); "setting" -> Color(0xFF6366F1); "writing" -> Color(0xFF8B5CF6); "completed" -> Color(0xFF10B981); "error" -> Color(0xFFEF4444); else -> Color.Gray }
    val statusText = when (project.status) { "pending" -> "等待中"; "setting" -> "生成设定"; "writing" -> "写作中"; "completed" -> "已完成"; "error" -> "错误"; else -> project.status }
    Card(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(project.title.ifEmpty { "生成中..." }, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Surface(color = statusColor, shape = MaterialTheme.shapes.small) { Text(statusText, style = MaterialTheme.typography.labelSmall, color = Color.White, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)) }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(project.prompt, style = MaterialTheme.typography.bodyMedium, color = Color.Gray, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("进度: ${project.currentChapter}/${project.totalChapters} 章", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                Row {
                    if (project.status != "completed") {
                        IconButton(onClick = onClick) { Icon(Icons.Default.PlayArrow, null, tint = Color(0xFF6366F1)) }
                    }
                    IconButton(onClick = { onDelete(project.id) }) { Icon(Icons.Default.Delete, null, tint = Color(0xFFEF4444)) }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectDetailScreen(project: Project, isRunning: Boolean, runMessage: String?, onBack: () -> Unit, onRefresh: () -> Unit, onAutoRun: () -> Unit, onDelete: () -> Unit) {
    Scaffold(
        topBar = { TopAppBar(title = { Text(project.title.ifEmpty { "详情" }) }, colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF6366F1), titleContentColor = Color.White),
            navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = Color.White) } },
            actions = { IconButton(onClick = onRefresh) { Icon(Icons.Default.Refresh, null, tint = Color.White) } }) }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("状态: ${when(project.status) { "pending" -> "等待中"; "setting" -> "生成设定"; "writing" -> "写作中"; "completed" -> "已完成"; else -> project.status }}", style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("进度: ${project.currentChapter}/${project.totalChapters} 章", style = MaterialTheme.typography.bodyLarge)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("提示词: ${project.prompt}", style = MaterialTheme.typography.bodyMedium, color = Color.Gray)
                }
            }
            runMessage?.let { Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFDCFCE7))) {
                Column(modifier = Modifier.padding(16.dp)) { Text(it, style = MaterialTheme.typography.bodyMedium, color = Color(0xFF16A34A)) }
            }}
            Spacer(modifier = Modifier.weight(1f))
            if (project.status != "completed") {
                Button(onClick = onAutoRun, modifier = Modifier.fillMaxWidth(), enabled = !isRunning, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))) {
                    if (isRunning) { CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White); Spacer(modifier = Modifier.width(8.dp)); Text("执行中...") }
                    else { Icon(Icons.Default.PlayArrow, null); Spacer(modifier = Modifier.width(8.dp)); Text("执行下一步") }
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(onClick = onRefresh, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color.Gray)) { Icon(Icons.Default.Refresh, null); Spacer(modifier = Modifier.width(8.dp)); Text("刷新") }
                Button(onClick = onDelete, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))) { Icon(Icons.Default.Delete, null); Spacer(modifier = Modifier.width(8.dp)); Text("删除") }
            }
        }
    }
}
