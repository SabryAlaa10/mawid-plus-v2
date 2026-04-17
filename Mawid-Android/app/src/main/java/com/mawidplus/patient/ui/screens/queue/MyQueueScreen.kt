package com.mawidplus.patient.ui.screens.queue

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.mawidplus.patient.ui.navigation.Routes

@Composable
fun MyQueueScreen(
    doctorId: String,
    navController: NavHostController,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
    ) {
        Text("My Queue Screen")
        Text("doctorId=$doctorId")
        Button(onClick = { navController.navigateUp() }) { Text("Back") }
        Button(onClick = { navController.navigate(Routes.NOTIFICATIONS) }) {
            Text("Notifications")
        }
    }
}
