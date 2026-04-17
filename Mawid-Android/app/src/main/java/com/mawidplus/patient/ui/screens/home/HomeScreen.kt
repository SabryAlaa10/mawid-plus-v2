package com.mawidplus.patient.ui.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import com.mawidplus.patient.ui.navigation.Routes

@Composable
fun HomeScreen(navController: NavHostController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text("Home Screen")
        Button(onClick = { navController.navigate(Routes.searchRoute()) }) { Text("Search") }
        Button(onClick = { navController.navigate(Routes.APPOINTMENTS) }) { Text("Appointments") }
        Button(onClick = { navController.navigate(Routes.PROFILE) }) { Text("Profile") }
        Button(onClick = { navController.navigate(Routes.NOTIFICATIONS) }) { Text("Notifications") }
        Button(onClick = { navController.navigate(Routes.doctorDetailRoute("demo-doctor")) }) {
            Text("Doctor detail (demo)")
        }
        Button(onClick = { navController.navigate(Routes.bookingRoute("demo-doctor")) }) {
            Text("Booking (demo)")
        }
        Button(onClick = { navController.navigate(Routes.myQueueRoute("demo-doctor")) }) {
            Text("My queue (demo)")
        }
        Button(onClick = { navController.navigate(Routes.MAP_VIEW) }) { Text("Map view") }
        Button(onClick = { navController.navigate(Routes.SEARCH_FILTERS) }) { Text("Search filters") }
    }
}
