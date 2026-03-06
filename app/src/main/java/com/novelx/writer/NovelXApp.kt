package com.novelx.writer

import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.novelx.writer.ui.screens.*

@Composable
fun NovelXApp() {
    val navController = rememberNavController()
    val viewModel: NovelViewModel = viewModel()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") {
            HomeScreen(
                viewModel = viewModel,
                onNavigateToCreate = { navController.navigate("create") },
                onNavigateToProject = { projectId -> 
                    navController.navigate("project/$projectId")
                }
            )
        }
        
        composable("create") {
            CreateScreen(
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onCreated = { projectId ->
                    navController.navigate("project/$projectId") {
                        popUpTo("home") { inclusive = false }
                    }
                }
            )
        }
        
        composable("project/{projectId}") { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            ProjectScreen(
                projectId = projectId,
                viewModel = viewModel,
                onBack = { navController.popBackStack() },
                onReadChapter = { chapter ->
                    navController.navigate("chapter/$projectId/$chapter")
                }
            )
        }
        
        composable("chapter/{projectId}/{chapter}") { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            val chapter = backStackEntry.arguments?.getString("chapter")?.toIntOrNull() ?: 1
            ChapterScreen(
                projectId = projectId,
                chapterNum = chapter,
                viewModel = viewModel,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
