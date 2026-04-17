package com.mawidplus.patient.ui.screens.splash

import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import kotlinx.coroutines.delay

@Composable
fun SplashScreen(onFinished: () -> Unit) {
    Text("Splash Screen")
    LaunchedEffect(Unit) {
        delay(400)
        onFinished()
    }
}
