package com.mawidplus.patient.ui.screens.register

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun RegisterScreen(
    preFilledPhoneLocalDigits: String,
    onRegisterSuccess: () -> Unit,
    onNavigateToLogin: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text("Register Screen")
        if (preFilledPhoneLocalDigits.isNotEmpty()) {
            Text("Phone arg: $preFilledPhoneLocalDigits")
        }
        Button(onClick = onRegisterSuccess) { Text("Done (skeleton)") }
        Button(onClick = onNavigateToLogin) { Text("Back to login") }
    }
}
