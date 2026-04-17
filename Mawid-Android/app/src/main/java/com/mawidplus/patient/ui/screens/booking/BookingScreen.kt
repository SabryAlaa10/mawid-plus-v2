package com.mawidplus.patient.ui.screens.booking

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
fun BookingScreen(
    doctorId: String,
    navController: NavHostController,
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
    ) {
        Text("Booking Screen")
        Text("doctorId=$doctorId")
        Button(onClick = { navController.navigateUp() }) { Text("Back") }
        Button(onClick = { navController.navigate(Routes.NOTIFICATIONS) }) {
            Text("Notifications")
        }
        Button(onClick = { navController.navigate(Routes.APPOINTMENTS) }) {
            Text("Appointments")
        }
    }
}
