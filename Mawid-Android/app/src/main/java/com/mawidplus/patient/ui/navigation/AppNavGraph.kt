package com.mawidplus.patient.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.navDeepLink
import com.mawidplus.patient.ui.screens.appointments.AppointmentsScreen
import com.mawidplus.patient.ui.screens.booking.BookingScreen
import com.mawidplus.patient.ui.screens.home.HomeScreen
import com.mawidplus.patient.ui.screens.login.LoginScreen
import com.mawidplus.patient.ui.screens.notifications.NotificationsScreen
import com.mawidplus.patient.ui.screens.profile.ProfileScreen
import com.mawidplus.patient.ui.screens.queue.MyQueueScreen
import com.mawidplus.patient.ui.screens.register.RegisterScreen
import com.mawidplus.patient.ui.screens.search.DoctorDetailScreen
import com.mawidplus.patient.ui.screens.search.DoctorMapScreen
import com.mawidplus.patient.ui.screens.search.MapViewScreen
import com.mawidplus.patient.ui.screens.search.SearchFiltersScreen
import com.mawidplus.patient.ui.screens.search.SearchScreen
import com.mawidplus.patient.ui.screens.splash.SplashScreen

@Composable
fun AppNavGraph(
    startDestination: String = Routes.SPLASH,
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = startDestination,
    ) {
        composable(Routes.SPLASH) {
            SplashScreen(
                onFinished = {
                    navController.navigate(Routes.LOGIN) {
                        launchSingleTop = true
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                },
            )
        }

        composable(Routes.LOGIN) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Routes.HOME) {
                        launchSingleTop = true
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Routes.registerRoute()) {
                        launchSingleTop = true
                    }
                },
                onNavigateToRegisterWithPhone = { digits ->
                    navController.navigate(Routes.registerRoute(digits)) {
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(
            route = Routes.REGISTER_WITH_PHONE_PATTERN,
            arguments = listOf(
                navArgument("phone") {
                    type = NavType.StringType
                    defaultValue = ""
                },
            ),
            deepLinks = listOf(
                navDeepLink { uriPattern = "mawidplus://auth/register" },
            ),
        ) { backStackEntry ->
            val phoneArg = backStackEntry.arguments?.getString("phone").orEmpty()
            RegisterScreen(
                preFilledPhoneLocalDigits = phoneArg,
                onRegisterSuccess = {
                    navController.navigate(Routes.HOME) {
                        launchSingleTop = true
                        popUpTo(Routes.LOGIN) { inclusive = true }
                    }
                },
                onNavigateToLogin = { navController.navigateUp() },
            )
        }

        composable(Routes.HOME) {
            HomeScreen(navController = navController)
        }

        composable(
            route = Routes.SEARCH_WITH_QUERY_PATTERN,
            arguments = listOf(
                navArgument("query") {
                    type = NavType.StringType
                    defaultValue = ""
                },
            ),
        ) { backStackEntry ->
            val q = backStackEntry.arguments?.getString("query").orEmpty()
            SearchScreen(initialQuery = q, navController = navController)
        }

        composable(Routes.APPOINTMENTS) {
            AppointmentsScreen(navController = navController)
        }

        composable(Routes.PROFILE) {
            ProfileScreen(navController = navController)
        }

        composable(
            route = Routes.MY_QUEUE_PATTERN,
            arguments = listOf(navArgument("doctorId") { type = NavType.StringType }),
        ) { entry ->
            val doctorId = entry.arguments?.getString("doctorId").orEmpty()
            MyQueueScreen(doctorId = doctorId, navController = navController)
        }

        composable(Routes.NOTIFICATIONS) {
            NotificationsScreen(navController = navController)
        }

        composable(Routes.MAP_VIEW) {
            MapViewScreen(navController = navController)
        }

        composable(Routes.SEARCH_FILTERS) {
            SearchFiltersScreen(navController = navController)
        }

        composable(
            route = Routes.DOCTOR_DETAIL_PATTERN,
            arguments = listOf(navArgument("doctorId") { type = NavType.StringType }),
        ) { entry ->
            val doctorId = entry.arguments?.getString("doctorId").orEmpty()
            DoctorDetailScreen(doctorId = doctorId, navController = navController)
        }

        composable(
            route = Routes.DOCTOR_MAP_PATTERN,
            arguments = listOf(navArgument("doctorId") { type = NavType.StringType }),
        ) { entry ->
            val mapDoctorId = entry.arguments?.getString("doctorId").orEmpty()
            DoctorMapScreen(doctorId = mapDoctorId, navController = navController)
        }

        composable(
            route = Routes.BOOKING_PATTERN,
            arguments = listOf(navArgument("doctorId") { type = NavType.StringType }),
        ) { entry ->
            val doctorId = entry.arguments?.getString("doctorId").orEmpty()
            BookingScreen(doctorId = doctorId, navController = navController)
        }
    }
}
