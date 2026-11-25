package com.barbershop.crm.ui.navigation

sealed class Screen(val route: String, val title: String) {
    object Tenant : Screen("tenant", "Conexión")
    object Login : Screen("login", "Iniciar Sesión")
    object Dashboard : Screen("dashboard", "Resumen General")
    object Cortes : Screen("cortes", "Registrar Cortes (CRM)")
    object NuevoCorte : Screen("nuevo_corte", "Nuevo Corte")
    object Caja : Screen("caja", "Control de Caja & Cierres")
    object Servicios : Screen("servicios", "Servicios & Combos")
    object Barberos : Screen("barberos", "Barberos & Esquemas")
    object Inventario : Screen("inventario", "Inventario & Stock")
    object Ventas : Screen("ventas", "Ventas de Productos")
    object Gastos : Screen("gastos", "Gastos del Salón")
    object Clientes : Screen("clientes", "Clientes & Puntos")
    object Reservas : Screen("reservas", "Reservas & Turnos")
    object Config : Screen("config", "Configuración")
    object Estadisticas : Screen("estadisticas", "Estadísticas & Finanzas")
    object Historial : Screen("historial", "Historial Completo")
}
