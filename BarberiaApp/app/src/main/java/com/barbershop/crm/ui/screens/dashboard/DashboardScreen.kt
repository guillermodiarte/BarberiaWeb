package com.barbershop.crm.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.barbershop.crm.core.session.SessionManager
import com.barbershop.crm.core.utils.formatPrice
import com.barbershop.crm.data.repository.BarberRepository
import com.barbershop.crm.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun DashboardScreen(
    repository: BarberRepository,
    sessionManager: SessionManager,
    onNavigateToNuevoCorte: () -> Unit,
    onNavigateToCaja: () -> Unit,
    onNavigateToClientes: () -> Unit,
    onLogout: () -> Unit = {}
) {
    val coroutineScope = rememberCoroutineScope()
    var fullName by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("barber") }

    val records by repository.getLocalRecords().collectAsState(initial = emptyList())
    val pendingCount = records.count { it.syncStatus.name.startsWith("PENDING") }
    val totalRevenue = records.sumOf { it.price }

    LaunchedEffect(Unit) {
        fullName = sessionManager.getFullName()
        role = sessionManager.getRole()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Slate950)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Encabezado
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "¡Hola, $fullName!",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = Slate50
                    )
                    Text(
                        text = "Rol: ${role.uppercase()}",
                        style = MaterialTheme.typography.labelSmall,
                        color = Amber500
                    )
                }
            }
        }

        // Estado de sincronización Offline
        if (pendingCount > 0) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Amber500.copy(alpha = 0.15f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.CloudQueue, contentDescription = null, tint = Amber500)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "$pendingCount corte(s) guardado(s) en local pendientes de sync.",
                            color = Amber400,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }

        // Tarjetas Métricas
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                MetricCard(
                    title = "Cortes Totales",
                    value = "${records.size}",
                    color = Amber500,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Recaudación Total",
                    value = formatPrice(totalRevenue),
                    color = Emerald500,
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Accesos directos
        item {
            Text(
                text = "Acciones Rápidas",
                style = MaterialTheme.typography.titleMedium,
                color = Slate50
            )
        }

        item {
            Button(
                onClick = onNavigateToNuevoCorte,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Amber500),
                shape = RoundedCornerShape(12.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Slate950)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Registrar Corte (Offline)", color = Slate950, fontWeight = FontWeight.Bold)
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = onNavigateToCaja,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Cyan500)
                ) {
                    Icon(Icons.Default.PointOfSale, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Caja")
                }

                OutlinedButton(
                    onClick = onNavigateToClientes,
                    modifier = Modifier
                        .weight(1f)
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate200)
                ) {
                    Icon(Icons.Default.People, contentDescription = null)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("Clientes")
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    value: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = Slate900),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, style = MaterialTheme.typography.bodySmall, color = Slate400)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = color,
                maxLines = 1,
                softWrap = false
            )
        }
    }
}
