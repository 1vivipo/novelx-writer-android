package com.novelx.writer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

object ApiConfig {
    const val BASE_URL = "https://my-project-eight-chi-80.vercel.app/api"
}

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

data class ProjectDetail(
    val id: String,
    val title: String,
    val prompt: String,
    val totalChapters: Int,
    val currentChapter: Int,
    val status: String,
    val settings: Settings,
    val chapters: List<ChapterInfo>
)

data class Settings(
    val worldview: String = "",
    val characters: String = "",
    val outline: String = "",
    val plotDesign: String = "",
    val chapterOutline: String = "",
    val writingRules: String = ""
)

data class ChapterInfo(
    val number: Int,
    val title: String,
    val status: String,
    val wordCount: Int
)

data class ChapterContent(
    val number: Int,
    val title: String,
    val content: String,
    val wordCount: Int
)

data class UiState(
    val isLoading: Boolean = false,
    val projects: List<Project> = emptyList(),
    val currentProject: ProjectDetail? = null,
    val currentChapter: ChapterContent? = null,
    val error: String? = null,
    val message: String? = null
)

class NovelViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    private val client = OkHttpClient.Builder()
        .connectTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
        .readTimeout(120, java.util.concurrent.TimeUnit.SECONDS)
        .writeTimeout(60, java.util.concurrent.TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    fun loadProjects() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val request = Request.Builder()
                    .url("${ApiConfig.BASE_URL}/novel/projects")
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: "{}"
                        val type = object : TypeToken<Map<String, List<Project>>>() {}.type
                        val map: Map<String, List<Project>> = gson.fromJson(body, type)
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                projects = map["projects"] ?: emptyList()
                            )
                        }
                    } else {
                        _uiState.update { 
                            it.copy(isLoading = false, error = "加载失败: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isLoading = false, error = "网络错误: ${e.message}")
                }
            }
        }
    }
    
    fun createProject(prompt: String, totalChapters: Int, onSuccess: (String) -> Unit) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val json = """{"prompt":"$prompt","totalChapters":$totalChapters}"""
                val body = json.toRequestBody("application/json".toMediaType())
                
                val request = Request.Builder()
                    .url("${ApiConfig.BASE_URL}/novel/create")
                    .post(body)
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string() ?: "{}"
                        val map: Map<String, Any> = gson.fromJson(responseBody, object : TypeToken<Map<String, Any>>() {}.type)
                        @Suppress("UNCHECKED_CAST")
                        val project = map["project"] as? Map<String, Any>
                        val projectId = project?.get("id") as? String ?: ""
                        _uiState.update { 
                            it.copy(isLoading = false, message = "项目创建成功")
                        }
                        onSuccess(projectId)
                    } else {
                        _uiState.update { 
                            it.copy(isLoading = false, error = "创建失败: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isLoading = false, error = "网络错误: ${e.message}")
                }
            }
        }
    }
    
    fun loadProject(projectId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val request = Request.Builder()
                    .url("${ApiConfig.BASE_URL}/novel/project?id=$projectId")
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: "{}"
                        val type = object : TypeToken<Map<String, ProjectDetail>>() {}.type
                        val map: Map<String, ProjectDetail> = gson.fromJson(body, type)
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                currentProject = map["project"]
                            )
                        }
                    } else {
                        _uiState.update { 
                            it.copy(isLoading = false, error = "加载失败: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isLoading = false, error = "网络错误: ${e.message}")
                }
            }
        }
    }
    
    fun loadChapter(projectId: String, chapterNum: Int) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val request = Request.Builder()
                    .url("${ApiConfig.BASE_URL}/novel/chapter?projectId=$projectId&chapter=$chapterNum")
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: "{}"
                        val type = object : TypeToken<Map<String, ChapterContent>>() {}.type
                        val map: Map<String, ChapterContent> = gson.fromJson(body, type)
                        _uiState.update { 
                            it.copy(
                                isLoading = false,
                                currentChapter = map["chapter"]
                            )
                        }
                    } else {
                        _uiState.update { 
                            it.copy(isLoading = false, error = "加载失败: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isLoading = false, error = "网络错误: ${e.message}")
                }
            }
        }
    }
    
    fun executeStep(projectId: String, step: String, chapter: Int = 1, onComplete: () -> Unit = {}) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val json = """{"projectId":"$projectId","step":"$step","chapter":$chapter}"""
                val body = json.toRequestBody("application/json".toMediaType())
                
                val request = Request.Builder()
                    .url("${ApiConfig.BASE_URL}/novel/step")
                    .post(body)
                    .build()
                
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val responseBody = response.body?.string() ?: "{}"
                        val map: Map<String, Any> = gson.fromJson(responseBody, object : TypeToken<Map<String, Any>>() {}.type)
                        val message = map["message"] as? String ?: "完成"
                        _uiState.update { 
                            it.copy(isLoading = false, message = message)
                        }
                        onComplete()
                    } else {
                        _uiState.update { 
                            it.copy(isLoading = false, error = "执行失败: ${response.code}")
                        }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(isLoading = false, error = "网络错误: ${e.message}")
                }
            }
        }
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    fun clearMessage() {
        _uiState.update { it.copy(message = null) }
    }
}
