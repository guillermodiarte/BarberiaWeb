package com.barbershop.crm.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.*
import com.barbershop.crm.core.network.NetworkClient
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.screens.barberos.BarberosScreen
import com.barbershop.crm.ui.screens.caja.CajaScreen
import com.barbershop.crm.ui.screens.clientes.ClientesScreen
import com.barbershop.crm.ui.screens.config.ConfigScreen
import com.barbershop.crm.ui.screens.cortes.CortesScreen
import com.barbershop.crm.ui.screens.cortes.NuevoCorteScreen
import com.barbershop.crm.ui.screens.dashboard.DashboardScreen
import com.barbershop.crm.ui.screens.gastos.GastosScreen
import com.barbershop.crm.ui.screens.inventario.InventarioScreen
import com.barbershop.crm.ui.screens.login.LoginScreen
import com.barbershop.crm.ui.screens.reservas.ReservasScreen
import com.barbershop.crm.ui.screens.servicios.ServiciosScreen
import com.barbershop.crm.ui.screens.tenant.TenantScreen
import com.barbershop.crm.ui.screens.ventas.VentasScreen
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppNavHost(
    repository: BarberRepository,
    sessionManager: SessionManager,
    networkClient: NetworkClient
) {
    val navController = rememberNavController()
    val token by sessionManager.tokenFlow.collectAsState(initial = "loading")
    val role by sessionManager.roleFlow.collectAsState(initial = "barber")
    val salonName by sessionManager.salonNameFlow.collectAsState(initial = "BarberShop Elite")
    val savedAccounts by sessionManager.accountsFlow.collectAsState(initial = emptyList())
    val currentTenantUrl by sessionManager.tenantUrlFlow.collectAsState(initial = SessionManager.DEFAULT_TENANT_URL)
    val coroutineScope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    var showLogoutDialog by remember { mutableStateOf(false) }
    var showDeleteAccountDialog by remember { mutableStateOf(false) }

    if (token == "loading") return

    val startDestination = if (token.isNullOrEmpty()) Screen.Login.route else Screen.Dashboard.route
    val isAdmin = role == "admin" || role == "superadmin"

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route ?: Screen.Dashboard.route

    val isAuthScreen = currentRoute == Screen.Login.route || currentRoute == Screen.Tenant.route

    ModalNavigationDrawer(
        drawerState = drawerState,
        gesturesEnabled = !isAuthScreen,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Slate900,
                drawerContentColor = Slate200,
                modifier = Modifier.width(300.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    // Header del Drawer: Tarjeta de Salón Activo y Selector Multi-Barbería
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Slate800.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 10.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.Storefront, contentDescription = null, tint = Amber500, modifier = Modifier.size(24.dp))
                                Spacer(modifier = Modifier.width(10.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = salonName,
                                        style = MaterialTheme.typography.titleMedium,
                                        fontWeight = FontWeight.Bold,
                                        color = Slate50,
                                        maxLines = 1
                                    )
                                    Text(
                                        text = "Rol: ${role.uppercase()}",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Amber400
                                    )
                                }
                            }

                            val otherAccounts = savedAccounts.filter { !it.salonUrl.equals(currentTenantUrl, ignoreCase = true) }
                            if (otherAccounts.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Text(
                                    text = "Cambiar a otra Barbería:",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = Slate400
                                )
                                otherAccounts.forEach { acc ->
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clickable {
                                                coroutineScope.launch {
                                                    drawerState.close()
                                                    sessionManager.switchAccount(acc.salonUrl)
                                                    repository.refreshAll()
                                                }
                                            }
                                            .padding(vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = "💈 ${acc.salonName}",
                                            color = Cyan400,
                                            style = MaterialTheme.typography.bodySmall,
                                            fontWeight = FontWeight.SemiBold,
                                            maxLines = 1,
                                            modifier = Modifier.weight(1f)
                                        )
                                        Text(
                                            text = "Cambiar →",
                                            color = Amber500,
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(6.dp))
                            TextButton(
                                onClick = {
                                    coroutineScope.launch {
                                        drawerState.close()
                                        navController.navigate(Screen.Tenant.route)
                                    }
                                },
                                contentPadding = PaddingValues(0.dp),
                                modifier = Modifier.height(26.dp)
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, tint = Amber500, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("+ Vincular otra Barbería", color = Amber500, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    Divider(color = Slate800, modifier = Modifier.padding(bottom = 8.dp))

                    DrawerMenuItem(title = "Resumen General", icon = Icons.Default.Dashboard, selected = currentRoute == Screen.Dashboard.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Dashboard.route)
                    }

                    DrawerMenuItem(title = "Registrar Cortes (CRM)", icon = Icons.Default.ContentCut, selected = currentRoute == Screen.Cortes.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Cortes.route)
                    }

                    DrawerMenuItem(title = "Control de Caja & Cierres", icon = Icons.Default.PointOfSale, selected = currentRoute == Screen.Caja.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Caja.route)
                    }

                    DrawerMenuItem(title = "Servicios & Combos", icon = Icons.Default.DryCleaning, selected = currentRoute == Screen.Servicios.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Servicios.route)
                    }

                    DrawerMenuItem(title = "Inventario & Stock", icon = Icons.Default.Inventory2, selected = currentRoute == Screen.Inventario.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Inventario.route)
                    }

                    DrawerMenuItem(title = "Ventas de Productos", icon = Icons.Default.ShoppingBag, selected = currentRoute == Screen.Ventas.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Ventas.route)
                    }

                    DrawerMenuItem(title = "Gastos del Salón", icon = Icons.Default.ReceiptLong, selected = currentRoute == Screen.Gastos.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Gastos.route)
                    }

                    DrawerMenuItem(title = "Clientes & Puntos", icon = Icons.Default.People, selected = currentRoute == Screen.Clientes.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Clientes.route)
                    }

                    DrawerMenuItem(title = "Reservas & Turnos", icon = Icons.Default.CalendarMonth, selected = currentRoute == Screen.Reservas.route) {
                        coroutineScope.launch { drawerState.close() }
                        navController.navigate(Screen.Reservas.route)
                    }

                    if (isAdmin) {
                        Divider(color = Slate800, modifier = Modifier.padding(vertical = 8.dp))

                        DrawerMenuItem(title = "Barberos & Esquemas", icon = Icons.Default.Badge, selected = currentRoute == Screen.Barberos.route) {
                            coroutineScope.launch { drawerState.close() }
                            navController.navigate(Screen.Barberos.route)
                        }

                        DrawerMenuItem(title = "Configuración del Sistema", icon = Icons.Default.Settings, selected = currentRoute == Screen.Config.route) {
                            coroutineScope.launch { drawerState.close() }
                            navController.navigate(Screen.Config.route)
                        }
                    }

                    Spacer(modifier = Modifier.weight(1f))
                    Divider(color = Slate800, modifier = Modifier.padding(vertical = 8.dp))

                    DrawerMenuItem(title = "Cerrar Sesión", icon = Icons.Default.ExitToApp, selected = false, tint = Rose500) {
                        coroutineScope.launch {
                            drawerState.close()
                            showLogoutDialog = true
                        }
                    }

                    DrawerMenuItem(title = "Eliminar Mi Cuenta", icon = Icons.Default.DeleteForever, selected = false, tint = Slate500) {
                        coroutineScope.launch {
                            drawerState.close()
                            showDeleteAccountDialog = true
                        }
                    }
                }
            }
        }
    ) {
        Scaffold(
            topBar = {
                if (!isAuthScreen && currentRoute != Screen.NuevoCorte.route) {
                    TopAppBar(
                        title = { Text(salonName, color = Slate50, fontWeight = FontWeight.Bold, maxLines = 1) },
                        navigationIcon = {
                            TextButton(
                                onClick = { coroutineScope.launch { drawerState.open() } },
                                contentPadding = PaddingValues(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    verticalArrangement = Arrangement.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Menu,
                                        contentDescription = "Menú",
                                        tint = Slate50,
                                        modifier = Modifier.size(22.dp)
                                    )
                                    Text(
                                        text = "Menú",
                                        color = Slate50,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }
                        },
                        actions = {
                            IconButton(onClick = { showLogoutDialog = true }) {
                                Icon(
                                    imageVector = Icons.Default.ExitToApp,
                                    contentDescription = "Cerrar Sesión",
                                    tint = Rose500
                                )
                            }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Slate900)
                    )
                }
            },
            bottomBar = {
                if (!isAuthScreen) {
                    NavigationBar(
                        containerColor = Slate900,
                        contentColor = Slate400
                    ) {
                        NavigationBarItem(
                            selected = currentRoute == Screen.Dashboard.route,
                            onClick = { navController.navigate(Screen.Dashboard.route) },
                            icon = { Icon(Icons.Default.Dashboard, contentDescription = null) },
                            label = { Text("Inicio") },
                            colors = NavigationBarItemDefaults.colors(selectedIconColor = Amber500, selectedTextColor = Amber500, indicatorColor = Slate800)
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Cortes.route,
                            onClick = { navController.navigate(Screen.Cortes.route) },
                            icon = { Icon(Icons.Default.ContentCut, contentDescription = null) },
                            label = { Text("Cortes") },
                            colors = NavigationBarItemDefaults.colors(selectedIconColor = Amber500, selectedTextColor = Amber500, indicatorColor = Slate800)
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Reservas.route,
                            onClick = { navController.navigate(Screen.Reservas.route) },
                            icon = { Icon(Icons.Default.CalendarMonth, contentDescription = null) },
                            label = { Text("Turnos") },
                            colors = NavigationBarItemDefaults.colors(selectedIconColor = Amber500, selectedTextColor = Amber500, indicatorColor = Slate800)
                        )
                        NavigationBarItem(
                            selected = currentRoute == Screen.Caja.route,
                            onClick = { navController.navigate(Screen.Caja.route) },
                            icon = { Icon(Icons.Default.PointOfSale, contentDescription = null) },
                            label = { Text("Caja") },
                            colors = NavigationBarItemDefaults.colors(selectedIconColor = Amber500, selectedTextColor = Amber500, indicatorColor = Slate800)
                        )
                    }
                }
            },
            containerColor = Slate950
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = startDestination,
                modifier = Modifier.padding(innerPadding)
            ) {
                composable(Screen.Tenant.route) {
                    TenantScreen(
                        sessionManager = sessionManager,
                        onConnected = {
                            navController.navigate(Screen.Login.route) {
                                popUpTo(Screen.Tenant.route) { inclusive = true }
                            }
                        },
                        onNavigateBack = if (!token.isNullOrEmpty()) {
                            { navController.popBackStack() }
                        } else null
                    )
                }

                composable(Screen.Login.route) {
                    LoginScreen(
                        repository = repository,
                        sessionManager = sessionManager,
                        onLoginSuccess = {
                            navController.navigate(Screen.Dashboard.route) {
                                popUpTo(Screen.Login.route) { inclusive = true }
                            }
                        },
                        onChangeServer = {
                            navController.navigate(Screen.Tenant.route)
                        }
                    )
                }

                composable(Screen.Dashboard.route) {
                    DashboardScreen(
                        repository = repository,
                        sessionManager = sessionManager,
                        onNavigateToNuevoCorte = { navController.navigate(Screen.NuevoCorte.route) },
                        onNavigateToCaja = { navController.navigate(Screen.Caja.route) },
                        onNavigateToClientes = { navController.navigate(Screen.Clientes.route) },
                        onLogout = {
                            coroutineScope.launch {
                                repository.logout()
                                navController.navigate(Screen.Login.route) {
                                    popUpTo(0) { inclusive = true }
                                }
                            }
                        }
                    )
                }

                composable(Screen.Cortes.route) {
                    CortesScreen(
                        repository = repository,
                        onNavigateToNuevo = { navController.navigate(Screen.NuevoCorte.route) }
                    )
                }

                composable(Screen.NuevoCorte.route) {
                    NuevoCorteScreen(
                        repository = repository,
                        sessionManager = sessionManager,
                        onNavigateBack = { navController.popBackStack() }
                    )
                }

                composable(Screen.Caja.route) {
                    CajaScreen(repository = repository)
                }

                composable(Screen.Servicios.route) {
                    ServiciosScreen(repository = repository, isAdmin = isAdmin)
                }

                composable(Screen.Inventario.route) {
                    InventarioScreen(repository = repository)
                }

                composable(Screen.Ventas.route) {
                    VentasScreen(repository = repository, sessionManager = sessionManager)
                }

                composable(Screen.Gastos.route) {
                    GastosScreen(repository = repository)
                }

                composable(Screen.Clientes.route) {
                    ClientesScreen(repository = repository)
                }

                composable(Screen.Reservas.route) {
                    ReservasScreen(repository = repository)
                }

                composable(Screen.Barberos.route) {
                    BarberosScreen(
                        networkClient = networkClient,
                        currentUserRole = role
                    )
                }

                composable(Screen.Config.route) {
                    ConfigScreen(networkClient = networkClient)
                }
            }
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Cerrar Sesión", color = Slate50, fontWeight = FontWeight.Bold) },
            text = { Text("¿Deseas cerrar la sesión actual para alternar de usuario?", color = Slate300) },
            confirmButton = {
                Button(
                    onClick = {
                        showLogoutDialog = false
                        coroutineScope.launch {
                            repository.logout()
                            navController.navigate(Screen.Login.route) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                ) {
                    Text("Cerrar Sesión", color = Slate50, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancelar", color = Slate400)
                }
            },
            containerColor = Slate900,
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showDeleteAccountDialog) {
        var deleteLoading by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = {
                if (!deleteLoading) showDeleteAccountDialog = false
            },
            title = {
                Text("Eliminar Mi Cuenta", color = Rose500, fontWeight = FontWeight.Bold)
            },
            text = {
                Column {
                    Text(
                        "¿Estás completamente seguro de que deseas eliminar tu cuenta?\n\nEsta acción es irreversible y purgará de forma permanente tu acceso, correo electrónico y datos personales de esta barbería.",
                        color = Slate300,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    if (errorMessage != null) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(errorMessage!!, color = Rose500, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        deleteLoading = true
                        errorMessage = null
                        coroutineScope.launch {
                            val res = repository.deleteOwnAccount()
                            deleteLoading = false
                            res.onSuccess {
                                showDeleteAccountDialog = false
                                navController.navigate(Screen.Login.route) {
                                    popUpTo(0) { inclusive = true }
                                }
                            }.onFailure { err ->
                                errorMessage = err.message
                            }
                        }
                    },
                    enabled = !deleteLoading,
                    colors = ButtonDefaults.buttonColors(containerColor = Rose500)
                ) {
                    if (deleteLoading) {
                        CircularProgressIndicator(color = Slate50, modifier = Modifier.size(16.dp))
                    } else {
                        Text("Sí, Eliminar Definitivamente", color = Slate50, fontWeight = FontWeight.Bold)
                    }
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showDeleteAccountDialog = false },
                    enabled = !deleteLoading
                ) {
                    Text("Cancelar", color = Slate400)
                }
            },
            containerColor = Slate900,
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@Composable
fun DrawerMenuItem(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    selected: Boolean,
    tint: androidx.compose.ui.graphics.Color? = null,
    onClick: () -> Unit
) {
    NavigationDrawerItem(
        label = { Text(title, fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal) },
        icon = { Icon(icon, contentDescription = null, tint = tint ?: if (selected) Amber500 else Slate400) },
        selected = selected,
        onClick = onClick,
        colors = NavigationDrawerItemDefaults.colors(
            selectedContainerColor = Slate800,
            selectedTextColor = Amber500,
            unselectedTextColor = tint ?: Slate200
        ),
        shape = RoundedCornerShape(12.dp)
    )
}
