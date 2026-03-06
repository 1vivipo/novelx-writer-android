package com.novelx.writer

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    private val handler = Handler(Looper.getMainLooper())
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NovelXWriterTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
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
        
        LaunchedEffect(Unit) {
            loadProjects { result ->
                when (result) {
                    is Result.Success -> {
                        projects = result.data
                        isLoading = false
                    }
                    is Result.Error -> {
                        error = result.message
                        isLoading = false
                    }
                }
            }
        }
        
        when {
            selectedProject != null -> {
                ProjectDetailScreen(
                    project = selectedProject!!,
                    onBack = { selectedProject = null },
                    onRefresh = {
                        loadProjectDetail(selectedProject!!.id) { result ->
                            if (result is Result.Success) {
                                selectedProject = result.data
                            }
                        }
                    }
                )
            }
            isLoading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            error != null -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("加载失败: $error")
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = {
                            isLoading = true
                            error = null
                            loadProjects { result ->
                                when (result) {
                                    is Result.Success -> {
                                        projects = result.data
                                        isLoading = false
                                    }
                                    is Result.Error -> {
                                        error = result.message
                                        isLoading = false
                                    }
                                }
                            }
                        }) {
                            Text("重试")
                        }
                    }
                }
            }
            projects.isEmpty() -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("暂无项目，点击右下角按钮创建")
                }
            }
            else -> {
                ProjectListScreen(
                    projects = projects,
                    onProjectClick = { project -> selectedProject = project },
                    onCreateProject = { prompt, chapters ->
                        createProject(prompt, chapters) { }
                    }
                )
            }
        }
    }
    
    sealed class Result<T> {
        data class Success<T>(val data: T) : Result<T>()
        data class Error<T>(val message: String) : Result<T>()
    }
    
    private fun loadProjects(callback: (Result<List<Project>>) -> Unit) {
        Thread {
            try {
                val request = Request.Builder()
                    .url("https://my-project-eight-chi-80.vercel.app/api/novel/projects")
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: "{}"
                        val type = object : TypeToken<Map<String, Any>>() {}.type
                        val map: Map<String, Any> = gson.fromJson(body, type)
                        @Suppress("UNCHECKED_CAST")
                        val projectsList = (map["projects"] as? List<*>)?.map {
                            val p = it as Map<String, Any?>
                            Project(
                                id = p["id"] as? String ?: "",
                                title = p["title"] as? String ?: "",
                                prompt = p["prompt"] as? String ?: "",
                                totalChapters = (p["totalChapters"] as? Number)?.toInt() ?: 0,
                                currentChapter = (p["currentChapter"] as? Number)?.toInt() ?: 0,
                                status = p["status"] as? String ?: "",
                                error = p["error"] as? String,
                                createdAt = p["createdAt"] as? String ?: "",
                                updatedAt = p["updatedAt"] as? String ?: ""
                            )
                        } ?: emptyList()
                        handler.post { callback(Result.Success(projectsList)) }
                    } else {
                        handler.post { callback(Result.Error("HTTP ${response.code}")) }
                    }
                }
            } catch (e: Exception) {
                handler.post { callback(Result.Error(e.message ?: "Unknown error")) }
            }
        }.start()
    }
    
    private fun loadProjectDetail(projectId: String, callback: (Result<Project>) -> Unit) {
        Thread {
            try {
                val request = Request.Builder()
                    .url("https://my-project-eight-chi-80.vercel.app/api/novel/project?id=$projectId")
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: "{}"
                        val type = object : TypeToken<Map<String, Any>>() {}.type
                        val map: Map<String, Any> = gson.fromJson(body, type)
                        @Suppress("UNCHECKED_CAST")
                        val p = map["project"] as? Map<String, Any?>
                        if (p != null) {
                            val project = Project(
                                id = p["id"] as? String ?: "",
                                title = p["title"] as? String ?: "",
                                prompt = p["prompt"] as? String ?: "",
                                totalChapters = (p["totalChapters"] as? Number)?.toInt() ?: 0,
                                currentChapter = (p["currentChapter"] as? Number)?.toInt() ?: 0,
                                status = p["status"] as? String ?: "",
                                error = p["error"] as? String,
                                createdAt = p["createdAt"] as? String ?: "",
                                updatedAt = p["updatedAt"] as? String ?: ""
                            )
                            handler.post { callback(Result.Success(project)) }
                        } else {
                            handler.post { callback(Result.Error("Project not found")) }
                        }
                    } else {
                        handler.post { callback(Result.Error("HTTP ${response.code}")) }
                    }
                }
            } catch (e: Exception) {
                handler.post { callback(Result.Error(e.message ?: "Unknown error")) }
            }
        }.start()
    }
    
    private fun createProject(prompt: String, chapters: Int, callback: (Result<String>) -> Unit) {
        Thread {
            try {
                val json = """{"prompt":"$prompt","totalChapters":$chapters}"""
                val body = json.toRequestBody("application/json".toMediaType())
                
                val request = Request.Builder()
                    .url("https://my-project-eight-chi-80.vercel.app/api/novel/create")
                    .post(body)
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        handler.post { callback(Result.Success("Created")) }
                    } else {
                        handler.post { callback(Result.Error("HTTP ${response.code}")) }
                    }
                }
            } catch (e: Exception) {
                handler.post { callback(Result.Error(e.message ?: "Unknown error")) }
            }
        }.start()
    }
}
